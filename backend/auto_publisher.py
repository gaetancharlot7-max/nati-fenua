# Auto-Publisher Service for Hui Fenua
# Publishes 20-30 local media content daily with coverage for all islands

import asyncio
import random
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
import uuid

logger = logging.getLogger(__name__)

# Island-specific content sources and themes
ISLAND_CONTENT = {
    "tahiti": {
        "name": "Tahiti",
        "themes": ["surf", "culture", "cuisine", "tourisme", "nature", "événements", "sport"],
        "locations": ["Papeete", "Teahupo'o", "Punaauia", "Faa'a", "Pirae", "Taravao", "Mahina"],
        "hashtags": ["#Tahiti", "#Papeete", "#FenuaTahiti", "#TahitiNui"],
        "accounts": ["fenua_tahiti", "papeete_daily", "tahiti_tourisme", "tahiti_culture"]
    },
    "moorea": {
        "name": "Moorea",
        "themes": ["nature", "randonnée", "plongée", "dauphins", "ananas", "tourisme"],
        "locations": ["Temae", "Opunohu", "Cook's Bay", "Haapiti", "Afareaitu"],
        "hashtags": ["#Moorea", "#IleSoeur", "#MooreaIsland", "#OpunohoBay"],
        "accounts": ["moorea_island", "moorea_nature", "moorea_dive"]
    },
    "bora-bora": {
        "name": "Bora Bora",
        "themes": ["luxe", "lagon", "plongée", "coucher de soleil", "romance", "requins"],
        "locations": ["Matira Beach", "Vaitape", "Mont Otemanu", "Lagoon"],
        "hashtags": ["#BoraBora", "#Perle du Pacifique", "#LuxuryTravel", "#Overwater"],
        "accounts": ["borabora_paradise", "bora_luxury", "borabora_nature"]
    },
    "raiatea": {
        "name": "Raiatea",
        "themes": ["histoire", "marae", "navigation", "culture", "vanille", "sacré"],
        "locations": ["Uturoa", "Marae Taputapuatea", "Mont Temehani", "Faaroa River"],
        "hashtags": ["#Raiatea", "#IleSacrée", "#Taputapuatea", "#UNESCO"],
        "accounts": ["raiatea_sacree", "raiatea_culture", "raiatea_heritage"]
    },
    "huahine": {
        "name": "Huahine",
        "themes": ["authenticité", "archéologie", "anguilles sacrées", "artisanat", "agriculture"],
        "locations": ["Fare", "Maeva", "Lac Fauna Nui", "Maroe Bay"],
        "hashtags": ["#Huahine", "#IleAuthentique", "#HuahineNui", "#AnguilleSacrée"],
        "accounts": ["huahine_authentic", "huahine_nature", "huahine_culture"]
    },
    "tuamotu": {
        "name": "Tuamotu",
        "themes": ["atoll", "perles", "plongée", "requin", "coprah", "fakarava"],
        "locations": ["Rangiroa", "Fakarava", "Tikehau", "Manihi", "Makemo"],
        "hashtags": ["#Tuamotu", "#Rangiroa", "#Fakarava", "#PerleTahiti"],
        "accounts": ["tuamotu_atolls", "rangiroa_dive", "fakarava_biosphere"]
    },
    "marquises": {
        "name": "Marquises",
        "themes": ["tikis", "tatouage", "Gauguin", "Brel", "sculpture", "danse", "cheval"],
        "locations": ["Nuku Hiva", "Hiva Oa", "Ua Pou", "Fatu Hiva", "Taiohae"],
        "hashtags": ["#Marquises", "#TeHenuaEnana", "#NukuHiva", "#HivaOa"],
        "accounts": ["marquises_heritage", "marquises_art", "marquises_nature"]
    }
}

# Content templates by type
CONTENT_TEMPLATES = {
    "photo": [
        {"theme": "nature", "captions": [
            "🌴 Magnifique vue sur {location} ce matin ! {hashtags}",
            "🌺 La beauté de {island} ne cesse de nous émerveiller {hashtags}",
            "📸 Instant capturé à {location}. Quel paradis ! {hashtags}",
            "🌊 Les couleurs du lagon de {island} sont incroyables {hashtags}",
            "☀️ Nouvelle journée au paradis à {location} {hashtags}"
        ]},
        {"theme": "culture", "captions": [
            "🎭 La culture polynésienne à {location} {hashtags}",
            "🌺 Tradition et modernité se mêlent à {island} {hashtags}",
            "🎶 Les arts de {island} - un patrimoine vivant {hashtags}",
            "✨ Beauté et tradition à {location} {hashtags}"
        ]},
        {"theme": "cuisine", "captions": [
            "🥥 Délicieux repas local à {location} ! {hashtags}",
            "🐟 Poisson cru au lait de coco - spécialité de {island} {hashtags}",
            "🍍 Les saveurs tropicales de {island} {hashtags}",
            "🍽️ Gastronomie polynésienne à {location} {hashtags}"
        ]}
    ],
    "video": [
        {"theme": "surf", "captions": [
            "🏄 Sessions de surf incroyables à {location} ! {hashtags}",
            "🌊 Les vagues de {island} attirent les surfeurs du monde entier {hashtags}",
            "🤙 Surf life à {location} {hashtags}"
        ]},
        {"theme": "plongée", "captions": [
            "🤿 Plongée magique à {location} {hashtags}",
            "🦈 Rencontre avec les requins de {island} {hashtags}",
            "🐠 Monde sous-marin de {location} {hashtags}"
        ]},
        {"theme": "événements", "captions": [
            "🎉 Festivités à {location} ! {hashtags}",
            "🎭 Événement culturel à {island} {hashtags}",
            "🎶 Concert et ambiance à {location} {hashtags}"
        ]}
    ],
    "article": [
        {"theme": "tourisme", "captions": [
            "📰 Guide complet : Que faire à {location} ? {hashtags}",
            "✈️ Découvrez les secrets de {island} {hashtags}",
            "🗺️ Top 10 des endroits à visiter à {location} {hashtags}",
            "📖 Histoire et légendes de {island} {hashtags}"
        ]},
        {"theme": "actualité", "captions": [
            "📰 Actualités de {island} - Ce qu'il faut savoir {hashtags}",
            "🆕 Nouveautés à {location} {hashtags}",
            "📢 Info locale : {island} en bref {hashtags}"
        ]}
    ]
}

# Sample media URLs (in production, these would come from real sources or be generated)
SAMPLE_MEDIA = {
    "photo": [
        "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",  # Tropical beach
        "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800",  # Ocean
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",  # Beach sunset
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",  # Mountains
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",  # Tropical
        "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",  # Lagoon
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800",  # Coconut
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",  # Tropical fruit
        "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800",  # Palm trees
        "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800",  # Sunset beach
    ],
    "video": [
        "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        # In production: real video URLs from local content creators
    ],
    "article_image": [
        "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800",  # Travel
        "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800",  # Island aerial
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800",  # Beach relax
    ]
}


class AutoPublisherService:
    """Service to automatically publish local content daily"""
    
    def __init__(self, db):
        self.db = db
        self.is_running = False
        
    async def get_or_create_bot_accounts(self) -> Dict[str, dict]:
        """Get or create bot accounts for each island"""
        bot_accounts = {}
        
        for island_id, island_data in ISLAND_CONTENT.items():
            for account_name in island_data["accounts"]:
                existing = await self.db.users.find_one({"user_id": account_name})
                
                if not existing:
                    # Create bot account
                    user = {
                        "user_id": account_name,
                        "name": account_name.replace("_", " ").title(),
                        "email": f"{account_name}@hui-fenua.local",
                        "picture": f"https://ui-avatars.com/api/?name={account_name[:2].upper()}&background={self._get_island_color(island_id)}&color=fff&bold=true&size=200",
                        "bio": f"Compte officiel - Actualités de {island_data['name']}",
                        "location": island_data["locations"][0] if island_data["locations"] else island_data["name"],
                        "island": island_id,
                        "is_verified": True,
                        "is_bot": True,
                        "followers_count": random.randint(500, 5000),
                        "following_count": random.randint(50, 200),
                        "posts_count": 0,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    }
                    await self.db.users.insert_one(user)
                    logger.info(f"Created bot account: {account_name}")
                    bot_accounts[account_name] = user
                else:
                    bot_accounts[account_name] = existing
                    
        return bot_accounts
    
    def _get_island_color(self, island_id: str) -> str:
        """Get a color for the island"""
        colors = {
            "tahiti": "FF6B35",
            "moorea": "00CED1",
            "bora-bora": "9B59B6",
            "raiatea": "E74C3C",
            "huahine": "27AE60",
            "tuamotu": "3498DB",
            "marquises": "F39C12"
        }
        return colors.get(island_id, "FF6B35")
    
    async def generate_daily_content(self, posts_count: int = 25) -> List[dict]:
        """Generate daily content for all islands"""
        
        posts = []
        
        # Ensure at least 2-3 posts per island
        islands = list(ISLAND_CONTENT.keys())
        posts_per_island = max(2, posts_count // len(islands))
        
        for island_id in islands:
            island_data = ISLAND_CONTENT[island_id]
            
            for i in range(posts_per_island):
                # Select content type
                content_type = random.choice(["photo", "photo", "photo", "video", "article"])
                
                # Select random account for this island
                account_id = random.choice(island_data["accounts"])
                
                # Select theme
                theme = random.choice(island_data["themes"])
                
                # Select location
                location = random.choice(island_data["locations"])
                
                # Generate caption
                caption = self._generate_caption(content_type, theme, island_data["name"], location, island_data["hashtags"])
                
                # Select media
                media_url = self._select_media(content_type)
                
                post = {
                    "post_id": f"auto_{uuid.uuid4().hex[:12]}",
                    "user_id": account_id,
                    "content_type": "link" if content_type == "article" else content_type,
                    "media_url": media_url,
                    "thumbnail_url": None,
                    "caption": caption,
                    "location": location,
                    "island": island_id,
                    "coordinates": self._get_island_coordinates(island_id),
                    "external_link": f"https://hui-fenua.com/article/{uuid.uuid4().hex[:8]}" if content_type == "article" else None,
                    "link_type": "article" if content_type == "article" else None,
                    "likes_count": random.randint(50, 2000),
                    "comments_count": random.randint(5, 150),
                    "shares_count": random.randint(2, 50),
                    "views_count": random.randint(100, 5000),
                    "reactions": {
                        "like": random.randint(30, 1000),
                        "love": random.randint(10, 300),
                        "haha": random.randint(0, 50),
                        "wow": random.randint(5, 100),
                        "fire": random.randint(10, 200)
                    },
                    "is_ad": False,
                    "is_featured": random.random() < 0.1,  # 10% chance to be featured
                    "is_auto_published": True,
                    "moderation_status": "approved",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                
                posts.append(post)
        
        # Add some extra random posts to reach target
        remaining = posts_count - len(posts)
        for _ in range(max(0, remaining)):
            island_id = random.choice(islands)
            island_data = ISLAND_CONTENT[island_id]
            content_type = random.choice(["photo", "photo", "video"])
            theme = random.choice(island_data["themes"])
            location = random.choice(island_data["locations"])
            
            post = {
                "post_id": f"auto_{uuid.uuid4().hex[:12]}",
                "user_id": random.choice(island_data["accounts"]),
                "content_type": content_type,
                "media_url": self._select_media(content_type),
                "thumbnail_url": None,
                "caption": self._generate_caption(content_type, theme, island_data["name"], location, island_data["hashtags"]),
                "location": location,
                "island": island_id,
                "coordinates": self._get_island_coordinates(island_id),
                "external_link": None,
                "link_type": None,
                "likes_count": random.randint(50, 2000),
                "comments_count": random.randint(5, 150),
                "shares_count": random.randint(2, 50),
                "views_count": random.randint(100, 5000),
                "reactions": {
                    "like": random.randint(30, 1000),
                    "love": random.randint(10, 300),
                    "haha": random.randint(0, 50),
                    "wow": random.randint(5, 100),
                    "fire": random.randint(10, 200)
                },
                "is_ad": False,
                "is_featured": False,
                "is_auto_published": True,
                "moderation_status": "approved",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            posts.append(post)
        
        # Shuffle to mix islands
        random.shuffle(posts)
        
        return posts
    
    def _generate_caption(self, content_type: str, theme: str, island: str, location: str, hashtags: List[str]) -> str:
        """Generate a caption for the content"""
        
        templates = CONTENT_TEMPLATES.get(content_type, CONTENT_TEMPLATES["photo"])
        
        # Find matching theme or use random
        matching = [t for t in templates if t["theme"] == theme]
        if not matching:
            matching = templates
        
        template = random.choice(matching)
        caption_template = random.choice(template["captions"])
        
        hashtag_str = " ".join(random.sample(hashtags, min(3, len(hashtags))))
        
        return caption_template.format(
            island=island,
            location=location,
            hashtags=hashtag_str
        )
    
    def _select_media(self, content_type: str) -> str:
        """Select appropriate media URL"""
        if content_type == "video":
            return random.choice(SAMPLE_MEDIA["video"]) if SAMPLE_MEDIA["video"] else random.choice(SAMPLE_MEDIA["photo"])
        elif content_type == "article":
            return random.choice(SAMPLE_MEDIA["article_image"])
        else:
            return random.choice(SAMPLE_MEDIA["photo"])
    
    def _get_island_coordinates(self, island_id: str) -> dict:
        """Get coordinates for an island"""
        coords = {
            "tahiti": {"lat": -17.6509, "lng": -149.4260},
            "moorea": {"lat": -17.5388, "lng": -149.8295},
            "bora-bora": {"lat": -16.5004, "lng": -151.7415},
            "raiatea": {"lat": -16.8333, "lng": -151.4333},
            "huahine": {"lat": -16.7333, "lng": -150.9833},
            "tuamotu": {"lat": -15.0, "lng": -145.0},
            "marquises": {"lat": -9.4333, "lng": -140.0667}
        }
        return coords.get(island_id, {"lat": -17.6509, "lng": -149.4260})
    
    async def publish_daily_content(self, posts_count: int = 25) -> dict:
        """Publish the daily content batch"""
        
        # First ensure bot accounts exist
        await self.get_or_create_bot_accounts()
        
        # Generate content
        posts = await self.generate_daily_content(posts_count)
        
        # Insert into database
        if posts:
            await self.db.posts.insert_many(posts)
            
            # Update post counts for bot accounts
            account_counts = {}
            for post in posts:
                account_counts[post["user_id"]] = account_counts.get(post["user_id"], 0) + 1
            
            for account_id, count in account_counts.items():
                await self.db.users.update_one(
                    {"user_id": account_id},
                    {"$inc": {"posts_count": count}}
                )
        
        # Log publication
        publication_log = {
            "log_id": f"pub_{uuid.uuid4().hex[:12]}",
            "type": "daily_auto_publish",
            "posts_count": len(posts),
            "islands_covered": list(set(p["island"] for p in posts)),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.publication_logs.insert_one(publication_log)
        
        logger.info(f"Auto-published {len(posts)} posts covering {len(publication_log['islands_covered'])} islands")
        
        return {
            "success": True,
            "posts_published": len(posts),
            "islands_covered": publication_log["islands_covered"],
            "timestamp": publication_log["created_at"]
        }
    
    async def get_content_by_island(self, island_id: str, limit: int = 20) -> List[dict]:
        """Get auto-published content for a specific island"""
        
        posts = await self.db.posts.find(
            {"island": island_id, "is_auto_published": True},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return posts
    
    async def get_daily_stats(self) -> dict:
        """Get stats for today's publications"""
        
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Count posts by island today
        pipeline = [
            {"$match": {
                "is_auto_published": True,
                "created_at": {"$gte": today_start.isoformat()}
            }},
            {"$group": {
                "_id": "$island",
                "count": {"$sum": 1}
            }}
        ]
        
        results = await self.db.posts.aggregate(pipeline).to_list(100)
        
        stats_by_island = {r["_id"]: r["count"] for r in results}
        
        return {
            "date": today_start.isoformat(),
            "total_posts": sum(stats_by_island.values()),
            "by_island": stats_by_island,
            "islands_missing": [
                island for island in ISLAND_CONTENT.keys() 
                if island not in stats_by_island
            ]
        }


# Background task for daily publishing
async def run_daily_publisher(db, interval_hours: int = 24):
    """Run the daily publisher as a background task"""
    
    service = AutoPublisherService(db)
    
    while True:
        try:
            # Check if we already published today
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            
            existing = await db.publication_logs.find_one({
                "type": "daily_auto_publish",
                "created_at": {"$gte": today_start.isoformat()}
            })
            
            if not existing:
                # Publish new content
                result = await service.publish_daily_content(posts_count=random.randint(20, 30))
                logger.info(f"Daily auto-publish completed: {result}")
            else:
                logger.info("Daily content already published today")
            
        except Exception as e:
            logger.error(f"Error in daily publisher: {e}")
        
        # Wait until next check (every hour, but only publish once per day)
        await asyncio.sleep(3600)  # Check every hour
