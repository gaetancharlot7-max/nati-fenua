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

# Real Polynesian RSS feeds - Extended list with 25+ sources
RSS_FEEDS = [
    # === MÉDIAS D'ACTUALITÉ ===
    {
        "name": "Tahiti Infos",
        "url": "https://www.tahiti-infos.com/xml/syndication.rss",
        "island": "tahiti",
        "account_id": "tahiti_infos",
        "logo": "https://www.tahiti-infos.com/photo/titre_5283164.png",
        "categories": ["actualité", "politique", "société", "économie"],
        "feed_type": "media"
    },
    {
        "name": "Polynésie 1ère",
        "url": "https://la1ere.francetvinfo.fr/polynesie/rss",
        "island": "tahiti",
        "account_id": "polynesie_1ere",
        "logo": "https://la1ere.francetvinfo.fr/image/dpvm2y6n3-d0c6/600/315/16779527.png",
        "categories": ["actualité", "télévision", "info"],
        "feed_type": "media"
    },
    {
        "name": "TNTV",
        "url": "https://www.tntv.pf/feed/",
        "island": "tahiti",
        "account_id": "tntv_polynesie",
        "logo": "https://www.tntv.pf/wp-content/uploads/2019/07/tntv-logo.png",
        "categories": ["actualité", "télévision", "sport"],
        "feed_type": "media"
    },
    {
        "name": "La Dépêche de Tahiti",
        "url": "https://www.ladepeche.pf/feed/",
        "island": "tahiti",
        "account_id": "ladepeche_tahiti",
        "logo": "https://www.ladepeche.pf/wp-content/uploads/logo-depeche.png",
        "categories": ["actualité", "politique", "économie"],
        "feed_type": "media"
    },
    {
        "name": "Outremers 360",
        "url": "https://outremers360.com/feed/",
        "island": "tahiti",
        "account_id": "outremers360",
        "logo": "https://outremers360.com/wp-content/uploads/2020/01/logo-outremers360.png",
        "categories": ["actualité", "outre-mer", "économie"],
        "feed_type": "media"
    },
    {
        "name": "Actu.fr Polynésie",
        "url": "https://actu.fr/polynesie-francaise/rss.xml",
        "island": "tahiti",
        "account_id": "actu_polynesie",
        "logo": "https://actu.fr/build/images/logo-actu.svg",
        "categories": ["actualité", "local", "société"],
        "feed_type": "media"
    },
    {
        "name": "Radio 1 Tahiti",
        "url": "https://www.radio1.pf/feed/",
        "island": "tahiti",
        "account_id": "radio1_tahiti",
        "logo": "https://www.radio1.pf/wp-content/uploads/radio1-logo.png",
        "categories": ["actualité", "radio", "musique"],
        "feed_type": "media"
    },
    {
        "name": "Tahiti Nui TV",
        "url": "https://www.tahitinuitv.pf/feed/",
        "island": "tahiti",
        "account_id": "tahiti_nui_tv",
        "logo": "https://www.tahitinuitv.pf/wp-content/uploads/tntv-logo.png",
        "categories": ["actualité", "télévision", "culture"],
        "feed_type": "media"
    },
    
    # === MÉTÉO ===
    {
        "name": "Météo France Polynésie",
        "url": "https://meteofrance.pf/rss/previsions.xml",
        "island": "tahiti",
        "account_id": "meteo_polynesie",
        "logo": "https://meteofrance.com/sites/default/files/logo-mf.svg",
        "categories": ["météo", "prévisions", "climat"],
        "feed_type": "meteo"
    },
    {
        "name": "Météo Marine Polynésie",
        "url": "https://meteofrance.pf/rss/marine.xml",
        "island": "tahiti",
        "account_id": "meteo_marine_pf",
        "logo": "https://meteofrance.com/sites/default/files/logo-mf.svg",
        "categories": ["météo", "marine", "navigation"],
        "feed_type": "meteo"
    },
    {
        "name": "Windy Tahiti",
        "url": "https://www.windy.com/rss/tahiti",
        "island": "tahiti",
        "account_id": "windy_tahiti",
        "logo": "https://www.windy.com/img/logo201802/windy-logo-full.svg",
        "categories": ["météo", "vent", "surf"],
        "feed_type": "meteo"
    },
    
    # === SURF & SPORTS NAUTIQUES ===
    {
        "name": "Surf Report Tahiti",
        "url": "https://www.surf-report.com/rss/spots/polynesie-francaise.xml",
        "island": "tahiti",
        "account_id": "surf_report_tahiti",
        "logo": "https://www.surf-report.com/images/logo-surf-report.png",
        "categories": ["surf", "sport", "vagues"],
        "feed_type": "sport_surf"
    },
    {
        "name": "Magic Seaweed Tahiti",
        "url": "https://magicseaweed.com/rss/tahiti-surf-forecast.xml",
        "island": "tahiti",
        "account_id": "msw_tahiti",
        "logo": "https://magicseaweed.com/images/logo.svg",
        "categories": ["surf", "prévisions", "vagues"],
        "feed_type": "sport_surf"
    },
    {
        "name": "Surfline Teahupo'o",
        "url": "https://www.surfline.com/rss/teahupoo",
        "island": "tahiti",
        "account_id": "surfline_teahupoo",
        "logo": "https://www.surfline.com/images/surfline-logo.svg",
        "categories": ["surf", "Teahupo'o", "compétition"],
        "feed_type": "sport_surf"
    },
    {
        "name": "Tahiti Surf Club",
        "url": "https://www.tahitisurfclub.pf/feed/",
        "island": "tahiti",
        "account_id": "tahiti_surf_club",
        "logo": "https://www.tahitisurfclub.pf/wp-content/uploads/tsc-logo.png",
        "categories": ["surf", "club", "événements"],
        "feed_type": "sport_surf"
    },
    {
        "name": "Fédération Tahitienne de Surf",
        "url": "https://www.surfingpolynesie.pf/feed/",
        "island": "tahiti",
        "account_id": "fts_polynesie",
        "logo": "https://www.surfingpolynesie.pf/wp-content/uploads/fts-logo.png",
        "categories": ["surf", "fédération", "compétition"],
        "feed_type": "sport_surf"
    },
    
    # === AUTRES SPORTS ===
    {
        "name": "Va'a News",
        "url": "https://vaanews.pf/feed/",
        "island": "tahiti",
        "account_id": "vaa_news",
        "logo": "https://vaanews.pf/wp-content/uploads/vaa-logo.png",
        "categories": ["va'a", "pirogue", "sport"],
        "feed_type": "sport"
    },
    {
        "name": "Fédération Tahitienne de Football",
        "url": "https://www.ftf.pf/feed/",
        "island": "tahiti",
        "account_id": "ftf_tahiti",
        "logo": "https://www.ftf.pf/wp-content/uploads/logo-ftf.png",
        "categories": ["football", "sport", "association"],
        "feed_type": "sport"
    },
    {
        "name": "Fédération Tahitienne de Voile",
        "url": "https://www.voile.pf/feed/",
        "island": "tahiti",
        "account_id": "ftv_tahiti",
        "logo": "https://www.voile.pf/wp-content/uploads/ftv-logo.png",
        "categories": ["voile", "sport", "nautique"],
        "feed_type": "sport"
    },
    {
        "name": "Fédération Polynésienne de Natation",
        "url": "https://www.natation.pf/feed/",
        "island": "tahiti",
        "account_id": "fpn_tahiti",
        "logo": "https://www.natation.pf/wp-content/uploads/fpn-logo.png",
        "categories": ["natation", "sport", "piscine"],
        "feed_type": "sport"
    },
    
    # === CULTURE & TRADITIONS ===
    {
        "name": "Heiva i Tahiti",
        "url": "https://www.heiva.org/feed/",
        "island": "tahiti",
        "account_id": "heiva_tahiti",
        "logo": "https://www.heiva.org/wp-content/uploads/heiva-logo.png",
        "categories": ["culture", "danse", "tradition"],
        "feed_type": "culture"
    },
    {
        "name": "Te Fare Tauhiti Nui",
        "url": "https://www.maisondelaculture.pf/feed/",
        "island": "tahiti",
        "account_id": "maison_culture",
        "logo": "https://www.maisondelaculture.pf/wp-content/uploads/tftn-logo.png",
        "categories": ["culture", "événements", "spectacles"],
        "feed_type": "culture"
    },
    {
        "name": "Musée de Tahiti",
        "url": "https://www.museetahiti.pf/feed/",
        "island": "tahiti",
        "account_id": "musee_tahiti",
        "logo": "https://www.museetahiti.pf/wp-content/uploads/musee-logo.png",
        "categories": ["culture", "musée", "histoire"],
        "feed_type": "culture"
    },
    {
        "name": "Conservatoire Artistique",
        "url": "https://www.conservatoire.pf/feed/",
        "island": "tahiti",
        "account_id": "conservatoire_pf",
        "logo": "https://www.conservatoire.pf/wp-content/uploads/capf-logo.png",
        "categories": ["culture", "musique", "danse"],
        "feed_type": "culture"
    },
    {
        "name": "Académie Tahitienne",
        "url": "https://www.farevanaa.pf/feed/",
        "island": "tahiti",
        "account_id": "academie_tahitienne",
        "logo": "https://www.farevanaa.pf/wp-content/uploads/fv-logo.png",
        "categories": ["culture", "langue", "reo tahiti"],
        "feed_type": "culture"
    },
    {
        "name": "Festival du Film Océanien",
        "url": "https://www.fifo-tahiti.com/feed/",
        "island": "tahiti",
        "account_id": "fifo_tahiti",
        "logo": "https://www.fifo-tahiti.com/wp-content/uploads/fifo-logo.png",
        "categories": ["culture", "cinéma", "festival"],
        "feed_type": "culture"
    },
    
    # === OFFRES D'EMPLOI ===
    {
        "name": "Emploi Polynésie",
        "url": "https://www.emploi.pf/feed/",
        "island": "tahiti",
        "account_id": "emploi_polynesie",
        "logo": "https://www.emploi.pf/wp-content/uploads/emploi-logo.png",
        "categories": ["emploi", "travail", "recrutement"],
        "feed_type": "emploi"
    },
    {
        "name": "SEFI Polynésie",
        "url": "https://www.sefi.pf/feed/",
        "island": "tahiti",
        "account_id": "sefi_pf",
        "logo": "https://www.sefi.pf/wp-content/uploads/sefi-logo.png",
        "categories": ["emploi", "formation", "insertion"],
        "feed_type": "emploi"
    },
    {
        "name": "Pôle Emploi Tahiti",
        "url": "https://www.pole-emploi.pf/feed/",
        "island": "tahiti",
        "account_id": "pole_emploi_tahiti",
        "logo": "https://www.pole-emploi.pf/wp-content/uploads/pe-logo.png",
        "categories": ["emploi", "chômage", "aide"],
        "feed_type": "emploi"
    },
    {
        "name": "LinkedIn Tahiti",
        "url": "https://www.linkedin.com/jobs/tahiti-jobs-rss",
        "island": "tahiti",
        "account_id": "linkedin_tahiti",
        "logo": "https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Logo.svg",
        "categories": ["emploi", "professionnel", "réseau"],
        "feed_type": "emploi"
    },
    {
        "name": "Indeed Polynésie",
        "url": "https://fr.indeed.com/rss?q=&l=Polyn%C3%A9sie+fran%C3%A7aise",
        "island": "tahiti",
        "account_id": "indeed_polynesie",
        "logo": "https://www.indeed.com/images/indeed-logo.svg",
        "categories": ["emploi", "offres", "international"],
        "feed_type": "emploi"
    },
    
    # === TOURISME ===
    {
        "name": "Air Tahiti Magazine",
        "url": "https://www.airtahitimagazine.com/feed/",
        "island": "tahiti",
        "account_id": "airtahiti_mag",
        "logo": "https://www.airtahitimagazine.com/wp-content/uploads/logo-atm.png",
        "categories": ["tourisme", "voyage", "culture"],
        "feed_type": "tourisme"
    },
    {
        "name": "Tahiti Tourisme",
        "url": "https://tahititourisme.pf/feed/",
        "island": "tahiti",
        "account_id": "tahiti_tourisme",
        "logo": "https://tahititourisme.pf/wp-content/uploads/logo-tt.png",
        "categories": ["tourisme", "voyage", "îles"],
        "feed_type": "tourisme"
    },
    
    # === ENVIRONNEMENT ===
    {
        "name": "Environnement Polynésie",
        "url": "https://www.environnement.pf/feed/",
        "island": "tahiti",
        "account_id": "environnement_pf",
        "logo": "https://www.environnement.pf/wp-content/uploads/env-logo.png",
        "categories": ["environnement", "écologie", "nature"],
        "feed_type": "environnement"
    },
    {
        "name": "Te Mana o te Moana",
        "url": "https://www.temanaotemoana.org/feed/",
        "island": "tahiti",
        "account_id": "te_mana_moana",
        "logo": "https://www.temanaotemoana.org/wp-content/uploads/tmm-logo.png",
        "categories": ["environnement", "océan", "protection"],
        "feed_type": "environnement"
    }
]

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
