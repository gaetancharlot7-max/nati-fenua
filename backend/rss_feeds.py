# RSS Feed Integration for Nati Fenua
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

# Real Polynesian RSS feeds - Only WORKING sources (validated 2026-04)
# Broken feeds removed: Polynésie 1ère, Outremers 360, Radio 1, Tahiti News,
# La Dépêche, Air Tahiti Nui, World Surf League, TNTV (DNS errors, 403, 404 or empty RSS)
RSS_FEEDS = [
    # === MÉDIAS D'ACTUALITÉ FIABLES ===
    {
        "name": "Tahiti Infos",
        "url": "https://www.tahiti-infos.com/xml/syndication.rss",
        "island": "tahiti",
        "account_id": "tahiti_infos",
        "logo": "https://www.tahiti-infos.com/photo/titre_5283164.png",
        "categories": ["actualité", "politique", "société"],
        "feed_type": "media"
    },
    {
        "name": "Le Monde Pacifique",
        "url": "https://www.lemonde.fr/asie-pacifique/rss_full.xml",
        "island": "tahiti",
        "account_id": "lemonde_pacifique",
        "logo": "https://www.lemonde.fr/img/favicon/icon-180.png",
        "categories": ["actualité", "international"],
        "feed_type": "media"
    },
    {
        "name": "Actu.fr Pacifique",
        "url": "https://actu.fr/polynesie-francaise/rss.xml",
        "island": "tahiti",
        "account_id": "actu_pacifique",
        "logo": "https://actu.fr/favicon.ico",
        "categories": ["actualité", "pacifique"],
        "feed_type": "media"
    },
    # === AGRÉGATEURS GOOGLE NEWS (haute densité d'articles) ===
    {
        "name": "Actualités Polynésie",
        "url": "https://news.google.com/rss/search?q=polyn%C3%A9sie+fran%C3%A7aise&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "tahiti",
        "account_id": "gnews_polynesie",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["actualité", "agrégateur"],
        "feed_type": "media"
    },
    {
        "name": "Actualités Tahiti",
        "url": "https://news.google.com/rss/search?q=tahiti&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "tahiti",
        "account_id": "gnews_tahiti",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["actualité", "tahiti"],
        "feed_type": "media"
    },
    {
        "name": "Actualités Bora Bora",
        "url": "https://news.google.com/rss/search?q=bora+bora&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "bora-bora",
        "account_id": "gnews_borabora",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["actualité", "bora-bora", "tourisme"],
        "feed_type": "media"
    },
    {
        "name": "Actualités Moorea",
        "url": "https://news.google.com/rss/search?q=moorea+polyn%C3%A9sie&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "moorea",
        "account_id": "gnews_moorea",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["actualité", "moorea"],
        "feed_type": "media"
    },
    # === SPORT & SURF ===
    {
        "name": "Teahupo'o Surf",
        "url": "https://news.google.com/rss/search?q=teahupoo+surf&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "tahiti",
        "account_id": "gnews_teahupoo",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["surf", "sport", "teahupoo"],
        "feed_type": "sport"
    },
    {
        "name": "Va'a Polynésie",
        "url": "https://news.google.com/rss/search?q=va%27a+polyn%C3%A9sie+pirogue&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "tahiti",
        "account_id": "gnews_vaa",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["sport", "va'a", "pirogue"],
        "feed_type": "sport"
    },
    {
        "name": "Surfer Magazine",
        "url": "https://www.surfer.com/feed/",
        "island": "tahiti",
        "account_id": "surfer_mag",
        "logo": "https://www.surfer.com/favicon.ico",
        "categories": ["surf", "sport", "lifestyle"],
        "feed_type": "sport"
    },
    # === CULTURE ===
    {
        "name": "Heiva & Culture",
        "url": "https://news.google.com/rss/search?q=heiva+tahiti&hl=fr&gl=FR&ceid=FR%3Afr",
        "island": "tahiti",
        "account_id": "gnews_heiva",
        "logo": "https://news.google.com/favicon.ico",
        "categories": ["culture", "danse", "heiva"],
        "feed_type": "culture"
    },
    # === ENVIRONNEMENT ===
    {
        "name": "Ocean Conservancy",
        "url": "https://oceanconservancy.org/feed/",
        "island": "tahiti",
        "account_id": "ocean_conservancy",
        "logo": "https://oceanconservancy.org/favicon.ico",
        "categories": ["environnement", "océan", "conservation"],
        "feed_type": "environnement"
    },
]

# Note: Les sources .pf locales sont souvent instables
# Ces sources ont été supprimées car inactives:
# - tahitinuitv.pf, meteofrance.pf, voile.pf, vaanews.pf, natation.pf
# - surfingpolynesie.pf, tahitisurfclub.pf, emploi.pf, pole-emploi.pf
# - environnement.pf, heiva.org, maisondelaculture.pf, museetahiti.pf
# - farevanaa.pf, fifo-tahiti.com, sefi.pf, tahititourisme.pf, airtahitimagazine.com

# Sources de secours
BACKUP_FEEDS = []

# Les sources .pf locales sont souvent instables
# Seules les sources internationales fiables sont gardées dans RSS_FEEDS


# Configuration pour permettre l'ajout dynamique de feeds
CUSTOM_FEEDS_COLLECTION = "custom_rss_feeds"

# Enhanced island keywords for better detection
ISLAND_KEYWORDS = {
    "tahiti": [
        "tahiti", "papeete", "faa'a", "faaa", "punaauia", "pirae", "mahina", 
        "taravao", "teahupo'o", "teahupoo", "mataiea", "papara", "paea", 
        "arue", "hitia'a", "tautira", "tahiti nui", "tahiti iti", "presqu'île",
        "assemblée", "haut-commissariat", "gouvernement polynésie"
    ],
    "moorea": [
        "moorea", "temae", "haapiti", "afareaitu", "opunohu", "cook", 
        "paopao", "maharepa", "teavaro", "île soeur", "belvedere moorea"
    ],
    "bora-bora": [
        "bora bora", "bora-bora", "vaitape", "matira", "otemanu", 
        "faanui", "anau", "povai", "nunue", "perle du pacifique"
    ],
    "raiatea": [
        "raiatea", "uturoa", "taputapuatea", "faaroa", "tevaitoa", 
        "opoa", "avera", "île sacrée", "unesco raiatea"
    ],
    "tahaa": [
        "tahaa", "taha'a", "patio", "haamene", "tapuamu", "hipu", 
        "faaaha", "île vanille", "vanille tahaa"
    ],
    "huahine": [
        "huahine", "fare", "maeva", "fauna nui", "fitii", "haapu",
        "parea", "tefarerii", "île authentique", "anguilles sacrées"
    ],
    "maupiti": [
        "maupiti", "vaiea", "farauru", "teurafaatiu", "tereia",
        "motu auira", "petite soeur", "raies manta maupiti"
    ],
    "tuamotu": [
        "tuamotu", "rangiroa", "fakarava", "tikehau", "manihi", "makemo",
        "hao", "ahe", "takaroa", "takapoto", "niau", "kaukura", "aratika",
        "kauehi", "raroia", "atoll", "passe tiputa", "passe avatoru",
        "lagon bleu", "récif", "coprah", "perles noires"
    ],
    "marquises": [
        "marquises", "nuku hiva", "nukuhiva", "hiva oa", "hivaoa", 
        "ua pou", "uapou", "fatu hiva", "fatuhiva", "taiohae", "atuona",
        "hakahau", "hakaui", "taipivai", "hatiheu", "gauguin", "brel",
        "te henua enana", "tiki", "tatouage marquisien"
    ],
    "gambier": [
        "gambier", "mangareva", "rikitea", "taravai", "akamaru",
        "perles gambier"
    ],
    "australes": [
        "australes", "tubuai", "rurutu", "raivavae", "rimatara", "rapa",
        "moerai", "mataura", "avera rurutu"
    ]
}


def detect_island_from_text(text: str) -> str:
    """Detect which island an article is about based on keywords with scoring"""
    text_lower = text.lower()
    
    # Score each island based on keyword matches
    scores = {}
    
    for island, keywords in ISLAND_KEYWORDS.items():
        score = 0
        for keyword in keywords:
            # Count occurrences of each keyword
            count = text_lower.count(keyword.lower())
            if count > 0:
                # Weight by keyword specificity (longer keywords = more specific)
                weight = len(keyword.split()) + (len(keyword) / 10)
                score += count * weight
        
        if score > 0:
            scores[island] = score
    
    # Return island with highest score, or tahiti as default
    if scores:
        best_island = max(scores, key=scores.get)
        # Only return non-tahiti if the score is significantly higher
        if best_island != "tahiti" or scores.get("tahiti", 0) > 0:
            return best_island
    
    return "tahiti"  # Default to Tahiti for general Polynesian news


def clean_html(html_content: str) -> str:
    """Remove HTML tags and clean up text"""
    if not html_content:
        return ""
    
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    return text[:500]  # Limit to 500 chars


def extract_image_from_content(content: str, entry: dict, feed_config: dict = None) -> Optional[str]:
    """Extract first image URL from RSS content with multiple fallback strategies"""
    
    # Try media:content first
    if hasattr(entry, 'media_content') and entry.media_content:
        for media in entry.media_content:
            url = media.get('url', '')
            if media.get('medium') == 'image' or url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
                if url.startswith('http'):
                    return url
    
    # Try enclosures (common in podcasts and media RSS)
    if hasattr(entry, 'enclosures') and entry.enclosures:
        for enc in entry.enclosures:
            enc_type = enc.get('type', '')
            enc_url = enc.get('href') or enc.get('url', '')
            if enc_type.startswith('image/') and enc_url.startswith('http'):
                return enc_url
    
    # Try media:thumbnail
    if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
        thumb_url = entry.media_thumbnail[0].get('url', '')
        if thumb_url.startswith('http'):
            return thumb_url
    
    # Try image element (common in atom feeds)
    if hasattr(entry, 'image') and entry.image:
        if isinstance(entry.image, dict):
            img_url = entry.image.get('href') or entry.image.get('url', '')
            if img_url.startswith('http'):
                return img_url
        elif isinstance(entry.image, str) and entry.image.startswith('http'):
            return entry.image
    
    # Parse HTML content for images
    if content:
        soup = BeautifulSoup(content, 'html.parser')
        
        # Look for og:image meta tag first (highest quality)
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content', '').startswith('http'):
            return og_image['content']
        
        # Look for twitter:image
        twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content', '').startswith('http'):
            return twitter_image['content']
        
        # Find all images and pick the best one (skip tiny icons)
        images = soup.find_all('img')
        for img in images:
            src = img.get('src', '')
            # Skip data URIs, tracking pixels, and tiny images
            if not src.startswith('http'):
                continue
            if 'pixel' in src.lower() or 'tracking' in src.lower() or 'spacer' in src.lower():
                continue
            if '1x1' in src or 'blank' in src.lower():
                continue
            # Prefer larger images based on attributes
            width = img.get('width', '')
            height = img.get('height', '')
            if width and height:
                try:
                    if int(width) < 100 or int(height) < 100:
                        continue
                except (ValueError, TypeError):
                    pass
            return src
    
    # Fallback: Use the feed's logo as placeholder if available
    if feed_config and feed_config.get('logo'):
        return feed_config.get('logo')
    
    # Generate a themed placeholder based on category
    categories = feed_config.get('categories', []) if feed_config else []
    if 'surf' in categories or 'sport' in categories:
        return 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80'
    elif 'météo' in categories or 'meteo' in categories:
        return 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=800&q=80'
    elif 'culture' in categories or 'danse' in categories:
        return 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=80'
    elif 'emploi' in categories:
        return 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80'
    elif 'tourisme' in categories or 'voyage' in categories:
        return 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80'
    else:
        # Default Polynesian themed placeholder
        return 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800&q=80'


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
            
            for entry in feed.entries[:15]:  # Get up to 15 articles per source (will be limited later)
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
                    
                    # Extract image with feed config for fallbacks
                    image_url = extract_image_from_content(content, entry, feed_config)
                    
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
        """Fetch all configured RSS feeds (built-in + custom)"""
        
        all_articles = []
        
        # Fetch built-in feeds
        tasks = [self.fetch_feed(feed) for feed in RSS_FEEDS]
        
        # Fetch custom feeds from database
        custom_feeds = await self.db.custom_rss_feeds.find({"is_active": True}).to_list(100)
        tasks.extend([self.fetch_feed(feed) for feed in custom_feeds])
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Feed fetch error: {result}")
        
        return all_articles
    
    async def publish_articles_as_posts(self, max_posts_per_source: int = 2, max_total_posts: int = 70) -> dict:
        """Fetch RSS feeds and publish as posts - STRICT NO DUPLICATES
        
        Args:
            max_posts_per_source: Maximum posts per media source (default: 2)
            max_total_posts: Maximum total posts to publish (default: 70 for 35 sources x 2)
        
        Features:
            - STRICT: 1 post per unique article URL (absolute no duplicates)
            - Max 2 posts per source
            - Random mixing of all sources
        """
        import random
        
        # Ensure media accounts exist
        await self.ensure_media_accounts()
        
        # Fetch all articles
        all_articles = await self.fetch_all_feeds()
        
        if not all_articles:
            return {"success": False, "message": "No articles found", "posts_created": 0}
        
        # STEP 1: Get ALL existing article URLs from database to prevent ANY duplicates
        existing_links = set()
        existing_posts = await self.db.posts.find(
            {"external_link": {"$ne": None}},
            {"external_link": 1, "_id": 0}
        ).to_list(10000)
        for p in existing_posts:
            if p.get("external_link"):
                existing_links.add(p["external_link"])
        
        logger.info(f"Found {len(existing_links)} existing article URLs in database")
        
        # STEP 2: Filter out articles that already exist in database
        new_articles = []
        for article in all_articles:
            if article["link"] not in existing_links:
                new_articles.append(article)
        
        logger.info(f"Filtered to {len(new_articles)} NEW articles (removed {len(all_articles) - len(new_articles)} existing)")
        
        # STEP 3: Remove duplicates within the new articles (by URL)
        seen_urls = set()
        unique_articles = []
        for article in sorted(new_articles, key=lambda x: x["pub_date"], reverse=True):
            if article["link"] not in seen_urls:
                seen_urls.add(article["link"])
                unique_articles.append(article)
        
        logger.info(f"Deduplicated to {len(unique_articles)} unique new articles")
        
        # STEP 4: Limit to max_posts_per_source per source
        articles_by_source = {}
        for article in unique_articles:
            source = article["source"]
            if source not in articles_by_source:
                articles_by_source[source] = []
            if len(articles_by_source[source]) < max_posts_per_source:
                articles_by_source[source].append(article)
        
        # STEP 5: Flatten and shuffle randomly
        limited_articles = []
        for source, articles in articles_by_source.items():
            limited_articles.extend(articles)
            logger.info(f"Source '{source}': {len(articles)} articles (max {max_posts_per_source})")
        
        # Shuffle to mix all sources randomly
        random.shuffle(limited_articles)
        
        # Limit total posts
        limited_articles = limited_articles[:max_total_posts]
        
        logger.info(f"Final: {len(limited_articles)} articles from {len(articles_by_source)} sources to publish")
        
        posts_created = 0
        
        for article in limited_articles:
            # Double-check: Skip if already exists (belt and suspenders)
            existing = await self.db.posts.find_one({"external_link": article["link"]})
            if existing:
                logger.warning(f"Skipping duplicate (found in final check): {article['link']}")
                continue
            
            # Create post with unique ID
            post_id = f"rss_{uuid.uuid4().hex[:12]}"
            
            post = {
                "post_id": post_id,
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
            "sources_used": list(articles_by_source.keys()),
            "max_per_source": max_posts_per_source,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.publication_logs.insert_one(log_entry)
        
        logger.info(f"Published {posts_created} NEW RSS articles (strict no duplicates)")
        
        return {
            "success": True,
            "posts_created": posts_created,
            "sources_fetched": len(RSS_FEEDS),
            "sources_with_articles": len(articles_by_source),
            "articles_found": len(all_articles),
            "new_articles": len(new_articles),
            "unique_articles": len(unique_articles),
            "max_per_source": max_posts_per_source
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
