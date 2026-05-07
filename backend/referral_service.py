# Referral system — viral growth via personal invite codes.
#
# Architecture:
#   - Each user has a unique 8-char alphanumeric `referral_code` (generated lazily on first read).
#   - Sign-up endpoint accepts a `?ref=CODE` query param OR `referral_code` in the body.
#   - When a new user signs up with a valid code, the referrer's `referral_count` is incremented.
#   - At 3+ referrals, the user automatically earns the "Ambassadeur" badge (level 4).
#
# Levels driven by referral_count + activity:
#   1 — Nouveau (default, < 7 days)
#   2 — Régulier (7+ days, 5+ posts)
#   3 — Local (30+ days, 20+ posts OR liked locally)
#   4 — Ambassadeur (3+ referrals)
#   5 — Mahana (top 1% contributors — manual or computed monthly)

import secrets
import string
from datetime import datetime, timezone
from typing import Optional


def generate_referral_code(length: int = 8) -> str:
    """Generate an 8-char alphanumeric code (uppercase, no ambiguous chars)."""
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no I, O, 0, 1
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def ensure_referral_code(db, user_id: str) -> str:
    """Return the user's referral_code, generating one if missing.
    Idempotent — safe to call multiple times."""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "referral_code": 1})
    if user and user.get("referral_code"):
        return user["referral_code"]
    
    # Generate a unique code (retry on collision — extremely rare)
    for _ in range(5):
        code = generate_referral_code()
        existing = await db.users.find_one({"referral_code": code}, {"_id": 0, "user_id": 1})
        if not existing:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"referral_code": code}}
            )
            return code
    raise RuntimeError("Failed to generate unique referral code after 5 attempts")


async def get_user_by_referral_code(db, code: str) -> Optional[dict]:
    """Look up the referrer user by their referral_code. Returns user_id + name or None."""
    if not code or len(code) < 4:
        return None
    code = code.strip().upper()
    user = await db.users.find_one(
        {"referral_code": code},
        {"_id": 0, "user_id": 1, "name": 1, "referral_count": 1}
    )
    return user


async def record_referral(db, referrer_id: str, new_user_id: str, new_user_email: str) -> dict:
    """Record a successful referral: increment referrer's count, log the event,
    and check if the Ambassadeur threshold is now met."""
    if referrer_id == new_user_id:
        return {"success": False, "reason": "self_referral"}
    
    # Avoid double-counting (idempotency)
    existing = await db.referrals.find_one({"new_user_id": new_user_id})
    if existing:
        return {"success": False, "reason": "already_recorded"}
    
    await db.referrals.insert_one({
        "referrer_id": referrer_id,
        "new_user_id": new_user_id,
        "new_user_email": new_user_email,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Increment referrer's count
    update_result = await db.users.find_one_and_update(
        {"user_id": referrer_id},
        {"$inc": {"referral_count": 1}},
        return_document=True,
        projection={"_id": 0, "referral_count": 1}
    )
    new_count = (update_result or {}).get("referral_count", 1)
    
    # Award Ambassadeur badge if threshold reached
    awarded_ambassadeur = False
    if new_count >= 3:
        user = await db.users.find_one({"user_id": referrer_id}, {"_id": 0, "badges": 1})
        current_badges = (user or {}).get("badges", [])
        if "ambassadeur" not in current_badges:
            await db.users.update_one(
                {"user_id": referrer_id},
                {"$addToSet": {"badges": "ambassadeur"},
                 "$set": {"ambassadeur_awarded_at": datetime.now(timezone.utc).isoformat()}}
            )
            awarded_ambassadeur = True
    
    return {
        "success": True,
        "referral_count": new_count,
        "awarded_ambassadeur": awarded_ambassadeur
    }


async def get_referral_stats(db, user_id: str) -> dict:
    """Return the user's referral stats for the profile / dashboard view."""
    user = await db.users.find_one(
        {"user_id": user_id},
        {"_id": 0, "referral_code": 1, "referral_count": 1, "badges": 1}
    )
    if not user:
        return {"referral_code": None, "referral_count": 0, "is_ambassadeur": False, "needed_for_ambassadeur": 3}
    
    referral_count = user.get("referral_count", 0)
    is_ambassadeur = "ambassadeur" in (user.get("badges") or [])
    
    # Recent invitees (last 5)
    recent = await db.referrals.find(
        {"referrer_id": user_id},
        {"_id": 0, "new_user_email": 1, "new_user_id": 1, "created_at": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    # Mask emails for privacy
    for r in recent:
        e = r.get("new_user_email", "")
        if "@" in e:
            local, _, domain = e.partition("@")
            masked_local = local[0] + "*" * (len(local) - 1) if len(local) > 1 else "*"
            r["new_user_email"] = f"{masked_local}@{domain}"
    
    return {
        "referral_code": user.get("referral_code"),
        "referral_count": referral_count,
        "is_ambassadeur": is_ambassadeur,
        "needed_for_ambassadeur": max(0, 3 - referral_count),
        "recent_referrals": recent
    }


def compute_user_level(user_doc: dict) -> dict:
    """Compute the user's level/badge based on activity + referrals.
    Returns {level: int, name: str, color: str, next: str|None, progress: 0-1}.
    Lightweight — call from any user-facing endpoint."""
    if not user_doc:
        return {"level": 1, "name": "Nouveau", "color": "#9CA3AF", "next": "Régulier", "progress": 0}
    
    badges = user_doc.get("badges") or []
    if "mahana" in badges:
        return {"level": 5, "name": "Mahana", "color": "#FFD700", "next": None, "progress": 1.0,
                "description": "Top contributeur Nati Fenua"}
    if "ambassadeur" in badges or (user_doc.get("referral_count", 0) >= 3):
        return {"level": 4, "name": "Ambassadeur", "color": "#FF1493", "next": "Mahana", "progress": 0.8,
                "description": "Vous avez parrainé 3+ amis 🌺"}
    
    posts_count = user_doc.get("posts_count", 0)
    created_at = user_doc.get("created_at", "")
    days_since = 0
    try:
        if created_at:
            created_dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            days_since = (datetime.now(timezone.utc) - created_dt).days
    except Exception:
        pass
    
    if days_since >= 30 and posts_count >= 20:
        return {"level": 3, "name": "Local", "color": "#00CED1", "next": "Ambassadeur", "progress": 0.6,
                "description": "Membre actif de la communauté"}
    if days_since >= 7 and posts_count >= 5:
        return {"level": 2, "name": "Régulier", "color": "#FF6B35", "next": "Local",
                "progress": min(0.5, (posts_count / 20) * 0.5),
                "description": "Vous prenez vos marques sur Nati Fenua"}
    return {"level": 1, "name": "Nouveau", "color": "#9CA3AF", "next": "Régulier",
            "progress": min(0.3, days_since / 7 * 0.3),
            "description": "Bienvenue ! Découvrez le Fenua"}
