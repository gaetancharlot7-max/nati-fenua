# AI Development Agent for Nati Fenua - MASTER DEVELOPER EDITION
# Expert-level code analysis, debugging, and audit capabilities

import os
import uuid
import logging
import json
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

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


# MASTER DEVELOPER SYSTEM CONTEXT - Ultra precise and comprehensive
MASTER_DEV_SYSTEM_CONTEXT = """
# AGENT IA NATI FENUA - MASTER DEVELOPER EDITION

Tu es un **EXPERT SENIOR FULL-STACK** avec 15+ ans d'experience. Tu maitrises parfaitement:
- Architecture logicielle et patterns de conception
- Performance et optimisation (frontend/backend)
- Securite applicative (OWASP, JWT, CORS, XSS, CSRF)
- DevOps et CI/CD
- Base de donnees (SQL/NoSQL, indexation, queries)
- Testing et QA
- Code review et audit de qualite

## TA MISSION PRINCIPALE

Tu aides Gaetan (le developpeur) a:
1. **DIAGNOSTIQUER** les bugs avec precision chirurgicale
2. **AUDITER** le code pour identifier les failles et ameliorations
3. **GENERER** du code production-ready et optimise
4. **DOCUMENTER** les solutions avec rapports detailles pour Emergent

## ARCHITECTURE NATI FENUA

### Stack Technologique
```
FRONTEND:
- React 18 + Hooks + Context API
- TailwindCSS + Shadcn/UI + Framer Motion
- PWA avec Service Worker
- Axios pour les requetes API

BACKEND:
- FastAPI (Python 3.11+)
- Motor (async MongoDB driver)
- Pydantic pour validation
- JWT + bcrypt pour auth

DATABASE:
- MongoDB Atlas (NoSQL)
- Collections: users, posts, stories, messages, conversations, notifications, reports

SERVICES EXTERNES:
- Cloudinary (stockage images/videos)
- Firebase Cloud Messaging (push notifications)
- Google OAuth 2.0
- Resend (emails transactionnels)

DEPLOIEMENT:
- Render (frontend: Static Site, backend: Web Service)
- Domaines separes: nati-fenua-frontend.onrender.com / nati-fenua-backend.onrender.com
```

### Structure du Projet
```
/backend/
├── server.py          # API principale (~8500 lignes - monolithe)
├── ai_agent.py        # Agent IA (ce fichier)
├── cloudinary_service.py
├── rss_feeds.py
├── fenua_pulse.py
├── requirements.txt
└── .env

/frontend/
├── src/
│   ├── pages/         # FeedPage, ProfilePage, ChatPage, ManaPage, etc.
│   ├── components/    # UI components
│   ├── contexts/      # AuthContext, ThemeContext
│   └── lib/           # utils, api config
├── public/
│   ├── service-worker.js
│   ├── _redirects     # Render SPA routing
│   └── manifest.json  # PWA config
└── package.json
```

### Endpoints API Critiques
```
AUTHENTIFICATION:
- POST /api/auth/login          # Login email/password
- POST /api/auth/register       # Inscription
- POST /api/auth/google         # Google OAuth
- GET  /api/auth/me             # Session check

POSTS & FEED:
- GET  /api/posts               # Feed avec pagination cursor
- POST /api/posts               # Creer un post
- GET  /api/users/{id}/posts    # Posts d'un utilisateur

SOCIAL:
- POST /api/friends/request     # Demande d'ami
- GET  /api/conversations       # Liste conversations
- POST /api/messages            # Envoyer message

ADMIN:
- GET  /api/admin/dashboard     # Stats admin
- POST /api/admin/login         # Login admin separe
```

### Problemes Connus et Points de Vigilance
1. **CORS**: CustomCORSMiddleware personnalise - verifier headers Cache-Control, Pragma
2. **OAuth**: Cross-domain entre frontend/backend Render - utilise localStorage au lieu de cookies
3. **Images**: Cloudinary pour stockage permanent (local = ephemere sur Render)
4. **MongoDB**: Toujours exclure `_id` des projections ou convertir en string
5. **Rate Limiting**: SlowAPI sur /login (10/min)

## FORMAT DE REPONSE

### Pour les BUGS:
```
## DIAGNOSTIC

**Severite**: CRITIQUE / HAUTE / MOYENNE / BASSE
**Composant affecte**: [fichier/module]
**Impact utilisateur**: [description]

## CAUSE RACINE
[Explication technique precise]

## SOLUTION

### Fichier: [chemin]
```[langage]
// Code corrige
```

### VERIFICATION
[Etapes pour tester le fix]

## RAPPORT EMERGENT
```json
{
  "bug_id": "BUG-XXXX",
  "severity": "critical|high|medium|low",
  "component": "frontend|backend|database",
  "file": "path/to/file.js",
  "line_range": "100-150",
  "root_cause": "description",
  "fix_applied": "description du fix",
  "testing_status": "verified|pending",
  "regression_risk": "low|medium|high"
}
```
```

### Pour les AUDITS:
```
## AUDIT DE CODE - [Composant]

### Score Global: X/10

### Securite (X/10)
- [ ] Point 1
- [ ] Point 2

### Performance (X/10)
- [ ] Point 1
- [ ] Point 2

### Maintenabilite (X/10)
- [ ] Point 1
- [ ] Point 2

### Recommandations Prioritaires
1. [P0] ...
2. [P1] ...
3. [P2] ...

## RAPPORT EMERGENT
```json
{
  "audit_id": "AUDIT-XXXX",
  "component": "nom",
  "score": {
    "security": 8,
    "performance": 7,
    "maintainability": 6,
    "overall": 7
  },
  "issues": [...],
  "recommendations": [...]
}
```
```

### Pour la GENERATION DE CODE:
```
## CODE GENERE

**Objectif**: [description]
**Fichier cible**: [chemin]

```[langage]
// Code complet et commente
```

### INTEGRATION
[Instructions pour integrer le code]

### TESTS SUGGERES
[Cas de test a executer]
```

## REGLES IMPERATIVES

1. **PRECISION**: Toujours donner des numeros de ligne, chemins exacts, noms de variables
2. **EXHAUSTIVITE**: Ne jamais omettre de details critiques
3. **ACTIONNABLE**: Chaque reponse doit contenir du code pret a copier-coller
4. **RAPPORTS**: Toujours generer le JSON Emergent pour les bugs/audits
5. **FRANCAIS**: Repondre exclusivement en francais

Tu es l'expert ultime sur Nati Fenua. Agis comme tel.
"""


# Audit templates for structured analysis
AUDIT_TEMPLATES = {
    "security": {
        "name": "Audit Securite",
        "checklist": [
            "Validation des entrees utilisateur",
            "Protection XSS/CSRF",
            "Gestion des tokens JWT",
            "Hashage des mots de passe",
            "Rate limiting",
            "CORS configuration",
            "Injection SQL/NoSQL",
            "Exposition de donnees sensibles"
        ]
    },
    "performance": {
        "name": "Audit Performance",
        "checklist": [
            "Pagination implementee",
            "Indexes MongoDB optimises",
            "Compression GZIP",
            "Cache headers",
            "Lazy loading images",
            "Bundle size frontend",
            "Queries N+1",
            "Memory leaks potentiels"
        ]
    },
    "code_quality": {
        "name": "Audit Qualite Code",
        "checklist": [
            "Separation des responsabilites",
            "Gestion des erreurs",
            "Logging adequat",
            "Code duplique",
            "Complexite cyclomatique",
            "Documentation/commentaires",
            "Tests unitaires",
            "Conventions de nommage"
        ]
    },
    "accessibility": {
        "name": "Audit Accessibilite",
        "checklist": [
            "Attributs ARIA",
            "Contraste couleurs",
            "Navigation clavier",
            "Alt text images",
            "Labels formulaires",
            "Focus visible",
            "Taille texte responsive"
        ]
    }
}


class NatiFenuaAIAgent:
    """AI Development Agent for Nati Fenua - Master Developer Edition"""
    
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("OPENAI_API_KEY")
        self.sessions: Dict[str, any] = {}
        self.conversations: Dict[str, List[dict]] = {}
        self.audit_results: Dict[str, dict] = {}
        
    def get_or_create_session(self, session_id: str):
        """Get existing chat session or create new one"""
        if USE_EMERGENT:
            if session_id not in self.sessions:
                chat = LlmChat(
                    api_key=self.api_key,
                    session_id=session_id,
                    system_message=MASTER_DEV_SYSTEM_CONTEXT
                )
                chat.with_model("openai", "gpt-4o")
                self.sessions[session_id] = chat
            return self.sessions[session_id]
        else:
            # Direct OpenAI - manage conversation manually
            if session_id not in self.conversations:
                self.conversations[session_id] = [
                    {"role": "system", "content": MASTER_DEV_SYSTEM_CONTEXT}
                ]
            return self.conversations[session_id]
    
    async def send_message(self, session_id: str, user_message: str, context: Optional[str] = None) -> dict:
        """Send a message to the AI agent and get response"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "Cle API non configuree. Ajoutez EMERGENT_LLM_KEY ou OPENAI_API_KEY.",
                    "session_id": session_id
                }
            
            # Add context if provided
            full_message = user_message
            if context:
                full_message = f"{user_message}\n\n--- CONTEXTE ADDITIONNEL ---\n{context}"
            
            if USE_EMERGENT:
                chat = self.get_or_create_session(session_id)
                message = UserMessage(text=full_message)
                response = await chat.send_message(message)
            else:
                # Direct OpenAI with enhanced parameters
                conversation = self.get_or_create_session(session_id)
                conversation.append({"role": "user", "content": full_message})
                
                client = AsyncOpenAI(api_key=self.api_key)
                result = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=conversation,
                    max_tokens=8192,  # Increased for detailed responses
                    temperature=0.3,  # Lower for more precise/technical responses
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
                response = result.choices[0].message.content
                conversation.append({"role": "assistant", "content": response})
            
            # Extract JSON report if present
            emergent_report = self._extract_emergent_report(response)
            
            # Store in database with enhanced metadata
            await self.db.ai_conversations.insert_one({
                "session_id": session_id,
                "user_message": user_message,
                "ai_response": response,
                "context": context,
                "emergent_report": emergent_report,
                "message_type": self._classify_message(user_message),
                "created_at": datetime.now(timezone.utc).isoformat()
            })
            
            return {
                "success": True,
                "response": response,
                "session_id": session_id,
                "emergent_report": emergent_report
            }
            
        except Exception as e:
            logger.error(f"AI Agent error: {e}")
            return {
                "success": False,
                "error": str(e),
                "session_id": session_id
            }
    
    def _extract_emergent_report(self, response: str) -> Optional[dict]:
        """Extract JSON report from AI response for Emergent"""
        try:
            # Look for JSON block in response
            json_pattern = r'```json\s*(\{[\s\S]*?\})\s*```'
            matches = re.findall(json_pattern, response)
            
            for match in matches:
                try:
                    report = json.loads(match)
                    # Check if it's an Emergent report (has bug_id or audit_id)
                    if any(key in report for key in ['bug_id', 'audit_id', 'severity', 'score']):
                        return report
                except json.JSONDecodeError:
                    continue
            return None
        except Exception:
            return None
    
    def _classify_message(self, message: str) -> str:
        """Classify the type of user message"""
        message_lower = message.lower()
        if any(word in message_lower for word in ['bug', 'erreur', 'crash', 'fix', 'probleme', 'marche pas']):
            return 'bug_report'
        elif any(word in message_lower for word in ['audit', 'analyse', 'revue', 'review', 'securite']):
            return 'audit_request'
        elif any(word in message_lower for word in ['genere', 'cree', 'code', 'implemente', 'ajoute']):
            return 'code_generation'
        elif any(word in message_lower for word in ['ameliore', 'optimise', 'performance', 'refactor']):
            return 'optimization'
        else:
            return 'general'
    
    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get conversation history from database"""
        history = await self.db.ai_conversations.find(
            {"session_id": session_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return list(reversed(history))
    
    async def run_audit(self, audit_type: str, code_snippet: Optional[str] = None, file_path: Optional[str] = None) -> dict:
        """Run a structured audit on code"""
        session_id = f"audit_{audit_type}_{uuid.uuid4().hex[:8]}"
        
        template = AUDIT_TEMPLATES.get(audit_type, AUDIT_TEMPLATES["code_quality"])
        checklist_str = "\n".join([f"- {item}" for item in template["checklist"]])
        
        prompt = f"""## DEMANDE D'AUDIT: {template["name"]}

Effectue un audit complet selon cette checklist:
{checklist_str}

"""
        if code_snippet:
            prompt += f"""### Code a analyser:
```
{code_snippet}
```
"""
        if file_path:
            prompt += f"\n### Fichier: {file_path}"
        
        prompt += """

Fournis:
1. Score detaille pour chaque categorie (X/10)
2. Liste des problemes identifies avec severite
3. Recommandations priorisees (P0/P1/P2)
4. Rapport JSON Emergent complet
"""
        
        result = await self.send_message(session_id, prompt)
        
        # Store audit result
        if result.get("success"):
            self.audit_results[session_id] = {
                "type": audit_type,
                "result": result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        
        return result
    
    async def analyze_error(self, error_log: str, file_path: Optional[str] = None, stack_trace: Optional[str] = None) -> dict:
        """Analyze an error with full context"""
        session_id = f"error_{uuid.uuid4().hex[:8]}"
        
        prompt = f"""## ANALYSE DE BUG

### Erreur:
```
{error_log}
```
"""
        if stack_trace:
            prompt += f"""
### Stack Trace:
```
{stack_trace}
```
"""
        if file_path:
            prompt += f"\n### Fichier concerne: {file_path}"
        
        prompt += """

Fournis:
1. DIAGNOSTIC complet avec severite
2. CAUSE RACINE precise
3. SOLUTION avec code correctif complet
4. VERIFICATION: etapes de test
5. RAPPORT EMERGENT JSON avec tous les details
"""
        
        return await self.send_message(session_id, prompt)
    
    async def generate_code(self, description: str, language: str = "javascript", context: Optional[str] = None) -> dict:
        """Generate production-ready code"""
        session_id = f"code_{uuid.uuid4().hex[:8]}"
        
        prompt = f"""## GENERATION DE CODE

**Langage**: {language}
**Objectif**: {description}

Genere du code:
1. Production-ready et optimise
2. Commente en francais
3. Avec gestion d'erreurs complete
4. Suivant les conventions du projet Nati Fenua

Inclus aussi:
- Instructions d'integration
- Tests suggeres
- Points d'attention
"""
        
        return await self.send_message(session_id, prompt, context)
    
    async def get_emergent_reports(self, limit: int = 20) -> List[dict]:
        """Get all Emergent reports from conversations"""
        reports = await self.db.ai_conversations.find(
            {"emergent_report": {"$ne": None}},
            {"_id": 0, "emergent_report": 1, "created_at": 1, "message_type": 1}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        return reports
    
    async def export_audit_summary(self) -> dict:
        """Export a summary of all audits for Emergent"""
        reports = await self.get_emergent_reports(100)
        
        summary = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_reports": len(reports),
            "bugs": [],
            "audits": [],
            "by_severity": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "by_component": {}
        }
        
        for item in reports:
            report = item.get("emergent_report", {})
            if "bug_id" in report:
                summary["bugs"].append(report)
                severity = report.get("severity", "low")
                summary["by_severity"][severity] = summary["by_severity"].get(severity, 0) + 1
            elif "audit_id" in report:
                summary["audits"].append(report)
            
            component = report.get("component", "unknown")
            summary["by_component"][component] = summary["by_component"].get(component, 0) + 1
        
        return summary
    
    def clear_session(self, session_id: str):
        """Clear a chat session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
        if session_id in self.conversations:
            del self.conversations[session_id]


def create_ai_agent(db):
    return NatiFenuaAIAgent(db)
