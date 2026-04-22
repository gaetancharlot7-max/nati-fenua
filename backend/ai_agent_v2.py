"""
AGENT IA V2 NATI FENUA - CLAUDE SONNET
Version: 2.0 - Principal Developer Mode
Modele: Claude 3.5 Sonnet
"""

import os
import re
import json
import time
import hashlib
import subprocess
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

import anthropic
from fastapi import APIRouter
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

# Configuration
CLAUDE_MODEL = "claude-3-5-sonnet-latest"
MAX_TOKENS_OUT = 16000
MAX_REACT_LOOPS = 12
SESSION_WINDOW = 30
SUMMARY_THRESHOLD = 15
PROJECT_ROOT = os.getenv("PROJECT_ROOT", "/app")
MONGO_URL = os.getenv("MONGO_URL", "")
DB_NAME = os.getenv("DB_NAME", "nati_fenua")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

FORBIDDEN_COMMANDS = ["rm -rf /", "DROP DATABASE", "DROP TABLE", "format c:", "dd if=/dev/zero"]

# Initialize Claude client
claude_client = None
if ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "METTRE_VOTRE_CLE_ICI":
    claude_client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

router = APIRouter(prefix="/api/ai", tags=["AI Agent V2"])


# ============================================
# PYDANTIC MODELS
# ============================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[str] = None
    autonomous_mode: bool = True

class TaskRequest(BaseModel):
    task: str
    session_id: Optional[str] = None
    confirm_writes: bool = False

class AuditRequest(BaseModel):
    audit_type: str = "full_app"
    target_path: Optional[str] = None

class CodeGenRequest(BaseModel):
    description: str
    target_file: Optional[str] = None
    language: str = "python"
    session_id: Optional[str] = None

class AgentResponse(BaseModel):
    response: str
    session_id: str
    actions_taken: List[Dict] = []
    files_modified: List[str] = []
    iterations: int = 0
    report: Optional[Dict] = None
    execution_time_ms: int = 0


# ============================================
# SYSTEM PROMPT - CONNAISSANCE COMPLETE NATI FENUA
# ============================================

def build_system_prompt(memory_context: str = "") -> str:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    return f"""
Tu es l'Agent Developpeur Principal de l'application Nati Fenua.
Tu incarnes le meilleur developpeur full-stack possible avec 20 ans d'experience.
Date/heure : {timestamp}

STACK TECHNIQUE NATI FENUA :
Frontend  : React 18 + Hooks + React Router v6 + Tailwind CSS
Backend   : FastAPI (Python 3.11) + Motor (async MongoDB)
Base de donnees : MongoDB Atlas (50+ collections)
Stockage  : Cloudinary (images/videos)
Auth      : JWT (users bcrypt) + SHA256 (admin) + OAuth Google
Deploy    : Render (backend) + Vercel/Netlify (frontend)

STRUCTURE DU PROJET :
/app/
├── backend/
│   ├── server.py              # API principale (~8700 lignes, monolithe)
│   ├── ai_agent_v2.py         # Agent IA V2 (ce fichier)
│   ├── auth_security.py       # Securite et hashage
│   ├── cloudinary_service.py  # Service upload Cloudinary
│   ├── rss_feeds.py           # Gestion flux RSS
│   ├── fenua_pulse.py         # Donnees carte Mana
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # 40+ pages React
│   │   ├── components/        # Composants reutilisables
│   │   ├── contexts/          # AuthContext, ThemeContext
│   │   └── lib/               # api.js, utils.js
│   └── public/

COLLECTIONS MONGODB PRINCIPALES :
- users, user_sessions, admin_users, admin_sessions
- posts, stories, comments, reactions, likes
- conversations, messages
- follows, friend_requests, blocks
- products, services, vendors (Marketplace)
- pulse_markers, mana_alerts (Carte Mana)
- notifications, push_subscriptions
- ai_conversations, ai_long_term_memory, ai_session_summaries

MEMOIRE LONG TERME :
{memory_context if memory_context else "Premiere session ou aucun historique disponible."}

MODE OPERATOIRE — BOUCLE REACT :
1. PLAN  → Analyse, identifie les fichiers concernes
2. READ  → Lis TOUJOURS les fichiers avant de les modifier
3. ACT   → Utilise les tools (ecrire, tester, analyser, git)
4. VERIFY→ Lance les tests, verifie le resultat
5. FIX   → Si erreur, corrige et recommence
6. REPORT→ Resume avec un rapport JSON structure

STANDARDS DE CODE :
PYTHON : Type hints · Docstrings · try/except + logging · Async/await · Pydantic · SOLID · Max 50 lignes/fonction
REACT  : Functional components · Custom hooks · useCallback/useMemo · Error boundaries
GENERAL: DRY · KISS · Commentaires francais · Pas de secrets hardcodes · Tests critiques

SECURITE OWASP Top 10 :
- Injection → Sanitize tous les inputs
- Auth → JWT expiry + refresh tokens
- Secrets → Jamais en clair
- CORS → Origines explicites
- Rate limiting → SlowAPI endpoints publics

PERFORMANCE :
- MongoDB : Index sur champs filtres, projection limitee
- API : Pagination toutes les listes, GZIP
- Frontend : Code splitting, lazy loading
- Requetes N+1 : agregations MongoDB

Tu reponds toujours en francais. Direct, precis, professionnel.
Quand tu modifies du code, fournis le fichier complet.
"""


# ============================================
# AGENT TOOLS DEFINITIONS
# ============================================

AGENT_TOOLS = [
    {
        "name": "read_file",
        "description": "Lit le contenu d'un fichier du projet. Utiliser AVANT toute modification.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "lines_from": {"type": "integer"},
                "lines_to": {"type": "integer"}
            },
            "required": ["path"]
        }
    },
    {
        "name": "write_file",
        "description": "Cree ou modifie un fichier. Mode patch pour modifications chirurgicales.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "content": {"type": "string"},
                "mode": {"type": "string", "enum": ["overwrite", "append", "patch"]},
                "patch_old": {"type": "string"},
                "patch_new": {"type": "string"}
            },
            "required": ["path", "mode"]
        }
    },
    {
        "name": "list_directory",
        "description": "Liste les fichiers d'un repertoire.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "recursive": {"type": "boolean", "default": False},
                "extensions": {"type": "array", "items": {"type": "string"}}
            }
        }
    },
    {
        "name": "search_in_codebase",
        "description": "Recherche un pattern dans tous les fichiers du projet.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {"type": "string"},
                "file_extensions": {"type": "array", "items": {"type": "string"}},
                "case_sensitive": {"type": "boolean", "default": False}
            },
            "required": ["pattern"]
        }
    },
    {
        "name": "run_command",
        "description": "Execute une commande shell securisee.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string"},
                "working_dir": {"type": "string"},
                "timeout": {"type": "integer"}
            },
            "required": ["command"]
        }
    },
    {
        "name": "run_tests",
        "description": "Lance les tests (pytest ou jest) et retourne les resultats.",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_path": {"type": "string"},
                "framework": {"type": "string", "enum": ["pytest", "jest", "auto"], "default": "auto"},
                "verbose": {"type": "boolean", "default": True}
            }
        }
    },
    {
        "name": "analyze_code_quality",
        "description": "Analyse qualite : Black, Flake8, MyPy (Python) ou ESLint (JS).",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string"},
                "checks": {"type": "array", "items": {"type": "string", "enum": ["complexity", "conventions", "types", "all"]}}
            },
            "required": ["path"]
        }
    },
    {
        "name": "security_scan",
        "description": "Scan securite OWASP : Bandit, secrets hardcodes, CVE.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "scan_type": {"type": "string", "enum": ["injection", "auth", "secrets", "dependencies", "full"], "default": "full"}
            },
            "required": ["target"]
        }
    },
    {
        "name": "performance_profile",
        "description": "Analyse performances : N+1 MongoDB, endpoints sans pagination.",
        "input_schema": {
            "type": "object",
            "properties": {
                "target": {"type": "string"},
                "focus": {"type": "string", "enum": ["database", "api", "frontend", "full"], "default": "full"}
            },
            "required": ["target"]
        }
    },
    {
        "name": "git_operation",
        "description": "Operations git : status, diff, log, branch, add, commit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["status", "diff", "log", "branch", "commit", "add", "checkout"]},
                "args": {"type": "string"},
                "files": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["action"]
        }
    },
    {
        "name": "query_database",
        "description": "Interroge MongoDB : find, count, aggregate, indexes, collections.",
        "input_schema": {
            "type": "object",
            "properties": {
                "operation": {"type": "string", "enum": ["find", "count", "aggregate", "indexes", "collections"]},
                "collection": {"type": "string"},
                "query": {"type": "object"},
                "pipeline": {"type": "array"},
                "limit": {"type": "integer", "default": 10}
            },
            "required": ["operation"]
        }
    },
    {
        "name": "generate_documentation",
        "description": "Genere documentation : docstrings, README, commentaires.",
        "input_schema": {
            "type": "object",
            "properties": {
                "source_path": {"type": "string"},
                "doc_type": {"type": "string", "enum": ["docstrings", "readme", "openapi", "inline_comments"]},
                "output_path": {"type": "string"}
            },
            "required": ["source_path", "doc_type"]
        }
    },
    {
        "name": "save_to_memory",
        "description": "Sauvegarde en memoire longue duree : bugs resolus, decisions, patterns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "enum": ["bug_fixed", "architecture_decision", "pattern_found", "performance_note", "security_note", "todo"]},
                "content": {"type": "string"},
                "file_reference": {"type": "string"}
            },
            "required": ["category", "content"]
        }
    },
    {
        "name": "recall_memory",
        "description": "Recupere les souvenirs depuis la memoire longue duree.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "category": {"type": "string"},
                "limit": {"type": "integer", "default": 5}
            },
            "required": ["query"]
        }
    },
    {
        "name": "create_plan",
        "description": "Cree un plan d'execution structure pour une tache complexe.",
        "input_schema": {
            "type": "object",
            "properties": {
                "task_description": {"type": "string"},
                "steps": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "step_id": {"type": "integer"},
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "tools_needed": {"type": "array", "items": {"type": "string"}},
                            "estimated_complexity": {"type": "string", "enum": ["low", "medium", "high"]}
                        }
                    }
                },
                "priority": {"type": "string", "enum": ["low", "medium", "high", "critical"]}
            },
            "required": ["task_description", "steps"]
        }
    }
]


# ============================================
# TOOL EXECUTOR
# ============================================

class ToolExecutor:
    def __init__(self, db, project_root: str = PROJECT_ROOT):
        self.db = db
        self.root = Path(project_root)

    def _safe_path(self, path: str) -> Path:
        resolved = (self.root / path).resolve()
        if not str(resolved).startswith(str(self.root.resolve())):
            raise PermissionError(f"Acces refuse hors projet : {path}")
        return resolved

    def read_file(self, path: str, lines_from: int = None, lines_to: int = None) -> str:
        try:
            fp = self._safe_path(path)
            if not fp.exists():
                return f"Fichier introuvable : {path}"
            content = fp.read_text(encoding="utf-8")
            lines = content.splitlines()
            if lines_from or lines_to:
                s = (lines_from or 1) - 1
                e = lines_to or len(lines)
                lines = lines[s:e]
            numbered = "\n".join(f"{i+1:4}| {l}" for i, l in enumerate(lines))
            return f"Fichier {path} ({len(lines)} lignes):\n{numbered}"
        except Exception as e:
            return f"Erreur lecture : {e}"

    def write_file(self, path: str, content: str = "", mode: str = "overwrite",
                   patch_old: str = None, patch_new: str = None) -> str:
        try:
            fp = self._safe_path(path)
            fp.parent.mkdir(parents=True, exist_ok=True)
            if mode == "overwrite":
                fp.write_text(content, encoding="utf-8")
                return f"Ecrit : {path}"
            elif mode == "append":
                with open(fp, "a", encoding="utf-8") as f:
                    f.write("\n" + content)
                return f"Ajoute a : {path}"
            elif mode == "patch":
                if not patch_old:
                    return "patch_old requis"
                existing = fp.read_text(encoding="utf-8")
                if patch_old not in existing:
                    return f"Texte source introuvable dans {path}"
                fp.write_text(existing.replace(patch_old, patch_new or "", 1), encoding="utf-8")
                return f"Patch applique : {path}"
        except Exception as e:
            return f"Erreur ecriture : {e}"

    def list_directory(self, path: str = ".", recursive: bool = False, extensions: List[str] = None) -> str:
        try:
            dp = self._safe_path(path)
            if not dp.exists():
                return f"Repertoire introuvable : {path}"
            files = list(dp.rglob("*") if recursive else dp.iterdir())
            excluded = {".git", "__pycache__", "node_modules", "venv", ".venv", "dist", "build"}
            files = [f for f in files if not any(p in excluded for p in f.parts)]
            if extensions:
                files = [f for f in files if f.suffix in extensions]
            files.sort()
            tree = []
            for f in files[:150]:
                rel = f.relative_to(dp)
                icon = "D" if f.is_dir() else "F"
                tree.append(f"[{icon}] {rel}")
            return f"{path} ({len(files)} elements):\n" + "\n".join(tree)
        except Exception as e:
            return f"Erreur listage : {e}"

    def search_in_codebase(self, pattern: str, file_extensions: List[str] = None, case_sensitive: bool = False) -> str:
        try:
            flags = "" if case_sensitive else "-i"
            includes = " ".join(f"--include='*{e}'" for e in (file_extensions or []))
            cmd = f"grep -rn {flags} {includes} --color=never '{pattern}' {self.root} 2>/dev/null"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=15)
            out = result.stdout.strip()
            if not out:
                return f"Aucun resultat pour '{pattern}'"
            lines = out.splitlines()[:60]
            return f"{len(lines)} occurrence(s) de '{pattern}':\n" + "\n".join(lines)
        except Exception as e:
            return f"Erreur recherche : {e}"

    def run_command(self, command: str, working_dir: str = None, timeout: int = 30) -> str:
        for forbidden in FORBIDDEN_COMMANDS:
            if forbidden.lower() in command.lower():
                return f"Commande interdite : {forbidden}"
        try:
            cwd = self._safe_path(working_dir) if working_dir else self.root
            r = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=timeout, cwd=str(cwd))
            out = (r.stdout or "") + (r.stderr or "")
            return f"(exit {r.returncode}):\n{out[:3000]}"
        except subprocess.TimeoutExpired:
            return f"Timeout ({timeout}s)"
        except Exception as e:
            return f"Erreur : {e}"

    def run_tests(self, test_path: str = None, framework: str = "auto", verbose: bool = True) -> str:
        if framework == "auto":
            framework = "pytest" if (self.root / "backend").exists() else "jest"
        if framework == "pytest":
            path = f"backend/{test_path}" if test_path else "backend"
            v = "-v" if verbose else ""
            cmd = f"python -m pytest {v} {path} --tb=short 2>&1"
        else:
            path = test_path or "."
            cmd = f"npx jest {path} --no-coverage 2>&1"
        return self.run_command(cmd, timeout=90)

    def analyze_code_quality(self, path: str, checks: List[str] = None) -> str:
        if not checks or "all" in checks:
            checks = ["conventions", "types"]
        fp = self._safe_path(path)
        is_py = str(path).endswith(".py") or (fp.is_dir() and any(fp.rglob("*.py")))
        results = []
        if is_py:
            if "conventions" in checks:
                results.append("Black:\n" + self.run_command(f"python -m black --check --diff {path} 2>&1", timeout=20))
                results.append("Flake8:\n" + self.run_command(f"python -m flake8 {path} --max-line-length 100 2>&1", timeout=20))
            if "types" in checks:
                results.append("MyPy:\n" + self.run_command(f"python -m mypy {path} --ignore-missing-imports 2>&1", timeout=30))
        else:
            results.append("ESLint:\n" + self.run_command(f"npx eslint {path} --format compact 2>&1", timeout=30))
        return "\n\n".join(results) or "Analyse terminee."

    def security_scan(self, target: str, scan_type: str = "full") -> str:
        results = []
        if scan_type in ["secrets", "full"]:
            r = self.search_in_codebase(r"(password|secret|api_key|token)\s*=\s*['\"][^'\"]{8,}", [".py", ".js"])
            results.append(f"Secrets hardcodes:\n{r}")
        fp = self._safe_path(target)
        is_py = str(target).endswith(".py") or (fp.is_dir() and any(fp.rglob("*.py")))
        if scan_type in ["injection", "full"] and is_py:
            r = self.run_command(f"python -m bandit -r {target} -ll -q 2>&1", timeout=30)
            results.append(f"Bandit:\n{r}")
        return "\n\n".join(results) or "Aucun probleme detecte."

    def performance_profile(self, target: str, focus: str = "full") -> str:
        results = []
        if focus in ["database", "full"]:
            r = self.search_in_codebase(r"\.find\(", [".py"])
            results.append(f"Requetes MongoDB (verifier index):\n{r}")
        if focus in ["api", "full"]:
            r = self.search_in_codebase(r"@router\.(get|post|put|delete)", [".py"])
            results.append(f"Endpoints (verifier pagination):\n{r}")
        return "\n\n".join(results) or "Profiling termine."

    def git_operation(self, action: str, args: str = "", files: List[str] = None) -> str:
        fl = " ".join(files) if files else "."
        cmds = {
            "status": "git status --short",
            "diff": f"git diff {args}",
            "log": f"git log --oneline -20 {args}",
            "branch": "git branch -a",
            "add": f"git add {fl}",
            "commit": f'git commit -m "{args}"',
            "checkout": f"git checkout {args}"
        }
        cmd = cmds.get(action, f"echo 'Action inconnue : {action}'")
        return self.run_command(cmd, timeout=15)

    async def query_database(self, operation: str, collection: str = None,
                             query: dict = None, pipeline: list = None, limit: int = 10) -> str:
        try:
            if operation == "collections":
                cols = await self.db.list_collection_names()
                return f"{len(cols)} collections:\n" + "\n".join(sorted(cols))
            if not collection:
                return "collection requise"
            col = self.db[collection]
            if operation == "indexes":
                idx = await col.index_information()
                return f"Index '{collection}':\n{json.dumps(idx, indent=2, default=str)}"
            if operation == "count":
                n = await col.count_documents(query or {})
                return f"{collection}: {n:,} documents"
            if operation == "find":
                docs = await col.find(query or {}).limit(limit).to_list(limit)
                for d in docs:
                    d["_id"] = str(d.get("_id", ""))
                return f"{len(docs)} doc(s):\n{json.dumps(docs, indent=2, default=str)}"
            if operation == "aggregate" and pipeline:
                docs = await col.aggregate(pipeline).to_list(limit)
                for d in docs:
                    d["_id"] = str(d.get("_id", ""))
                return f"Aggregation:\n{json.dumps(docs, indent=2, default=str)}"
            return "Operation invalide"
        except Exception as e:
            return f"Erreur DB : {e}"

    def generate_documentation(self, source_path: str, doc_type: str, output_path: str = None) -> str:
        content = self.read_file(source_path)
        return f"Lu pour generation [{doc_type}]:\n{content[:4000]}"

    async def save_to_memory(self, category: str, content: str,
                             file_reference: str = None, session_id: str = "") -> str:
        await self.db.ai_long_term_memory.insert_one({
            "session_id": session_id,
            "category": category,
            "content": content,
            "file_reference": file_reference,
            "created_at": datetime.utcnow()
        })
        return f"Memorise [{category}]: {content[:100]}..."

    async def recall_memory(self, query: str, category: str = None, limit: int = 5) -> str:
        fq: Dict[str, Any] = {"content": {"$regex": query, "$options": "i"}}
        if category:
            fq["category"] = category
        docs = await self.db.ai_long_term_memory.find(fq).sort("created_at", -1).limit(limit).to_list(limit)
        if not docs:
            return f"Aucun souvenir pour '{query}'"
        return "Souvenirs:\n" + "\n".join(f"[{d['category']}] {d['content'][:150]}" for d in docs)

    async def create_plan(self, task_description: str, steps: List[Dict],
                          priority: str = "medium", session_id: str = "") -> str:
        await self.db.ai_plans.insert_one({
            "session_id": session_id,
            "task": task_description,
            "priority": priority,
            "steps": steps,
            "status": "active",
            "created_at": datetime.utcnow()
        })
        summary = f"Plan [{priority}]: {task_description}\n"
        summary += "\n".join(f"  {s['step_id']}. {s['title']}" for s in steps)
        return summary


# ============================================
# MEMORY MANAGER
# ============================================

class MemoryManager:
    def __init__(self, db):
        self.db = db

    async def get_session_history(self, session_id: str) -> List[Dict]:
        docs = await self.db.ai_conversations.find(
            {"session_id": session_id}
        ).sort("created_at", 1).limit(SESSION_WINDOW).to_list(SESSION_WINDOW)
        history = []
        for d in docs:
            history.append({"role": "user", "content": d["user_message"]})
            history.append({"role": "assistant", "content": d["ai_response"]})
        return history

    async def save_turn(self, session_id: str, user_msg: str, ai_resp: str,
                        actions: List[Dict] = None, report: Dict = None, message_type: str = "chat") -> None:
        await self.db.ai_conversations.insert_one({
            "session_id": session_id,
            "user_message": user_msg,
            "ai_response": ai_resp,
            "actions_taken": actions or [],
            "emergent_report": report,
            "message_type": message_type,
            "created_at": datetime.utcnow()
        })
        count = await self.db.ai_conversations.count_documents({"session_id": session_id})
        if count % SUMMARY_THRESHOLD == 0:
            await self._auto_summarize(session_id)

    async def _auto_summarize(self, session_id: str) -> None:
        if not claude_client:
            return
        docs = await self.db.ai_conversations.find(
            {"session_id": session_id}
        ).sort("created_at", -1).limit(SUMMARY_THRESHOLD).to_list(SUMMARY_THRESHOLD)
        if not docs:
            return
        turns = "\n".join(f"User: {d['user_message'][:200]}\nAgent: {d['ai_response'][:300]}" for d in reversed(docs))
        try:
            resp = claude_client.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=800,
                messages=[{"role": "user", "content": f"Resume ces echanges en 150 mots max, decisions cles, bugs resolus, fichiers modifies:\n\n{turns}"}]
            )
            await self.db.ai_session_summaries.insert_one({
                "session_id": session_id,
                "summary": resp.content[0].text,
                "created_at": datetime.utcnow()
            })
        except Exception:
            pass

    async def get_long_term_context(self, session_id: str) -> str:
        summaries = await self.db.ai_session_summaries.find(
            {"session_id": session_id}
        ).sort("created_at", -1).limit(3).to_list(3)
        if not summaries:
            return ""
        return "\n\n".join(f"Resume ({s['created_at'].strftime('%d/%m %H:%M')}):\n{s['summary']}" for s in summaries)

    async def get_global_memory(self) -> str:
        docs = await self.db.ai_long_term_memory.find().sort("created_at", -1).limit(10).to_list(10)
        if not docs:
            return ""
        return "Memoire globale:\n" + "\n".join(f"- [{d['category']}] {d['content'][:150]}" for d in docs)


# ============================================
# MAIN AGENT CLASS
# ============================================

class NatiFenuaAgentV2:
    def __init__(self, db):
        self.db = db
        self.memory = MemoryManager(db)
        self.executor = ToolExecutor(db)

    @staticmethod
    def _new_session() -> str:
        return f"sess_{hashlib.md5(str(time.time()).encode()).hexdigest()[:10]}"

    @staticmethod
    def _extract_report(text: str) -> Optional[Dict]:
        m = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(1))
            except Exception:
                pass
        return None

    @staticmethod
    def _classify(msg: str) -> str:
        m = msg.lower()
        if any(w in m for w in ["bug", "erreur", "error", "crash", "casse"]):
            return "bug_report"
        if any(w in m for w in ["audit", "analyse", "verifi", "check", "scan"]):
            return "audit_request"
        if any(w in m for w in ["cree", "genere", "ajoute", "implement", "ecris", "code"]):
            return "code_generation"
        if any(w in m for w in ["optimise", "ameliore", "performe", "lent"]):
            return "optimization"
        return "explanation"

    async def _run_tool(self, name: str, inputs: dict, session_id: str) -> str:
        ex = self.executor
        async_tools = {
            "query_database": lambda: ex.query_database(**inputs),
            "save_to_memory": lambda: ex.save_to_memory(**inputs, session_id=session_id),
            "recall_memory": lambda: ex.recall_memory(**inputs),
            "create_plan": lambda: ex.create_plan(**inputs, session_id=session_id),
        }
        sync_tools = {
            "read_file": lambda: ex.read_file(**inputs),
            "write_file": lambda: ex.write_file(**inputs),
            "list_directory": lambda: ex.list_directory(**inputs),
            "search_in_codebase": lambda: ex.search_in_codebase(**inputs),
            "run_command": lambda: ex.run_command(**inputs),
            "run_tests": lambda: ex.run_tests(**inputs),
            "analyze_code_quality": lambda: ex.analyze_code_quality(**inputs),
            "security_scan": lambda: ex.security_scan(**inputs),
            "performance_profile": lambda: ex.performance_profile(**inputs),
            "git_operation": lambda: ex.git_operation(**inputs),
            "generate_documentation": lambda: ex.generate_documentation(**inputs),
        }
        if name in async_tools:
            return await async_tools[name]()
        if name in sync_tools:
            return sync_tools[name]()
        return f"Tool inconnu : {name}"

    async def run(self, user_message: str, session_id: str = None,
                  context: str = None, autonomous_mode: bool = True) -> AgentResponse:
        t0 = time.time()
        session_id = session_id or self._new_session()
        actions_taken, files_modified = [], []
        iterations = 0

        # Check if Claude is configured
        if not claude_client:
            return AgentResponse(
                response="Erreur : La cle API Anthropic n'est pas configuree. Ajoutez ANTHROPIC_API_KEY dans votre .env sur Render.",
                session_id=session_id,
                actions_taken=[],
                files_modified=[],
                iterations=0,
                report=None,
                execution_time_ms=int((time.time() - t0) * 1000)
            )

        history = await self.memory.get_session_history(session_id)
        long_term = await self.memory.get_long_term_context(session_id)
        global_m = await self.memory.get_global_memory()
        mem_ctx = "\n\n".join(filter(None, [long_term, global_m]))

        messages = history.copy()
        content = f"Contexte : {context}\n\n{user_message}" if context else user_message
        messages.append({"role": "user", "content": content})

        final_response = ""

        while iterations < MAX_REACT_LOOPS:
            iterations += 1
            kwargs = {
                "model": CLAUDE_MODEL,
                "max_tokens": MAX_TOKENS_OUT,
                "system": build_system_prompt(mem_ctx),
                "messages": messages,
            }
            if autonomous_mode:
                kwargs["tools"] = AGENT_TOOLS

            try:
                resp = claude_client.messages.create(**kwargs)
            except anthropic.APIError as e:
                final_response = f"Erreur API Claude : {e}"
                break

            if resp.stop_reason == "end_turn":
                for block in resp.content:
                    if hasattr(block, "text"):
                        final_response = block.text
                break

            if resp.stop_reason == "tool_use":
                assistant_content = list(resp.content)
                messages.append({"role": "assistant", "content": assistant_content})
                tool_results = []
                for block in resp.content:
                    if block.type == "tool_use":
                        result = await self._run_tool(block.name, block.input, session_id)
                        actions_taken.append({
                            "tool": block.name,
                            "input": block.input,
                            "preview": str(result)[:200],
                            "iteration": iterations
                        })
                        if block.name == "write_file" and "Ecrit" in str(result):
                            fp = block.input.get("path", "")
                            if fp and fp not in files_modified:
                                files_modified.append(fp)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": str(result)
                        })
                messages.append({"role": "user", "content": tool_results})
                continue

            for block in resp.content:
                if hasattr(block, "text"):
                    final_response = block.text
            break

        report = self._extract_report(final_response)
        await self.memory.save_turn(session_id, user_message, final_response, actions_taken, report, self._classify(user_message))

        return AgentResponse(
            response=final_response,
            session_id=session_id,
            actions_taken=actions_taken,
            files_modified=files_modified,
            iterations=iterations,
            report=report,
            execution_time_ms=int((time.time() - t0) * 1000)
        )


# ============================================
# DATABASE CONNECTION
# ============================================

def get_db():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


# ============================================
# API ROUTES
# ============================================

@router.post("/chat", response_model=AgentResponse)
async def chat(req: ChatRequest):
    """Chat avec l'Agent IA V2"""
    return await NatiFenuaAgentV2(get_db()).run(req.message, req.session_id, req.context, req.autonomous_mode)


@router.post("/task", response_model=AgentResponse)
async def execute_task(req: TaskRequest):
    """Executer une tache autonome"""
    msg = f"{'[CONFIRMATION REQUISE] ' if req.confirm_writes else ''}Tache autonome : {req.task}\nCommence par create_plan, puis execute chaque etape."
    return await NatiFenuaAgentV2(get_db()).run(msg, req.session_id, autonomous_mode=True)


@router.post("/audit", response_model=AgentResponse)
async def run_audit(req: AuditRequest):
    """Lancer un audit automatique"""
    prompts = {
        "security": "Audit securite OWASP Top 10 complet. security_scan sur backend/ et frontend/src/. Cherche secrets hardcodes et CVE. Rapport JSON.",
        "performance": "Analyse performance. N+1 MongoDB, endpoints sans pagination, lazy loading React. performance_profile sur backend/ et frontend/src/.",
        "code_quality": "Audit qualite code. analyze_code_quality sur backend/ et frontend/src/. Type hints, PropTypes, DRY, try/catch.",
        "full_app": "Audit COMPLET : 1) list_directory 2) security_scan 3) performance_profile 4) analyze_code_quality. Rapport JSON avec score /100 et roadmap priorisee."
    }
    target = f" Focus : {req.target_path}" if req.target_path else ""
    msg = prompts.get(req.audit_type, prompts["full_app"]) + target
    return await NatiFenuaAgentV2(get_db()).run(msg, autonomous_mode=True)


@router.post("/generate-code", response_model=AgentResponse)
async def generate_code(req: CodeGenRequest):
    """Generer du code"""
    target = f" Integrer dans {req.target_file} (lire d'abord)." if req.target_file else ""
    msg = f"Genere en {req.language} :\n{req.description}{target}\nStandards : type, commente FR, gestion erreurs, tests."
    return await NatiFenuaAgentV2(get_db()).run(msg, req.session_id, autonomous_mode=True)


@router.get("/sessions/{session_id}/history")
async def get_history(session_id: str, limit: int = 20):
    """Recuperer l'historique d'une session"""
    db = get_db()
    docs = await db.ai_conversations.find({"session_id": session_id}).sort("created_at", -1).limit(limit).to_list(limit)
    for d in docs:
        d["_id"] = str(d["_id"])
        if d.get("created_at"):
            d["created_at"] = d["created_at"].isoformat()
    return {"session_id": session_id, "messages": list(reversed(docs))}


@router.get("/memory")
async def get_memory(category: str = None, limit: int = 20):
    """Recuperer la memoire longue duree"""
    db = get_db()
    fq = {"category": category} if category else {}
    docs = await db.ai_long_term_memory.find(fq).sort("created_at", -1).limit(limit).to_list(limit)
    for d in docs:
        d["_id"] = str(d["_id"])
        if d.get("created_at"):
            d["created_at"] = d["created_at"].isoformat()
    return {"memories": docs, "count": len(docs)}


@router.get("/reports")
async def get_reports(limit: int = 50):
    """Recuperer les rapports generes"""
    db = get_db()
    docs = await db.ai_conversations.find({"emergent_report": {"$ne": None}}).sort("created_at", -1).limit(limit).to_list(limit)
    return {
        "reports": [
            {
                "session_id": d.get("session_id"),
                "report": d["emergent_report"],
                "created_at": d.get("created_at", "").isoformat() if d.get("created_at") else ""
            }
            for d in docs if d.get("emergent_report")
        ]
    }


@router.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Supprimer une session"""
    db = get_db()
    r = await db.ai_conversations.delete_many({"session_id": session_id})
    return {"deleted": r.deleted_count, "session_id": session_id}


@router.get("/health")
async def health_check():
    """Verifier l'etat de l'agent"""
    return {
        "status": "operational" if claude_client else "api_key_missing",
        "model": CLAUDE_MODEL,
        "tools_count": len(AGENT_TOOLS),
        "tools": [t["name"] for t in AGENT_TOOLS]
    }
