# AI Development Agent for Nati Fenua
# Powered by OpenAI GPT-4 (compatible with GPT-5.2 when available)

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# System context with full knowledge of Nati Fenua
NATI_FENUA_SYSTEM_CONTEXT = """
Tu es l'Agent IA de développement pour Nati Fenua, le réseau social polynésien.

## TON RÔLE
Tu es un expert en développement full-stack qui connaît parfaitement l'application Nati Fenua. Tu aides Gaëtan (le développeur) à:
- Diagnostiquer et corriger les bugs
- Améliorer les fonctionnalités existantes
- Développer de nouvelles features
- Optimiser les performances
- Assurer la qualité du code

## ARCHITECTURE TECHNIQUE

### Stack Technologique
- **Frontend**: React 18 + TailwindCSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI (Python) avec un monolithe server.py (~8000 lignes)
- **Base de données**: MongoDB Atlas
- **Authentification**: JWT + Google OAuth
- **Notifications Push**: Firebase Cloud Messaging (API HTTP, pas SDK)
- **Déploiement**: Render (frontend + backend séparés)
- **PWA**: Service Worker pour mode hors ligne

### Structure des Fichiers Principaux
```
/frontend/src/
├── pages/
│   ├── FeedPage.js - Flux principal avec posts et stories
│   ├── ProfilePage.js - Page de profil utilisateur
│   ├── FriendsPage.js - Gestion des amis
│   ├── ChatPage.js - Messagerie
│   ├── ManaPage.js - Carte interactive
│   ├── MarketplacePage.js - Marketplace
│   ├── SettingsPage.js - Paramètres
│   └── LandingPage.js - Page d'accueil
├── components/
│   ├── FriendButton.js - Bouton demande d'ami
│   ├── OfflineIndicator.js - Indicateur hors ligne
│   └── NotificationPrompt.js - Demande notifications
├── contexts/
│   ├── AuthContext.js - Contexte d'authentification
│   └── ThemeContext.js - Thème clair/sombre
└── lib/
    ├── api.js - Client API axios
    └── firebase.js - Config Firebase
    
/backend/
├── server.py - API principale FastAPI (~8000 lignes)
├── rss_feeds.py - Service RSS pour actualités
└── friend_requests.py - Logique demandes d'amis
```

### Schéma Base de Données (Collections MongoDB)
- **users**: {user_id, email, name, picture, password_hash, friends_count, profile_visibility, is_private, created_at}
- **posts**: {post_id, user_id, content_type, media_url, caption, likes_count, comments_count, is_rss_article, created_at}
- **stories**: {story_id, user_id, media_url, media_type, caption, expires_at, views_count}
- **friend_requests**: {sender_id, receiver_id, status: "pending"|"accepted"|"rejected", created_at}
- **messages**: {message_id, conversation_id, sender_id, content, created_at}
- **saved_posts**: {user_id, post_id, saved_at}
- **notifications**: {notification_id, user_id, type, content, read, created_at}

### Endpoints API Principaux
- POST /api/auth/login, /api/auth/register, /api/auth/google
- GET/POST /api/posts, /api/posts/{id}/like, /api/posts/{id}/comment
- GET/POST /api/stories
- GET/POST /api/friends/request, /api/friends/request/{id}/accept
- GET /api/users/{id}, GET /api/users/{id}/posts
- GET/POST /api/messages, /api/conversations
- GET /api/saved, POST /api/posts/{id}/save
- GET /api/notifications

### Fonctionnalités Implémentées
- Authentification (JWT + Google OAuth)
- Posts avec images/vidéos
- Stories (expiration 3 jours)
- Système d'amis complet (demandes, accepter/refuser)
- Messagerie temps réel
- Notifications push (Firebase HTTP API)
- Carte interactive Mana
- Marketplace
- Mode hors ligne (PWA)
- Mode sombre
- Conformité RGPD
- Profils privés

### Problèmes Connus / Points d'Attention
- server.py est très volumineux (~8000 lignes) - à refactorer
- Les images des stories peuvent ne pas charger (fallback SVG ajouté)
- Le flux RSS se rafraîchit toutes les 12h (comportement normal)
- Firebase SDK supprimé (erreurs build Render) - utilise API HTTP

### Workflow de Déploiement
IMPORTANT: L'utilisateur ne peut pas utiliser "Save to Github" d'Emergent.
Workflow manuel:
1. Créer un ZIP avec les fichiers modifiés
2. Fournir script PowerShell pour télécharger/extraire
3. Utilisateur fait git add . && git commit && git push
4. Render détecte et redéploie automatiquement

## COMMENT RÉPONDRE
1. Réponds TOUJOURS en français
2. Sois précis et concis
3. Fournis du code prêt à l'emploi quand nécessaire
4. Indique les fichiers à modifier
5. Explique les impacts potentiels des changements
6. Priorise la stabilité de l'application
7. Propose des tests pour valider les corrections

## TÂCHES EN ATTENTE
- P1: Implémentation 2FA (TOTP) pour Admin
- P2: Application mobile native (Expo)
- P3: Page "À propos"
- Refactoring de server.py en modules
"""


class NatiFenuaAIAgent:
    """AI Development Agent for Nati Fenua using OpenAI API"""
    
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EMERGENT_LLM_KEY")
        self.client = AsyncOpenAI(api_key=self.api_key) if self.api_key else None
        self.conversations: Dict[str, List[dict]] = {}
        
    def get_conversation(self, session_id: str) -> List[dict]:
        """Get or create conversation history for session"""
        if session_id not in self.conversations:
            self.conversations[session_id] = [
                {"role": "system", "content": NATI_FENUA_SYSTEM_CONTEXT}
            ]
        return self.conversations[session_id]
    
    async def send_message(self, session_id: str, user_message: str, context: Optional[str] = None) -> dict:
        """Send a message to the AI agent and get response"""
        try:
            if not self.client:
                return {
                    "success": False,
                    "error": "API key not configured",
                    "session_id": session_id
                }
            
            conversation = self.get_conversation(session_id)
            
            # Add context if provided
            full_message = user_message
            if context:
                full_message = f"{user_message}\n\n--- CONTEXTE ADDITIONNEL ---\n{context}"
            
            # Add user message to conversation
            conversation.append({"role": "user", "content": full_message})
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-4o",  # Use gpt-4o as fallback, will use gpt-5.2 when available
                messages=conversation,
                max_tokens=4096,
                temperature=0.7
            )
            
            assistant_message = response.choices[0].message.content
            
            # Add assistant response to conversation
            conversation.append({"role": "assistant", "content": assistant_message})
            
            # Store in database for persistence
            await self.db.ai_conversations.insert_one({
                "session_id": session_id,
                "user_message": user_message,
                "ai_response": assistant_message,
                "context": context,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {
                "success": True,
                "response": assistant_message,
                "session_id": session_id
            }
            
        except Exception as e:
            logger.error(f"AI Agent error: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id
            }
    
    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get conversation history from database"""
        history = await self.db.ai_conversations.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return list(reversed(history))
    
    async def analyze_error(self, error_log: str, file_path: Optional[str] = None) -> dict:
        """Specialized method to analyze errors"""
        session_id = f"error_analysis_{uuid.uuid4().hex[:8]}"
        
        prompt = f"""Analyse cette erreur et propose une solution:

ERREUR:
```
{error_log}
```
"""
        if file_path:
            prompt += f"\nFICHIER CONCERNÉ: {file_path}"
        
        return await self.send_message(session_id, prompt)
    
    async def suggest_improvement(self, feature: str, current_code: Optional[str] = None) -> dict:
        """Get improvement suggestions for a feature"""
        session_id = f"improvement_{uuid.uuid4().hex[:8]}"
        
        prompt = f"Suggère des améliorations pour la fonctionnalité: {feature}"
        
        return await self.send_message(session_id, prompt, context=current_code)
    
    async def generate_code(self, description: str, language: str = "javascript") -> dict:
        """Generate code based on description"""
        session_id = f"codegen_{uuid.uuid4().hex[:8]}"
        
        prompt = f"""Génère du code {language} pour:
{description}

Fournis un code complet, bien commenté et prêt à l'emploi."""
        
        return await self.send_message(session_id, prompt)
    
    def clear_session(self, session_id: str):
        """Clear a chat session"""
        if session_id in self.conversations:
            del self.conversations[session_id]


# Factory function to create agent instance
def create_ai_agent(db):
    return NatiFenuaAIAgent(db)
