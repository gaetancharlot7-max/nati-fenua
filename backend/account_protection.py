# Account Protection System for Hui Fenua
# Prevents fake accounts and multi-account abuse

import hashlib
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
import re
import uuid

logger = logging.getLogger(__name__)

# Suspicious patterns for fake accounts
SUSPICIOUS_EMAIL_PATTERNS = [
    r'.*\+.*@',  # Email with + sign (aliases)
    r'^temp.*@',  # Temporary emails
    r'^test.*@',
    r'@mailinator\.',
    r'@guerrillamail\.',
    r'@10minutemail\.',
    r'@throwaway\.',
    r'@tempmail\.',
    r'@fakeinbox\.',
    r'@trashmail\.',
]

# Rate limits
RATE_LIMITS = {
    "registrations_per_ip_per_day": 3,
    "registrations_per_device_per_day": 2,
    "email_verifications_per_day": 5,
    "failed_logins_before_captcha": 3,
}


class AccountProtectionService:
    """Service to protect against fake accounts and multi-account abuse"""
    
    def __init__(self, db):
        self.db = db
    
    def _hash_identifier(self, identifier: str) -> str:
        """Hash an identifier for privacy"""
        return hashlib.sha256(identifier.encode()).hexdigest()[:32]
    
    def _get_device_fingerprint(self, user_agent: str, ip: str, accept_language: str = "") -> str:
        """Generate a device fingerprint from request headers"""
        fingerprint_data = f"{user_agent}|{accept_language}"
        return self._hash_identifier(fingerprint_data)
    
    async def check_registration_allowed(
        self,
        email: str,
        ip_address: str,
        user_agent: str = "",
        phone: Optional[str] = None
    ) -> Dict:
        """Check if a new registration should be allowed"""
        
        issues = []
        risk_score = 0
        
        # 1. Check for suspicious email patterns
        for pattern in SUSPICIOUS_EMAIL_PATTERNS:
            if re.match(pattern, email.lower()):
                issues.append("Email temporaire ou alias détecté")
                risk_score += 30
                break
        
        # 2. Check if email domain is disposable
        email_domain = email.split('@')[1].lower() if '@' in email else ''
        disposable_domains = await self.db.disposable_domains.find_one({"domain": email_domain})
        if disposable_domains:
            issues.append("Domaine email jetable détecté")
            risk_score += 50
        
        # 3. Check IP registration rate
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        ip_hash = self._hash_identifier(ip_address)
        
        recent_registrations = await self.db.registration_logs.count_documents({
            "ip_hash": ip_hash,
            "created_at": {"$gte": today.isoformat()}
        })
        
        if recent_registrations >= RATE_LIMITS["registrations_per_ip_per_day"]:
            issues.append(f"Limite d'inscriptions atteinte pour cette adresse IP ({recent_registrations} aujourd'hui)")
            risk_score += 40
        
        # 4. Check device fingerprint
        device_fp = self._get_device_fingerprint(user_agent, ip_address)
        device_registrations = await self.db.registration_logs.count_documents({
            "device_fingerprint": device_fp,
            "created_at": {"$gte": today.isoformat()}
        })
        
        if device_registrations >= RATE_LIMITS["registrations_per_device_per_day"]:
            issues.append("Limite d'inscriptions atteinte pour cet appareil")
            risk_score += 50
        
        # 5. Check for similar emails (name+number pattern)
        email_base = email.split('@')[0].lower()
        email_base_clean = re.sub(r'\d+$', '', email_base)  # Remove trailing numbers
        
        if len(email_base_clean) >= 3:
            similar_emails = await self.db.users.count_documents({
                "email": {"$regex": f"^{re.escape(email_base_clean)}\\d*@", "$options": "i"}
            })
            if similar_emails >= 3:
                issues.append("Pattern d'email suspect détecté (multiples variations)")
                risk_score += 25
        
        # Determine action
        allowed = risk_score < 50
        requires_verification = risk_score >= 30 and risk_score < 50
        requires_email_verification = risk_score >= 30  # Email verification for moderate risk
        
        return {
            "allowed": allowed,
            "risk_score": risk_score,
            "issues": issues,
            "requires_email_verification": requires_email_verification,
            "requires_captcha": requires_verification,
            "message": "Inscription autorisée" if allowed else "Inscription refusée - activité suspecte détectée"
        }
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number for comparison"""
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        # Handle Polynesian numbers (+689)
        if digits.startswith('689'):
            return '+689' + digits[3:]
        elif len(digits) == 6:  # Local Polynesian number
            return '+689' + digits
        return '+' + digits
    
    async def log_registration_attempt(
        self,
        email: str,
        ip_address: str,
        user_agent: str,
        success: bool,
        user_id: Optional[str] = None
    ):
        """Log a registration attempt for rate limiting"""
        
        log = {
            "log_id": f"reg_{uuid.uuid4().hex[:12]}",
            "email_hash": self._hash_identifier(email),
            "ip_hash": self._hash_identifier(ip_address),
            "device_fingerprint": self._get_device_fingerprint(user_agent, ip_address),
            "success": success,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.registration_logs.insert_one(log)
    
    async def check_login_allowed(self, email: str, ip_address: str) -> Dict:
        """Check if login attempt should be allowed"""
        
        # Check failed login attempts
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        ip_hash = self._hash_identifier(ip_address)
        
        failed_attempts = await self.db.login_logs.count_documents({
            "email_hash": self._hash_identifier(email),
            "ip_hash": ip_hash,
            "success": False,
            "created_at": {"$gte": one_hour_ago}
        })
        
        requires_captcha = failed_attempts >= RATE_LIMITS["failed_logins_before_captcha"]
        blocked = failed_attempts >= 10  # Block after 10 failed attempts
        
        return {
            "allowed": not blocked,
            "requires_captcha": requires_captcha,
            "failed_attempts": failed_attempts,
            "message": "Compte temporairement bloqué" if blocked else None
        }
    
    async def log_login_attempt(
        self,
        email: str,
        ip_address: str,
        success: bool,
        user_id: Optional[str] = None
    ):
        """Log a login attempt"""
        
        log = {
            "log_id": f"login_{uuid.uuid4().hex[:12]}",
            "email_hash": self._hash_identifier(email),
            "ip_hash": self._hash_identifier(ip_address),
            "success": success,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.login_logs.insert_one(log)
    
    async def verify_email_code(self, user_id: str, code: str) -> Dict:
        """Verify an email verification code for a user"""
        
        # Check if code is valid
        verification = await self.db.email_verifications.find_one({
            "user_id": user_id,
            "code": code,
            "used": False,
            "expires_at": {"$gt": datetime.now(timezone.utc).isoformat()}
        })
        
        if not verification:
            return {"success": False, "message": "Code invalide ou expiré"}
        
        # Mark as used
        await self.db.email_verifications.update_one(
            {"_id": verification["_id"]},
            {"$set": {"used": True, "used_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update user
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "email_verified": True,
                "email_verified_at": datetime.now(timezone.utc).isoformat(),
                "trust_score": 50  # Higher trust for verified email
            }}
        )
        
        return {"success": True, "message": "Email vérifié avec succès"}
    
    async def send_email_verification(self, user_id: str, email: str) -> Dict:
        """Send a verification code to an email address"""
        
        # Check rate limit
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_verifications = await self.db.email_verifications.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": today.isoformat()}
        })
        
        if today_verifications >= RATE_LIMITS["email_verifications_per_day"]:
            return {"success": False, "message": "Limite de vérifications atteinte pour aujourd'hui"}
        
        # Generate code
        import random
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Save verification
        verification = {
            "verification_id": f"email_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "email": email.lower(),
            "code": code,
            "used": False,
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.email_verifications.insert_one(verification)
        
        logger.info(f"Email verification code for {email}: {code}")
        
        return {
            "success": True,
            "message": "Code envoyé par email",
            "code": code,  # For testing - remove in production with Resend
            "email": email
        }
    
    async def get_user_trust_score(self, user_id: str) -> Dict:
        """Calculate a trust score for a user"""
        
        user = await self.db.users.find_one({"user_id": user_id})
        if not user:
            return {"trust_score": 0, "factors": []}
        
        score = 10  # Base score
        factors = []
        
        # Email verified
        if user.get("email_verified"):
            score += 25
            factors.append({"factor": "Email vérifié", "points": 25})
        
        # Account age
        created_at = datetime.fromisoformat(user.get("created_at", datetime.now(timezone.utc).isoformat()).replace('Z', '+00:00'))
        age_days = (datetime.now(timezone.utc) - created_at).days
        
        if age_days >= 30:
            score += 10
            factors.append({"factor": "Compte > 30 jours", "points": 10})
        if age_days >= 90:
            score += 10
            factors.append({"factor": "Compte > 90 jours", "points": 10})
        
        # Profile completeness
        if user.get("picture"):
            score += 5
            factors.append({"factor": "Photo de profil", "points": 5})
        if user.get("bio"):
            score += 5
            factors.append({"factor": "Bio remplie", "points": 5})
        
        # Activity
        posts_count = await self.db.posts.count_documents({"user_id": user_id})
        if posts_count >= 5:
            score += 10
            factors.append({"factor": "5+ publications", "points": 10})
        
        # Google auth
        if user.get("google_id"):
            score += 15
            factors.append({"factor": "Connexion Google", "points": 15})
        
        # Cap at 100
        score = min(100, score)
        
        return {
            "trust_score": score,
            "factors": factors,
            "level": "Vérifié" if score >= 70 else "Standard" if score >= 40 else "Nouveau"
        }
    
    async def detect_suspicious_activity(self, user_id: str) -> List[str]:
        """Detect suspicious activity for a user"""
        
        warnings = []
        
        # Check for rapid posting
        one_hour_ago = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        recent_posts = await self.db.posts.count_documents({
            "user_id": user_id,
            "created_at": {"$gte": one_hour_ago}
        })
        
        if recent_posts > 20:
            warnings.append("Activité de publication excessive")
        
        # Check for mass following
        recent_follows = await self.db.follows.count_documents({
            "follower_id": user_id,
            "created_at": {"$gte": one_hour_ago}
        })
        
        if recent_follows > 50:
            warnings.append("Activité de suivi excessive")
        
        # Check for spam messages
        recent_messages = await self.db.messages.count_documents({
            "sender_id": user_id,
            "created_at": {"$gte": one_hour_ago}
        })
        
        if recent_messages > 100:
            warnings.append("Activité de messagerie excessive")
        
        return warnings
