"""
Fenua Social - Security & Content Moderation System
Inspired by Meta, TikTok, Instagram best practices
"""

import re
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

# ==================== CONTENT MODERATION ====================

# Banned words and patterns (French + Tahitian context)
BANNED_WORDS = [
    # Violence
    'tuer', 'mourir', 'mort', 'suicide', 'arme', 'bombe', 'terroriste',
    # Hate speech
    'raciste', 'nazi', 'haine', 
    # Adult content indicators
    'nude', 'porn', 'xxx', 'sexe',
    # Drugs
    'drogue', 'cocaine', 'heroine', 'meth',
    # Scams
    'arnaque', 'gratuit', 'gagnez', 'bitcoin gratuit',
]

# Suspicious URL patterns
SUSPICIOUS_URL_PATTERNS = [
    r'bit\.ly', r'tinyurl', r'goo\.gl',  # URL shorteners (potential phishing)
    r'\.ru/', r'\.cn/',  # Suspicious TLDs
    r'login.*\.', r'signin.*\.',  # Phishing attempts
    r'password', r'credential',
]

# Spam patterns
SPAM_PATTERNS = [
    r'(.)\1{5,}',  # Repeated characters (aaaaaaa)
    r'(http[s]?://\S+\s*){3,}',  # Multiple URLs
    r'[A-Z\s]{20,}',  # All caps text
    r'(\$|€|£)\d+.*gratuit',  # Money + free
    r'whatsapp.*\+\d{10,}',  # WhatsApp spam
]

class ContentModerationResult(BaseModel):
    is_safe: bool
    flags: List[str] = []
    risk_level: str = "low"  # low, medium, high, critical
    requires_review: bool = False
    blocked: bool = False
    message: Optional[str] = None

def moderate_text_content(text: str) -> ContentModerationResult:
    """Analyze text content for policy violations"""
    if not text:
        return ContentModerationResult(is_safe=True)
    
    flags = []
    text_lower = text.lower()
    
    # Check banned words
    for word in BANNED_WORDS:
        if word in text_lower:
            flags.append(f"banned_word:{word}")
    
    # Check spam patterns
    for pattern in SPAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            flags.append("spam_pattern")
            break
    
    # Check suspicious URLs
    for pattern in SUSPICIOUS_URL_PATTERNS:
        if re.search(pattern, text_lower):
            flags.append("suspicious_url")
            break
    
    # Check for excessive emojis (spam indicator)
    emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]', text))
    if emoji_count > 15:
        flags.append("excessive_emojis")
    
    # Check for phone numbers (privacy concern)
    if re.search(r'\+?\d{8,}', text):
        flags.append("phone_number_detected")
    
    # Determine risk level
    risk_level = "low"
    blocked = False
    requires_review = False
    
    if len(flags) >= 3:
        risk_level = "critical"
        blocked = True
    elif len(flags) == 2:
        risk_level = "high"
        requires_review = True
    elif len(flags) == 1:
        risk_level = "medium"
        requires_review = True
    
    return ContentModerationResult(
        is_safe=len(flags) == 0,
        flags=flags,
        risk_level=risk_level,
        requires_review=requires_review,
        blocked=blocked,
        message="Contenu bloqué pour violation des règles" if blocked else None
    )

def moderate_media_url(url: str) -> ContentModerationResult:
    """Check media URL for suspicious patterns"""
    flags = []
    
    if not url:
        return ContentModerationResult(is_safe=True)
    
    url_lower = url.lower()
    
    # Check file extension
    suspicious_extensions = ['.exe', '.bat', '.cmd', '.scr', '.js', '.vbs']
    for ext in suspicious_extensions:
        if url_lower.endswith(ext):
            flags.append("dangerous_file_type")
            break
    
    # Check for suspicious domains
    for pattern in SUSPICIOUS_URL_PATTERNS:
        if re.search(pattern, url_lower):
            flags.append("suspicious_domain")
            break
    
    # Check for data URLs (potential XSS)
    if url_lower.startswith('data:') and 'script' in url_lower:
        flags.append("potential_xss")
    
    blocked = "dangerous_file_type" in flags or "potential_xss" in flags
    
    return ContentModerationResult(
        is_safe=len(flags) == 0,
        flags=flags,
        risk_level="critical" if blocked else "medium" if flags else "low",
        blocked=blocked,
        message="URL non autorisée" if blocked else None
    )

# ==================== RATE LIMITING ====================

class RateLimiter:
    """In-memory rate limiter"""
    def __init__(self):
        self.requests: Dict[str, List[datetime]] = {}
    
    def is_allowed(self, identifier: str, max_requests: int = 100, window_seconds: int = 60) -> bool:
        """Check if request is allowed under rate limit"""
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=window_seconds)
        
        if identifier not in self.requests:
            self.requests[identifier] = []
        
        # Clean old requests
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > window_start
        ]
        
        # Check limit
        if len(self.requests[identifier]) >= max_requests:
            return False
        
        self.requests[identifier].append(now)
        return True
    
    def get_remaining(self, identifier: str, max_requests: int = 100, window_seconds: int = 60) -> int:
        """Get remaining requests in window"""
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=window_seconds)
        
        if identifier not in self.requests:
            return max_requests
        
        recent = [r for r in self.requests[identifier] if r > window_start]
        return max(0, max_requests - len(recent))

# Global rate limiter instance
rate_limiter = RateLimiter()

# Rate limit configurations
RATE_LIMITS = {
    "post_create": {"max": 10, "window": 3600},      # 10 posts per hour
    "comment_create": {"max": 50, "window": 3600},   # 50 comments per hour
    "like": {"max": 200, "window": 3600},            # 200 likes per hour
    "message": {"max": 100, "window": 3600},         # 100 messages per hour
    "upload": {"max": 20, "window": 3600},           # 20 uploads per hour
    "login_attempt": {"max": 5, "window": 300},      # 5 login attempts per 5 min
    "api_general": {"max": 1000, "window": 3600},    # 1000 API calls per hour
}

def check_rate_limit(user_id: str, action: str) -> tuple[bool, int]:
    """Check rate limit for an action. Returns (allowed, remaining)"""
    config = RATE_LIMITS.get(action, RATE_LIMITS["api_general"])
    identifier = f"{user_id}:{action}"
    allowed = rate_limiter.is_allowed(identifier, config["max"], config["window"])
    remaining = rate_limiter.get_remaining(identifier, config["max"], config["window"])
    return allowed, remaining

# ==================== INPUT SANITIZATION ====================

def sanitize_html(text: str) -> str:
    """Remove potentially dangerous HTML/script content"""
    if not text:
        return text
    
    # Remove script tags
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove on* event handlers
    text = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', text, flags=re.IGNORECASE)
    
    # Remove javascript: URLs
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    
    # Remove data: URLs with scripts
    text = re.sub(r'data:[^,]*script[^,]*,', 'data:blocked,', text, flags=re.IGNORECASE)
    
    return text

def sanitize_filename(filename: str) -> str:
    """Sanitize uploaded filename"""
    if not filename:
        return "unnamed"
    
    # Remove path components
    filename = filename.split('/')[-1].split('\\')[-1]
    
    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
    
    # Limit length
    if len(filename) > 100:
        name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
        filename = name[:90] + ('.' + ext if ext else '')
    
    return filename

def validate_location(lat: Optional[float], lon: Optional[float]) -> bool:
    """Validate GPS coordinates"""
    if lat is None or lon is None:
        return True  # No location is valid
    
    # Check valid ranges
    if not (-90 <= lat <= 90):
        return False
    if not (-180 <= lon <= 180):
        return False
    
    return True

# ==================== PRIVACY PROTECTION ====================

def hash_ip(ip: str) -> str:
    """Hash IP address for privacy"""
    return hashlib.sha256(ip.encode()).hexdigest()[:16]

def mask_email(email: str) -> str:
    """Mask email for display"""
    if '@' not in email:
        return email
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    return f"{masked_local}@{domain}"

def mask_phone(phone: str) -> str:
    """Mask phone number for display"""
    digits = re.sub(r'\D', '', phone)
    if len(digits) < 4:
        return '****'
    return '*' * (len(digits) - 4) + digits[-4:]

class LocationPrivacy:
    """Handle location privacy settings"""
    
    @staticmethod
    def blur_location(lat: float, lon: float, precision: str = "city") -> tuple[float, float]:
        """Blur location based on privacy setting"""
        import random
        
        # Blur amounts (in degrees, approximately)
        blur_amounts = {
            "exact": 0,
            "street": 0.001,    # ~100m
            "neighborhood": 0.01,  # ~1km
            "city": 0.1,       # ~10km
            "hidden": None
        }
        
        blur = blur_amounts.get(precision, 0.01)
        
        if blur is None:
            return None, None
        
        if blur > 0:
            lat += random.uniform(-blur, blur)
            lon += random.uniform(-blur, blur)
        
        return round(lat, 4), round(lon, 4)

# ==================== REPORT SYSTEM ====================

class ReportType:
    SPAM = "spam"
    HARASSMENT = "harassment"
    VIOLENCE = "violence"
    NUDITY = "nudity"
    HATE_SPEECH = "hate_speech"
    SCAM = "scam"
    FAKE_ACCOUNT = "fake_account"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    SELF_HARM = "self_harm"
    OTHER = "other"

REPORT_TYPES = {
    ReportType.SPAM: {"label": "Spam", "priority": 2},
    ReportType.HARASSMENT: {"label": "Harcèlement", "priority": 1},
    ReportType.VIOLENCE: {"label": "Violence", "priority": 1},
    ReportType.NUDITY: {"label": "Nudité", "priority": 2},
    ReportType.HATE_SPEECH: {"label": "Discours haineux", "priority": 1},
    ReportType.SCAM: {"label": "Arnaque", "priority": 1},
    ReportType.FAKE_ACCOUNT: {"label": "Faux compte", "priority": 3},
    ReportType.INTELLECTUAL_PROPERTY: {"label": "Propriété intellectuelle", "priority": 3},
    ReportType.SELF_HARM: {"label": "Automutilation/Suicide", "priority": 0},  # Highest priority
    ReportType.OTHER: {"label": "Autre", "priority": 4},
}

class Report(BaseModel):
    report_id: str
    reporter_id: str
    reported_content_type: str  # post, comment, user, message
    reported_content_id: str
    report_type: str
    description: Optional[str] = None
    created_at: datetime
    status: str = "pending"  # pending, reviewed, actioned, dismissed
    reviewed_by: Optional[str] = None
    action_taken: Optional[str] = None

# ==================== ACCOUNT SECURITY ====================

def validate_password_strength(password: str) -> tuple[bool, List[str]]:
    """Validate password meets security requirements"""
    issues = []
    
    if len(password) < 8:
        issues.append("Minimum 8 caractères requis")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Au moins une majuscule requise")
    
    if not re.search(r'[a-z]', password):
        issues.append("Au moins une minuscule requise")
    
    if not re.search(r'\d', password):
        issues.append("Au moins un chiffre requis")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Au moins un caractère spécial requis")
    
    # Check for common passwords
    common_passwords = ['password', '123456', 'qwerty', 'fenua', 'tahiti']
    if password.lower() in common_passwords:
        issues.append("Mot de passe trop commun")
    
    return len(issues) == 0, issues

def detect_suspicious_activity(user_id: str, activities: List[Dict]) -> List[str]:
    """Detect suspicious account activity"""
    alerts = []
    
    # Check for unusual login locations
    locations = set()
    for activity in activities:
        if activity.get('type') == 'login' and activity.get('location'):
            locations.add(activity['location'])
    
    if len(locations) > 3:
        alerts.append("Connexions depuis plusieurs localisations différentes")
    
    # Check for rapid actions
    action_times = [a['timestamp'] for a in activities if a.get('timestamp')]
    if len(action_times) > 10:
        action_times.sort()
        for i in range(len(action_times) - 10):
            if (action_times[i + 10] - action_times[i]).total_seconds() < 60:
                alerts.append("Activité anormalement rapide détectée")
                break
    
    return alerts

# ==================== AGE VERIFICATION ====================

def verify_age(birth_date: datetime) -> tuple[bool, int]:
    """Verify user is at least 13 years old (COPPA compliance)"""
    today = datetime.now(timezone.utc)
    age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
    return age >= 13, age

# ==================== EXPORT ====================

__all__ = [
    'moderate_text_content',
    'moderate_media_url',
    'ContentModerationResult',
    'check_rate_limit',
    'rate_limiter',
    'RATE_LIMITS',
    'sanitize_html',
    'sanitize_filename',
    'validate_location',
    'hash_ip',
    'mask_email',
    'mask_phone',
    'LocationPrivacy',
    'ReportType',
    'REPORT_TYPES',
    'Report',
    'validate_password_strength',
    'detect_suspicious_activity',
    'verify_age',
]
