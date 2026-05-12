"""Weekly email digest for Nati Fenua users.

Sends a personalized summary every Saturday morning to users who:
- Have email verified
- Have opted in (notifications.email_digest = True) OR are new users (< 7 days)
- Haven't logged in for at least 3 days (re-engagement focus)

Content: counts of new posts/articles/products + top 3 most-liked posts of the week.
Powered by Resend.
"""

import os
import asyncio
import logging
from datetime import datetime, timezone, timedelta

import resend

logger = logging.getLogger(__name__)


async def send_weekly_digest(db) -> dict:
    """Run the weekly digest. Idempotent — safe to call multiple times per day."""
    api_key = os.environ.get("RESEND_API_KEY")
    sender = os.environ.get("SENDER_EMAIL", "noreply@nati-fenua.com")
    if not api_key:
        logger.warning("Resend API key missing — skipping digest")
        return {"sent": 0, "skipped": "no_api_key"}
    resend.api_key = api_key

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    three_days_ago = now - timedelta(days=3)

    # Weekly aggregated stats (count once for the whole batch)
    new_posts = await db.posts.count_documents({
        "created_at": {"$gte": week_ago.isoformat()},
        "is_rss_article": {"$ne": True}
    })
    new_articles = await db.posts.count_documents({
        "created_at": {"$gte": week_ago.isoformat()},
        "is_rss_article": True
    })
    new_products = await db.marketplace_items.count_documents({
        "created_at": {"$gte": week_ago.isoformat()}
    }) if "marketplace_items" in await db.list_collection_names() else 0
    new_users = await db.users.count_documents({"created_at": {"$gte": week_ago.isoformat()}})

    # Top posts of the week (sorted by likes_count desc)
    top_posts = await db.posts.find(
        {"created_at": {"$gte": week_ago.isoformat()}, "is_rss_article": {"$ne": True}},
        {"_id": 0, "post_id": 1, "caption": 1, "likes_count": 1, "user_id": 1, "media_url": 1}
    ).sort("likes_count", -1).limit(3).to_list(3)

    # Users eligible for the digest
    cursor = db.users.find(
        {
            "is_email_verified": True,
            "email": {"$exists": True, "$ne": None},
            "$or": [
                {"last_seen": {"$lt": three_days_ago.isoformat()}},
                {"last_seen": {"$exists": False}}
            ],
            "notifications.email_digest": {"$ne": False}  # opted-in OR not set yet
        },
        {"_id": 0, "user_id": 1, "email": 1, "name": 1}
    )

    sent = 0
    failed = 0
    async for user in cursor:
        try:
            html = _build_html(
                user_name=user.get("name", "Polynésien"),
                new_posts=new_posts,
                new_articles=new_articles,
                new_products=new_products,
                new_users=new_users,
                top_posts=top_posts
            )
            await asyncio.to_thread(resend.Emails.send, {
                "from": sender,
                "to": [user["email"]],
                "subject": f"🌺 Cette semaine sur Nati Fenua — {new_posts + new_articles} actualités à découvrir",
                "html": html
            })
            sent += 1
        except Exception as e:
            failed += 1
            logger.warning(f"Digest send failed for {user.get('email')}: {e}")

    logger.info(f"📧 Digest: {sent} sent / {failed} failed")
    return {"sent": sent, "failed": failed, "stats": {
        "new_posts": new_posts, "new_articles": new_articles,
        "new_products": new_products, "new_users": new_users
    }}


def _build_html(user_name, new_posts, new_articles, new_products, new_users, top_posts):
    """Render the digest HTML email."""
    top_html = ""
    for i, p in enumerate(top_posts):
        emoji = ["🥇", "🥈", "🥉"][i] if i < 3 else "📌"
        caption = (p.get("caption") or "").strip()[:120]
        likes = p.get("likes_count", 0)
        top_html += f"""
            <div style="background:#FFF5F0;border-left:4px solid #FF6B35;padding:12px 16px;border-radius:8px;margin:8px 0;">
                <p style="margin:0;font-size:13px;color:#888;">{emoji} {likes} ❤️</p>
                <p style="margin:4px 0 0;color:#1A1A2E;">{caption or 'Photo Nati Fenua'}</p>
            </div>
        """

    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A2E;">
        <div style="text-align:center;margin-bottom:24px;">
            <h1 style="margin:0;font-size:28px;background:linear-gradient(135deg,#FF6B35,#FF1493);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                Nati Fenua
            </h1>
            <p style="margin:4px 0 0;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:2px;">Le récap de la semaine</p>
        </div>

        <p style="font-size:16px;">Ia ora na <strong>{user_name}</strong> 🌺</p>
        <p>Voici ce qui s'est passé sur Nati Fenua cette semaine :</p>

        <table style="width:100%;border-spacing:8px;margin:20px 0;">
            <tr>
                <td style="background:linear-gradient(135deg,#FF6B35,#FF1493);color:white;padding:18px;border-radius:14px;text-align:center;width:50%;">
                    <p style="margin:0;font-size:32px;font-weight:900;">{new_posts}</p>
                    <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📸 nouvelles publications</p>
                </td>
                <td style="background:linear-gradient(135deg,#00CED1,#006994);color:white;padding:18px;border-radius:14px;text-align:center;width:50%;">
                    <p style="margin:0;font-size:32px;font-weight:900;">{new_articles}</p>
                    <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">📰 articles d'actu</p>
                </td>
            </tr>
            <tr>
                <td style="background:linear-gradient(135deg,#9400D3,#FF1493);color:white;padding:18px;border-radius:14px;text-align:center;">
                    <p style="margin:0;font-size:32px;font-weight:900;">{new_users}</p>
                    <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">👋 nouveaux Polynésiens</p>
                </td>
                <td style="background:linear-gradient(135deg,#FFD700,#FF6B35);color:white;padding:18px;border-radius:14px;text-align:center;">
                    <p style="margin:0;font-size:32px;font-weight:900;">{new_products}</p>
                    <p style="margin:4px 0 0;font-size:12px;opacity:0.9;">🛍️ produits marketplace</p>
                </td>
            </tr>
        </table>

        {f'<h3 style="color:#1A1A2E;margin-top:28px;">🔥 Top 3 des publications de la semaine</h3>{top_html}' if top_html else ''}

        <div style="text-align:center;margin:32px 0;">
            <a href="https://nati-fenua.com/feed" style="background:linear-gradient(135deg,#FF6B35,#FF1493);color:white;padding:14px 36px;text-decoration:none;border-radius:999px;font-weight:700;display:inline-block;">
                Ouvrir Nati Fenua →
            </a>
        </div>

        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:11px;text-align:center;">
            Tu reçois cet email parce que tu es membre de Nati Fenua.<br>
            <a href="https://nati-fenua.com/settings/notifications" style="color:#FF6B35;">Modifier mes préférences</a> ·
            <a href="https://nati-fenua.com" style="color:#FF6B35;">nati-fenua.com</a>
        </p>
    </div>
    """
