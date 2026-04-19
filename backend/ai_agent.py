# AI Development Agent for Nati Fenua
# Using emergentintegrations for Emergent LLM Key support

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

# Try to import emergentintegrations, fallback to direct OpenAI
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    USE_EMERGENT = True
    logger.info("Using emergentintegrations for LLM")
except ImportError:
    USE_EMERGENT = False
    try:
        from openai import AsyncOpenAI
        logger.info("Using direct OpenAI API")
    except ImportError:
        logger.error("No LLM library available")

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
├── pages/ - FeedPage, ProfilePage, FriendsPage, ChatPage, ManaPage, MarketplacePage, SettingsPage
├── components/ - FriendButton, OfflineIndicator, NotificationPrompt
├── contexts/ - AuthContext, ThemeContext
└── lib/ - api.js, firebase.js
    
/backend/
├── server.py - API principale FastAPI (~8000 lignes)
├── rss_feeds.py - Service RSS pour actualités
└── friend_requests.py - Logique demandes d'amis
```

### Endpoints API Principaux
- POST /api/auth/login, /api/auth/register, /api/auth/google
- GET/POST /api/posts (pagination cursor, limit max 30)
- GET/POST /api/stories
- GET/POST /api/friends/request
- GET /api/users/{id}, GET /api/users/{id}/posts (limit max 50)
- GET/POST /api/messages, /api/conversations

### Optimisations récentes (5000 utilisateurs)
- Pagination cursor au lieu de skip/limit
- CORS whitelist (plus de allow_origins=["*"])
- Rate limit login: 10/minute
- Indexes MongoDB optimisés
- Gunicorn multi-workers

## COMMENT RÉPONDRE
1. Réponds TOUJOURS en français
2. Sois précis et concis
3. Fournis du code prêt à l'emploi quand nécessaire
4. Indique les fichiers à modifier
5. Priorise la stabilité de l'application
"""


class NatiFenuaAIAgent:
    """AI Development Agent for Nati Fenua"""
    
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY")
        self.sessions: Dict[str, any] = {}
        self.conversations: Dict[str, List[dict]] = {}
        
    def get_or_create_session(self, session_id: str):
        """Get existing chat session or create new one"""
        if USE_EMERGENT:
            if session_id not in self.sessions:
                chat = LlmChat(
                    api_key=self.api_key,
                    session_id=session_id,
                    system_message=NATI_FENUA_SYSTEM_CONTEXT
                )
                chat.with_model("openai", "gpt-4o")
                self.sessions[session_id] = chat
            return self.sessions[session_id]
        else:
            # Direct OpenAI - manage conversation manually
            if session_id not in self.conversations:
                self.conversations[session_id] = [
                    {"role": "system", "content": NATI_FENUA_SYSTEM_CONTEXT}
                ]
            return self.conversations[session_id]
    
    async def send_message(self, session_id: str, user_message: str, context: Optional[str] = None) -> dict:
        """Send a message to the AI agent and get response"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "Clé API non configurée. Ajoutez EMERGENT_LLM_KEY ou OPENAI_API_KEY.",
                    "session_id": session_id
                }
            
            # Add context if provided
            full_message = user_message
            if context:
                full_message = f"{user_message}\n\n--- CONTEXTE ---\n{context}"
            
            if USE_EMERGENT:
                chat = self.get_or_create_session(session_id)
                message = UserMessage(text=full_message)
                response = await chat.send_message(message)
            else:
                # Direct OpenAI
                conversation = self.get_or_create_session(session_id)
                conversation.append({"role": "user", "content": full_message})
                
                client = AsyncOpenAI(api_key=self.api_key)
                result = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=conversation,
                    max_tokens=4096,
                    temperature=0.7
                )
                response = result.choices[0].message.content
                conversation.append({"role": "assistant", "content": response})
            
            # Store in database
            await self.db.ai_conversations.insert_one({
                "session_id": session_id,
                "user_message": user_message,
                "ai_response": response,
                "context": context,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {
                "success": True,
                "response": response,
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
        """Analyze an error and suggest fixes"""
        session_id = f"error_{uuid.uuid4().hex[:8]}"
        prompt = f"Analyse cette erreur:\n```\n{error_log}\n```"
        if file_path:
            prompt += f"\nFichier: {file_path}"
        return await self.send_message(session_id, prompt)
    
    async def generate_code(self, description: str, language: str = "javascript") -> dict:
        """Generate code based on description"""
        session_id = f"code_{uuid.uuid4().hex[:8]}"
        prompt = f"Génère du code {language} pour: {description}"
        return await self.send_message(session_id, prompt)
    
    def clear_session(self, session_id: str):
        """Clear a chat session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.conversations:
            del self.conversations[session_id]


def create_ai_agent(db):
    return NatiFenuaAIAgent(db)
