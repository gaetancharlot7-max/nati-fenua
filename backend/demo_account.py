"""Demo account seeding for App Store / Play Store reviewers.

Required by Apple App Review Guideline 2.1: when an app requires authentication,
a demo account with sample content must be provided to reviewers.

The demo account is idempotent — safe to run on every startup.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

DEMO_EMAIL = "demo@nati-fenua.com"
DEMO_PASSWORD = "DemoFenua2026!"
DEMO_NAME = "Demo Fenua"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_demo_account(db) -> dict:
    """Create or refresh the demo account + 3 demo posts + a marketplace product.
    Returns a summary dict. Safe to call repeatedly."""

    now = datetime.now(timezone.utc)

    # 1. Demo user
    existing = await db.users.find_one({"email": DEMO_EMAIL}, {"_id": 0, "user_id": 1})
    if existing:
        demo_user_id = existing["user_id"]
        await db.users.update_one(
            {"email": DEMO_EMAIL},
            {"$set": {
                "password_hash": pwd_context.hash(DEMO_PASSWORD),
                "is_email_verified": True,
                "failed_login_attempts": 0,
                "locked_until": None,
                "is_demo": True
            }}
        )
    else:
        demo_user_id = str(uuid.uuid4())
        await db.users.insert_one({
            "user_id": demo_user_id,
            "email": DEMO_EMAIL,
            "password_hash": pwd_context.hash(DEMO_PASSWORD),
            "name": DEMO_NAME,
            "username": "demo_fenua",
            "picture": "https://ui-avatars.com/api/?name=Demo+Fenua&background=FF6B35&color=fff&bold=true",
            "bio": "Compte démo officiel — réservé aux reviewers Apple & Google. 🌺",
            "location": "Tahiti, Polynésie française",
            "island": "tahiti",
            "is_business": False,
            "is_verified": True,
            "is_demo": True,
            "is_admin": False,
            "is_email_verified": True,
            "followers_count": 0,
            "following_count": 0,
            "posts_count": 3,
            "badges": [],
            "referral_count": 0,
            "created_at": now.isoformat(),
            "profile_visibility": {
                "show_photos": True, "show_posts": True,
                "show_saved": True, "is_private": False
            }
        })

    # 2. Demo posts (idempotent by post_id prefix)
    demo_posts = [
        {
            "post_id": "demo_post_1",
            "caption": "Magnifique coucher de soleil sur le lagon de Bora Bora ce soir 🌅 #Fenua #BoraBora",
            "content_type": "image",
            "media_url": "https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80",
            "location": "Bora Bora",
        },
        {
            "post_id": "demo_post_2",
            "caption": "Heiva i Tahiti 2026 — l'énergie du Fenua à son apogée 🪘 Bravo aux danseurs !",
            "content_type": "image",
            "media_url": "https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800&q=80",
            "location": "Place To'ata, Papeete",
        },
        {
            "post_id": "demo_post_3",
            "caption": "Petite balade matinale à Moorea 🌴 La vue depuis le Belvédère est imprenable.",
            "content_type": "image",
            "media_url": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
            "location": "Moorea",
        }
    ]

    posts_created = 0
    for p in demo_posts:
        result = await db.posts.update_one(
            {"post_id": p["post_id"]},
            {"$set": {
                **p,
                "user_id": demo_user_id,
                "likes_count": 12 + posts_created * 3,
                "comments_count": 2,
                "is_demo": True,
                "is_rss_article": False,
                "feed_type": "user",
                "created_at": (now - timedelta(days=posts_created, hours=2)).isoformat()
            }},
            upsert=True
        )
        if result.upserted_id:
            posts_created += 1

    return {
        "demo_user_id": demo_user_id,
        "demo_email": DEMO_EMAIL,
        "demo_password": DEMO_PASSWORD,
        "posts_seeded": len(demo_posts),
        "newly_created": posts_created
    }
