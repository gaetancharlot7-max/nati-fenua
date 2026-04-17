# Enhanced Security Module for Hui Fenua
import bcrypt
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple, Optional
import logging
import re
from collections import defaultdict
import time

logger = logging.getLogger(__name__)

# ==================== PASSWORD SECURITY ====================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def is_sha256_hash(hash_str: str) -> bool:
    """Check if string is a SHA256 hash (legacy)"""
    return len(hash_str) == 64 and all(c in '0123456789abcdef' for c in hash_str.lower())


def verify_password_with_migration(password: str, stored_hash: str) -> Tuple[bool, Optional[str]]:
    """
    Verify password and migrate from SHA256 to bcrypt if needed
    Returns: (is_valid, new_bcrypt_hash_if_migrated)
    """
    # Try bcrypt first
    if stored_hash.startswith('$2'):
        return verify_password(password, stored_hash), None
    
    # Legacy SHA256 check
    if is_sha256_hash(stored_hash):
        sha256_hash = hashlib.sha256(password.encode()).hexdigest()
        if sha256_hash == stored_hash:
            # Password valid, return new bcrypt hash for migration
            new_hash = hash_password(password)
            return True, new_hash
    
    return False, None


# ==================== BRUTE FORCE PROTECTION ====================

# Store failed login attempts: {ip_or_email: [(timestamp, count)]}
_failed_attempts: Dict[str, list] = defaultdict(list)
_locked_accounts: Dict[str, datetime] = {}

# Configuration
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15
ATTEMPT_WINDOW_MINUTES = 15


def record_failed_login(identifier: str) -> Tuple[bool, int, int]:
    """
    Record a failed login attempt
    Returns: (is_locked, remaining_attempts, lockout_minutes)
    """
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(minutes=ATTEMPT_WINDOW_MINUTES)
    
    # Clean old attempts
    _failed_attempts[identifier] = [
        t for t in _failed_attempts[identifier] 
        if t > window_start
    ]
    
    # Add new attempt
    _failed_attempts[identifier].append(now)
    
    attempt_count = len(_failed_attempts[identifier])
    
    if attempt_count >= MAX_FAILED_ATTEMPTS:
        # Lock the account
        _locked_accounts[identifier] = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
        return True, 0, LOCKOUT_DURATION_MINUTES
    
    return False, MAX_FAILED_ATTEMPTS - attempt_count, 0


def is_account_locked(identifier: str) -> Tuple[bool, int]:
    """
    Check if account is locked
    Returns: (is_locked, remaining_minutes)
    """
    if identifier not in _locked_accounts:
        return False, 0
    
    lock_until = _locked_accounts[identifier]
    now = datetime.now(timezone.utc)
    
    if now >= lock_until:
        # Lockout expired
        del _locked_accounts[identifier]
        _failed_attempts[identifier] = []
        return False, 0
    
    remaining = int((lock_until - now).total_seconds() / 60) + 1
    return True, remaining


def clear_failed_attempts(identifier: str):
    """Clear failed attempts after successful login"""
    _failed_attempts[identifier] = []
    if identifier in _locked_accounts:
        del _locked_accounts[identifier]


# ==================== RATE LIMITING ====================

# Store request counts: {user_id: [(timestamp, count)]}
_request_counts: Dict[str, list] = defaultdict(list)

# Rate limit configuration
RATE_LIMITS = {
    "api_general": {"requests": 100, "window_seconds": 60},
    "login": {"requests": 10, "window_seconds": 60},
    "post_create": {"requests": 30, "window_seconds": 60},
    "upload": {"requests": 20, "window_seconds": 60},
    "message": {"requests": 60, "window_seconds": 60},
}


def check_rate_limit_enhanced(identifier: str, action: str = "api_general") -> Tuple[bool, int]:
    """
    Enhanced rate limiting
    Returns: (is_allowed, remaining_requests)
    """
    config = RATE_LIMITS.get(action, RATE_LIMITS["api_general"])
    max_requests = config["requests"]
    window_seconds = config["window_seconds"]
    
    now = time.time()
    window_start = now - window_seconds
    
    key = f"{identifier}:{action}"
    
    # Clean old requests
    _request_counts[key] = [t for t in _request_counts[key] if t > window_start]
    
    current_count = len(_request_counts[key])
    
    if current_count >= max_requests:
        return False, 0
    
    _request_counts[key].append(now)
    return True, max_requests - current_count - 1


# ==================== INPUT VALIDATION ====================

def sanitize_input(text: str, max_length: int = 10000) -> str:
    """Sanitize user input to prevent XSS and injection attacks"""
    if not text:
        return ""
    
    # Truncate
    text = text[:max_length]
    
    # Remove null bytes
    text = text.replace('\x00', '')
    
    # Basic HTML entity encoding for XSS prevention
    html_escape_table = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
    }
    
    for char, entity in html_escape_table.items():
        text = text.replace(char, entity)
    
    return text


def validate_email(email: str) -> bool:
    """Validate email format and check for disposable emails"""
    if not email:
        return False
    
    # Basic format validation
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False
    
    # Check for disposable email domains (common ones)
    disposable_domains = [
        'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'fakeinbox.com', 'trashmail.com',
        'temp-mail.org', 'getnada.com', 'maildrop.cc', 'dispostable.com'
    ]
    
    domain = email.split('@')[-1].lower()
    if domain in disposable_domains:
        return False
    
    return True


def validate_password_strength(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Returns: (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Le mot de passe doit contenir au moins 8 caractères"
    
    if not re.search(r'[A-Za-z]', password):
        return False, "Le mot de passe doit contenir au moins une lettre"
    
    if not re.search(r'\d', password):
        return False, "Le mot de passe doit contenir au moins un chiffre"
    
    return True, ""


# ==================== TOKEN SECURITY ====================

def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token"""
    return secrets.token_urlsafe(length)


def generate_password_reset_token() -> Tuple[str, datetime]:
    """
    Generate a password reset token valid for 1 hour
    Returns: (token, expiry_datetime)
    """
    token = secrets.token_urlsafe(32)
    expiry = datetime.now(timezone.utc) + timedelta(hours=1)
    return token, expiry


# ==================== HTTP SECURITY HEADERS ====================

SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https: blob:; "
        "font-src 'self' data:; "
        "connect-src 'self' https:; "
        "media-src 'self' blob: https:; "
        "frame-ancestors 'none';"
    ),
}


def add_security_headers(response):
    """Add security headers to response"""
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    return response


# ==================== SESSION SECURITY ====================

SESSION_EXPIRY_DAYS = 7


def create_session_token() -> Tuple[str, datetime]:
    """
    Create a new session token with 7 day expiry
    Returns: (token, expiry_datetime)
    """
    token = f"sess_{secrets.token_urlsafe(32)}"
    expiry = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRY_DAYS)
    return token, expiry


def is_session_expired(expiry_str: str) -> bool:
    """Check if session has expired"""
    try:
        expiry = datetime.fromisoformat(expiry_str.replace('Z', '+00:00'))
        return datetime.now(timezone.utc) > expiry
    except:
        return True
