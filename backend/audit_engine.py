"""
Nati Fenua - Deterministic audit engine
Runs code quality / security / performance / accessibility audits
without depending on external tools (bandit, flake8, eslint, etc.).
Always returns a structured JSON report + a Markdown version
ready for download.
"""

import os
import re
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

PROJECT_ROOT = Path(os.getenv("PROJECT_ROOT", "/app"))

# -----------------------------
# Helpers
# -----------------------------

IGNORE_DIRS = {
    "node_modules", ".git", "__pycache__", ".venv", "venv", "build",
    "dist", ".next", ".cache", "coverage", ".emergent", "test_reports"
}


def _iter_files(root: Path, extensions: List[str], max_files: int = 800) -> List[Path]:
    """Iterate project files, skipping vendor / build folders."""
    out: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # prune
        dirnames[:] = [d for d in dirnames if d not in IGNORE_DIRS and not d.startswith(".")]
        for f in filenames:
            if any(f.endswith(ext) for ext in extensions):
                out.append(Path(dirpath) / f)
                if len(out) >= max_files:
                    return out
    return out


def _read(p: Path, max_bytes: int = 400_000) -> str:
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as fh:
            return fh.read(max_bytes)
    except Exception:
        return ""


def _relpath(p: Path) -> str:
    try:
        return str(p.relative_to(PROJECT_ROOT))
    except Exception:
        return str(p)


# -----------------------------
# Individual audits
# -----------------------------

SECRET_PATTERNS = [
    (r"(?i)(AKIA[0-9A-Z]{16})", "AWS Access Key"),
    (r"(?i)(sk[_-]?live[_-]?[0-9a-z]{16,})", "Stripe live secret"),
    (r"(?i)(sk[_-]?test[_-]?[0-9a-z]{16,})", "Stripe test secret"),
    (r"(?i)(ghp_[0-9A-Za-z]{20,})", "GitHub Personal Access Token"),
    (r"(?i)(AIzaSy[0-9A-Za-z_-]{20,})", "Google API Key"),
    (r"(?i)(?:password|passwd|pwd)\s*[:=]\s*['\"]([^'\"\s]{6,})['\"]", "Hardcoded password"),
    (r"(?i)(?:secret[_-]?key|api[_-]?key|access[_-]?token)\s*[:=]\s*['\"]([^'\"\s]{12,})['\"]", "Hardcoded secret/API key"),
]

DANGEROUS_PY = [
    (r"\beval\s*\(", "Usage of eval() — code injection risk"),
    (r"\bexec\s*\(", "Usage of exec() — code execution risk"),
    (r"subprocess\.(?:call|run|Popen)\([^)]*shell\s*=\s*True", "subprocess with shell=True (command injection risk)"),
    (r"pickle\.loads?\(", "Unsafe pickle.load (deserialization vulnerability)"),
    (r"yaml\.load\((?!.*Loader)", "yaml.load without Loader (use yaml.safe_load)"),
    (r"md5\(|sha1\(", "Weak hash (MD5/SHA1) used — prefer SHA-256+"),
]

DANGEROUS_JS = [
    (r"dangerouslySetInnerHTML", "React dangerouslySetInnerHTML — XSS risk if user-controlled"),
    (r"\beval\s*\(", "Usage of eval() — XSS / code injection risk"),
    (r"new\s+Function\s*\(", "new Function() — code injection risk"),
    (r"document\.write\s*\(", "document.write — XSS risk"),
    (r"innerHTML\s*=\s*(?!['\"`])", "innerHTML with dynamic content — XSS risk"),
]


def audit_security() -> Dict[str, Any]:
    """Scan for security issues."""
    issues: List[Dict[str, Any]] = []

    # Scan backend
    for p in _iter_files(PROJECT_ROOT / "backend", [".py"]):
        content = _read(p)
        rel = _relpath(p)
        for pattern, msg in SECRET_PATTERNS:
            for m in re.finditer(pattern, content):
                line_no = content[:m.start()].count("\n") + 1
                issues.append({
                    "severity": "critical", "category": "secret",
                    "file": rel, "line": line_no, "message": msg,
                    "snippet": m.group(0)[:80],
                })
        for pattern, msg in DANGEROUS_PY:
            for m in re.finditer(pattern, content):
                line_no = content[:m.start()].count("\n") + 1
                issues.append({
                    "severity": "high", "category": "dangerous_api",
                    "file": rel, "line": line_no, "message": msg,
                    "snippet": m.group(0)[:80],
                })

    # Scan frontend
    for p in _iter_files(PROJECT_ROOT / "frontend" / "src", [".js", ".jsx", ".ts", ".tsx"]):
        content = _read(p)
        rel = _relpath(p)
        for pattern, msg in SECRET_PATTERNS:
            for m in re.finditer(pattern, content):
                line_no = content[:m.start()].count("\n") + 1
                issues.append({
                    "severity": "critical", "category": "secret",
                    "file": rel, "line": line_no, "message": msg,
                    "snippet": m.group(0)[:80],
                })
        for pattern, msg in DANGEROUS_JS:
            for m in re.finditer(pattern, content):
                line_no = content[:m.start()].count("\n") + 1
                issues.append({
                    "severity": "high", "category": "xss_risk",
                    "file": rel, "line": line_no, "message": msg,
                    "snippet": m.group(0)[:80],
                })

    # CORS wildcard in backend
    for p in _iter_files(PROJECT_ROOT / "backend", [".py"]):
        c = _read(p)
        if re.search(r"allow_origins\s*=\s*\[\s*['\"]\*['\"]", c):
            issues.append({
                "severity": "medium", "category": "cors",
                "file": _relpath(p), "line": 0,
                "message": "CORS allow_origins='*' with credentials can be unsafe in production",
                "snippet": "allow_origins=['*']"
            })
            break

    # .env files committed?
    for env_path in [PROJECT_ROOT / "backend" / ".env", PROJECT_ROOT / "frontend" / ".env"]:
        if env_path.exists():
            gitignore = _read(PROJECT_ROOT / ".gitignore")
            if ".env" not in gitignore:
                issues.append({
                    "severity": "critical", "category": "secret_leak",
                    "file": _relpath(env_path), "line": 0,
                    "message": ".env file present and NOT in .gitignore — secrets may be pushed to git",
                    "snippet": "",
                })

    score = max(0, 100 - sum({"critical": 20, "high": 8, "medium": 3, "low": 1}.get(i["severity"], 1) for i in issues))
    return {"type": "security", "score": score, "issues": issues, "total_issues": len(issues)}


def audit_performance() -> Dict[str, Any]:
    """Scan for performance bottlenecks."""
    issues: List[Dict[str, Any]] = []

    for p in _iter_files(PROJECT_ROOT / "backend", [".py"]):
        content = _read(p)
        rel = _relpath(p)

        # find() without limit/to_list
        for m in re.finditer(r"db\.\w+\.find\([^)]*\)(?!\s*\.(?:limit|to_list|sort))", content):
            line_no = content[:m.start()].count("\n") + 1
            issues.append({
                "severity": "medium", "category": "unbounded_query",
                "file": rel, "line": line_no,
                "message": "MongoDB .find() without explicit .limit() — can scan entire collection",
                "snippet": m.group(0)[:80],
            })

        # Loops doing await DB calls (potential N+1)
        if re.search(r"for\s+\w+\s+in\s+\w+\s*:\s*\n\s+.*await\s+.*db\.", content):
            issues.append({
                "severity": "high", "category": "n_plus_1",
                "file": rel, "line": 0,
                "message": "Possible N+1 query pattern (DB call inside a loop)",
                "snippet": "",
            })

    # Frontend: missing lazy
    app_js = _read(PROJECT_ROOT / "frontend" / "src" / "App.js")
    if app_js:
        total_imports = len(re.findall(r"^import\s+.*from\s+['\"]\./pages/", app_js, re.MULTILINE))
        lazy_imports = len(re.findall(r"lazy\(\(\)\s*=>\s*import", app_js))
        if total_imports > lazy_imports and total_imports > 0:
            issues.append({
                "severity": "medium", "category": "bundle_size",
                "file": "frontend/src/App.js", "line": 0,
                "message": f"{total_imports - lazy_imports} pages imported eagerly — consider React.lazy() for code splitting",
                "snippet": "",
            })

    # <img> without loading="lazy"
    img_no_lazy = 0
    for p in _iter_files(PROJECT_ROOT / "frontend" / "src", [".js", ".jsx"], max_files=400):
        c = _read(p)
        for m in re.finditer(r"<img\b(?![^>]*loading\s*=)[^>]*>", c):
            img_no_lazy += 1
    if img_no_lazy > 5:
        issues.append({
            "severity": "low", "category": "image_loading",
            "file": "frontend/src/**", "line": 0,
            "message": f"{img_no_lazy} <img> tags without loading=\"lazy\" — can slow first paint on mobile",
            "snippet": "",
        })

    score = max(0, 100 - sum({"critical": 20, "high": 10, "medium": 4, "low": 1}.get(i["severity"], 1) for i in issues))
    return {"type": "performance", "score": score, "issues": issues, "total_issues": len(issues)}


def audit_code_quality() -> Dict[str, Any]:
    """Scan for code quality issues."""
    issues: List[Dict[str, Any]] = []

    # Python: long functions, TODO, bare except
    for p in _iter_files(PROJECT_ROOT / "backend", [".py"]):
        c = _read(p)
        rel = _relpath(p)
        for m in re.finditer(r"#\s*(TODO|FIXME|XXX)\b", c):
            line_no = c[:m.start()].count("\n") + 1
            issues.append({
                "severity": "low", "category": "todo",
                "file": rel, "line": line_no,
                "message": f"Unresolved {m.group(1)} marker",
                "snippet": "",
            })
        for m in re.finditer(r"^\s*except\s*:\s*$", c, re.MULTILINE):
            line_no = c[:m.start()].count("\n") + 1
            issues.append({
                "severity": "medium", "category": "bare_except",
                "file": rel, "line": line_no,
                "message": "Bare 'except:' catches everything including KeyboardInterrupt — use 'except Exception:'",
                "snippet": "",
            })
        for m in re.finditer(r"print\s*\(", c):
            line_no = c[:m.start()].count("\n") + 1
            if "#" not in c[max(0, m.start()-30):m.start()]:
                issues.append({
                    "severity": "low", "category": "print_in_backend",
                    "file": rel, "line": line_no,
                    "message": "print() in backend — prefer logger.info/warning",
                    "snippet": "",
                })
                break  # one per file is enough

    # Frontend: console.log left in code
    console_count = 0
    for p in _iter_files(PROJECT_ROOT / "frontend" / "src", [".js", ".jsx"]):
        c = _read(p)
        matches = re.findall(r"\bconsole\.(?:log|debug|info)\s*\(", c)
        if matches:
            console_count += len(matches)
            rel = _relpath(p)
            issues.append({
                "severity": "low", "category": "console_log",
                "file": rel, "line": 0,
                "message": f"{len(matches)} console.log/debug/info call(s) — remove in production",
                "snippet": "",
            })
    if console_count > 30:
        issues.append({
            "severity": "medium", "category": "logging",
            "file": "frontend/src/**", "line": 0,
            "message": f"Total of {console_count} console calls in frontend — pollutes browser console",
            "snippet": "",
        })

    score = max(0, 100 - sum({"critical": 15, "high": 6, "medium": 3, "low": 0.5}.get(i["severity"], 1) for i in issues))
    return {"type": "code_quality", "score": int(score), "issues": issues, "total_issues": len(issues)}


def audit_accessibility() -> Dict[str, Any]:
    """Scan for accessibility (WCAG 2.1 AA) issues."""
    issues: List[Dict[str, Any]] = []

    missing_alt = 0
    missing_aria = 0
    buttons_no_label = 0
    inputs_no_label = 0

    for p in _iter_files(PROJECT_ROOT / "frontend" / "src", [".js", ".jsx"], max_files=500):
        c = _read(p)
        rel = _relpath(p)

        # <img> without alt
        for m in re.finditer(r"<img\b(?![^>]*\balt\s*=)[^>]*>", c):
            missing_alt += 1
            line_no = c[:m.start()].count("\n") + 1
            issues.append({
                "severity": "high", "category": "missing_alt",
                "file": rel, "line": line_no,
                "message": "Image without alt attribute (WCAG 1.1.1)",
                "snippet": m.group(0)[:100],
            })
            if missing_alt >= 20:
                break

        # <button> with only an icon (no text, no aria-label)
        for m in re.finditer(r"<button\b(?![^>]*aria-label)[^>]*>\s*<[A-Z]\w+[^/]*/>\s*</button>", c):
            buttons_no_label += 1
            line_no = c[:m.start()].count("\n") + 1
            issues.append({
                "severity": "medium", "category": "icon_button_no_label",
                "file": rel, "line": line_no,
                "message": "Icon-only <button> without aria-label — screen readers will not announce it",
                "snippet": m.group(0)[:120],
            })
            if buttons_no_label >= 15:
                break

        # <input> without label / placeholder / aria-label
        for m in re.finditer(r"<input\b(?![^>]*(?:aria-label|placeholder))[^>]*/>", c):
            inputs_no_label += 1
            line_no = c[:m.start()].count("\n") + 1
            issues.append({
                "severity": "medium", "category": "input_no_label",
                "file": rel, "line": line_no,
                "message": "<input> without aria-label or placeholder",
                "snippet": m.group(0)[:120],
            })
            if inputs_no_label >= 15:
                break

    if missing_alt == 0 and buttons_no_label == 0 and inputs_no_label == 0:
        issues.append({
            "severity": "info", "category": "ok",
            "file": "", "line": 0,
            "message": "Aucun problème d'accessibilité grave détecté par les règles automatiques. Un audit manuel reste recommandé.",
            "snippet": "",
        })

    score = max(0, 100 - sum({"critical": 15, "high": 6, "medium": 2, "low": 0.5, "info": 0}.get(i["severity"], 1) for i in issues))
    return {"type": "accessibility", "score": int(score), "issues": issues, "total_issues": len(issues)}


# -----------------------------
# Dispatch + Markdown export
# -----------------------------

def run_audit(audit_type: str) -> Dict[str, Any]:
    if audit_type == "security":
        result = audit_security()
    elif audit_type == "performance":
        result = audit_performance()
    elif audit_type == "code_quality":
        result = audit_code_quality()
    elif audit_type == "accessibility":
        result = audit_accessibility()
    elif audit_type in ("full_app", "full"):
        parts = [audit_security(), audit_performance(), audit_code_quality(), audit_accessibility()]
        merged_issues = []
        for r in parts:
            merged_issues.extend(r["issues"])
        avg = int(sum(r["score"] for r in parts) / len(parts))
        result = {
            "type": "full_app",
            "score": avg,
            "issues": merged_issues,
            "total_issues": len(merged_issues),
            "breakdown": {r["type"]: r["score"] for r in parts},
        }
    else:
        result = {
            "type": audit_type, "score": 0, "issues": [],
            "total_issues": 0, "error": f"Unknown audit type: {audit_type}"
        }

    result["generated_at"] = datetime.now(timezone.utc).isoformat()
    result["markdown"] = to_markdown(result)
    return result


def to_markdown(report: Dict[str, Any]) -> str:
    t = report.get("type", "audit")
    score = report.get("score", 0)
    issues = report.get("issues", [])
    lines: List[str] = []
    lines.append(f"# Nati Fenua — Rapport d'audit : `{t}`")
    lines.append("")
    lines.append(f"**Date :** {report.get('generated_at', '')}")
    lines.append(f"**Score global :** {score}/100")
    lines.append(f"**Issues détectées :** {len(issues)}")
    if report.get("breakdown"):
        lines.append("")
        lines.append("## Scores par catégorie")
        for k, v in report["breakdown"].items():
            lines.append(f"- **{k}** : {v}/100")
    lines.append("")

    # Group by severity
    by_sev: Dict[str, List[dict]] = {}
    for it in issues:
        by_sev.setdefault(it.get("severity", "low"), []).append(it)

    order = ["critical", "high", "medium", "low", "info"]
    for sev in order:
        items = by_sev.get(sev, [])
        if not items:
            continue
        lines.append(f"## {sev.upper()} ({len(items)})")
        for it in items[:100]:
            loc = f"`{it.get('file','')}`" + (f" (ligne {it['line']})" if it.get("line") else "")
            lines.append(f"- **{it.get('message','')}** — {loc}")
            if it.get("snippet"):
                lines.append(f"  ```\n  {it['snippet']}\n  ```")
        if len(items) > 100:
            lines.append(f"- _…et {len(items) - 100} autres._")
        lines.append("")

    lines.append("---")
    lines.append("_Rapport généré automatiquement par l'Agent IA Nati Fenua._")
    return "\n".join(lines)
