"""
One-shot cleanup:
1. Remove duplicate RSS posts (keep oldest by created_at, drop the rest with same normalized title)
2. Replace junk image URLs (Google News favicons, etc.) with a Polynesian default placeholder
"""
import asyncio
import os
import re
import sys
import unicodedata
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

sys.path.insert(0, "/app/backend")
load_dotenv("/app/backend/.env")


def normalize_title(title: str) -> str:
    if not title:
        return ""
    nfkd = unicodedata.normalize("NFKD", title)
    ascii_t = "".join(c for c in nfkd if not unicodedata.combining(c))
    cleaned = re.sub(r"[^\w\s]", "", ascii_t.lower())
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:80]


def is_junk_image(url: str) -> bool:
    if not url:
        return True
    u = url.lower()
    if "news.google.com" in u and ("favicon" in u or ".ico" in u):
        return True
    junk = ["favicon", "spacer.gif", "spacer.png", "pixel.gif",
            "tracking", "1x1", "blank.gif", "transparent.gif"]
    return any(k in u for k in junk)


DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80"


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # 1. Find duplicates by normalized title
    print("=== Step 1: Removing duplicate RSS posts by normalized title ===")
    posts = await db.posts.find(
        {"is_rss_article": True, "link_title": {"$exists": True, "$ne": None}},
        {"_id": 0, "post_id": 1, "link_title": 1, "created_at": 1}
    ).sort("created_at", 1).to_list(20000)

    title_groups = defaultdict(list)
    for p in posts:
        tk = normalize_title(p["link_title"])
        if tk:
            title_groups[tk].append(p)

    to_delete = []
    for tk, group in title_groups.items():
        if len(group) > 1:
            # Keep the oldest, delete the rest
            for p in group[1:]:
                to_delete.append(p["post_id"])

    if to_delete:
        result = await db.posts.delete_many({"post_id": {"$in": to_delete}})
        print(f"  Deleted {result.deleted_count} duplicate posts")
    else:
        print("  No title duplicates found")

    # 2. Fix junk image URLs
    print("\n=== Step 2: Replacing junk image URLs ===")
    rss_posts = await db.posts.find(
        {"is_rss_article": True},
        {"_id": 0, "post_id": 1, "media_url": 1}
    ).to_list(20000)

    fixed = 0
    for p in rss_posts:
        if is_junk_image(p.get("media_url", "")):
            await db.posts.update_one(
                {"post_id": p["post_id"]},
                {"$set": {
                    "media_url": DEFAULT_PLACEHOLDER,
                    "thumbnail_url": DEFAULT_PLACEHOLDER
                }}
            )
            fixed += 1

    print(f"  Fixed {fixed} posts with junk images")

    # 3. Stats
    print("\n=== Final stats ===")
    total = await db.posts.count_documents({"is_rss_article": True})
    print(f"Total RSS posts: {total}")
    no_img = await db.posts.count_documents({
        "is_rss_article": True,
        "$or": [{"media_url": None}, {"media_url": ""}, {"media_url": {"$exists": False}}]
    })
    print(f"RSS posts without media_url: {no_img}")


if __name__ == "__main__":
    asyncio.run(main())
