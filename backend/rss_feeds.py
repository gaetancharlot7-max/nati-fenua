# RSS Feed Integration for Hui Fenua
# Fetches real news from Polynesian media sources

import asyncio
import aiohttp
import feedparser
import logging
import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Real Polynesian RSS feeds
RSS_FEEDS = [
    {
        "name": "Tahiti Infos",
        "url": "https://www.tahiti-infos.com/xml/syndication.rss",
        "island": "tahiti",
        "account_id": "tahiti_infos",
        "logo": "https://www.tahiti-infos.com/photo/titre_5283164.png",
        "categories": ["actualité", "politique", "société", "économie"]
    },
    {
        "name": "La Dépêche de Tahiti",
        "url": "https://www.ladepeche.pf/feed/",
        "island": "tahiti",
        "account_id": "ladepeche_tahiti",
        "logo": "https://www.ladepeche.pf/wp-content/uploads/2020/01/logo-depeche.png",
        "categories": ["actualité", "sport", "culture"]
    },
    {
        "name": "Polynésie 1ère",
        "url": "https://la1ere.francetvinfo.fr/polynesie/rss",
        "island": "tahiti",
        "account_id": "polynesie_1ere",
        "logo": "https://la1ere.francetvinfo.fr/image/dpvm2y6n3-d0c6/600/315/16779527.png",
        "categories": ["actualité", "télévision", "info"]
    },
    {
        "name": "Radio 1 Tahiti",
        "url": "https://www.radio1.pf/feed/",
        "island": "tahiti",
        "account_id": "radio1_tahiti",
        "logo": "https://www.radio1.pf/wp-content/uploads/2018/10/logo-radio1.png",
        "categories": ["actualité", "musique", "événements"]
    },
    {
        "name": "TNTV",
        "url": "https://www.tntv.pf/feed/",
        "island": "tahiti",
        "account_id": "tntv_polynesie",
        "logo": "https://www.tntv.pf/wp-content/uploads/2019/07/tntv-logo.png",
        "categories": ["actualité", "télévision", "sport"]
    }
]

# Island keywords for auto-tagging
ISLAND_KEYWORDS = {
    "tahiti": ["tahiti", "papeete", "faa'a", "punaauia", "pirae", "mahina", "taravao", "teahupo'o", "mataiea"],
    "moorea": ["moorea", "temae", "haapiti", "afareaitu", "opunohu", "cook"],
    "bora-bora": ["bora bora", "bora-bora", "vaitape", "matira", "otemanu"],
    "raiatea": ["raiatea", "uturoa", "taputapuatea", "faaroa"],
    "tahaa": ["tahaa", "taha'a", "patio", "haamene"],
    "huahine": ["huahine", "fare", "maeva", "fauna nui"],
    "maupiti": ["maupiti", "vaiea", "farauru"],
    "tuamotu": ["tuamotu", "rangiroa", "fakarava", "tikehau", "manihi", "makemo", "hao", "ahe"],
    "marquises": ["marquises", "nuku hiva", "hiva oa", "ua pou", "fatu hiva", "taiohae", "atuona"]
}


def detect_island_from_text(text: str) -> str:
    """Detect which island an article is about based on keywords"""
    text_lower = text.lower()
    
    for island, keywords in ISLAND_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return island
    
    return "tahiti"  # Default to Tahiti


def clean_html(html_content: str) -> str:
    """Remove HTML tags and clean up text"""
    if not html_content:
        return ""
    
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text[:500]  # Limit to 500 chars


def extract_image_from_content(content: str, entry: dict) -> Optional[str]:
    """Extract first image URL from RSS content"""
    
    # Try media:content first
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            if media.get('medium') == 'image' or media.get('url', '').endswith(('.jpg', '.jpeg', '.png', '.webp')):
                return media.get('url')
    
    # Try enclosures
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get('type', '').startswith('image/'):
                return enc.get('href') or enc.get('url')
    
    # Try media:thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        return entry.media_thumbnail[0].get('url')
    
    # Parse HTML content for images
    if content:
        soup = BeautifulSoup(content, 'html.parser')
        img = soup.find('img')
        if img and img.get('src'):
            src = img.get('src')
            if src.startswith('http'):
                return src
    
    return None


class RSSFeedService:
    """Service to fetch and process RSS feeds from Polynesian media"""
    
    def __init__(self, db):
        self.db = db
        self.session = None
    
    async def get_session(self):
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=30)
            self.session = aiohttp.ClientSession(timeout=timeout)
        return self.session
    
    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
    
    async def ensure_media_accounts(self):
        """Create accounts for media sources if they don't exist"""
        
        for feed in RSS_FEEDS:
            existing = await self.db.users.find_one({"user_id": feed["account_id"]})
            
            if not existing:
                account = {
                    "user_id": feed["account_id"],
                    "name": feed["name"],
                    "email": f"{feed['account_id']}@hui-fenua.local",
                    "picture": feed.get("logo") or f"https://ui-avatars.com/api/?name={feed['name'][:2]}&background=FF6B35&color=fff&bold=true&size=200",
                    "bio": f"Compte officiel - {feed['name']}",
                    "location": "Polynésie française",
                    "island": feed["island"],
                    "website": feed["url"].replace("/feed/", "").replace("/rss", ""),
                    "is_verified": True,
                    "is_media": True,
                    "is_bot": True,
                    "followers_count": 1000,
                    "following_count": 0,
                    "posts_count": 0,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.users.insert_one(account)
                logger.info(f"Created media account: {feed['name']}")
    
    async def fetch_feed(self, feed_config: dict) -> List[dict]:
        """Fetch and parse a single RSS feed"""
        
        articles = []
        
        try:
            session = await self.get_session()
            
            headers = {
                'User-Agent': 'HuiFenua/1.0 (RSS Reader; https://hui-fenua.com)'
            }
            
            async with session.get(feed_config["url"], headers=headers) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch {feed_config['name']}: {response.status}")
                    return []
                
                content = await response.text()
            
            # Parse feed
            feed = feedparser.parse(content)
            
            for entry in feed.entries[:10]:  # Limit to 10 latest articles per source
                try:
                    # Get publication date
                    pub_date = None
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                    elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                        pub_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
                    else:
                        pub_date = datetime.now(timezone.utc)
                    
                    # Skip articles older than 7 days
                    if pub_date < datetime.now(timezone.utc) - timedelta(days=7):
                        continue
                    
                    # Get content
                    content = ""
                    if hasattr(entry, 'content') and entry.content:
                        content = entry.content[0].get('value', '')
                    elif hasattr(entry, 'summary'):
                        content = entry.summary
                    elif hasattr(entry, 'description'):
                        content = entry.description
                    
                    # Clean content
                    clean_content = clean_html(content)
                    
                    # Extract image
                    image_url = extract_image_from_content(content, entry)
                    
                    # Detect island from title and content
                    full_text = f"{entry.title} {clean_content}"
                    island = detect_island_from_text(full_text)
                    
                    article = {
                        "title": entry.title,
                        "link": entry.link,
                        "summary": clean_content,
                        "image_url": image_url,
                        "pub_date": pub_date.isoformat(),
                        "source": feed_config["name"],
                        "account_id": feed_config["account_id"],
                        "island": island,
                        "categories": feed_config.get("categories", [])
                    }
                    
                    articles.append(article)
                    
                except Exception as e:
                    logger.error(f"Error parsing entry from {feed_config['name']}: {e}")
                    continue
            
            logger.info(f"Fetched {len(articles)} articles from {feed_config['name']}")
            
        except Exception as e:
            logger.error(f"Error fetching feed {feed_config['name']}: {e}")
        
        return articles
    
    async def fetch_all_feeds(self) -> List[dict]:
        """Fetch all configured RSS feeds"""
        
        all_articles = []
        
        tasks = [self.fetch_feed(feed) for feed in RSS_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Feed fetch error: {result}")
        
        return all_articles
    
    async def publish_articles_as_posts(self, max_posts: int = 20) -> dict:
        """Fetch RSS feeds and publish as posts"""
        
        # Ensure media accounts exist
        await self.ensure_media_accounts()
        
        # Fetch all articles
        articles = await self.fetch_all_feeds()
        
        if not articles:
            return {"success": False, "message": "No articles found", "posts_created": 0}
        
        # Sort by date and limit
        articles.sort(key=lambda x: x["pub_date"], reverse=True)
        articles = articles[:max_posts]
        
        posts_created = 0
        
        for article in articles:
            # Check if article already exists (by link)
            existing = await self.db.posts.find_one({"external_link": article["link"]})
            if existing:
                continue
            
            # Create post
            post = {
                "post_id": f"rss_{uuid.uuid4().hex[:12]}",
                "user_id": article["account_id"],
                "content_type": "link",
                "media_url": article.get("image_url"),
                "thumbnail_url": article.get("image_url"),
                "caption": f"📰 {article['title']}\n\n{article['summary'][:200]}...\n\n🔗 Lire l'article complet",
                "location": "Polynésie française",
                "island": article["island"],
                "external_link": article["link"],
                "link_type": "article",
                "link_title": article["title"],
                "link_source": article["source"],
                "likes_count": 0,
                "comments_count": 0,
                "shares_count": 0,
                "views_count": 0,
                "reactions": {"like": 0, "love": 0, "haha": 0, "wow": 0, "fire": 0},
                "is_ad": False,
                "is_featured": False,
                "is_rss_article": True,
                "moderation_status": "approved",
                "created_at": article["pub_date"]
            }
            
            await self.db.posts.insert_one(post)
            
            # Update account post count
            await self.db.users.update_one(
                {"user_id": article["account_id"]},
                {"$inc": {"posts_count": 1}}
            )
            
            posts_created += 1
        
        # Log publication
        log_entry = {
            "log_id": f"rss_{uuid.uuid4().hex[:12]}",
            "type": "rss_fetch",
            "posts_created": posts_created,
            "sources": list(set(a["source"] for a in articles[:posts_created] if posts_created > 0)),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.publication_logs.insert_one(log_entry)
        
        logger.info(f"Published {posts_created} RSS articles as posts")
        
        return {
            "success": True,
            "posts_created": posts_created,
            "sources_fetched": len(RSS_FEEDS),
            "articles_found": len(articles)
        }
    
    async def get_rss_stats(self) -> dict:
        """Get statistics about RSS publications"""
        
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Count RSS posts today
        rss_posts_today = await self.db.posts.count_documents({
            "is_rss_article": True,
            "created_at": {"$gte": today.isoformat()}
        })
        
        # Count by source
        pipeline = [
            {"$match": {"is_rss_article": True}},
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        by_source = await self.db.posts.aggregate(pipeline).to_list(20)
        
        return {
            "rss_posts_today": rss_posts_today,
            "total_rss_posts": await self.db.posts.count_documents({"is_rss_article": True}),
            "by_source": {r["_id"]: r["count"] for r in by_source},
            "configured_feeds": len(RSS_FEEDS)
        }


# Cleanup function to remove broken YouTube links
async def cleanup_youtube_links(db):
    """Remove or mark posts with non-functional YouTube links"""
    
    # Find posts with YouTube links
    youtube_posts = await db.posts.find({
        "$or": [
            {"media_url": {"$regex": "youtube.com|youtu.be"}},
            {"external_link": {"$regex": "youtube.com|youtu.be"}}
        ]
    }).to_list(1000)
    
    removed_count = 0
    
    for post in youtube_posts:
        # For now, mark as needing review or delete if it's auto-generated
        if post.get("is_auto_published") or post.get("is_seeded"):
            await db.posts.delete_one({"post_id": post["post_id"]})
            removed_count += 1
    
    logger.info(f"Removed {removed_count} posts with YouTube links")
    return {"removed": removed_count}
