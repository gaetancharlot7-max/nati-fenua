# Auto-Moderation System for Nati Fenua
# Hybrid system: Word filters (free) + AI (optional)

import re
import os
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ==================== MOTS INTERDITS ====================
# Liste de mots interdits en français et tahitien

FORBIDDEN_WORDS = {
    # Insultes françaises
    "connard", "connasse", "salaud", "salope", "putain", "pute", "merde",
    "enculé", "enculer", "nique", "niquer", "ntm", "fdp", "pd", "pédale",
    "tapette", "tantouze", "gouine", "bâtard", "batard", "bordel", "couille",
    "bite", "couilles", "crétin", "débile", "abruti", "idiot", "imbécile",
    "con", "conne", "ducon", "trou du cul", "trouduc", "bouffon", "bolos",
    "ta gueule", "ferme ta gueule", "ftg", "va te faire", "vas te faire",
    
    # Insultes tahitiennes
    "taioro", "taero", "taata ino", "taata haavare",
    
    # Racisme/discrimination
    "nègre", "négro", "bougnoule", "arabe de merde", "sale arabe", "sale noir",
    "sale blanc", "sale chinois", "youpin", "youtre", "feuj", "rebeu de merde",
    "bicot", "raton", "chinetoque", "bridé", "bamboula",
    
    # Termes haineux
    "nazi", "hitler", "je vais te tuer", "je te tue", "mort aux", "crève",
    "suicide", "suicider", "terroriste", "terrorisme", "bombe",
    
    # Spam patterns
    "gagne de l'argent", "deviens riche", "investis maintenant", "bitcoin gratuit",
    "clique ici", "lien dans ma bio", "argent facile", "mlm", "pyramide",
}

# Patterns regex pour détecter le spam et contenu inapproprié
SPAM_PATTERNS = [
    r"https?://[^\s]+\.(ru|cn|xyz|tk|ml|ga|cf)(/|\s|$)",  # Liens suspects
    r"(gagne|gagner)\s+(de\s+l')?argent",
    r"(deviens?|devenir)\s+riche",
    r"\$\$\$|\€\€\€",
    r"[A-Z\s]{20,}",  # Trop de majuscules (cri)
    r"(.)\1{5,}",  # Caractères répétés 5+ fois (aaaaaa)
    r"(?:whatsapp|telegram|signal)[\s:]+\+?\d{10,}",  # Numéros de téléphone spam
    r"@\w+\s+@\w+\s+@\w+\s+@\w+",  # Mention spam (4+ mentions)
]

# Contenu sexuel explicite
EXPLICIT_PATTERNS = [
    r"(nudes?|sexe|porn|xxx|onlyfans|escort)",
    r"(grosse\s+bite|petite\s+chatte|levrette|sodomie)",
]


class AutoModerationService:
    """Service de modération automatique hybride"""
    
    def __init__(self, db=None, ai_enabled: bool = False, ai_api_key: str = None):
        self.db = db
        self.ai_enabled = ai_enabled and bool(ai_api_key)
        self.ai_api_key = ai_api_key
        
        # Compile patterns for performance
        self.spam_regex = [re.compile(p, re.IGNORECASE) for p in SPAM_PATTERNS]
        self.explicit_regex = [re.compile(p, re.IGNORECASE) for p in EXPLICIT_PATTERNS]
        
        logger.info(f"AutoModeration initialized (AI: {'enabled' if self.ai_enabled else 'disabled'})")
    
    def check_content(self, text: str, check_type: str = "post") -> Dict:
        """
        Analyse un texte et retourne le résultat de modération
        
        Args:
            text: Le texte à analyser
            check_type: Type de contenu (post, comment, message, bio)
        
        Returns:
            {
                "approved": bool,
                "score": float (0-1, 1 = très problématique),
                "reasons": List[str],
                "action": str (approve, flag, block),
                "flagged_words": List[str]
            }
        """
        if not text or not text.strip():
            return {
                "approved": True,
                "score": 0,
                "reasons": [],
                "action": "approve",
                "flagged_words": []
            }
        
        text_lower = text.lower()
        reasons = []
        flagged_words = []
        score = 0.0
        
        # 1. Check forbidden words
        for word in FORBIDDEN_WORDS:
            if word in text_lower:
                flagged_words.append(word)
                score += 0.3
                if word not in reasons:
                    reasons.append(f"Mot interdit détecté")
        
        # 2. Check spam patterns
        for pattern in self.spam_regex:
            if pattern.search(text):
                score += 0.2
                if "Contenu spam détecté" not in reasons:
                    reasons.append("Contenu spam détecté")
        
        # 3. Check explicit content
        for pattern in self.explicit_regex:
            match = pattern.search(text)
            if match:
                flagged_words.append(match.group())
                score += 0.4
                if "Contenu explicite détecté" not in reasons:
                    reasons.append("Contenu explicite détecté")
        
        # 4. Check excessive caps (shouting)
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        if caps_ratio > 0.7 and len(text) > 10:
            score += 0.1
            reasons.append("Trop de majuscules")
        
        # 5. Check excessive links
        links_count = len(re.findall(r'https?://[^\s]+', text))
        if links_count > 3:
            score += 0.15
            reasons.append("Trop de liens")
        
        # Cap score at 1
        score = min(score, 1.0)
        
        # Determine action
        if score >= 0.5:
            action = "block"
            approved = False
        elif score >= 0.2:
            action = "flag"  # Flag for human review
            approved = True  # Allow but notify admin
        else:
            action = "approve"
            approved = True
        
        return {
            "approved": approved,
            "score": round(score, 2),
            "reasons": reasons,
            "action": action,
            "flagged_words": list(set(flagged_words))
        }
    
    async def moderate_post(self, post_data: Dict) -> Dict:
        """Modère un post complet (texte + métadonnées)"""
        text_to_check = f"{post_data.get('caption', '')} {post_data.get('title', '')}"
        result = self.check_content(text_to_check, "post")
        
        # Log moderation action
        if self.db and result["action"] != "approve":
            await self._log_moderation(
                content_type="post",
                content_id=post_data.get("post_id", "unknown"),
                user_id=post_data.get("user_id", "unknown"),
                result=result
            )
        
        return result
    
    async def moderate_comment(self, comment_data: Dict) -> Dict:
        """Modère un commentaire"""
        result = self.check_content(comment_data.get("content", ""), "comment")
        
        if self.db and result["action"] != "approve":
            await self._log_moderation(
                content_type="comment",
                content_id=comment_data.get("comment_id", "unknown"),
                user_id=comment_data.get("user_id", "unknown"),
                result=result
            )
        
        return result
    
    async def moderate_message(self, message_data: Dict) -> Dict:
        """Modère un message privé"""
        result = self.check_content(message_data.get("content", ""), "message")
        
        if self.db and result["action"] != "approve":
            await self._log_moderation(
                content_type="message",
                content_id=message_data.get("message_id", "unknown"),
                user_id=message_data.get("sender_id", "unknown"),
                result=result
            )
        
        return result
    
    async def _log_moderation(self, content_type: str, content_id: str, user_id: str, result: Dict):
        """Log une action de modération dans la base de données"""
        try:
            log_entry = {
                "content_type": content_type,
                "content_id": content_id,
                "user_id": user_id,
                "action": result["action"],
                "score": result["score"],
                "reasons": result["reasons"],
                "flagged_words": result["flagged_words"],
                "created_at": datetime.now(timezone.utc).isoformat(),
                "reviewed": False
            }
            await self.db.moderation_logs.insert_one(log_entry)
            logger.info(f"Moderation log: {result['action']} for {content_type}/{content_id}")
        except Exception as e:
            logger.error(f"Error logging moderation: {e}")
    
    def add_forbidden_word(self, word: str):
        """Ajoute un mot à la liste des mots interdits"""
        FORBIDDEN_WORDS.add(word.lower())
        logger.info(f"Added forbidden word: {word}")
    
    def remove_forbidden_word(self, word: str):
        """Retire un mot de la liste des mots interdits"""
        FORBIDDEN_WORDS.discard(word.lower())
        logger.info(f"Removed forbidden word: {word}")
    
    def get_forbidden_words(self) -> List[str]:
        """Retourne la liste des mots interdits (pour admin)"""
        return sorted(list(FORBIDDEN_WORDS))


# ==================== AI MODERATION (OPTIONAL) ====================

class AIModeration:
    """
    Modération par IA (optionnel, nécessite clé API)
    Utilisable avec OpenAI, Claude, ou autre
    """
    
    def __init__(self, api_key: str = None, provider: str = "openai"):
        self.api_key = api_key or os.environ.get("MODERATION_AI_KEY")
        self.provider = provider
        self.enabled = bool(self.api_key)
    
    async def analyze(self, text: str) -> Dict:
        """
        Analyse un texte avec l'IA
        Retourne un score et des catégories
        """
        if not self.enabled:
            return {"enabled": False, "score": 0}
        
        # TODO: Implement AI analysis when key is provided
        # Example with OpenAI Moderation API:
        # response = await openai.Moderation.create(input=text)
        # return response.results[0]
        
        return {
            "enabled": True,
            "score": 0,
            "categories": {},
            "message": "AI moderation not yet configured"
        }


# Global instance
auto_moderator = AutoModerationService()


# ==================== HELPER FUNCTIONS ====================

def check_text(text: str) -> Dict:
    """Quick helper to check text"""
    return auto_moderator.check_content(text)


def is_safe(text: str) -> bool:
    """Quick check if text is safe to post"""
    result = auto_moderator.check_content(text)
    return result["approved"]
