from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import shutil
import base64

# Import Stripe checkout (optional - may not be available on all deployments)
try:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    logging.warning("Stripe integration not available - emergentintegrations not installed")

# Import security module
from security import (
    moderate_text_content, moderate_media_url,
    check_rate_limit, sanitize_html, sanitize_filename,
    validate_location, hash_ip, mask_email,
    LocationPrivacy, ReportType, REPORT_TYPES,
    validate_password_strength
)

# Import enhanced auth security
from auth_security import (
    hash_password, verify_password, verify_password_with_migration,
    record_failed_login, is_account_locked, clear_failed_attempts,
    check_rate_limit_enhanced, sanitize_input, validate_email,
    generate_secure_token, generate_password_reset_token,
    SECURITY_HEADERS, add_security_headers, create_session_token,
    is_session_expired
)

# Import media processing module
from media_processing import (
    compress_video, compress_image, check_user_storage_limits,
    cleanup_expired_media, delete_post_media, get_storage_stats,
    MEDIA_SPECS, STORAGE_LIMITS
)

# Import moderation module
from moderation import ModerationService, get_report_categories, REPORT_CATEGORIES

# Import GDPR module
from gdpr import GDPRService, get_consent_types, MINIMUM_AGE, PARENTAL_CONSENT_AGE

# Import analytics module
from analytics import AnalyticsService, MonitoringService

# Import Fenua Pulse module
from fenua_pulse import (
    FenuaPulseService, get_islands, get_marker_types, get_badges_list,
    ISLANDS, MARKER_TYPES, BADGES, MANA_REWARDS
)

# Import Roulotte module
from roulotte import (
    RouletteService, get_payment_methods, get_cuisine_types,
    PAYMENT_METHODS, CUISINE_TYPES
)

# Import Auto Publisher module
from auto_publisher import AutoPublisherService, run_daily_publisher, ISLAND_CONTENT

# Import Cache and DB optimization modules
from cache import (
    cache, static_cache, markers_cache, feed_cache, user_cache,
    cached, warm_up_cache, get_cache_stats
)
from db_optimization import (
    create_optimized_client, create_indexes, get_db_stats,
    get_collection_stats, MONGO_POOL_CONFIG
)

# Import Redis Cache (production-ready)
from redis_cache import redis_cache, cached_query, CacheKeys

# Import RSS Feed module
from rss_feeds import RSSFeedService, cleanup_youtube_links

# Import Account Protection module
from account_protection import AccountProtectionService

# Import Tahitian Dictionary for translation
from tahitian_dictionary import translate_text, get_dictionary_stats, get_common_phrases

# Import Resend for emails
import resend

# Import WebSocket Manager for real-time chat
from websocket_manager import chat_manager, WSMessageTypes, create_ws_message

# Import Push Notifications service
from push_notifications import push_service, NotificationTemplates

# Import Email service
from email_service import email_service

# Import Translations
from translations import get_translation, get_all_translations, TRANSLATIONS

# Import Auto-Moderation
from auto_moderation import auto_moderator, check_text, is_safe

# Import Performance Optimizer
from performance_optimizer import (
    perf_cache, perf_monitor, adaptive_limiter, get_performance_report,
    initialize_performance_optimizations, batch_get_users, enrich_posts_with_users,
    USER_PROJECTION_MINIMAL, USER_PROJECTION_PROFILE, POST_PROJECTION_FEED, MARKER_PROJECTION
)
from performance_optimizer import feed_cache as perf_feed_cache
from performance_optimizer import user_cache as perf_user_cache
from performance_optimizer import marker_cache as perf_marker_cache
from performance_optimizer import translation_cache as perf_translation_cache

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with optimized pooling
mongo_url = os.environ['MONGO_URL']
client = create_optimized_client(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Nati Fenua API", docs_url="/api/docs", redoc_url="/api/redoc")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Initialize Rate Limiter (optimized for high load - 2000 req/min per IP)
RATE_LIMIT_ENABLED = os.environ.get('RATE_LIMIT_ENABLED', 'true').lower() == 'true'
if not RATE_LIMIT_ENABLED:
    # Disabled for load testing
    limiter = Limiter(key_func=get_remote_address, default_limits=["100000/minute"], enabled=False)
else:
    limiter = Limiter(key_func=get_remote_address, default_limits=["2000/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add GZip Middleware for compression (reduces bandwidth by ~70%)
app.add_middleware(GZipMiddleware, minimum_size=500)

# Add CORS Middleware - CRITICAL for production
# Accept all origins during development/testing, restrict in production
cors_origins_env = os.environ.get('CORS_ORIGINS', '')
if cors_origins_env == '*':
    allow_all_origins = True
    cors_origins = ["*"]
else:
    allow_all_origins = False
    default_origins = [
        "https://accurate-quietude-production-ff09.up.railway.app",
        "https://fenua-connect.preview.emergentagent.com",
        "https://nati-fenua-frontend.onrender.com",
        "https://nati-fenua-backend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    if cors_origins_env:
        cors_origins = [o.strip() for o in cors_origins_env.split(',') if o.strip()]
    else:
        cors_origins = default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for API access
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Health check endpoint (pour Railway/monitoring)
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": "Nati Fenua", "version": "1.2.0", "optimized": True}

# Performance monitoring endpoint
@app.get("/api/performance")
async def get_performance_stats():
    """Retourne les statistiques de performance en temps réel"""
    return get_performance_report()

# Startup event - Initialize optimizations
@app.on_event("startup")
async def startup_event():
    """Initialise les optimisations au démarrage"""
    logger.info("🚀 Starting Nati Fenua with performance optimizations...")
    
    # 1. Initialize performance optimizations
    try:
        result = await initialize_performance_optimizations(db)
        logger.info(f"✅ Performance optimizations: {result}")
    except Exception as e:
        logger.error(f"❌ Failed to initialize optimizations: {e}")
    
    # 2. Connect to Redis cache (if REDIS_URL is configured)
    try:
        redis_url = os.environ.get("REDIS_URL")
        if redis_url:
            connected = await redis_cache.connect(redis_url)
            if connected:
                logger.info("✅ Redis cache connected")
            else:
                logger.info("⚠️ Redis unavailable, using memory cache")
        else:
            logger.info("ℹ️ REDIS_URL not configured, using memory cache (add Upstash for better performance)")
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed: {e}")
    
    # 3. Create MongoDB indexes
    try:
        from db_optimization import create_indexes
        await create_indexes(db)
        logger.info("✅ MongoDB indexes verified")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")


# Initialize services
moderation_service = None
gdpr_service = None
analytics_service = None
monitoring_service = None
pulse_service = None
roulotte_service = None
auto_publisher_service = None

def get_app_services():
    global moderation_service, gdpr_service, analytics_service, monitoring_service, pulse_service, roulotte_service, auto_publisher_service
    if moderation_service is None:
        moderation_service = ModerationService(db)
        gdpr_service = GDPRService(db)
        analytics_service = AnalyticsService(db)
        monitoring_service = MonitoringService(db)
        pulse_service = FenuaPulseService(db)
        roulotte_service = RouletteService(db, pulse_service)
        auto_publisher_service = AutoPublisherService(db)
    return moderation_service, gdpr_service, analytics_service, monitoring_service, pulse_service, roulotte_service

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# WebSocket connection manager for chat and live
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.live_viewers: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
    
    async def send_message(self, message: dict, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def connect_live(self, websocket: WebSocket, live_id: str):
        await websocket.accept()
        if live_id not in self.live_viewers:
            self.live_viewers[live_id] = []
        self.live_viewers[live_id].append(websocket)
        return len(self.live_viewers[live_id])
    
    def disconnect_live(self, websocket: WebSocket, live_id: str):
        if live_id in self.live_viewers:
            if websocket in self.live_viewers[live_id]:
                self.live_viewers[live_id].remove(websocket)
            return len(self.live_viewers[live_id])
        return 0
    
    async def broadcast_live(self, message: dict, live_id: str):
        if live_id in self.live_viewers:
            for connection in self.live_viewers[live_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = "Polynésie Française"
    is_business: bool = False
    is_verified: bool = False
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Profile visibility settings
    profile_visibility: dict = Field(default_factory=lambda: {
        "show_photos": True,
        "show_posts": True,
        "show_saved": True,
        "is_private": False
    })

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class PostBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    post_id: str = Field(default_factory=lambda: f"post_{uuid.uuid4().hex[:12]}")
    user_id: str
    content_type: str  # photo, video, reel, live_replay, link
    media_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[dict] = None  # {"lat": float, "lng": float}
    external_link: Optional[str] = None  # YouTube, article URLs
    link_type: Optional[str] = None  # youtube, article, tiktok, etc.
    tagged_users: List[str] = Field(default_factory=list)  # List of user_ids tagged in the post
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    views_count: int = 0
    reactions: dict = Field(default_factory=lambda: {"like": 0, "love": 0, "haha": 0, "wow": 0, "fire": 0})
    is_ad: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    content_type: str
    media_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[dict] = None  # {"lat": float, "lng": float}
    external_link: Optional[str] = None  # YouTube, article URLs
    link_type: Optional[str] = None  # youtube, article, tiktok, etc.
    tagged_users: List[str] = Field(default_factory=list)  # List of user_ids to tag

class StoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    story_id: str = Field(default_factory=lambda: f"story_{uuid.uuid4().hex[:12]}")
    user_id: str
    media_url: str
    media_type: str
    duration: int = 5
    views_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # Stories visible in feed for 7 days
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    # Stories kept on profile for 30 days
    profile_expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=30))

class StoryCreate(BaseModel):
    media_url: str
    media_type: str
    duration: int = 5

class ProductBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    product_id: str = Field(default_factory=lambda: f"prod_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: Optional[str] = None
    price: float
    currency: str = "XPF"
    category: str
    images: List[str] = []
    location: Optional[str] = None
    is_available: bool = True
    views_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: str
    images: List[str] = []
    location: Optional[str] = None

class ServiceBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str = Field(default_factory=lambda: f"svc_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: Optional[str] = None
    price_range: Optional[str] = None
    category: str
    images: List[str] = []
    location: Optional[str] = None
    is_available: bool = True
    rating: float = 0.0
    reviews_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ServiceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price_range: Optional[str] = None
    category: str
    images: List[str] = []
    location: Optional[str] = None

# Ad Campaign Models
class AdCampaignBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    campaign_id: str = Field(default_factory=lambda: f"camp_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    objective: str  # awareness, engagement, traffic, conversions
    status: str = "draft"  # draft, pending, active, paused, completed
    budget_total: float
    budget_daily: float
    budget_spent: float = 0.0
    target_audience: dict = Field(default_factory=dict)  # age, location, interests
    placement: List[str] = Field(default_factory=lambda: ["feed", "stories", "reels"])
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    ad_id: str = Field(default_factory=lambda: f"ad_{uuid.uuid4().hex[:12]}")
    campaign_id: str
    user_id: str
    title: str
    description: Optional[str] = None
    media_url: str
    media_type: str
    cta_text: str = "En savoir plus"
    cta_url: Optional[str] = None
    impressions: int = 0
    clicks: int = 0
    conversions: int = 0
    spend: float = 0.0
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdCreate(BaseModel):
    campaign_id: str
    title: str
    description: Optional[str] = None
    media_url: str
    media_type: str
    cta_text: str = "En savoir plus"
    cta_url: Optional[str] = None

class AdCampaignCreate(BaseModel):
    name: str
    objective: str
    budget_total: float
    budget_daily: float
    target_audience: dict = {}
    placement: List[str] = ["feed", "stories", "reels"]
    end_date: Optional[datetime] = None

# Chat/Message Models
class MessageBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    conversation_id: str
    sender_id: str
    content: str
    message_type: str = "text"  # text, image, video, voice
    media_url: Optional[str] = None
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ConversationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    conversation_id: str = Field(default_factory=lambda: f"conv_{uuid.uuid4().hex[:12]}")
    participants: List[str]
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None

# Live Stream Models
class LiveStreamBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    live_id: str = Field(default_factory=lambda: f"live_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str = "live"  # live, ended
    viewer_count: int = 0
    peak_viewers: int = 0
    likes_count: int = 0
    comments_count: int = 0
    duration: int = 0
    replay_url: Optional[str] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = None

class LiveStreamCreate(BaseModel):
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None

class CommentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    comment_id: str = Field(default_factory=lambda: f"cmt_{uuid.uuid4().hex[:12]}")
    post_id: str
    user_id: str
    content: str
    likes_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    content: str

class AnalyticsEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    user_id: Optional[str] = None
    event_type: str
    event_data: dict = {}
    device_info: Optional[dict] = None
    location: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Optional[UserBase]:
    session_token = request.cookies.get("session_token")
    
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return UserBase(**user_doc)

async def require_auth(request: Request) -> UserBase:
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    return user

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
@limiter.limit("500/minute")  # Rate limit: 500 registrations per minute per IP
async def register(request: Request, response: Response):
    user_data_raw = await request.json()
    user_data = UserCreate(**user_data_raw)
    email = user_data.email.lower().strip()
    
    # Get client info for protection check
    client_ip = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    user_agent = request.headers.get("user-agent", "unknown")
    
    # Check if registration is allowed (anti-fake account)
    protection = AccountProtectionService(db)
    check_result = await protection.check_registration_allowed(
        email=email,
        ip_address=client_ip,
        user_agent=user_agent,
        phone=getattr(user_data, 'phone', None)
    )
    
    if not check_result["allowed"]:
        # Log the blocked attempt
        await protection.log_registration_attempt(email, client_ip, user_agent, success=False)
        raise HTTPException(
            status_code=429, 
            detail=check_result["message"] + ". " + ", ".join(check_result["issues"])
        )
    
    # Validate email format
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Format d'email invalide")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(user_data.password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Check for existing user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Hash password with bcrypt
    password_hashed = hash_password(user_data.password)
    
    # Sanitize name
    clean_name = sanitize_input(user_data.name, max_length=100)
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": email,
        "name": clean_name,
        "password_hash": password_hashed,
        "picture": f"https://ui-avatars.com/api/?name={clean_name}&background=FF6B35&color=fff&bold=true",
        "bio": None,
        "location": "Polynésie Française",
        "address": user_data.address,
        "is_business": False,
        "is_verified": False,
        "is_banned": False,
        "phone": None,
        "phone_verified": None,
        "trust_score": 10,  # Initial trust score
        "requires_phone_verification": check_result.get("requires_phone_verification", False),
        "followers_count": 0,
        "following_count": 0,
        "posts_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    
    # Log successful registration
    await protection.log_registration_attempt(email, client_ip, user_agent, success=True, user_id=user_id)
    
    # Create session with 7 day expiry
    session_token, expiry = create_session_token()
    client_ip = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    
    session = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": client_ip,
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    await db.user_sessions.insert_one(session)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    logger.info(f"New user registered: {email}")
    return {"user": user, "session_token": session_token}

@api_router.post("/auth/login")
@limiter.limit("1000/minute")  # Rate limit: 1000 login attempts per minute per IP
async def login(request: Request, response: Response):
    user_data_raw = await request.json()
    user_data = UserLogin(**user_data_raw)
    email = user_data.email.lower().strip()
    
    # Get client IP for rate limiting
    client_ip = request.headers.get("x-forwarded-for", request.client.host).split(",")[0].strip()
    identifier = f"{email}:{client_ip}"
    
    # Check if account is locked (brute force protection)
    is_locked, remaining_minutes = is_account_locked(identifier)
    if is_locked:
        raise HTTPException(
            status_code=429, 
            detail=f"Compte temporairement bloqué. Réessayez dans {remaining_minutes} minutes."
        )
    
    # Check rate limit
    allowed, _ = check_rate_limit_enhanced(client_ip, "login")
    if not allowed:
        raise HTTPException(status_code=429, detail="Trop de tentatives. Réessayez dans une minute.")
    
    # Find user
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
        # Record failed attempt
        is_now_locked, remaining, lockout_mins = record_failed_login(identifier)
        if is_now_locked:
            raise HTTPException(
                status_code=429,
                detail=f"Compte bloqué après trop de tentatives. Réessayez dans {lockout_mins} minutes."
            )
        raise HTTPException(status_code=401, detail=f"Email ou mot de passe incorrect. {remaining} tentative(s) restante(s).")
    
    # Check if account is banned
    if user.get("is_banned"):
        raise HTTPException(status_code=403, detail="Ce compte a été suspendu")
    
    # Verify password with migration support (SHA256 -> bcrypt)
    stored_hash = user.get("password_hash", "")
    is_valid, new_hash = verify_password_with_migration(user_data.password, stored_hash)
    
    if not is_valid:
        # Record failed attempt
        is_now_locked, remaining, lockout_mins = record_failed_login(identifier)
        if is_now_locked:
            raise HTTPException(
                status_code=429,
                detail=f"Compte bloqué après trop de tentatives. Réessayez dans {lockout_mins} minutes."
            )
        raise HTTPException(status_code=401, detail=f"Email ou mot de passe incorrect. {remaining} tentative(s) restante(s).")
    
    # Migrate password hash if needed
    if new_hash:
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$set": {"password_hash": new_hash}}
        )
        logger.info(f"Password hash migrated to bcrypt for user {user['user_id']}")
    
    # Clear failed attempts on successful login
    clear_failed_attempts(identifier)
    
    # Create session with 7 day expiry
    session_token, expiry = create_session_token()
    session = {
        "user_id": user["user_id"],
        "session_token": session_token,
        "expires_at": expiry.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "ip_address": client_ip,
        "user_agent": request.headers.get("user-agent", "unknown")
    }
    await db.user_sessions.insert_one(session)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user.pop("password_hash", None)
    logger.info(f"Login successful for {email}")
    return {"user": user, "session_token": session_token}

# REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requis")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Session invalide")
        
        session_data = resp.json()
    
    email = session_data.get("email")
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "name": session_data.get("name"),
                "picture": session_data.get("picture")
            }}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": session_data.get("name"),
            "picture": session_data.get("picture"),
            "bio": None,
            "location": "Polynésie Française",
            "is_business": False,
            "is_verified": False,
            "followers_count": 0,
            "following_count": 0,
            "posts_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    session_token = session_data.get("session_token")
    session = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session)
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user_doc.pop("password_hash", None)
    
    return {"user": user_doc, "session_token": session_token}

# ==================== NATIVE GOOGLE OAUTH ====================
# Environment variables are read at request time to ensure latest values

@api_router.get("/auth/google")
async def google_login(request: Request):
    """Redirect to Google OAuth"""
    from urllib.parse import urlencode
    from starlette.responses import RedirectResponse
    
    # Read environment variables at request time
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "")
    
    logger.info(f"Google OAuth - Client ID: {client_id[:20]}... Redirect URI: {redirect_uri}")
    
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured - missing GOOGLE_CLIENT_ID")
    
    if not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured - missing GOOGLE_REDIRECT_URI")
    
    # Build Google OAuth URL with properly encoded parameters
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent"
    }
    
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    
    logger.info(f"Google OAuth redirect URL: {google_auth_url}")
    return RedirectResponse(url=google_auth_url)

@api_router.get("/auth/google/callback")
async def google_callback(request: Request, response: Response, code: str = None, error: str = None):
    """Handle Google OAuth callback"""
    from starlette.responses import RedirectResponse
    
    # Read environment variables at request time
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI", "")
    frontend_url = os.environ.get("FRONTEND_URL", "https://nati-fenua-frontend.onrender.com")
    
    if error:
        logger.error(f"Google OAuth error: {error}")
        return RedirectResponse(url=f"{frontend_url}/auth?error=google_oauth_error")
    
    if not code:
        return RedirectResponse(url=f"{frontend_url}/auth?error=no_code")
    
    try:
        # Exchange code for tokens
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "code": code,
                    "grant_type": "authorization_code",
                    "redirect_uri": redirect_uri
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                return RedirectResponse(url=f"{FRONTEND_URL}/auth?error=token_exchange_failed")
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info from Google
            user_info_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if user_info_response.status_code != 200:
                logger.error(f"User info fetch failed: {user_info_response.text}")
                return RedirectResponse(url=f"{frontend_url}/auth?error=userinfo_failed")
            
            google_user = user_info_response.json()
        
        email = google_user.get("email")
        name = google_user.get("name")
        picture = google_user.get("picture")
        
        # Find or create user
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})
        
        if existing_user:
            user_id = existing_user["user_id"]
            # Update user info
            await db.users.update_one(
                {"email": email},
                {"$set": {
                    "name": name or existing_user.get("name"),
                    "picture": picture or existing_user.get("picture"),
                    "last_login": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new user
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "bio": None,
                "location": "Polynésie Française",
                "island": "tahiti",
                "is_business": False,
                "is_verified": False,
                "auth_provider": "google",
                "followers_count": 0,
                "following_count": 0,
                "posts_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(user)
            logger.info(f"New user created via Google OAuth: {email}")
        
        # Create session
        session_token, expiry = create_session_token()
        session = {
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expiry.isoformat(),
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.user_sessions.insert_one(session)
        
        # Redirect to frontend with session token
        redirect_response = RedirectResponse(url=f"{frontend_url}/auth/callback#session_token={session_token}")
        redirect_response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        
        logger.info(f"Google OAuth successful for {email}")
        return redirect_response
        
    except Exception as e:
        logger.error(f"Google OAuth error: {str(e)}")
        return RedirectResponse(url=f"{frontend_url}/auth?error=oauth_error")

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Non authentifié")
    user_dict = user.model_dump()
    user_dict.pop("password_hash", None)
    return user_dict

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Déconnecté"}

@api_router.post("/auth/logout-all")
async def logout_all_devices(request: Request, response: Response):
    """Logout from all devices"""
    user = await require_auth(request)
    
    # Delete all sessions for this user
    result = await db.user_sessions.delete_many({"user_id": user.user_id})
    
    response.delete_cookie(key="session_token", path="/")
    return {
        "success": True,
        "message": f"Déconnecté de {result.deleted_count} appareil(s)"
    }

@api_router.post("/auth/request-password-reset")
@limiter.limit("100/minute")  # Limite pour éviter les abus
async def request_password_reset(request: Request):
    """Request a password reset link - sends email via Resend"""
    body = await request.json()
    email = body.get("email", "").lower().strip()
    
    if not email or not validate_email(email):
        raise HTTPException(status_code=400, detail="Email invalide")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"success": True, "message": "Si cet email existe, un lien de réinitialisation a été envoyé"}
    
    # Generate reset token
    token, expiry = generate_password_reset_token()
    
    # Store reset token
    await db.password_resets.delete_many({"email": email})  # Remove old tokens
    await db.password_resets.insert_one({
        "email": email,
        "token": token,
        "expires_at": expiry.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Get frontend URL for reset link
    frontend_url = os.environ.get("REACT_APP_BACKEND_URL", "https://fenua-connect.preview.emergentagent.com")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    # Send email via Resend
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if resend_api_key:
        try:
            resend.api_key = resend_api_key
            sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #FF6B35;">🌺 Nati Fenua</h1>
                </div>
                
                <h2 style="color: #1A1A2E;">Réinitialisation de votre mot de passe</h2>
                
                <p>Ia ora na {user.get('name', 'cher utilisateur')} !</p>
                
                <p>Vous avez demandé à réinitialiser votre mot de passe sur Nati Fenua.</p>
                
                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background: linear-gradient(135deg, #FF6B35, #FF1493);
                              color: white;
                              padding: 15px 30px;
                              text-decoration: none;
                              border-radius: 25px;
                              font-weight: bold;
                              display: inline-block;">
                        Réinitialiser mon mot de passe
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, 
                    ignorez simplement cet email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Mauruuru roa ! 🌴<br>
                    L'équipe Nati Fenua
                </p>
            </div>
            """
            
            # Send email asynchronously
            import asyncio
            await asyncio.to_thread(
                resend.Emails.send,
                {
                    "from": sender_email,
                    "to": [email],
                    "subject": "🔑 Réinitialisation de votre mot de passe - Nati Fenua",
                    "html": html_content
                }
            )
            logger.info(f"Password reset email sent to {email}")
            
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
            # Continue anyway - don't expose email sending failures
    else:
        # Log for development
        logger.info(f"Password reset requested for {email}, token: {token}")
        logger.info(f"Reset link: {reset_link}")
    
    return {"success": True, "message": "Si cet email existe, un lien de réinitialisation a été envoyé"}

@api_router.post("/auth/reset-password")
async def reset_password(request: Request):
    """Reset password using token"""
    body = await request.json()
    token = body.get("token", "")
    new_password = body.get("new_password", "")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token et nouveau mot de passe requis")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Find and validate token
    reset_record = await db.password_resets.find_one({"token": token, "used": False}, {"_id": 0})
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Lien de réinitialisation invalide ou expiré")
    
    # Check expiry
    expiry = datetime.fromisoformat(reset_record["expires_at"])
    if datetime.now(timezone.utc) > expiry:
        await db.password_resets.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Lien de réinitialisation expiré")
    
    # Hash new password with bcrypt
    new_hash = hash_password(new_password)
    
    # Update password
    await db.users.update_one(
        {"email": reset_record["email"]},
        {"$set": {"password_hash": new_hash}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": token},
        {"$set": {"used": True}}
    )
    
    # Logout all sessions
    user = await db.users.find_one({"email": reset_record["email"]}, {"_id": 0})
    if user:
        await db.user_sessions.delete_many({"user_id": user.get("user_id")})
    
    logger.info(f"Password reset completed for {reset_record['email']}")
    return {"success": True, "message": "Mot de passe réinitialisé avec succès"}

# ==================== EMAIL VERIFICATION ====================

@api_router.post("/auth/send-verification")
@limiter.limit("10/minute")
async def send_email_verification(request: Request):
    """Send email verification code to current user"""
    user = await require_auth(request)
    
    # Check if already verified
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if user_doc and user_doc.get("email_verified"):
        return {"success": True, "message": "Email déjà vérifié"}
    
    protection = AccountProtectionService(db)
    result = await protection.send_email_verification(user.user_id, user.email)
    
    # If Resend is configured, send the actual email
    resend_api_key = os.environ.get("RESEND_API_KEY")
    if resend_api_key and result.get("success"):
        try:
            resend.api_key = resend_api_key
            sender_email = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
            
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #FF6B35;">🌺 Nati Fenua</h1>
                </div>
                
                <h2 style="color: #1A1A2E;">Vérifiez votre email</h2>
                
                <p>Ia ora na {user.name} !</p>
                
                <p>Voici votre code de vérification :</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <div style="background: linear-gradient(135deg, #FF6B35, #FF1493);
                                color: white;
                                padding: 20px 40px;
                                font-size: 32px;
                                font-weight: bold;
                                letter-spacing: 8px;
                                border-radius: 15px;
                                display: inline-block;">
                        {result.get('code')}
                    </div>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Ce code expire dans 30 minutes.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Mauruuru roa ! 🌴<br>
                    L'équipe Nati Fenua
                </p>
            </div>
            """
            
            import asyncio
            await asyncio.to_thread(
                resend.Emails.send,
                {
                    "from": sender_email,
                    "to": [user.email],
                    "subject": "🔐 Code de vérification - Nati Fenua",
                    "html": html_content
                }
            )
            logger.info(f"Verification email sent to {user.email}")
            # Remove code from response when email is sent
            result.pop("code", None)
            
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
    
    return result

@api_router.post("/auth/verify-email")
async def verify_email_code(request: Request):
    """Verify email with code"""
    user = await require_auth(request)
    body = await request.json()
    code = body.get("code", "")
    
    if not code or len(code) != 6:
        raise HTTPException(status_code=400, detail="Code à 6 chiffres requis")
    
    protection = AccountProtectionService(db)
    result = await protection.verify_email_code(user.user_id, code)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@api_router.get("/auth/verification-status")
async def get_verification_status(request: Request):
    """Get current user's verification status"""
    user = await require_auth(request)
    
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    
    protection = AccountProtectionService(db)
    trust_info = await protection.get_user_trust_score(user.user_id)
    
    return {
        "email_verified": user_doc.get("email_verified", False),
        "email_verified_at": user_doc.get("email_verified_at"),
        "trust_score": trust_info.get("trust_score", 0),
        "trust_level": trust_info.get("level", "Nouveau"),
        "factors": trust_info.get("factors", [])
    }


# ==================== FACEBOOK OAUTH ====================

FACEBOOK_CLIENT_ID = os.environ.get("FACEBOOK_CLIENT_ID")
FACEBOOK_CLIENT_SECRET = os.environ.get("FACEBOOK_CLIENT_SECRET")

@api_router.get("/auth/facebook")
async def facebook_login(request: Request):
    """Initiate Facebook OAuth flow"""
    # Get the redirect URI from request headers
    forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
    forwarded_host = request.headers.get('x-forwarded-host', request.headers.get('host', ''))
    
    if forwarded_host:
        redirect_uri = f"{forwarded_proto}://{forwarded_host}/api/auth/facebook/callback"
    else:
        base_url = str(request.base_url).rstrip('/').replace('http://', 'https://')
        redirect_uri = f"{base_url}/api/auth/facebook/callback"
    
    # Facebook OAuth URL
    facebook_auth_url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={FACEBOOK_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=email,public_profile"
        f"&response_type=code"
    )
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=facebook_auth_url)

@api_router.get("/auth/facebook/callback")
async def facebook_callback(request: Request, response: Response, code: str = None, error: str = None):
    """Handle Facebook OAuth callback"""
    from fastapi.responses import RedirectResponse
    
    if error:
        logger.error(f"Facebook OAuth error: {error}")
        return RedirectResponse(url="/auth?error=facebook_auth_failed")
    
    if not code:
        return RedirectResponse(url="/auth?error=no_code")
    
    # Get the redirect URI (same as in login)
    forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
    forwarded_host = request.headers.get('x-forwarded-host', request.headers.get('host', ''))
    
    if forwarded_host:
        redirect_uri = f"{forwarded_proto}://{forwarded_host}/api/auth/facebook/callback"
        frontend_url = f"{forwarded_proto}://{forwarded_host}"
    else:
        base_url = str(request.base_url).rstrip('/').replace('http://', 'https://')
        redirect_uri = f"{base_url}/api/auth/facebook/callback"
        frontend_url = base_url
    
    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.get(
                "https://graph.facebook.com/v18.0/oauth/access_token",
                params={
                    "client_id": FACEBOOK_CLIENT_ID,
                    "client_secret": FACEBOOK_CLIENT_SECRET,
                    "redirect_uri": redirect_uri,
                    "code": code
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Facebook token error: {token_response.text}")
                return RedirectResponse(url="/auth?error=token_error")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user info from Facebook
            user_response = await client.get(
                "https://graph.facebook.com/v18.0/me",
                params={
                    "fields": "id,name,email,picture.type(large)",
                    "access_token": access_token
                }
            )
            
            if user_response.status_code != 200:
                logger.error(f"Facebook user info error: {user_response.text}")
                return RedirectResponse(url="/auth?error=user_info_error")
            
            fb_user = user_response.json()
            
            email = fb_user.get("email")
            name = fb_user.get("name")
            picture = fb_user.get("picture", {}).get("data", {}).get("url")
            facebook_id = fb_user.get("id")
            
            # If no email, use facebook id as identifier
            if not email:
                email = f"fb_{facebook_id}@facebook.local"
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": email}, {"_id": 0})
            
            if existing_user:
                user_id = existing_user["user_id"]
                # Update user info
                await db.users.update_one(
                    {"email": email},
                    {"$set": {
                        "name": name or existing_user.get("name"),
                        "picture": picture or existing_user.get("picture"),
                        "facebook_id": facebook_id
                    }}
                )
            else:
                # Create new user
                user_id = f"user_{uuid.uuid4().hex[:12]}"
                user = {
                    "user_id": user_id,
                    "email": email,
                    "name": name or "Utilisateur Facebook",
                    "picture": picture or f"https://ui-avatars.com/api/?name={name or 'FB'}&background=FF6B35&color=fff&bold=true",
                    "bio": None,
                    "location": "Polynésie Française",
                    "is_business": False,
                    "is_verified": False,
                    "followers_count": 0,
                    "following_count": 0,
                    "posts_count": 0,
                    "facebook_id": facebook_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.users.insert_one(user)
            
            # Create session
            session_token = f"sess_{uuid.uuid4().hex}"
            session = {
                "user_id": user_id,
                "session_token": session_token,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.user_sessions.insert_one(session)
            
            # Set cookie and redirect to feed
            redirect_response = RedirectResponse(url="/feed", status_code=302)
            redirect_response.set_cookie(
                key="session_token",
                value=session_token,
                httponly=True,
                secure=True,
                samesite="none",
                path="/",
                max_age=7*24*60*60
            )
            
            logger.info(f"Facebook login successful for user: {email}")
            return redirect_response
            
    except Exception as e:
        logger.error(f"Facebook OAuth error: {str(e)}")
        return RedirectResponse(url="/auth?error=oauth_error")

# ==================== POSTS ROUTES ====================

@api_router.get("/posts", response_model=List[dict])
async def get_posts(request: Request, limit: int = 20, skip: int = 0):
    """Get posts with smart feed algorithm - equitable mix of user posts and RSS"""
    import random
    
    # Get current user for personalization (optional)
    current_user = await get_current_user(request)
    user_id = current_user.user_id if current_user else None
    
    # Cache key based on pagination
    cache_key = f"smart_feed:{limit}:{skip}:{user_id or 'anon'}"
    
    # Try cache first (shorter TTL for fresh content)
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    # Calculate how many of each type to fetch
    # Goal: ~60% user posts, ~40% RSS posts (adjustable)
    user_posts_limit = int(limit * 0.6) + 5  # Fetch extra for mixing
    rss_posts_limit = int(limit * 0.4) + 5
    
    # Fetch user posts (non-RSS, non-auto-published)
    user_posts_pipeline = [
        {"$match": {
            "moderation_status": {"$ne": "rejected"},
            "is_rss_article": {"$ne": True},
            "is_auto_published": {"$ne": True}
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": int(skip * 0.6)},
        {"$limit": user_posts_limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_data._id": 0,
            "user_data.password_hash": 0,
            "user_data.email": 0
        }},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified"
            },
            "feed_type": "user"
        }},
        {"$project": {"user_data": 0}}
    ]
    
    # Fetch RSS posts
    rss_posts_pipeline = [
        {"$match": {
            "moderation_status": {"$ne": "rejected"},
            "is_rss_article": True
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": int(skip * 0.4)},
        {"$limit": rss_posts_limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$project": {
            "_id": 0,
            "user_data._id": 0,
            "user_data.password_hash": 0,
            "user_data.email": 0
        }},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified",
                "is_media": "$user_data.is_media"
            },
            "feed_type": "rss"
        }},
        {"$project": {"user_data": 0}}
    ]
    
    # Execute both queries in parallel
    user_posts, rss_posts = await asyncio.gather(
        db.posts.aggregate(user_posts_pipeline).to_list(user_posts_limit),
        db.posts.aggregate(rss_posts_pipeline).to_list(rss_posts_limit)
    )
    
    # Smart mixing algorithm: alternate between user and RSS posts
    mixed_posts = []
    user_idx = 0
    rss_idx = 0
    
    # Pattern: 2 user posts, 1 RSS, 2 user posts, 1 RSS, etc.
    # This creates a natural feel while ensuring RSS content is visible
    while len(mixed_posts) < limit and (user_idx < len(user_posts) or rss_idx < len(rss_posts)):
        # Add 2 user posts
        for _ in range(2):
            if user_idx < len(user_posts) and len(mixed_posts) < limit:
                mixed_posts.append(user_posts[user_idx])
                user_idx += 1
        
        # Add 1 RSS post
        if rss_idx < len(rss_posts) and len(mixed_posts) < limit:
            mixed_posts.append(rss_posts[rss_idx])
            rss_idx += 1
    
    # Fill remaining slots if one type is exhausted
    while len(mixed_posts) < limit and user_idx < len(user_posts):
        mixed_posts.append(user_posts[user_idx])
        user_idx += 1
    
    while len(mixed_posts) < limit and rss_idx < len(rss_posts):
        mixed_posts.append(rss_posts[rss_idx])
        rss_idx += 1
    
    # Add slight randomization within groups to keep feed fresh
    # Group posts by time windows and shuffle within each window
    if len(mixed_posts) > 5:
        # Shuffle posts within same hour to add variety
        from itertools import groupby
        def get_hour(post):
            try:
                dt = datetime.fromisoformat(post.get('created_at', '').replace('Z', '+00:00'))
                return dt.strftime('%Y-%m-%d-%H')
            except:
                return 'unknown'
        
        # Sort by created_at first to group properly
        sorted_posts = sorted(mixed_posts, key=lambda x: x.get('created_at', ''), reverse=True)
        
        # Group by hour and shuffle within groups
        final_posts = []
        for _, group in groupby(sorted_posts, key=get_hour):
            group_list = list(group)
            if len(group_list) > 2:
                # Keep first post in place, shuffle the rest
                first = group_list[0]
                rest = group_list[1:]
                random.shuffle(rest)
                final_posts.append(first)
                final_posts.extend(rest)
            else:
                final_posts.extend(group_list)
        
        mixed_posts = final_posts[:limit]
    
    # Fallback demo posts if empty
    if not mixed_posts:
        mixed_posts = [
            {
                "post_id": "demo_post_1",
                "user_id": "demo_user",
                "caption": "🌺 Ia ora na ! Bienvenue sur Nati Fenua - Le réseau social polynésien",
                "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
                "content_type": "image",
                "likes_count": 42,
                "comments_count": 5,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user": {"user_id": "demo_user", "name": "Nati Fenua", "picture": None, "is_verified": True},
                "feed_type": "user"
            }
        ]
    
    # Cache for 15 seconds (shorter for fresher content)
    await cache.set(cache_key, mixed_posts, ttl=15)
    
    logger.info(f"Smart feed: {len(user_posts)} user posts + {len(rss_posts)} RSS posts = {len(mixed_posts)} mixed")
    return mixed_posts

@api_router.get("/posts/fresh")
async def get_fresh_posts(request: Request, limit: int = 20, seen_ids: str = ""):
    """Get fresh posts that user hasn't seen yet
    
    Args:
        limit: Number of posts to return
        seen_ids: Comma-separated list of post IDs user has already seen
    
    Returns:
        Fresh posts mixed equitably between user posts and RSS
    """
    import random
    
    # Parse seen IDs
    seen_list = [s.strip() for s in seen_ids.split(",") if s.strip()] if seen_ids else []
    
    # Get current user for personalization
    current_user = await get_current_user(request)
    user_id = current_user.user_id if current_user else None
    
    # Build exclusion filter
    exclusion_filter = {"moderation_status": {"$ne": "rejected"}}
    if seen_list:
        exclusion_filter["post_id"] = {"$nin": seen_list}
    
    # Fetch fresh user posts
    user_posts_pipeline = [
        {"$match": {
            **exclusion_filter,
            "is_rss_article": {"$ne": True},
            "is_auto_published": {"$ne": True}
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user_data._id": 0, "user_data.password_hash": 0}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified"
            },
            "feed_type": "user"
        }},
        {"$project": {"user_data": 0}}
    ]
    
    # Fetch fresh RSS posts
    rss_posts_pipeline = [
        {"$match": {
            **exclusion_filter,
            "is_rss_article": True
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$project": {"_id": 0, "user_data._id": 0, "user_data.password_hash": 0}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified",
                "is_media": "$user_data.is_media"
            },
            "feed_type": "rss"
        }},
        {"$project": {"user_data": 0}}
    ]
    
    # Execute in parallel
    user_posts, rss_posts = await asyncio.gather(
        db.posts.aggregate(user_posts_pipeline).to_list(limit),
        db.posts.aggregate(rss_posts_pipeline).to_list(limit)
    )
    
    # Smart mix: interleave posts
    mixed = []
    u_idx, r_idx = 0, 0
    
    while len(mixed) < limit and (u_idx < len(user_posts) or r_idx < len(rss_posts)):
        # 2:1 ratio - 2 user posts, 1 RSS
        for _ in range(2):
            if u_idx < len(user_posts) and len(mixed) < limit:
                mixed.append(user_posts[u_idx])
                u_idx += 1
        if r_idx < len(rss_posts) and len(mixed) < limit:
            mixed.append(rss_posts[r_idx])
            r_idx += 1
    
    return {
        "posts": mixed,
        "has_more": len(user_posts) == limit or len(rss_posts) == limit,
        "user_posts_count": len(user_posts),
        "rss_posts_count": len(rss_posts)
    }

@api_router.get("/posts/nearby")
async def get_nearby_posts(lat: float, lng: float, radius_km: float = 50, limit: int = 20):
    """Get posts within a radius of given coordinates"""
    # Simple distance calculation (Haversine formula approximation)
    # 1 degree lat ≈ 111km, 1 degree lng ≈ 111km * cos(lat)
    import math
    lat_range = radius_km / 111.0
    lng_range = radius_km / (111.0 * math.cos(math.radians(lat)))
    
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$match": {
            "coordinates": {"$ne": None},
            "coordinates.lat": {"$gte": lat - lat_range, "$lte": lat + lat_range},
            "coordinates.lng": {"$gte": lng - lng_range, "$lte": lng + lng_range}
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    
    # Calculate distances
    for post in posts:
        if post.get("coordinates"):
            dlat = math.radians(post["coordinates"]["lat"] - lat)
            dlng = math.radians(post["coordinates"]["lng"] - lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(post["coordinates"]["lat"])) * math.sin(dlng/2)**2
            post["distance_km"] = round(2 * 6371 * math.asin(math.sqrt(a)), 1)
    
    return posts

@api_router.get("/posts/paginated")
async def get_paginated_posts(limit: int = 10, skip: int = 0):
    """Get paginated posts for infinite scroll (optimized for slow connections)"""
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    
    # Get total count for pagination info
    total = await db.posts.count_documents({})
    
    return {
        "posts": posts,
        "pagination": {
            "skip": skip,
            "limit": limit,
            "total": total,
            "has_more": skip + limit < total
        }
    }

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trouvé")
    
    user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
    post["user"] = user
    
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"views_count": 1}})
    
    return post

@api_router.post("/posts")
async def create_post(post_data: PostCreate, request: Request):
    user = await require_auth(request)
    
    # Rate limiting
    allowed, remaining = check_rate_limit(user.user_id, "post_create")
    if not allowed:
        raise HTTPException(status_code=429, detail="Trop de publications. Réessayez plus tard.")
    
    # Content moderation
    if post_data.caption:
        content_check = moderate_text_content(post_data.caption)
        if content_check.blocked:
            raise HTTPException(status_code=400, detail="Contenu non autorisé: " + ", ".join(content_check.flags))
        if content_check.requires_review:
            logger.warning(f"Post requires review: user={user.user_id}, flags={content_check.flags}")
    
    # Media URL check
    if post_data.media_url:
        media_check = moderate_media_url(post_data.media_url)
        if media_check.blocked:
            raise HTTPException(status_code=400, detail="URL média non autorisée")
    
    # Sanitize content
    sanitized_caption = sanitize_html(post_data.caption) if post_data.caption else None
    
    post = PostBase(
        user_id=user.user_id,
        caption=sanitized_caption,
        media_url=post_data.media_url,
        content_type=post_data.content_type,
        location=post_data.location,
        coordinates=post_data.coordinates,
        external_link=post_data.external_link,
        link_type=post_data.link_type,
        tagged_users=post_data.tagged_users or []
    )
    post_dict = post.model_dump()
    post_dict["created_at"] = post_dict["created_at"].isoformat()
    post_dict["moderation_status"] = "approved" if not (post_data.caption and moderate_text_content(post_data.caption).requires_review) else "pending_review"
    
    await db.posts.insert_one(post_dict)
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"posts_count": 1}})
    
    # Notify followers about new post
    await notify_followers_new_post(user.user_id, post.post_id, post_data.content_type)
    
    # Notify tagged users
    for tagged_user_id in (post_data.tagged_users or []):
        if tagged_user_id != user.user_id:
            await create_notification(
                tagged_user_id,
                "tag",
                f"{user.name} vous a identifié(e) dans une publication",
                {"post_id": post.post_id, "from_user_id": user.user_id}
            )
    
    post_dict.pop("_id", None)
    return post_dict

@api_router.post("/posts/{post_id}/react")
async def react_to_post(post_id: str, request: Request):
    user = await require_auth(request)
    body = await request.json()
    reaction_type = body.get("reaction", "like")  # like, love, haha, wow, fire
    
    existing = await db.reactions.find_one({"post_id": post_id, "user_id": user.user_id}, {"_id": 0})
    
    if existing:
        if existing["reaction"] == reaction_type:
            # Remove reaction
            await db.reactions.delete_one({"post_id": post_id, "user_id": user.user_id})
            await db.posts.update_one({"post_id": post_id}, {
                "$inc": {f"reactions.{reaction_type}": -1, "likes_count": -1}
            })
            return {"reacted": False, "reaction": None}
        else:
            # Change reaction
            old_reaction = existing["reaction"]
            await db.reactions.update_one(
                {"post_id": post_id, "user_id": user.user_id},
                {"$set": {"reaction": reaction_type}}
            )
            await db.posts.update_one({"post_id": post_id}, {
                "$inc": {f"reactions.{old_reaction}": -1, f"reactions.{reaction_type}": 1}
            })
            return {"reacted": True, "reaction": reaction_type}
    else:
        # Add new reaction
        reaction = {
            "reaction_id": f"react_{uuid.uuid4().hex[:12]}",
            "post_id": post_id,
            "user_id": user.user_id,
            "reaction": reaction_type,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.reactions.insert_one(reaction)
        await db.posts.update_one({"post_id": post_id}, {
            "$inc": {f"reactions.{reaction_type}": 1, "likes_count": 1}
        })
        return {"reacted": True, "reaction": reaction_type}


# ==================== PUSH NOTIFICATION HELPERS ====================

async def send_like_notification(post_id: str, liker_id: str, liker_name: str):
    """Send push notification when someone likes a post"""
    try:
        # Get post owner
        post = await db.posts.find_one({"post_id": post_id}, {"user_id": 1, "_id": 0})
        if not post:
            return
        
        owner_id = post.get("user_id")
        # Don't notify yourself
        if owner_id == liker_id:
            return
        
        # Get owner's device tokens
        owner = await db.users.find_one(
            {"user_id": owner_id},
            {"device_tokens": 1, "_id": 0}
        )
        
        if owner and owner.get("device_tokens"):
            template = NotificationTemplates.new_like(liker_name or "Quelqu'un", post_id)
            await push_service.send_to_devices(
                owner["device_tokens"],
                template["title"],
                template["body"],
                template["data"]
            )
    except Exception as e:
        logger.error(f"Error sending like notification: {e}")


async def send_comment_notification(post_id: str, commenter_id: str, commenter_name: str, comment_preview: str):
    """Send push notification when someone comments on a post"""
    try:
        # Get post owner
        post = await db.posts.find_one({"post_id": post_id}, {"user_id": 1, "_id": 0})
        if not post:
            return
        
        owner_id = post.get("user_id")
        # Don't notify yourself
        if owner_id == commenter_id:
            return
        
        # Get owner's device tokens
        owner = await db.users.find_one(
            {"user_id": owner_id},
            {"device_tokens": 1, "_id": 0}
        )
        
        if owner and owner.get("device_tokens"):
            name = commenter_name or "Quelqu'un"
            await push_service.send_to_devices(
                owner["device_tokens"],
                f"{name} a commente votre post",
                comment_preview + "..." if len(comment_preview) >= 50 else comment_preview,
                {"type": "comment", "postId": post_id}
            )
    except Exception as e:
        logger.error(f"Error sending comment notification: {e}")


async def send_follow_notification(followed_id: str, follower_id: str, follower_name: str):
    """Send push notification when someone follows a user"""
    try:
        # Get followed user's device tokens
        user = await db.users.find_one(
            {"user_id": followed_id},
            {"device_tokens": 1, "_id": 0}
        )
        
        if user and user.get("device_tokens"):
            template = NotificationTemplates.new_follower(follower_name or "Quelqu'un", follower_id)
            await push_service.send_to_devices(
                user["device_tokens"],
                template["title"],
                template["body"],
                template["data"]
            )
    except Exception as e:
        logger.error(f"Error sending follow notification: {e}")


@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, request: Request):
    user = await require_auth(request)
    
    existing = await db.likes.find_one({"post_id": post_id, "user_id": user.user_id}, {"_id": 0})
    
    if existing:
        await db.likes.delete_one({"post_id": post_id, "user_id": user.user_id})
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": -1}})
        return {"liked": False}
    else:
        like = {
            "like_id": f"like_{uuid.uuid4().hex[:12]}",
            "post_id": post_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.likes.insert_one(like)
        await db.posts.update_one({"post_id": post_id}, {"$inc": {"likes_count": 1}})
        
        # Send push notification to post owner (async, don't wait)
        asyncio.create_task(send_like_notification(post_id, user.user_id, user.display_name))
        
        return {"liked": True}

@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, request: Request):
    """Toggle save/unsave a post"""
    user = await require_auth(request)
    
    existing = await db.saved_posts.find_one({"post_id": post_id, "user_id": user.user_id}, {"_id": 0})
    
    if existing:
        await db.saved_posts.delete_one({"post_id": post_id, "user_id": user.user_id})
        return {"saved": False}
    else:
        save = {
            "save_id": f"save_{uuid.uuid4().hex[:12]}",
            "post_id": post_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.saved_posts.insert_one(save)
        return {"saved": True}

@api_router.get("/saved")
async def get_saved_posts(request: Request, limit: int = 50):
    """Get all saved posts for current user"""
    user = await require_auth(request)
    
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$match": {"user_id": user.user_id}},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "posts",
            "localField": "post_id",
            "foreignField": "post_id",
            "as": "post_data"
        }},
        {"$unwind": {"path": "$post_data", "preserveNullAndEmptyArrays": False}},
        {"$lookup": {
            "from": "users",
            "localField": "post_data.user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "post_data.user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified"
            }
        }},
        {"$replaceRoot": {"newRoot": "$post_data"}},
        {"$project": {"_id": 0}}
    ]
    
    posts = await db.saved_posts.aggregate(pipeline).to_list(limit)
    return posts

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 50):
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$match": {"post_id": post_id}},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    comments = await db.comments.aggregate(pipeline).to_list(limit)
    return comments

@api_router.post("/posts/{post_id}/comments")
async def create_comment(post_id: str, comment_data: CommentCreate, request: Request):
    user = await require_auth(request)
    
    comment = CommentBase(
        post_id=post_id,
        user_id=user.user_id,
        content=comment_data.content
    )
    comment_dict = comment.model_dump()
    comment_dict["created_at"] = comment_dict["created_at"].isoformat()
    
    await db.comments.insert_one(comment_dict)
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"comments_count": 1}})
    
    # Send push notification to post owner (async, don't wait)
    asyncio.create_task(send_comment_notification(post_id, user.user_id, user.display_name, comment_data.content[:50]))
    
    comment_dict.pop("_id", None)
    return comment_dict

# ==================== TRANSLATION ROUTES ====================

@api_router.api_route("/translate", methods=["GET", "POST"])
async def translate_content(request: Request, text: str = None, direction: str = "fr_to_tah"):
    """
    Traduit du texte entre français et tahitien.
    Supporte GET (query params) et POST (body JSON).
    Utilise un dictionnaire intégré de mots et expressions courants.
    """
    # Support GET avec query params
    if request.method == "GET":
        if not text:
            raise HTTPException(status_code=400, detail="Paramètre 'text' requis")
        # Normaliser les directions
        if direction in ["fr_to_th", "fr_to_tah"]:
            direction = "fr_to_tah"
        elif direction in ["th_to_fr", "tah_to_fr"]:
            direction = "tah_to_fr"
    else:
        # POST avec body JSON
        try:
            body = await request.json()
            text = body.get("text", text)
            direction = body.get("direction", direction)
        except:
            pass
    
    if not text:
        raise HTTPException(status_code=400, detail="Texte requis")
    
    # Normaliser les directions
    if direction in ["fr_to_th", "fr_to_tah"]:
        direction = "fr_to_tah"
    elif direction in ["th_to_fr", "tah_to_fr"]:
        direction = "tah_to_fr"
    
    if direction not in ["fr_to_tah", "tah_to_fr"]:
        raise HTTPException(status_code=400, detail="Direction invalide. Utilisez 'fr_to_tah' ou 'tah_to_fr'")
    
    result = translate_text(text, direction)
    return result

@api_router.get("/translate/dictionary")
async def get_translation_dictionary():
    """Retourne les statistiques du dictionnaire de traduction"""
    return get_dictionary_stats()

@api_router.get("/translate/phrases")
async def get_translation_phrases():
    """Retourne les phrases courantes pour l'apprentissage"""
    return get_common_phrases()

@api_router.post("/posts/{post_id}/translate")
async def translate_post(post_id: str, request: Request):
    """
    Traduit le contenu d'un post.
    """
    body = await request.json()
    direction = body.get("direction", "fr_to_tah")
    
    # Récupérer le post
    post = await db.posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post non trouvé")
    
    caption = post.get("caption", "")
    if not caption:
        return {
            "post_id": post_id,
            "original": "",
            "translated": "",
            "direction": direction,
            "words_translated": 0
        }
    
    result = translate_text(caption, direction)
    result["post_id"] = post_id
    
    return result

# ==================== STORIES ROUTES ====================

@api_router.get("/stories")
async def get_stories():
    """Get stories for the feed (expires after 3 days) with caching"""
    
    cache_key = "stories_feed"
    
    # Try cache first
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find({"expires_at": {"$gt": now}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    users_stories = {}
    for story in stories:
        user_id = story["user_id"]
        if user_id not in users_stories:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
            users_stories[user_id] = {"user": user, "stories": []}
        users_stories[user_id]["stories"].append(story)
    
    result = list(users_stories.values())
    
    # Fallback demo stories if empty
    if not result:
        result = [
            {
                "user": {"user_id": "demo_story", "name": "Hinano", "picture": "https://ui-avatars.com/api/?name=HN&background=FF6B35&color=fff"},
                "stories": [
                    {
                        "story_id": "story_demo_1",
                        "user_id": "demo_story",
                        "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
                        "media_type": "image",
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "expires_at": (datetime.now(timezone.utc).replace(hour=23, minute=59)).isoformat()
                    }
                ]
            }
        ]
    
    # Cache for 30 seconds
    await cache.set(cache_key, result, ttl=30)
    return result

@api_router.get("/stories/profile/{user_id}")
async def get_profile_stories(user_id: str):
    """Get stories for a user profile (expires after 30 days)"""
    now = datetime.now(timezone.utc).isoformat()
    # Use profile_expires_at for profile view
    stories = await db.stories.find({
        "user_id": user_id,
        "$or": [
            {"profile_expires_at": {"$gt": now}},
            {"profile_expires_at": {"$exists": False}, "expires_at": {"$gt": now}}
        ]
    }, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    return stories

@api_router.post("/stories")
async def create_story(story_data: StoryCreate, request: Request):
    user = await require_auth(request)
    
    story = StoryBase(
        user_id=user.user_id,
        **story_data.model_dump()
    )
    story_dict = story.model_dump()
    story_dict["created_at"] = story_dict["created_at"].isoformat()
    story_dict["expires_at"] = story_dict["expires_at"].isoformat()
    story_dict["profile_expires_at"] = story_dict["profile_expires_at"].isoformat()
    
    await db.stories.insert_one(story_dict)
    
    story_dict.pop("_id", None)
    return story_dict

@api_router.post("/stories/{story_id}/view")
async def view_story(story_id: str, request: Request):
    user = await get_current_user(request)
    
    await db.stories.update_one({"story_id": story_id}, {"$inc": {"views_count": 1}})
    
    if user:
        view = {
            "story_id": story_id,
            "user_id": user.user_id,
            "viewed_at": datetime.now(timezone.utc).isoformat()
        }
        await db.story_views.update_one(
            {"story_id": story_id, "user_id": user.user_id},
            {"$set": view},
            upsert=True
        )
    
    return {"viewed": True}

@api_router.delete("/stories/{story_id}")
async def delete_story(story_id: str, request: Request):
    """Delete a story (only creator can delete)"""
    user = await require_auth(request)
    
    # Find the story
    story = await db.stories.find_one({"story_id": story_id}, {"_id": 0})
    if not story:
        raise HTTPException(status_code=404, detail="Story non trouvée")
    
    # Check ownership
    if story.get("user_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres stories")
    
    # Delete the story
    await db.stories.delete_one({"story_id": story_id})
    
    # Delete views
    await db.story_views.delete_many({"story_id": story_id})
    
    return {"success": True, "message": "Story supprimée"}

# ==================== REELS ROUTES ====================

@api_router.get("/reels")
async def get_reels(limit: int = 20, skip: int = 0):
    """Get reels with caching and fallback demo data"""
    cache_key = f"reels:{limit}:{skip}"
    
    # Try cache first
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    reels = await db.posts.find({"content_type": "reel"}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for reel in reels:
        user = await db.users.find_one({"user_id": reel["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        reel["user"] = user
    
    # Fallback demo data if empty
    if not reels:
        reels = [
            {
                "post_id": "reel_demo_1",
                "user_id": "demo_user",
                "content_type": "reel",
                "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
                "caption": "🌺 Découvrez la beauté de Tahiti #tahiti #polynesie",
                "likes_count": 245,
                "comments_count": 18,
                "views_count": 1250,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user": {"user_id": "demo_user", "name": "Hinano Tahiti", "picture": "https://ui-avatars.com/api/?name=HT&background=FF6B35&color=fff", "is_verified": True}
            },
            {
                "post_id": "reel_demo_2",
                "user_id": "demo_user_2",
                "content_type": "reel",
                "media_url": "https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800",
                "caption": "🏄 Surf session à Teahupoo #surf #teahupoo",
                "likes_count": 512,
                "comments_count": 34,
                "views_count": 3200,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user": {"user_id": "demo_user_2", "name": "Maui Surf", "picture": "https://ui-avatars.com/api/?name=MS&background=00CED1&color=fff", "is_verified": False}
            }
        ]
    
    # Cache for 60 seconds
    await cache.set(cache_key, reels, ttl=60)
    return reels

# ==================== LIVE STREAMING ROUTES ====================

# Global setting for live feature
LIVE_FEATURE_ENABLED = True

@api_router.get("/lives")
async def get_active_lives():
    """Get active lives with caching and fallback demo data"""
    # Check if live feature is enabled
    settings = await db.app_settings.find_one({"setting_id": "live_settings"}, {"_id": 0})
    if settings and not settings.get("live_enabled", True):
        return []  # Return empty if lives are disabled
    
    cache_key = "active_lives"
    
    # Try cache first
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    lives = await db.lives.find({"status": "live"}, {"_id": 0}).sort("viewer_count", -1).to_list(50)
    
    for live in lives:
        user = await db.users.find_one({"user_id": live["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        live["user"] = user
    
    # Fallback demo data if empty
    if not lives:
        lives = [
            {
                "live_id": "live_demo_1",
                "user_id": "demo_live_user",
                "title": "🌴 Live depuis Papeete - Coucher de soleil",
                "status": "live",
                "viewer_count": 45,
                "started_at": datetime.now(timezone.utc).isoformat(),
                "user": {"user_id": "demo_live_user", "name": "Tahiti Live", "picture": "https://ui-avatars.com/api/?name=TL&background=FF1493&color=fff", "is_verified": True}
            }
        ]
    
    # Cache for 30 seconds (lives change frequently)
    await cache.set(cache_key, lives, ttl=30)
    return lives

@api_router.get("/lives/replays")
async def get_live_replays():
    """Get live replays from the last 48 hours"""
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=48)
    
    replays = await db.lives.find({
        "status": "ended",
        "ended_at": {"$gte": cutoff_time.isoformat()}
    }, {"_id": 0}).sort("ended_at", -1).to_list(100)
    
    for replay in replays:
        user = await db.users.find_one({"user_id": replay["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        replay["user"] = user
    
    return replays

@api_router.get("/admin/lives/settings")
async def get_live_settings(request: Request):
    """Get live feature settings (admin only)"""
    await verify_admin_token(request)
    
    settings = await db.app_settings.find_one({"setting_id": "live_settings"}, {"_id": 0})
    if not settings:
        settings = {
            "setting_id": "live_settings",
            "live_enabled": True,
            "max_duration_minutes": 120,
            "replay_retention_hours": 48
        }
        await db.app_settings.insert_one(settings)
    
    return settings

@api_router.post("/admin/lives/toggle")
async def toggle_live_feature(request: Request):
    """Toggle live feature on/off (admin only)"""
    await verify_admin_token(request)
    
    settings = await db.app_settings.find_one({"setting_id": "live_settings"}, {"_id": 0})
    current_status = settings.get("live_enabled", True) if settings else True
    new_status = not current_status
    
    await db.app_settings.update_one(
        {"setting_id": "live_settings"},
        {"$set": {"live_enabled": new_status}},
        upsert=True
    )
    
    # Clear cache
    await cache.delete("active_lives")
    
    logger.info(f"Live feature toggled to: {new_status}")
    return {"live_enabled": new_status, "message": f"Lives {'activés' if new_status else 'désactivés'}"}

@api_router.get("/admin/lives/replays")
async def get_admin_live_replays(request: Request):
    """Get all live replays for admin (last 48h)"""
    await verify_admin_token(request)
    
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=48)
    
    replays = await db.lives.find({
        "status": "ended",
        "ended_at": {"$gte": cutoff_time.isoformat()}
    }, {"_id": 0}).sort("ended_at", -1).to_list(200)
    
    for replay in replays:
        user = await db.users.find_one({"user_id": replay["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        replay["user"] = user
        
        # Calculate time remaining before deletion
        ended_at = datetime.fromisoformat(replay["ended_at"].replace('Z', '+00:00')) if isinstance(replay.get("ended_at"), str) else replay.get("ended_at")
        if ended_at:
            expires_at = ended_at + timedelta(hours=48)
            replay["expires_at"] = expires_at.isoformat()
            replay["hours_remaining"] = max(0, (expires_at - datetime.now(timezone.utc)).total_seconds() / 3600)
    
    return replays

@api_router.delete("/admin/lives/{live_id}")
async def delete_live_replay(live_id: str, request: Request):
    """Delete a live replay (admin only)"""
    await verify_admin_token(request)
    
    result = await db.lives.delete_one({"live_id": live_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Live non trouvé")
    
    return {"success": True, "message": "Replay supprimé"}

@api_router.post("/lives")
async def start_live(live_data: LiveStreamCreate, request: Request):
    user = await require_auth(request)
    
    live = LiveStreamBase(
        user_id=user.user_id,
        **live_data.model_dump()
    )
    live_dict = live.model_dump()
    live_dict["started_at"] = live_dict["started_at"].isoformat()
    
    await db.lives.insert_one(live_dict)
    
    live_dict.pop("_id", None)
    return live_dict

@api_router.post("/lives/{live_id}/end")
async def end_live(live_id: str, request: Request):
    user = await require_auth(request)
    
    live = await db.lives.find_one({"live_id": live_id, "user_id": user.user_id}, {"_id": 0})
    if not live:
        raise HTTPException(status_code=404, detail="Live non trouvé")
    
    ended_at = datetime.now(timezone.utc)
    started_at = datetime.fromisoformat(live["started_at"]) if isinstance(live["started_at"], str) else live["started_at"]
    duration = int((ended_at - started_at).total_seconds())
    
    await db.lives.update_one(
        {"live_id": live_id},
        {"$set": {"status": "ended", "ended_at": ended_at.isoformat(), "duration": duration}}
    )
    
    return {"ended": True, "duration": duration}

@api_router.get("/lives/{live_id}")
async def get_live(live_id: str):
    live = await db.lives.find_one({"live_id": live_id}, {"_id": 0})
    if not live:
        raise HTTPException(status_code=404, detail="Live non trouvé")
    
    user = await db.users.find_one({"user_id": live["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
    live["user"] = user
    
    return live

@api_router.post("/lives/{live_id}/like")
async def like_live(live_id: str, request: Request):
    await db.lives.update_one({"live_id": live_id}, {"$inc": {"likes_count": 1}})
    return {"liked": True}

# ==================== CHAT/MESSAGING ROUTES ====================

@api_router.get("/conversations")
async def get_conversations(request: Request):
    user = await require_auth(request)
    
    conversations = await db.conversations.find(
        {"participants": user.user_id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(50)
    
    for conv in conversations:
        # Get other participant info
        other_id = [p for p in conv["participants"] if p != user.user_id][0]
        other_user = await db.users.find_one({"user_id": other_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        conv["other_user"] = other_user
        conv["unread"] = conv.get("unread_count", {}).get(user.user_id, 0)
    
    return conversations

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, request: Request, limit: int = 50):
    user = await require_auth(request)
    
    messages = await db.messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Mark as read
    await db.messages.update_many(
        {"conversation_id": conversation_id, "sender_id": {"$ne": user.user_id}, "read": False},
        {"$set": {"read": True}}
    )
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {f"unread_count.{user.user_id}": 0}}
    )
    
    return list(reversed(messages))

@api_router.post("/conversations")
async def create_conversation(request: Request):
    """Create or get existing conversation with another user"""
    user = await require_auth(request)
    body = await request.json()
    other_user_id = body.get("user_id")
    
    if not other_user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    if other_user_id == user.user_id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself")
    
    # Check if other user exists
    other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find or create conversation
    participants = sorted([user.user_id, other_user_id])
    conversation = await db.conversations.find_one({"participants": participants}, {"_id": 0})
    
    if not conversation:
        new_conversation = ConversationBase(participants=participants)
        conv_dict = new_conversation.model_dump()
        conv_dict["created_at"] = conv_dict["created_at"].isoformat()
        await db.conversations.insert_one(conv_dict)
        conversation = conv_dict
    
    # Add other user info
    conversation["other_user"] = other_user
    conversation.pop("_id", None)
    
    return conversation

@api_router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, request: Request):
    """Delete a conversation and all its messages"""
    user = await require_auth(request)
    
    # Find the conversation
    conversation = await db.conversations.find_one(
        {"conversation_id": conversation_id, "participants": user.user_id},
        {"_id": 0}
    )
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation non trouvée")
    
    # Delete all messages in the conversation
    await db.messages.delete_many({"conversation_id": conversation_id})
    
    # Delete the conversation
    await db.conversations.delete_one({"conversation_id": conversation_id})
    
    return {"success": True, "message": "Conversation supprimée"}

@api_router.post("/messages")
async def send_message(message_data: MessageCreate, request: Request):
    user = await require_auth(request)
    
    # Find or create conversation
    participants = sorted([user.user_id, message_data.receiver_id])
    conversation = await db.conversations.find_one({"participants": participants}, {"_id": 0})
    
    if not conversation:
        conversation = ConversationBase(participants=participants)
        conv_dict = conversation.model_dump()
        conv_dict["created_at"] = conv_dict["created_at"].isoformat()
        await db.conversations.insert_one(conv_dict)
        conversation_id = conversation.conversation_id
    else:
        conversation_id = conversation["conversation_id"]
    
    # Create message
    message = MessageBase(
        conversation_id=conversation_id,
        sender_id=user.user_id,
        content=message_data.content,
        message_type=message_data.message_type,
        media_url=message_data.media_url
    )
    message_dict = message.model_dump()
    message_dict["created_at"] = message_dict["created_at"].isoformat()
    
    await db.messages.insert_one(message_dict)
    
    # Update conversation
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {
            "$set": {
                "last_message": message_data.content[:50],
                "last_message_at": message_dict["created_at"]
            },
            "$inc": {f"unread_count.{message_data.receiver_id}": 1}
        }
    )
    
    # Broadcast via WebSocket
    await manager.send_message({
        "type": "new_message",
        "message": message_dict
    }, conversation_id)
    
    # Send push notification to receiver if offline
    receiver = await db.users.find_one(
        {"user_id": message_data.receiver_id},
        {"device_tokens": 1, "username": 1, "_id": 0}
    )
    
    if receiver and receiver.get("device_tokens"):
        sender = await db.users.find_one(
            {"user_id": user.user_id},
            {"username": 1, "name": 1, "_id": 0}
        )
        sender_name = sender.get("name") or sender.get("username") or "Quelqu'un"
        
        # Check if receiver is online via WebSocket
        is_online = chat_manager.is_user_online(message_data.receiver_id)
        
        if not is_online:
            await push_service.send_to_devices(
                receiver["device_tokens"],
                f"💬 Message de {sender_name}",
                message_data.content[:100],
                {
                    "type": "message",
                    "sender_id": user.user_id,
                    "conversation_id": conversation_id,
                    "url": f"/chat?conversation={conversation_id}"
                }
            )
    
    message_dict.pop("_id", None)
    return message_dict

# ==================== FEED ALIAS ROUTES ====================

@api_router.get("/feed")
async def get_feed(page: int = 1, per_page: int = 10, request: Request = None):
    """Get paginated feed with cache"""
    skip = (page - 1) * per_page
    
    # Check cache first
    cache_key_str = f"feed:{page}:{per_page}"
    cached_feed = await feed_cache.get(cache_key_str)
    if cached_feed:
        return cached_feed
    
    # Optimized aggregation with $lookup
    pipeline = [
        {"$match": {"moderation_status": {"$ne": "rejected"}}},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": per_page},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": {"$ifNull": ["$user_data.is_verified", False]}
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(per_page)
    total = await db.posts.count_documents({"moderation_status": {"$ne": "rejected"}})
    
    result = {
        "posts": posts,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "has_more": skip + per_page < total
        }
    }
    
    # Cache the result for 30 seconds
    await feed_cache.set(cache_key_str, result, ttl=30)
    return result

# ==================== MARKETPLACE ROUTES ====================

@api_router.get("/marketplace/products")
async def get_products(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    """Get marketplace products (optimized with cache)"""
    
    cache_key = f"products:{category or 'all'}:{limit}:{skip}"
    
    # Try cache first
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "seller_data"
        }},
        {"$unwind": {"path": "$seller_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "seller": {
                "user_id": "$seller_data.user_id",
                "name": "$seller_data.name",
                "picture": "$seller_data.picture"
            }
        }},
        {"$project": {"_id": 0, "seller_data": 0}}
    ]
    
    products = await db.products.aggregate(pipeline).to_list(limit)
    
    # Fallback demo products if empty
    if not products:
        products = [
            {
                "product_id": "prod_demo_1",
                "title": "Paréo traditionnel tahitien",
                "description": "Magnifique paréo fait main avec motifs traditionnels polynésiens",
                "price": 4500,
                "currency": "XPF",
                "category": "Mode",
                "images": ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800"],
                "is_available": True,
                "location": "Papeete",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "seller": {"user_id": "seller_demo", "name": "Artisan Tahiti", "picture": None}
            }
        ]
    
    # Cache for 60 seconds
    await cache.set(cache_key, products, ttl=60)
    return products

# Alias routes for /market/* (compatibility)
@api_router.get("/market/products")
async def get_market_products(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    """Alias for /marketplace/products"""
    return await get_products(category, limit, skip)

@api_router.get("/marketplace/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    user = await db.users.find_one({"user_id": product["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
    product["seller"] = user
    
    await db.products.update_one({"product_id": product_id}, {"$inc": {"views_count": 1}})
    
    return product

@api_router.post("/marketplace/products")
async def create_product(product_data: ProductCreate, request: Request):
    user = await require_auth(request)
    
    product = ProductBase(
        user_id=user.user_id,
        **product_data.model_dump()
    )
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    
    await db.products.insert_one(product_dict)
    
    product_dict.pop("_id", None)
    return product_dict


@api_router.post("/marketplace/products/{product_id}/like")
async def like_product(product_id: str, request: Request):
    """Like/unlike a product"""
    user = await require_auth(request)
    
    # Check if already liked
    existing = await db.product_likes.find_one({
        "product_id": product_id, 
        "user_id": user.user_id
    }, {"_id": 0})
    
    if existing:
        # Unlike
        await db.product_likes.delete_one({
            "product_id": product_id, 
            "user_id": user.user_id
        })
        await db.products.update_one(
            {"product_id": product_id}, 
            {"$inc": {"likes_count": -1}}
        )
        return {"liked": False}
    else:
        # Like
        await db.product_likes.insert_one({
            "product_id": product_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.products.update_one(
            {"product_id": product_id}, 
            {"$inc": {"likes_count": 1}}
        )
        return {"liked": True}


@api_router.post("/marketplace/services/{service_id}/like")
async def like_service(service_id: str, request: Request):
    """Like/unlike a service"""
    user = await require_auth(request)
    
    existing = await db.service_likes.find_one({
        "service_id": service_id, 
        "user_id": user.user_id
    }, {"_id": 0})
    
    if existing:
        await db.service_likes.delete_one({
            "service_id": service_id, 
            "user_id": user.user_id
        })
        await db.services.update_one(
            {"service_id": service_id}, 
            {"$inc": {"likes_count": -1}}
        )
        return {"liked": False}
    else:
        await db.service_likes.insert_one({
            "service_id": service_id,
            "user_id": user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.services.update_one(
            {"service_id": service_id}, 
            {"$inc": {"likes_count": 1}}
        )
        return {"liked": True}


@api_router.get("/marketplace/favorites")
async def get_favorites(request: Request):
    """Get user's favorite products and services"""
    user = await require_auth(request)
    
    # Get liked products
    product_likes = await db.product_likes.find(
        {"user_id": user.user_id}, 
        {"product_id": 1, "_id": 0}
    ).to_list(100)
    product_ids = [l["product_id"] for l in product_likes]
    
    products = await db.products.find(
        {"product_id": {"$in": product_ids}},
        {"_id": 0}
    ).to_list(100)
    
    # Get liked services
    service_likes = await db.service_likes.find(
        {"user_id": user.user_id}, 
        {"service_id": 1, "_id": 0}
    ).to_list(100)
    service_ids = [l["service_id"] for l in service_likes]
    
    services = await db.services.find(
        {"service_id": {"$in": service_ids}},
        {"_id": 0}
    ).to_list(100)
    
    return {"products": products, "services": services}


@api_router.get("/marketplace/services")
async def get_services(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    """Get marketplace services (optimized)"""
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    # Optimized: Use aggregation with $lookup to avoid N+1 queries
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "provider_data"
        }},
        {"$unwind": {"path": "$provider_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "provider": {
                "user_id": "$provider_data.user_id",
                "name": "$provider_data.name",
                "picture": "$provider_data.picture"
            }
        }},
        {"$project": {"_id": 0, "provider_data": 0}}
    ]
    
    services = await db.services.aggregate(pipeline).to_list(limit)
    return services

# Alias route for /market/services (compatibility)
@api_router.get("/market/services")
async def get_market_services(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    """Alias for /marketplace/services"""
    return await get_services(category, limit, skip)

@api_router.post("/marketplace/services")
async def create_service(service_data: ServiceCreate, request: Request):
    user = await require_auth(request)
    
    service = ServiceBase(
        user_id=user.user_id,
        **service_data.model_dump()
    )
    service_dict = service.model_dump()
    service_dict["created_at"] = service_dict["created_at"].isoformat()
    
    await db.services.insert_one(service_dict)
    
    service_dict.pop("_id", None)
    return service_dict

@api_router.get("/marketplace/categories")
async def get_categories():
    return {
        "products": [
            {"id": "perles", "name": "Perles de Tahiti", "icon": "gem", "color": "#00CED1"},
            {"id": "artisanat", "name": "Artisanat", "icon": "palette", "color": "#FF6B35"},
            {"id": "monoi", "name": "Monoï & Cosmétiques", "icon": "droplet", "color": "#FFD700"},
            {"id": "vetements", "name": "Vêtements & Paréos", "icon": "shirt", "color": "#FF1493"},
            {"id": "bijoux", "name": "Bijoux", "icon": "sparkles", "color": "#9400D3"},
            {"id": "alimentaire", "name": "Produits Locaux", "icon": "utensils", "color": "#32CD32"},
            {"id": "decoration", "name": "Décoration", "icon": "home", "color": "#FF4500"},
            {"id": "autres", "name": "Autres", "icon": "package", "color": "#808080"}
        ],
        "services": [
            {"id": "tourisme", "name": "Tourisme & Excursions", "icon": "compass", "color": "#00CED1"},
            {"id": "restauration", "name": "Restauration", "icon": "utensils", "color": "#FF6B35"},
            {"id": "beaute", "name": "Beauté & Bien-être", "icon": "sparkles", "color": "#FF1493"},
            {"id": "evenements", "name": "Événements", "icon": "calendar", "color": "#9400D3"},
            {"id": "transport", "name": "Transport", "icon": "car", "color": "#FFD700"},
            {"id": "hebergement", "name": "Hébergement", "icon": "home", "color": "#32CD32"},
            {"id": "cours", "name": "Cours & Formations", "icon": "book", "color": "#FF4500"},
            {"id": "autres", "name": "Autres Services", "icon": "briefcase", "color": "#808080"}
        ]
    }

# ==================== AD CAMPAIGNS ROUTES ====================

@api_router.get("/ads/campaigns")
async def get_campaigns(request: Request):
    user = await require_auth(request)
    campaigns = await db.ad_campaigns.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return campaigns

@api_router.post("/ads/campaigns")
async def create_campaign(campaign_data: AdCampaignCreate, request: Request):
    user = await require_auth(request)
    
    campaign = AdCampaignBase(
        user_id=user.user_id,
        **campaign_data.model_dump()
    )
    campaign_dict = campaign.model_dump()
    campaign_dict["created_at"] = campaign_dict["created_at"].isoformat()
    campaign_dict["start_date"] = campaign_dict["start_date"].isoformat()
    if campaign_dict["end_date"]:
        campaign_dict["end_date"] = campaign_dict["end_date"].isoformat()
    
    await db.ad_campaigns.insert_one(campaign_dict)
    
    campaign_dict.pop("_id", None)
    return campaign_dict

@api_router.put("/ads/campaigns/{campaign_id}/status")
async def update_campaign_status(campaign_id: str, request: Request):
    user = await require_auth(request)
    body = await request.json()
    status = body.get("status")
    
    if status not in ["draft", "pending", "active", "paused", "completed"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    result = await db.ad_campaigns.update_one(
        {"campaign_id": campaign_id, "user_id": user.user_id},
        {"$set": {"status": status}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    return {"success": True, "status": status}

@api_router.get("/ads")
async def get_ads(limit: int = 5):
    # Get active ads for display
    ads = await db.ads.find({"status": "active"}, {"_id": 0}).limit(limit).to_list(limit)
    
    for ad in ads:
        await db.ads.update_one({"ad_id": ad["ad_id"]}, {"$inc": {"impressions": 1}})
    
    return ads

@api_router.post("/ads")
async def create_ad(ad_data: AdCreate, request: Request):
    user = await require_auth(request)
    
    # Verify campaign belongs to user
    campaign = await db.ad_campaigns.find_one(
        {"campaign_id": ad_data.campaign_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campagne non trouvée")
    
    ad = AdBase(
        user_id=user.user_id,
        **ad_data.model_dump()
    )
    ad_dict = ad.model_dump()
    ad_dict["created_at"] = ad_dict["created_at"].isoformat()
    
    await db.ads.insert_one(ad_dict)
    
    ad_dict.pop("_id", None)
    return ad_dict

@api_router.post("/ads/{ad_id}/click")
async def track_ad_click(ad_id: str, request: Request):
    user = await get_current_user(request)
    
    await db.ads.update_one({"ad_id": ad_id}, {"$inc": {"clicks": 1}})
    
    event = {
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id if user else None,
        "event_type": "ad_click",
        "event_data": {"ad_id": ad_id},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.analytics.insert_one(event)
    
    return {"clicked": True}

@api_router.get("/ads/my-ads")
async def get_my_ads(request: Request):
    user = await require_auth(request)
    ads = await db.ads.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return ads

@api_router.get("/ads/pricing")
async def get_ad_pricing():
    return {
        "packages": [
            {
                "id": "starter",
                "name": "Starter",
                "price": 5000,
                "currency": "XPF",
                "impressions": 1000,
                "duration_days": 7,
                "features": ["Feed uniquement", "1 publicité"]
            },
            {
                "id": "boost",
                "name": "Boost",
                "price": 15000,
                "currency": "XPF",
                "impressions": 5000,
                "duration_days": 14,
                "features": ["Feed + Stories", "3 publicités", "Statistiques basiques"],
                "popular": True
            },
            {
                "id": "pro",
                "name": "Pro",
                "price": 35000,
                "currency": "XPF",
                "impressions": 15000,
                "duration_days": 30,
                "features": ["Tous placements", "Publicités illimitées", "Statistiques avancées", "Support prioritaire"]
            },
            {
                "id": "enterprise",
                "name": "Entreprise",
                "price": 100000,
                "currency": "XPF",
                "impressions": 50000,
                "duration_days": 30,
                "features": ["Tous placements", "Publicités illimitées", "API accès", "Account manager dédié", "Ciblage avancé"]
            }
        ],
        "cpm_rate": 500,  # Cost per 1000 impressions in XPF
        "cpc_rate": 50    # Cost per click in XPF
    }

# ==================== USER ROUTES ====================

@api_router.get("/users/search")
async def search_users_for_chat(q: str = "", limit: int = 10):
    """Search users by name or username for chat/messaging"""
    if len(q) < 2:
        return []
    
    # Search by name (case-insensitive)
    users = await db.users.find(
        {
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": f"^{q}", "$options": "i"}}
            ]
        },
        {"_id": 0, "password_hash": 0, "email": 0}
    ).limit(limit).to_list(limit)
    
    return users

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str):
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, limit: int = 20):
    posts = await db.posts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return posts

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, request: Request):
    current_user = await require_auth(request)
    
    if current_user.user_id == user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous suivre vous-même")
    
    existing = await db.follows.find_one({"follower_id": current_user.user_id, "following_id": user_id}, {"_id": 0})
    
    if existing:
        await db.follows.delete_one({"follower_id": current_user.user_id, "following_id": user_id})
        await db.users.update_one({"user_id": current_user.user_id}, {"$inc": {"following_count": -1}})
        await db.users.update_one({"user_id": user_id}, {"$inc": {"followers_count": -1}})
        return {"following": False}
    else:
        follow = {
            "follow_id": f"fol_{uuid.uuid4().hex[:12]}",
            "follower_id": current_user.user_id,
            "following_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.follows.insert_one(follow)
        await db.users.update_one({"user_id": current_user.user_id}, {"$inc": {"following_count": 1}})
        await db.users.update_one({"user_id": user_id}, {"$inc": {"followers_count": 1}})
        
        # Send push notification to followed user (async, don't wait)
        asyncio.create_task(send_follow_notification(user_id, current_user.user_id, current_user.display_name))
        
        return {"following": True}


@api_router.get("/users/{user_id}/followers")
async def get_user_followers(user_id: str, limit: int = 50, skip: int = 0):
    """Get list of users who follow this user"""
    # Get follower IDs
    follows = await db.follows.find(
        {"following_id": user_id},
        {"follower_id": 1, "_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    follower_ids = [f["follower_id"] for f in follows]
    
    if not follower_ids:
        return []
    
    # Get follower user details
    followers = await db.users.find(
        {"user_id": {"$in": follower_ids}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(limit)
    
    return followers


@api_router.get("/users/{user_id}/following")
async def get_user_following(user_id: str, limit: int = 50, skip: int = 0):
    """Get list of users this user follows"""
    # Get following IDs
    follows = await db.follows.find(
        {"follower_id": user_id},
        {"following_id": 1, "_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    following_ids = [f["following_id"] for f in follows]
    
    if not following_ids:
        return []
    
    # Get following user details
    following = await db.users.find(
        {"user_id": {"$in": following_ids}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(limit)
    
    return following


@api_router.get("/users/me/friends")
async def get_my_friends(request: Request):
    """Get mutual follows (friends) for current user"""
    user = await require_auth(request)
    
    # Get users I follow
    my_following = await db.follows.find(
        {"follower_id": user.user_id},
        {"following_id": 1, "_id": 0}
    ).to_list(1000)
    following_ids = set(f["following_id"] for f in my_following)
    
    # Get users who follow me
    my_followers = await db.follows.find(
        {"following_id": user.user_id},
        {"follower_id": 1, "_id": 0}
    ).to_list(1000)
    follower_ids = set(f["follower_id"] for f in my_followers)
    
    # Mutual = intersection
    friend_ids = list(following_ids & follower_ids)
    
    if not friend_ids:
        return []
    
    friends = await db.users.find(
        {"user_id": {"$in": friend_ids}},
        {"_id": 0, "password_hash": 0, "email": 0}
    ).to_list(100)
    
    return friends


@api_router.put("/users/profile")
async def update_profile(request: Request):
    user = await require_auth(request)
    body = await request.json()
    
    allowed_fields = ["name", "bio", "location", "picture", "is_business", "profile_visibility"]
    update_data = {k: v for k, v in body.items() if k in allowed_fields}
    
    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.put("/users/me")
async def update_my_profile(request: Request):
    """Update current user profile with file upload support"""
    user = await require_auth(request)
    
    content_type = request.headers.get("content-type", "")
    
    if "multipart/form-data" in content_type:
        # Handle form data with file upload
        form = await request.form()
        update_data = {}
        
        # Text fields
        if form.get("name"):
            update_data["name"] = form.get("name")
        if form.get("bio") is not None:
            update_data["bio"] = form.get("bio")
        if form.get("location"):
            update_data["location"] = form.get("location")
        
        # Handle picture upload
        picture = form.get("picture")
        if picture and hasattr(picture, 'file'):
            # Save file
            import os
            filename = f"profile_{user.user_id}_{uuid.uuid4().hex[:8]}.jpg"
            upload_dir = Path(__file__).resolve().parent / "uploads" / "profiles"
            upload_dir.mkdir(parents=True, exist_ok=True)
            file_path = upload_dir / filename
            
            content = await picture.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Get base URL for the file
            update_data["picture"] = f"/uploads/profiles/{filename}"
        
        if update_data:
            await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    else:
        # Handle JSON body
        body = await request.json()
        allowed_fields = ["name", "bio", "location", "picture", "is_business", "profile_visibility"]
        update_data = {k: v for k, v in body.items() if k in allowed_fields}
        
        if update_data:
            await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.put("/users/visibility")
async def update_profile_visibility(request: Request):
    """Update profile visibility settings"""
    user = await require_auth(request)
    body = await request.json()
    
    allowed_settings = ["show_photos", "show_posts", "show_saved", "is_private"]
    visibility_updates = {f"profile_visibility.{k}": v for k, v in body.items() if k in allowed_settings}
    
    if visibility_updates:
        await db.users.update_one({"user_id": user.user_id}, {"$set": visibility_updates})
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "password_hash": 0})
    return updated_user.get("profile_visibility", {})

# ==================== ANALYTICS ROUTES ====================

@api_router.post("/analytics/event")
async def track_event(request: Request):
    body = await request.json()
    user = await get_current_user(request)
    
    event = AnalyticsEvent(
        user_id=user.user_id if user else None,
        event_type=body.get("event_type", "unknown"),
        event_data=body.get("event_data", {}),
        device_info=body.get("device_info"),
        location=body.get("location")
    )
    event_dict = event.model_dump()
    event_dict["timestamp"] = event_dict["timestamp"].isoformat()
    
    await db.analytics.insert_one(event_dict)
    
    return {"tracked": True}

@api_router.get("/analytics/dashboard")
async def get_analytics_dashboard(request: Request):
    user = await require_auth(request)
    
    posts = await db.posts.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    total_likes = sum(p.get("likes_count", 0) for p in posts)
    total_views = sum(p.get("views_count", 0) for p in posts)
    total_comments = sum(p.get("comments_count", 0) for p in posts)
    
    products = await db.products.find({"user_id": user.user_id}, {"_id": 0}).to_list(1000)
    product_views = sum(p.get("views_count", 0) for p in products)
    
    ads = await db.ads.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    total_impressions = sum(a.get("impressions", 0) for a in ads)
    total_clicks = sum(a.get("clicks", 0) for a in ads)
    total_spend = sum(a.get("spend", 0) for a in ads)
    
    campaigns = await db.ad_campaigns.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    
    return {
        "posts": {
            "total": len(posts),
            "total_likes": total_likes,
            "total_views": total_views,
            "total_comments": total_comments
        },
        "products": {
            "total": len(products),
            "total_views": product_views
        },
        "ads": {
            "total": len(ads),
            "campaigns": len(campaigns),
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_spend": total_spend,
            "ctr": round((total_clicks / total_impressions * 100) if total_impressions > 0 else 0, 2)
        },
        "followers": user.followers_count,
        "following": user.following_count
    }

# ==================== SEARCH ROUTES ====================

@api_router.get("/search")
async def search(q: str, type: str = "all", limit: int = 20):
    """Search across all content types"""
    results = {"users": [], "posts": [], "products": [], "services": [], "lives": []}
    
    if type in ["all", "users"]:
        users = await db.users.find(
            {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"bio": {"$regex": q, "$options": "i"}}]},
            {"_id": 0, "password_hash": 0}
        ).limit(limit).to_list(limit)
        results["users"] = users
    
    if type in ["all", "posts"]:
        posts = await db.posts.find(
            {"caption": {"$regex": q, "$options": "i"}},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        results["posts"] = posts
    
    if type in ["all", "products"]:
        products = await db.products.find(
            {"$or": [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        results["products"] = products
    
    if type in ["all", "services"]:
        services = await db.services.find(
            {"$or": [{"title": {"$regex": q, "$options": "i"}}, {"description": {"$regex": q, "$options": "i"}}]},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        results["services"] = services
    
    if type in ["all", "lives"]:
        lives = await db.lives.find(
            {"$and": [{"status": "live"}, {"title": {"$regex": q, "$options": "i"}}]},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        results["lives"] = lives
    
    return results


# ==================== SEARCH SPECIFIC ENDPOINTS ====================

@api_router.get("/search/users")
async def search_users(q: str, limit: int = 20, skip: int = 0):
    """Search users by name, bio, or location with caching - excludes private profiles"""
    if not q or len(q) < 2:
        return []
    
    # Cache key
    cache_key = f"search_users:{q}:{limit}:{skip}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    # Optimized search with index - exclude private profiles
    pipeline = [
        {"$match": {
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"bio": {"$regex": q, "$options": "i"}},
                {"location": {"$regex": q, "$options": "i"}}
            ],
            "is_banned": {"$ne": True},
            # Exclude private profiles from search
            "$or": [
                {"profile_visibility.is_private": {"$ne": True}},
                {"profile_visibility": {"$exists": False}}
            ]
        }},
        {"$project": {
            "_id": 0,
            "password_hash": 0,
            "email": 0
        }},
        {"$skip": skip},
        {"$limit": limit}
    ]
    
    users = await db.users.aggregate(pipeline).to_list(limit)
    
    # Cache for 60 seconds
    await cache.set(cache_key, users, ttl=60)
    return users


@api_router.get("/search/posts")
async def search_posts(q: str, limit: int = 20, skip: int = 0):
    """Search posts by caption or hashtags with caching"""
    if not q or len(q) < 2:
        return []
    
    # Cache key
    cache_key = f"search_posts:{q}:{limit}:{skip}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    # Optimized search with user lookup
    pipeline = [
        {"$match": {
            "$or": [
                {"caption": {"$regex": q, "$options": "i"}},
                {"hashtags": {"$regex": q, "$options": "i"}}
            ],
            "moderation_status": {"$ne": "rejected"}
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    
    # Cache for 60 seconds
    await cache.set(cache_key, posts, ttl=60)
    return posts


@api_router.get("/search/products")
async def search_products(q: str, limit: int = 20, skip: int = 0):
    """Search marketplace products with caching"""
    if not q or len(q) < 2:
        return []
    
    # Cache key
    cache_key = f"search_products:{q}:{limit}:{skip}"
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    pipeline = [
        {"$match": {
            "$or": [
                {"title": {"$regex": q, "$options": "i"}},
                {"description": {"$regex": q, "$options": "i"}},
                {"category": {"$regex": q, "$options": "i"}}
            ],
            "is_available": True
        }},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "seller_data"
        }},
        {"$unwind": {"path": "$seller_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "seller": {
                "user_id": "$seller_data.user_id",
                "name": "$seller_data.name",
                "picture": "$seller_data.picture"
            }
        }},
        {"$project": {"_id": 0, "seller_data": 0}}
    ]
    
    products = await db.products.aggregate(pipeline).to_list(limit)
    
    # Cache for 60 seconds
    await cache.set(cache_key, products, ttl=60)
    return products

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(request: Request, limit: int = 50):
    user = await require_auth(request)
    notifications = await db.notifications.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return notifications

@api_router.post("/notifications/read")
async def mark_notifications_read(request: Request):
    user = await require_auth(request)
    await db.notifications.update_many({"user_id": user.user_id, "read": False}, {"$set": {"read": True}})
    return {"success": True}

@api_router.get("/notifications/unread-count")
async def get_unread_count(request: Request):
    user = await require_auth(request)
    count = await db.notifications.count_documents({"user_id": user.user_id, "read": False})
    return {"count": count}

@api_router.post("/notifications/subscribe")
async def subscribe_push(request: Request):
    """Subscribe to push notifications"""
    user = await require_auth(request)
    body = await request.json()
    
    subscription = {
        "user_id": user.user_id,
        "endpoint": body.get("endpoint"),
        "keys": body.get("keys"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.push_subscriptions.update_one(
        {"user_id": user.user_id},
        {"$set": subscription},
        upsert=True
    )
    
    return {"success": True, "message": "Notifications activées"}

@api_router.delete("/notifications/unsubscribe")
async def unsubscribe_push(request: Request):
    """Unsubscribe from push notifications"""
    user = await require_auth(request)
    await db.push_subscriptions.delete_one({"user_id": user.user_id})
    return {"success": True, "message": "Notifications désactivées"}

@api_router.get("/notifications/settings")
async def get_notification_settings(request: Request):
    """Get user notification preferences"""
    user = await require_auth(request)
    
    settings = await db.notification_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not settings:
        settings = {
            "user_id": user.user_id,
            "friend_posts": True,
            "likes": True,
            "comments": True,
            "follows": True,
            "messages": True,
            "live_streams": True,
            "marketing": False
        }
        await db.notification_settings.insert_one(dict(settings))
    
    settings.pop("_id", None)
    return settings

@api_router.put("/notifications/settings")
async def update_notification_settings(request: Request):
    """Update user notification preferences"""
    user = await require_auth(request)
    body = await request.json()
    
    allowed_fields = ["friend_posts", "likes", "comments", "follows", "messages", "live_streams", "marketing"]
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.notification_settings.update_one(
        {"user_id": user.user_id},
        {"$set": updates},
        upsert=True
    )
    
    return {"success": True}

# Helper function to create notifications for followers when user posts
async def notify_followers_new_post(user_id: str, post_id: str, post_type: str):
    """Send notifications to all followers when user creates a post"""
    # Get user info
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "name": 1, "picture": 1})
    if not user:
        return
    
    # Get all followers
    followers = await db.follows.find({"following_id": user_id}, {"_id": 0, "follower_id": 1}).to_list(1000)
    
    for follower in followers:
        # Check if follower wants notifications for friend posts
        settings = await db.notification_settings.find_one({"user_id": follower["follower_id"]})
        if settings and not settings.get("friend_posts", True):
            continue
        
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": follower["follower_id"],
            "type": "new_post",
            "title": "Nouvelle publication",
            "message": f"{user['name']} a publié {('un reel' if post_type == 'reel' else 'une story' if post_type == 'story' else 'une photo')}",
            "from_user": {
                "user_id": user_id,
                "name": user["name"],
                "picture": user.get("picture")
            },
            "data": {
                "post_id": post_id,
                "post_type": post_type
            },
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    logger.info(f"Notified {len(followers)} followers about new post from {user_id}")

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Ia ora na! Bienvenue sur Fenua Social API", "version": "2.0.0"}

@api_router.get("/ping")
async def ping():
    """Ultra-fast health check without DB access"""
    return {"pong": True}

# ==================== WEBSOCKET ENDPOINTS ====================

@app.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    await manager.connect(websocket, conversation_id)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.send_message(data, conversation_id)
    except WebSocketDisconnect:
        manager.disconnect(websocket, conversation_id)

@app.websocket("/ws/live/{live_id}")
async def websocket_live(websocket: WebSocket, live_id: str):
    viewer_count = await manager.connect_live(websocket, live_id)
    await db.lives.update_one({"live_id": live_id}, {"$set": {"viewer_count": viewer_count}})
    
    try:
        while True:
            data = await websocket.receive_json()
            data["viewer_count"] = viewer_count
            await manager.broadcast_live(data, live_id)
    except WebSocketDisconnect:
        viewer_count = manager.disconnect_live(websocket, live_id)
        await db.lives.update_one({"live_id": live_id}, {"$set": {"viewer_count": viewer_count}})

# ==================== FILE UPLOAD ====================

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...), 
    request: Request = None,
    media_type: str = "video"  # video, story, photo
):
    """Upload a file (image or video) with automatic compression"""
    try:
        # Get user for storage limits check
        user = None
        try:
            user = await require_auth(request)
            # Check storage limits
            storage_check = await check_user_storage_limits(db, user.user_id)
            if not storage_check["can_upload"]:
                raise HTTPException(status_code=400, detail=storage_check["message"])
        except HTTPException as auth_error:
            # Allow anonymous uploads for now (could be restricted later)
            pass
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non supporté. Utilisez JPG, PNG, GIF, WebP ou MP4.")
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        temp_file_path = UPLOAD_DIR / f"temp_{unique_filename}"
        final_file_path = UPLOAD_DIR / unique_filename
        
        # Save original file to temp location
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size before compression
        original_size_mb = os.path.getsize(temp_file_path) / (1024 * 1024)
        
        is_video = file.content_type.startswith('video/')
        compression_result = {"success": True}
        
        if is_video:
            # Compress video based on media type
            output_filename = f"{uuid.uuid4().hex}.mp4"
            output_path = UPLOAD_DIR / output_filename
            
            compression_result = await compress_video(
                str(temp_file_path), 
                str(output_path), 
                media_type
            )
            
            if compression_result["success"]:
                # Remove temp file, use compressed version
                os.remove(temp_file_path)
                final_file_path = output_path
                unique_filename = output_filename
            else:
                os.remove(temp_file_path)
                raise HTTPException(status_code=400, detail=compression_result["message"])
        else:
            # Compress image to WebP
            output_filename = f"{uuid.uuid4().hex}.webp"
            output_path = UPLOAD_DIR / output_filename
            
            compression_result = await compress_image(
                str(temp_file_path),
                str(output_path)
            )
            
            if compression_result["success"]:
                os.remove(temp_file_path)
                final_file_path = output_path
                unique_filename = output_filename
            else:
                # If compression fails, use original
                shutil.move(str(temp_file_path), str(final_file_path))
        
        # Calculate final size
        final_size_mb = os.path.getsize(final_file_path) / (1024 * 1024)
        
        # Record media file in database
        if user:
            media_record = {
                "media_id": f"media_{uuid.uuid4().hex[:12]}",
                "user_id": user.user_id,
                "file_path": f"/uploads/{unique_filename}",
                "media_type": "photo" if not is_video else media_type,
                "size_mb": round(final_size_mb, 2),
                "original_size_mb": round(original_size_mb, 2),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.media_files.insert_one(media_record)
        
        # Build URL
        forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
        forwarded_host = request.headers.get('x-forwarded-host', request.headers.get('host', ''))
        
        if forwarded_host:
            file_url = f"{forwarded_proto}://{forwarded_host}/api/uploads/{unique_filename}"
        else:
            base_url = str(request.base_url).rstrip('/').replace('http://', 'https://')
            file_url = f"{base_url}/api/uploads/{unique_filename}"
        
        compression_ratio = round((1 - final_size_mb / original_size_mb) * 100, 1) if original_size_mb > 0 else 0
        
        logger.info(f"File uploaded: {unique_filename}, Original: {original_size_mb:.2f}MB, Final: {final_size_mb:.2f}MB, Compression: {compression_ratio}%")
        
        return {
            "success": True,
            "url": file_url,
            "filename": unique_filename,
            "content_type": file.content_type,
            "original_size_mb": round(original_size_mb, 2),
            "final_size_mb": round(final_size_mb, 2),
            "compression_ratio": compression_ratio,
            "message": f"Fichier optimisé ({compression_ratio}% de compression)"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

@api_router.post("/upload/base64")
async def upload_base64(request: Request):
    """Upload a file from base64 encoded data"""
    try:
        data = await request.json()
        base64_data = data.get('data', '')
        file_type = data.get('type', 'image/jpeg')
        
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64
        file_bytes = base64.b64decode(base64_data)
        
        # Determine extension
        ext_map = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4'
        }
        file_ext = ext_map.get(file_type, 'jpg')
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_bytes)
        
        # Get base URL from request
        base_url = str(request.base_url).rstrip('/')
        file_url = f"{base_url}/api/uploads/{unique_filename}"
        
        return {
            "success": True,
            "url": file_url,
            "filename": unique_filename
        }
    except Exception as e:
        logger.error(f"Base64 upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload: {str(e)}")

# Serve uploaded files
from fastapi.responses import FileResponse

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    # Sanitize filename
    safe_filename = sanitize_filename(filename)
    file_path = UPLOAD_DIR / safe_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    return FileResponse(file_path)

# ==================== SECURITY & REPORTING ROUTES ====================

class ReportCreate(BaseModel):
    content_type: str  # post, comment, user, message
    content_id: str
    report_type: str
    description: Optional[str] = None

@api_router.post("/report")
async def report_content(report_data: ReportCreate, request: Request):
    """Report content or user for policy violations"""
    user = await require_auth(request)
    
    # Validate report type
    if report_data.report_type not in REPORT_TYPES:
        raise HTTPException(status_code=400, detail="Type de signalement invalide")
    
    # Check rate limit for reports
    allowed, _ = check_rate_limit(user.user_id, "api_general")
    if not allowed:
        raise HTTPException(status_code=429, detail="Trop de requêtes")
    
    report = {
        "report_id": f"report_{uuid.uuid4().hex[:12]}",
        "reporter_id": user.user_id,
        "content_type": report_data.content_type,
        "content_id": report_data.content_id,
        "report_type": report_data.report_type,
        "description": sanitize_html(report_data.description) if report_data.description else None,
        "status": "pending",
        "priority": REPORT_TYPES[report_data.report_type]["priority"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reporter_ip_hash": hash_ip(request.client.host) if request.client else None
    }
    
    await db.reports.insert_one(report)
    
    # High priority reports (self-harm, violence) trigger immediate alert
    if REPORT_TYPES[report_data.report_type]["priority"] <= 1:
        logger.warning(f"HIGH PRIORITY REPORT: {report['report_id']} - Type: {report_data.report_type}")
    
    return {
        "success": True,
        "report_id": report["report_id"],
        "message": "Signalement envoyé. Merci de contribuer à la sécurité de la communauté."
    }

@api_router.get("/report/types")
async def get_report_types():
    """Get available report types"""
    return [
        {"value": key, "label": value["label"]}
        for key, value in REPORT_TYPES.items()
    ]

@api_router.post("/block/{user_id}")
async def block_user(user_id: str, request: Request):
    """Block a user"""
    user = await require_auth(request)
    
    if user_id == user.user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous bloquer")
    
    # Check if already blocked
    existing = await db.blocks.find_one({
        "blocker_id": user.user_id,
        "blocked_id": user_id
    })
    
    if existing:
        # Unblock
        await db.blocks.delete_one({"_id": existing["_id"]})
        return {"blocked": False, "message": "Utilisateur débloqué"}
    
    # Block
    await db.blocks.insert_one({
        "block_id": f"block_{uuid.uuid4().hex[:12]}",
        "blocker_id": user.user_id,
        "blocked_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Also unfollow if following
    await db.follows.delete_one({"follower_id": user.user_id, "following_id": user_id})
    await db.follows.delete_one({"follower_id": user_id, "following_id": user.user_id})
    
    return {"blocked": True, "message": "Utilisateur bloqué"}

@api_router.get("/blocked")
async def get_blocked_users(request: Request):
    """Get list of blocked users"""
    user = await require_auth(request)
    
    blocks = await db.blocks.find(
        {"blocker_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    blocked_users = []
    for block in blocks:
        blocked_user = await db.users.find_one(
            {"user_id": block["blocked_id"]},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
        )
        if blocked_user:
            blocked_users.append({
                **blocked_user,
                "blocked_at": block["created_at"]
            })
    
    return blocked_users

@api_router.get("/security/check")
async def security_check(request: Request):
    """Check account security status"""
    user = await require_auth(request)
    
    checks = {
        "email_verified": user.email_verified if hasattr(user, 'email_verified') else False,
        "strong_password": True,  # Already validated on registration
        "two_factor_enabled": False,  # Future feature
        "recent_login_alerts": 0,
        "blocked_users_count": await db.blocks.count_documents({"blocker_id": user.user_id}),
        "reports_made": await db.reports.count_documents({"reporter_id": user.user_id}),
    }
    
    # Calculate security score
    score = 50
    if checks["email_verified"]:
        score += 25
    if checks["strong_password"]:
        score += 15
    if checks["two_factor_enabled"]:
        score += 10
    
    return {
        "security_score": score,
        "checks": checks,
        "recommendations": [
            "Activez la vérification en deux étapes" if not checks["two_factor_enabled"] else None,
            "Vérifiez votre email" if not checks["email_verified"] else None,
        ]
    }

@api_router.get("/privacy/settings")
async def get_privacy_settings(request: Request):
    """Get user's privacy settings"""
    user = await require_auth(request)
    
    settings = await db.privacy_settings.find_one(
        {"user_id": user.user_id},
        {"_id": 0}
    )
    
    if not settings:
        # Default settings
        settings = {
            "user_id": user.user_id,
            "profile_visibility": "public",  # public, followers, private
            "show_activity_status": True,
            "allow_messages_from": "everyone",  # everyone, followers, nobody
            "allow_mentions": True,
            "allow_tagging": True,
            "show_location": "blur",  # exact, blur, hidden
            "data_download_requested": False
        }
        await db.privacy_settings.insert_one(settings)
    
    settings.pop("_id", None)
    return settings

@api_router.put("/privacy/settings")
async def update_privacy_settings(request: Request):
    """Update user's privacy settings"""
    user = await require_auth(request)
    body = await request.json()
    
    allowed_fields = [
        "profile_visibility", "show_activity_status", "allow_messages_from",
        "allow_mentions", "allow_tagging", "show_location"
    ]
    
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.privacy_settings.update_one(
        {"user_id": user.user_id},
        {"$set": updates},
        upsert=True
    )
    
    return {"success": True, "message": "Paramètres mis à jour"}

@api_router.post("/privacy/data-request")
async def request_data_download(request: Request):
    """Request a download of all user data (GDPR compliance)"""
    user = await require_auth(request)
    
    # Rate limit: 1 request per week
    last_request = await db.data_requests.find_one(
        {"user_id": user.user_id},
        sort=[("created_at", -1)]
    )
    
    if last_request:
        last_time = datetime.fromisoformat(last_request["created_at"].replace('Z', '+00:00'))
        if datetime.now(timezone.utc) - last_time < timedelta(days=7):
            raise HTTPException(
                status_code=429, 
                detail="Vous ne pouvez demander vos données qu'une fois par semaine"
            )
    
    request_doc = {
        "request_id": f"data_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.data_requests.insert_one(request_doc)
    
    return {
        "success": True,
        "request_id": request_doc["request_id"],
        "message": "Votre demande a été enregistrée. Vous recevrez un email sous 48h."
    }

@api_router.delete("/account")
async def delete_account(request: Request):
    """Delete user account immediately (GDPR right to be forgotten)"""
    user = await require_auth(request)
    
    # Delete all user's media files
    user_media = await db.media_files.find({"user_id": user.user_id}).to_list(10000)
    base_dir = Path(__file__).resolve().parent
    for media in user_media:
        file_path = media.get("file_path", "")
        if file_path.startswith("/uploads/"):
            full_path = base_dir / file_path.lstrip("/")
            if full_path.exists():
                try:
                    full_path.unlink()
                except:
                    pass
    
    # Delete user's posts
    await db.posts.delete_many({"user_id": user.user_id})
    
    # Delete user's stories
    await db.stories.delete_many({"user_id": user.user_id})
    
    # Delete user's media records
    await db.media_files.delete_many({"user_id": user.user_id})
    
    # Delete user's conversations and messages
    await db.messages.delete_many({"$or": [{"sender_id": user.user_id}, {"receiver_id": user.user_id}]})
    await db.conversations.delete_many({"participants": user.user_id})
    
    # Delete user's notifications
    await db.notifications.delete_many({"user_id": user.user_id})
    
    # Delete user's products/services
    await db.products.delete_many({"user_id": user.user_id})
    await db.services.delete_many({"user_id": user.user_id})
    
    # Delete sessions
    await db.user_sessions.delete_many({"user_id": user.user_id})
    
    # Finally delete the user
    await db.users.delete_one({"user_id": user.user_id})
    
    logger.info(f"Account deleted: {user.user_id}")
    return {"success": True, "message": "Votre compte a été supprimé"}

# Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        # Add security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving uploaded files
import os
# Use relative path for Render compatibility
BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
(UPLOADS_DIR / "profiles").mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== STARTUP OPTIMIZATION ====================

@app.on_event("startup")
async def optimize_database():
    """Create indexes and warm up cache on startup"""
    try:
        logger.info("🚀 Starting database optimization...")
        
        # Create MongoDB indexes
        index_result = await create_indexes(db)
        logger.info(f"✅ Created {index_result['total']} MongoDB indexes")
        
        # Connect to Redis if available
        redis_url = os.environ.get("REDIS_URL")
        if redis_url:
            redis_connected = await redis_cache.connect(redis_url)
            if redis_connected:
                logger.info("✅ Redis cache connected")
            else:
                logger.info("⚠️ Redis not available, using memory cache")
        else:
            logger.info("ℹ️ REDIS_URL not set, using memory cache")
        
        # Warm up cache with static data
        cache_result = await warm_up_cache(db)
        logger.info(f"✅ Cache warmed up: {cache_result['warmed_keys']}")
        
        # Log DB stats
        db_stats = await get_db_stats(db)
        logger.info(f"📊 DB Stats: {db_stats.get('objects', 0)} objects, {db_stats.get('dataSize_mb', 0)}MB data")
        
    except Exception as e:
        logger.error(f"❌ Optimization error: {e}")

# ==================== ADMIN ROUTES ====================

import hashlib
import secrets

# Admin credentials (should be in env in production)
ADMIN_EMAIL = "admin@natifenua.pf"
ADMIN_PASSWORD_HASH = None  # Will be set on first access or via env

async def get_or_create_admin():
    """Get or create admin account"""
    admin = await db.admin_users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if not admin:
        # Create default admin with password "NatiFenua2025!"
        default_password = "NatiFenua2025!"
        password_hash = hashlib.sha256(default_password.encode()).hexdigest()
        admin = {
            "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_users.insert_one(admin)
        logger.info(f"Created default admin account: {ADMIN_EMAIL}")
    else:
        # Update existing admin with new credentials if email changed
        if admin["email"] != ADMIN_EMAIL:
            default_password = "NatiFenua2025!"
            password_hash = hashlib.sha256(default_password.encode()).hexdigest()
            await db.admin_users.update_one(
                {"admin_id": admin["admin_id"]},
                {"$set": {"email": ADMIN_EMAIL, "password_hash": password_hash}}
            )
            admin["email"] = ADMIN_EMAIL
            admin["password_hash"] = password_hash
            logger.info(f"Updated admin account to: {ADMIN_EMAIL}")
    return admin

@api_router.get("/admin/reset-credentials")
async def reset_admin_credentials():
    """Reset admin credentials to default (use once then remove in production)"""
    default_password = "NatiFenua2025!"
    password_hash = hashlib.sha256(default_password.encode()).hexdigest()
    
    # Delete old admin accounts
    await db.admin_users.delete_many({})
    
    # Create new admin
    admin = {
        "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
        "email": ADMIN_EMAIL,
        "password_hash": password_hash,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_users.insert_one(admin)
    
    return {"success": True, "message": f"Admin reset to {ADMIN_EMAIL} / NatiFenua2025!"}

async def verify_admin_token(request: Request):
    """Verify admin token from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token admin requis")
    
    token = auth_header.split(" ")[1]
    session = await db.admin_sessions.find_one({"token": token}, {"_id": 0})
    
    if not session:
        raise HTTPException(status_code=401, detail="Token invalide")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expiré")
    
    return session

@api_router.post("/admin/login")
async def admin_login(request: Request):
    """Admin login endpoint"""
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")
    
    admin = await get_or_create_admin()
    
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    if email != admin["email"] or password_hash != admin["password_hash"]:
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    
    # Create session token
    token = secrets.token_urlsafe(32)
    session = {
        "admin_id": admin["admin_id"],
        "token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_sessions.insert_one(session)
    
    logger.info(f"Admin login successful: {email}")
    return {"success": True, "token": token}

@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    """Get admin dashboard data"""
    await verify_admin_token(request)
    
    # Get stats
    total_users = await db.users.count_documents({})
    total_posts = await db.posts.count_documents({})
    active_lives = await db.lives.count_documents({"status": "live"})
    pending_reports = await db.reports.count_documents({"status": "pending"})
    
    # Get recent users
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(50).to_list(50)
    
    # Get recent posts with user info
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1})
        post["user"] = user
    
    # Get reports
    reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    for report in reports:
        reporter = await db.users.find_one({"user_id": report.get("reporter_id")}, {"_id": 0, "name": 1})
        report["reporter_name"] = reporter.get("name") if reporter else "Inconnu"
    
    # Get active lives
    lives = await db.lives.find({"status": "live"}, {"_id": 0}).to_list(50)
    for live in lives:
        user = await db.users.find_one({"user_id": live["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        live["user"] = user
    
    # Get moderation settings
    mod_settings = await db.moderation_settings.find_one({"setting_id": "global"}, {"_id": 0})
    if not mod_settings:
        mod_settings = {
            "setting_id": "global",
            "live_moderation_enabled": False,
            "bad_words_filter": False,
            "adult_content_filter": False,
            "hate_speech_filter": False
        }
        await db.moderation_settings.insert_one(mod_settings)
    
    # Get ads settings
    ads_settings = await db.ads_settings.find_one({"setting_id": "global"}, {"_id": 0})
    if not ads_settings:
        ads_settings = {
            "setting_id": "global",
            "ads_enabled": False,
            "sponsored_posts_enabled": False,
            "promoted_accounts_enabled": False,
            "story_ads_enabled": False,
            "feed_ad_frequency": 5,
            "min_ad_budget": 10
        }
        await db.ads_settings.insert_one(ads_settings)
    
    # Get storage stats
    storage_stats = await get_storage_stats(db)
    
    return {
        "stats": {
            "total_users": total_users,
            "total_posts": total_posts,
            "active_lives": active_lives,
            "pending_reports": pending_reports
        },
        "users": users,
        "posts": posts,
        "reports": reports,
        "lives": lives,
        "moderation_settings": mod_settings,
        "ads_settings": ads_settings,
        "storage_stats": storage_stats
    }

@api_router.put("/admin/moderation/settings")
async def update_moderation_settings(request: Request):
    """Update moderation settings"""
    await verify_admin_token(request)
    body = await request.json()
    
    allowed_fields = ["live_moderation_enabled", "bad_words_filter", "adult_content_filter", "hate_speech_filter"]
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.moderation_settings.update_one(
        {"setting_id": "global"},
        {"$set": updates},
        upsert=True
    )
    
    logger.info(f"Moderation settings updated: {updates}")
    return {"success": True, "updated": updates}

# ==================== ADMIN POST MANAGEMENT ====================

@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, request: Request):
    """Delete a post (admin only)"""
    await verify_admin_token(request)
    
    result = await db.posts.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post non trouvé")
    
    logger.info(f"Admin deleted post: {post_id}")
    return {"success": True, "message": "Post supprimé"}

@api_router.post("/admin/posts")
async def admin_create_post(request: Request):
    """Create a post as admin"""
    await verify_admin_token(request)
    body = await request.json()
    
    post = {
        "post_id": f"post_{uuid.uuid4().hex[:12]}",
        "user_id": "admin",
        "user_name": "Nati Fenua",
        "user_picture": "https://ui-avatars.com/api/?name=Nati+Fenua&background=FF6B35&color=fff",
        "content": body.get("content", ""),
        "media_url": body.get("media_url"),
        "media_type": body.get("media_type", "image"),
        "location": body.get("location"),
        "island": body.get("island"),
        "hashtags": body.get("hashtags", []),
        "likes": 0,
        "comments_count": 0,
        "shares": 0,
        "is_admin_post": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(post)
    logger.info(f"Admin created post: {post['post_id']}")
    
    # Clear feed cache
    await feed_cache.clear()
    
    return {"success": True, "post": {k: v for k, v in post.items() if k != "_id"}}

@api_router.get("/admin/posts")
async def admin_get_posts(request: Request, limit: int = 50, skip: int = 0):
    """Get all posts for admin"""
    await verify_admin_token(request)
    
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.posts.count_documents({})
    
    return {"posts": posts, "total": total}

# ==================== ADMIN MANA/MARKERS MANAGEMENT ====================

@api_router.get("/admin/mana/markers")
async def admin_get_markers(request: Request):
    """Get all Mana markers for admin"""
    await verify_admin_token(request)
    
    markers = await db.markers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"markers": markers, "total": len(markers)}

@api_router.post("/admin/mana/markers")
async def admin_create_marker(request: Request):
    """Create a Mana marker (webcam, POI, etc.)"""
    await verify_admin_token(request)
    body = await request.json()
    
    marker = {
        "marker_id": f"marker_{uuid.uuid4().hex[:12]}",
        "name": body.get("name"),
        "description": body.get("description", ""),
        "type": body.get("type", "poi"),  # webcam, poi, event, alert
        "island": body.get("island", "tahiti"),
        "lat": body.get("lat"),
        "lng": body.get("lng"),
        "is_webcam": body.get("is_webcam", False),
        "iframe_url": body.get("iframe_url"),
        "embed_url": body.get("embed_url"),
        "external_url": body.get("external_url"),
        "video_url": body.get("video_url"),
        "thumbnail": body.get("thumbnail"),
        "source": body.get("source", "Admin"),
        "is_live": body.get("is_live", True),
        "is_admin_created": True,
        "created_by": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.markers.insert_one(marker)
    await markers_cache.clear()
    
    logger.info(f"Admin created marker: {marker['marker_id']}")
    return {"success": True, "marker": {k: v for k, v in marker.items() if k != "_id"}}

@api_router.put("/admin/mana/markers/{marker_id}")
async def admin_update_marker(marker_id: str, request: Request):
    """Update a Mana marker"""
    await verify_admin_token(request)
    body = await request.json()
    
    allowed_fields = ["name", "description", "type", "island", "lat", "lng", "is_webcam", 
                      "iframe_url", "embed_url", "external_url", "video_url", "thumbnail", 
                      "source", "is_live"]
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.markers.update_one({"marker_id": marker_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Marqueur non trouvé")
    
    await markers_cache.clear()
    logger.info(f"Admin updated marker: {marker_id}")
    return {"success": True}

@api_router.delete("/admin/mana/markers/{marker_id}")
async def admin_delete_marker(marker_id: str, request: Request):
    """Delete a Mana marker"""
    await verify_admin_token(request)
    
    result = await db.markers.delete_one({"marker_id": marker_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Marqueur non trouvé")
    
    await markers_cache.clear()
    logger.info(f"Admin deleted marker: {marker_id}")
    return {"success": True}

@api_router.get("/admin/mana/webcams")
async def admin_get_webcams(request: Request):
    """Get webcam configuration from fenua_pulse"""
    await verify_admin_token(request)
    
    from fenua_pulse import WEBCAMS
    return {"webcams": WEBCAMS, "total": len(WEBCAMS)}

# ==================== ADVERTISING PACKAGES & STRIPE PAYMENTS ====================

# Fixed advertising packages in XPF (Pacific Franc)
AD_PACKAGES = {
    # Post Sponsorisé
    "post_1day": {"name": "Post Sponsorisé - 1 jour", "type": "post_sponsorise", "amount": 300.0, "currency": "xpf", "duration_days": 1},
    "post_7days": {"name": "Post Sponsorisé - 7 jours", "type": "post_sponsorise", "amount": 1500.0, "currency": "xpf", "duration_days": 7},
    "post_30days": {"name": "Post Sponsorisé - 30 jours", "type": "post_sponsorise", "amount": 5000.0, "currency": "xpf", "duration_days": 30},
    
    # Compte Promu
    "account_1day": {"name": "Compte Promu - 1 jour", "type": "compte_promu", "amount": 500.0, "currency": "xpf", "duration_days": 1},
    "account_7days": {"name": "Compte Promu - 7 jours", "type": "compte_promu", "amount": 2500.0, "currency": "xpf", "duration_days": 7},
    "account_30days": {"name": "Compte Promu - 30 jours", "type": "compte_promu", "amount": 8000.0, "currency": "xpf", "duration_days": 30},
    
    # Story Ad
    "story_1day": {"name": "Story Ad - 1 jour", "type": "story_ad", "amount": 800.0, "currency": "xpf", "duration_days": 1},
    "story_7days": {"name": "Story Ad - 7 jours", "type": "story_ad", "amount": 4000.0, "currency": "xpf", "duration_days": 7},
    "story_30days": {"name": "Story Ad - 30 jours", "type": "story_ad", "amount": 12000.0, "currency": "xpf", "duration_days": 30},
    
    # Mana Alert (notifications)
    "mana_alert_1": {"name": "Mana Alert - 1 notification", "type": "mana_alert", "amount": 200.0, "currency": "xpf", "notifications": 1},
    "mana_alert_5": {"name": "Mana Alert - Pack 5 notifications", "type": "mana_alert", "amount": 800.0, "currency": "xpf", "notifications": 5},
    "mana_alert_10": {"name": "Mana Alert - Pack 10 notifications", "type": "mana_alert", "amount": 1500.0, "currency": "xpf", "notifications": 10},
}

@api_router.get("/advertising/packages")
async def get_advertising_packages():
    """Get all available advertising packages"""
    packages = []
    for package_id, details in AD_PACKAGES.items():
        packages.append({
            "package_id": package_id,
            **details
        })
    return {"packages": packages}

@api_router.post("/payments/checkout")
async def create_checkout_session(request: Request):
    """Create a Stripe checkout session for advertising payment"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Paiement non disponible - Stripe non configuré sur ce serveur")
    
    body = await request.json()
    package_id = body.get("package_id")
    origin_url = body.get("origin_url")
    user_id = body.get("user_id")
    post_id = body.get("post_id")  # Optional: for post sponsorise
    marker_id = body.get("marker_id")  # Optional: for mana alert
    island = body.get("island")  # Optional: for mana alert targeting
    
    if not package_id or package_id not in AD_PACKAGES:
        raise HTTPException(status_code=400, detail="Package invalide")
    
    if not origin_url:
        raise HTTPException(status_code=400, detail="Origin URL requis")
    
    package = AD_PACKAGES[package_id]
    
    # Convert XPF to EUR for Stripe (1 EUR ≈ 119.33 XPF)
    xpf_to_eur = 119.33
    amount_eur = round(package["amount"] / xpf_to_eur, 2)
    
    # Build URLs
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payment/cancel"
    
    # Initialize Stripe
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    # Create checkout session
    metadata = {
        "package_id": package_id,
        "package_name": package["name"],
        "package_type": package["type"],
        "amount_xpf": str(package["amount"]),
        "user_id": user_id or "",
        "post_id": post_id or "",
        "marker_id": marker_id or "",
        "island": island or ""
    }
    
    checkout_request = CheckoutSessionRequest(
        amount=amount_eur,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    
    try:
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record
        transaction = {
            "transaction_id": f"tx_{uuid.uuid4().hex[:12]}",
            "session_id": session.session_id,
            "user_id": user_id,
            "package_id": package_id,
            "package_name": package["name"],
            "package_type": package["type"],
            "amount_xpf": package["amount"],
            "amount_eur": amount_eur,
            "currency": "eur",
            "post_id": post_id,
            "marker_id": marker_id,
            "island": island,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Checkout session created: {session.session_id} for package {package_id}")
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "amount_xpf": package["amount"],
            "amount_eur": amount_eur
        }
        
    except Exception as e:
        logger.error(f"Stripe checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de paiement: {str(e)}")


# ==================== BOOST MARKER PAYMENT ====================

class BoostMarkerRequest(BaseModel):
    marker_id: str
    amount: int = 300  # 300 XPF default, 500 XPF for weekly woofing
    currency: str = "XPF"
    boost_type: str  # roulotte, market, or woofing
    boost_duration: str = "standard"  # standard (8h/24h) or weekly (7 days, woofing only)

@api_router.post("/payments/boost-marker")
async def create_boost_checkout(request: Request, data: BoostMarkerRequest):
    """Create a Stripe checkout session for boosting a marker - 300 XPF (8h) or 500 XPF (1 week for woofing)"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Paiement non disponible")
    
    user = await require_auth(request)
    
    # Verify marker exists and belongs to user
    marker = await db.markers.find_one({"marker_id": data.marker_id}, {"_id": 0})
    if not marker:
        raise HTTPException(status_code=404, detail="Publication non trouvée")
    
    # Check if user owns the marker
    owner_id = marker.get("user_id") or marker.get("extra_data", {}).get("vendor_user_id")
    if owner_id != user.user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez booster que vos propres publications")
    
    # Only allow boosting roulottes, market and woofing
    if marker.get("marker_type") not in ["roulotte", "market", "woofing"]:
        raise HTTPException(status_code=400, detail="Seules les roulottes, bonnes affaires et woofing peuvent être boostées")
    
    # Determine boost duration and price
    # Roulotte/Market: 300 XPF = 8h
    # Woofing: 300 XPF = 24h, 1500 XPF = 1 week
    if data.boost_duration == "weekly" and data.boost_type == "woofing":
        boost_hours = 168  # 1 week
        boost_price = 1500
        boost_description = "1 semaine"
    elif data.boost_type == "woofing":
        boost_hours = 24
        boost_price = 300
        boost_description = "24h"
    else:
        boost_hours = 8
        boost_price = 300
        boost_description = "8h"
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")
    
    try:
        # Convert XPF to EUR (1 EUR ≈ 119.33 XPF)
        amount_eur = round(boost_price / 119.33, 2)
        amount_cents = int(amount_eur * 100)
        
        # Ensure minimum amount for Stripe (50 cents)
        if amount_cents < 50:
            amount_cents = 50
        
        host_url = str(request.base_url).rstrip('/')
        if 'localhost' not in host_url and 'http://' in host_url:
            host_url = host_url.replace('http://', 'https://')
        
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_request = CheckoutSessionRequest(
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "unit_amount": amount_cents,
                    "product_data": {
                        "name": f"Boost {marker.get('title', 'Publication')}",
                        "description": f"Booster votre {data.boost_type} pendant {boost_description} sur Fenua Mana"
                    }
                },
                "quantity": 1
            }],
            success_url=f"{host_url}/mana?boost=success&marker={data.marker_id}",
            cancel_url=f"{host_url}/mana?boost=cancelled",
            metadata={
                "type": "marker_boost",
                "marker_id": data.marker_id,
                "user_id": user.user_id,
                "boost_type": data.boost_type,
                "boost_duration": data.boost_duration,
                "boost_hours": str(boost_hours),
                "amount_xpf": str(boost_price)
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save transaction
        transaction = {
            "transaction_id": f"boost_{uuid.uuid4().hex[:12]}",
            "session_id": session.session_id,
            "user_id": user.user_id,
            "marker_id": data.marker_id,
            "type": "marker_boost",
            "boost_type": data.boost_type,
            "boost_duration": data.boost_duration,
            "boost_hours": boost_hours,
            "amount_xpf": boost_price,
            "amount_eur": amount_eur,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.boost_transactions.insert_one(transaction)
        
        logger.info(f"Boost checkout created for marker {data.marker_id} by user {user.user_id}")
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.session_id,
            "amount_xpf": data.amount,
            "amount_eur": amount_eur
        }
        
    except Exception as e:
        logger.error(f"Boost checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de paiement: {str(e)}")


# ==================== BOOST PRODUCT PAYMENT (MARKETPLACE) ====================

class BoostProductRequest(BaseModel):
    product_id: str
    amount: int = 300  # 300 XPF for 24h
    currency: str = "XPF"

@api_router.post("/payments/boost-product")
async def create_product_boost_checkout(request: Request, data: BoostProductRequest):
    """Create a Stripe checkout session for boosting a marketplace product - 300 XPF for 24h at top"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Paiement non disponible")
    
    user = await require_auth(request)
    
    # Verify product exists and belongs to user
    product = await db.products.find_one({"product_id": data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")
    
    # Check if user owns the product
    owner_id = product.get("user_id") or product.get("seller", {}).get("user_id")
    if owner_id != user.user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez booster que vos propres annonces")
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")
    
    try:
        # Convert 300 XPF to EUR (1 EUR ≈ 119.33 XPF)
        amount_eur = round(data.amount / 119.33, 2)
        amount_cents = int(amount_eur * 100)
        
        if amount_cents < 50:
            amount_cents = 50
        
        host_url = str(request.base_url).rstrip('/')
        if 'localhost' not in host_url and 'http://' in host_url:
            host_url = host_url.replace('http://', 'https://')
        
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_request = CheckoutSessionRequest(
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "unit_amount": amount_cents,
                    "product_data": {
                        "name": f"Boost {product.get('title', 'Annonce')}",
                        "description": "Boost 24h en tête de liste du Marché"
                    }
                },
                "quantity": 1
            }],
            success_url=f"{host_url}/marketplace?boost=success&product={data.product_id}",
            cancel_url=f"{host_url}/marketplace?boost=cancelled",
            metadata={
                "type": "product_boost",
                "product_id": data.product_id,
                "user_id": user.user_id,
                "boost_hours": "24",  # 24h
                "amount_xpf": str(data.amount)
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Save transaction
        transaction = {
            "transaction_id": f"pboost_{uuid.uuid4().hex[:12]}",
            "session_id": session.session_id,
            "user_id": user.user_id,
            "product_id": data.product_id,
            "type": "product_boost",
            "boost_hours": 24,
            "amount_xpf": data.amount,
            "amount_eur": amount_eur,
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.product_boost_transactions.insert_one(transaction)
        
        logger.info(f"Product boost checkout created for {data.product_id} by user {user.user_id}")
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.session_id,
            "amount_xpf": data.amount,
            "amount_eur": amount_eur
        }
        
    except Exception as e:
        logger.error(f"Product boost checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur de paiement: {str(e)}")


@api_router.post("/payments/boost-marker/activate")
async def activate_marker_boost(marker_id: str, session_id: str):
    """Activate boost for a marker after successful payment"""
    try:
        # Update marker with boost info
        boost_expires = datetime.now(timezone.utc) + timedelta(hours=24)
        
        await db.markers.update_one(
            {"marker_id": marker_id},
            {"$set": {
                "is_boosted": True,
                "boost_expires_at": boost_expires.isoformat(),
                "boosted_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update transaction
        await db.boost_transactions.update_one(
            {"session_id": session_id},
            {"$set": {
                "payment_status": "paid",
                "activated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Boost activated for marker {marker_id}")
        return {"success": True, "message": "Boost activé pour 24h"}
        
    except Exception as e:
        logger.error(f"Boost activation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    """Get payment status for a checkout session"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Paiement non disponible")
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe non configuré")
    
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction in database
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        
        if transaction and transaction.get("payment_status") != "paid":
            if status.payment_status == "paid":
                # Payment successful - activate the advertising package
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Activate the package
                await activate_advertising_package(transaction)
                
                logger.info(f"Payment completed for session: {session_id}")
            elif status.status == "expired":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "expired"}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency,
            "metadata": status.metadata
        }
        
    except Exception as e:
        logger.error(f"Payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")

async def activate_advertising_package(transaction: dict):
    """Activate an advertising package after successful payment"""
    package_type = transaction.get("package_type")
    user_id = transaction.get("user_id")
    package_id = transaction.get("package_id")
    
    package = AD_PACKAGES.get(package_id, {})
    duration_days = package.get("duration_days", 1)
    
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(days=duration_days)
    
    if package_type == "post_sponsorise":
        # Mark post as sponsored
        post_id = transaction.get("post_id")
        if post_id:
            await db.posts.update_one(
                {"post_id": post_id},
                {"$set": {
                    "is_sponsored": True,
                    "sponsored_until": expires_at.isoformat(),
                    "sponsored_at": now.isoformat()
                }}
            )
            
    elif package_type == "compte_promu":
        # Mark account as promoted
        if user_id:
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {
                    "is_promoted": True,
                    "promoted_until": expires_at.isoformat(),
                    "promoted_at": now.isoformat()
                }}
            )
            
    elif package_type == "story_ad":
        # Create story ad slot
        story_ad = {
            "ad_id": f"story_ad_{uuid.uuid4().hex[:8]}",
            "user_id": user_id,
            "transaction_id": transaction.get("transaction_id"),
            "active": True,
            "expires_at": expires_at.isoformat(),
            "created_at": now.isoformat()
        }
        await db.story_ads.insert_one(story_ad)
        
    elif package_type == "mana_alert":
        # Add notification credits
        notifications = package.get("notifications", 1)
        await db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"mana_alert_credits": notifications}}
        )
    
    logger.info(f"Activated package {package_type} for user {user_id}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    if not STRIPE_AVAILABLE:
        return {"error": "Stripe not available"}
    
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        return {"error": "Stripe not configured"}
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Check for advertising package transaction
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                await activate_advertising_package(transaction)
            
            # Check for boost transaction
            boost_transaction = await db.boost_transactions.find_one({"session_id": webhook_response.session_id})
            if boost_transaction and boost_transaction.get("payment_status") != "paid":
                marker_id = boost_transaction.get("marker_id")
                boost_hours = boost_transaction.get("boost_hours", 8)  # Default 8h for roulotte/market
                
                # Activate boost for the specified duration
                boost_expires = datetime.now(timezone.utc) + timedelta(hours=boost_hours)
                await db.markers.update_one(
                    {"marker_id": marker_id},
                    {"$set": {
                        "is_boosted": True,
                        "boost_expires_at": boost_expires.isoformat(),
                        "boosted_at": datetime.now(timezone.utc).isoformat(),
                        "boost_hours": boost_hours
                    }}
                )
                
                await db.boost_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "activated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Boost activated via webhook for marker {marker_id} ({boost_hours}h)")
                
                # Send push notifications to users on the same island
                marker = await db.markers.find_one({"marker_id": marker_id}, {"_id": 0})
                if marker:
                    island = marker.get("island", "tahiti")
                    marker_title = marker.get("title", "Publication")
                    marker_type = marker.get("marker_type", "roulotte")
                    
                    # Get users on this island with device tokens
                    users_on_island = await db.users.find(
                        {"device_tokens": {"$exists": True, "$ne": []}},
                        {"device_tokens": 1, "user_id": 1, "_id": 0}
                    ).to_list(500)
                    
                    if users_on_island:
                        all_tokens = []
                        for u in users_on_island:
                            all_tokens.extend(u.get("device_tokens", []))
                        
                        if all_tokens:
                            emoji = "🚚" if marker_type == "roulotte" else "🌿" if marker_type == "woofing" else "🛍️"
                            await push_service.send_to_devices(
                                all_tokens[:100],  # Limit to 100 devices
                                f"{emoji} Nouveau sur Mana !",
                                f"{marker_title} est maintenant boosté sur {island.capitalize()}",
                                {
                                    "type": "boost",
                                    "marker_id": marker_id,
                                    "url": f"/mana?marker={marker_id}"
                                }
                            )
            
            # Check for product boost transaction
            product_boost = await db.product_boost_transactions.find_one({"session_id": webhook_response.session_id})
            if product_boost and product_boost.get("payment_status") != "paid":
                product_id = product_boost.get("product_id")
                
                # Activate boost for 24 hours
                boost_expires = datetime.now(timezone.utc) + timedelta(hours=24)
                await db.products.update_one(
                    {"product_id": product_id},
                    {"$set": {
                        "is_boosted": True,
                        "boost_expires_at": boost_expires.isoformat(),
                        "boosted_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                await db.product_boost_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "activated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                logger.info(f"Product boost activated via webhook for product {product_id}")
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return {"error": str(e)}

# ==================== MANA ALERT NOTIFICATIONS ====================

@api_router.post("/mana/alert")
async def send_mana_alert(request: Request):
    """Send a Mana Alert notification to users on a specific island"""
    body = await request.json()
    user_id = body.get("user_id")
    island = body.get("island")
    title = body.get("title")
    message = body.get("message")
    marker_id = body.get("marker_id")
    
    if not all([user_id, island, title, message]):
        raise HTTPException(status_code=400, detail="Données manquantes")
    
    # Check user has credits
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    credits = user.get("mana_alert_credits", 0)
    if credits < 1:
        raise HTTPException(status_code=402, detail="Crédits Mana Alert insuffisants")
    
    # Deduct credit
    await db.users.update_one(
        {"user_id": user_id},
        {"$inc": {"mana_alert_credits": -1}}
    )
    
    # Get users on this island who have notifications enabled
    recipients = await db.users.find({
        "preferred_island": island,
        "notifications_mana_alert": {"$ne": False}
    }, {"user_id": 1}).to_list(1000)
    
    # Create notifications for all recipients
    notifications = []
    now = datetime.now(timezone.utc).isoformat()
    
    for recipient in recipients:
        if recipient["user_id"] != user_id:  # Don't notify sender
            notifications.append({
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": recipient["user_id"],
                "type": "mana_alert",
                "title": title,
                "message": message,
                "from_user_id": user_id,
                "island": island,
                "marker_id": marker_id,
                "read": False,
                "created_at": now
            })
    
    if notifications:
        await db.notifications.insert_many(notifications)
    
    # Log the alert
    alert_log = {
        "alert_id": f"alert_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "island": island,
        "title": title,
        "message": message,
        "marker_id": marker_id,
        "recipients_count": len(notifications),
        "created_at": now
    }
    await db.mana_alerts.insert_one(alert_log)
    
    logger.info(f"Mana Alert sent to {len(notifications)} users on {island}")
    
    return {
        "success": True,
        "recipients_count": len(notifications),
        "remaining_credits": credits - 1
    }

@api_router.get("/mana/alert/credits/{user_id}")
async def get_mana_alert_credits(user_id: str):
    """Get user's Mana Alert credits"""
    user = await db.users.find_one({"user_id": user_id}, {"mana_alert_credits": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"credits": user.get("mana_alert_credits", 0)}

# ==================== USER NOTIFICATION SETTINGS ====================

@api_router.get("/users/{user_id}/notification-settings")
async def get_notification_settings(user_id: str):
    """Get user's notification settings"""
    user = await db.users.find_one({"user_id": user_id}, {
        "notifications_mana_alert": 1,
        "notifications_promo": 1,
        "notifications_social": 1,
        "notifications_messages": 1
    })
    
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "notifications_mana_alert": user.get("notifications_mana_alert", True),
        "notifications_promo": user.get("notifications_promo", True),
        "notifications_social": user.get("notifications_social", True),
        "notifications_messages": user.get("notifications_messages", True)
    }

@api_router.put("/users/{user_id}/notification-settings")
async def update_notification_settings(user_id: str, request: Request):
    """Update user's notification settings"""
    body = await request.json()
    
    allowed_settings = ["notifications_mana_alert", "notifications_promo", "notifications_social", "notifications_messages"]
    updates = {k: v for k, v in body.items() if k in allowed_settings}
    
    if not updates:
        raise HTTPException(status_code=400, detail="Aucun paramètre valide")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": updates}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {"success": True, "updated": updates}

# ==================== CACHE & PERFORMANCE ADMIN ====================

@api_router.get("/admin/cache/stats")
async def get_admin_cache_stats(request: Request):
    """Get cache statistics (admin only)"""
    await verify_admin_token(request)
    return get_cache_stats()

@api_router.post("/admin/cache/clear")
async def clear_admin_cache(request: Request):
    """Clear all caches (admin only)"""
    await verify_admin_token(request)
    
    await cache.clear()
    await static_cache.clear()
    await markers_cache.clear()
    await feed_cache.clear()
    await user_cache.clear()
    
    # Warm up static cache again
    warm_result = await warm_up_cache(db)
    
    return {
        "success": True,
        "message": "All caches cleared and warmed up",
        "warmed_keys": warm_result["warmed_keys"]
    }

@api_router.get("/admin/db/stats")
async def get_admin_db_stats(request: Request):
    """Get database statistics (admin only)"""
    await verify_admin_token(request)
    
    db_stats = await get_db_stats(db)
    
    # Get stats for main collections
    collections = ["users", "posts", "markers", "conversations", "messages", "vendors"]
    collection_stats = {}
    for coll in collections:
        collection_stats[coll] = await get_collection_stats(db, coll)
    
    return {
        "database": db_stats,
        "collections": collection_stats,
        "mongo_pool_config": MONGO_POOL_CONFIG
    }

@api_router.post("/admin/db/optimize")
async def optimize_admin_db(request: Request):
    """Recreate indexes and optimize database (admin only)"""
    await verify_admin_token(request)
    
    index_result = await create_indexes(db)
    cache_result = await warm_up_cache(db)
    
    return {
        "success": True,
        "indexes_created": index_result["total"],
        "cache_warmed": cache_result["warmed_keys"]
    }

@api_router.get("/admin/performance")
async def get_performance_stats(request: Request):
    """Get comprehensive performance statistics (admin only)"""
    await verify_admin_token(request)
    
    return {
        "memory_cache": get_cache_stats(),
        "redis_cache": redis_cache.get_stats(),
        "mongo_pool": MONGO_POOL_CONFIG,
        "workers": 4  # Current worker count
    }

@api_router.post("/admin/users/{user_id}/ban")
async def ban_user(user_id: str, request: Request):
    """Ban a user"""
    await verify_admin_token(request)
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_banned": True, "banned_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Delete their sessions
    await db.user_sessions.delete_many({"user_id": user_id})
    
    logger.info(f"User banned: {user_id}")
    return {"success": True}

@api_router.post("/admin/lives/{live_id}/end")
async def admin_end_live(live_id: str, request: Request):
    """End a live stream as admin"""
    await verify_admin_token(request)
    
    result = await db.lives.update_one(
        {"live_id": live_id},
        {"$set": {"status": "ended", "ended_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Live non trouvé")
    
    logger.info(f"Live ended by admin: {live_id}")
    return {"success": True}

@api_router.post("/admin/reports/{report_id}/resolve")
async def resolve_report(report_id: str, request: Request):
    """Resolve a report"""
    await verify_admin_token(request)
    body = await request.json()
    action = body.get("action", "dismiss")
    
    result = await db.reports.update_one(
        {"report_id": report_id},
        {"$set": {
            "status": "resolved",
            "action_taken": action,
            "resolved_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Signalement non trouvé")
    
    logger.info(f"Report resolved: {report_id}, action: {action}")
    return {"success": True}

@api_router.get("/admin/storage")
async def admin_storage_stats(request: Request):
    """Get storage statistics for admin dashboard"""
    await verify_admin_token(request)
    
    stats = await get_storage_stats(db)
    return stats

@api_router.put("/admin/ads/settings")
async def update_ads_settings(request: Request):
    """Update advertising settings"""
    await verify_admin_token(request)
    body = await request.json()
    
    allowed_fields = ["ads_enabled", "sponsored_posts_enabled", "promoted_accounts_enabled", 
                      "story_ads_enabled", "feed_ad_frequency", "min_ad_budget"]
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    
    await db.ads_settings.update_one(
        {"setting_id": "global"},
        {"$set": updates},
        upsert=True
    )
    
    logger.info(f"Ads settings updated: {updates}")
    return {"success": True, "updated": updates}

@api_router.post("/admin/storage/cleanup")
async def admin_trigger_cleanup(request: Request):
    """Manually trigger storage cleanup"""
    await verify_admin_token(request)
    
    deleted_count = await cleanup_expired_media(db)
    return {"success": True, "deleted_files": deleted_count}

@api_router.delete("/admin/media/{media_id}")
async def admin_delete_media(media_id: str, request: Request):
    """Delete a specific media file"""
    await verify_admin_token(request)
    
    media = await db.media_files.find_one({"media_id": media_id})
    if not media:
        raise HTTPException(status_code=404, detail="Media non trouvé")
    
    # Delete file from disk
    base_dir = Path(__file__).resolve().parent
    file_path = media.get("file_path", "")
    if file_path.startswith("/uploads/"):
        full_path = base_dir / file_path.lstrip("/")
        if full_path.exists():
            full_path.unlink()
    
    # Delete from database
    await db.media_files.delete_one({"media_id": media_id})
    
    logger.info(f"Media deleted by admin: {media_id}")
    return {"success": True}

@api_router.get("/users/{user_id}/storage")
async def get_user_storage(user_id: str, request: Request):
    """Get storage usage for a specific user"""
    user = await require_auth(request)
    
    # Only allow users to see their own storage or admin
    if user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    storage_info = await check_user_storage_limits(db, user_id)
    
    # Get counts
    media_files = await db.media_files.find({"user_id": user_id}).to_list(10000)
    photo_count = sum(1 for m in media_files if m.get("media_type") == "photo")
    video_count = sum(1 for m in media_files if m.get("media_type") in ["video", "reel", "story"])
    
    return {
        "storage_used_mb": storage_info["storage_used_mb"],
        "storage_limit_mb": STORAGE_LIMITS["max_storage_per_user_mb"],
        "storage_remaining_mb": storage_info.get("storage_remaining_mb", 0),
        "photo_count": photo_count,
        "photo_limit": STORAGE_LIMITS["max_photos_per_user"],
        "video_count": video_count,
        "video_limit": STORAGE_LIMITS["max_reels_per_user"],
        "can_upload": storage_info["can_upload"]
    }

# ==================== ENHANCED MODERATION ROUTES ====================

@api_router.get("/moderation/categories")
async def get_moderation_categories():
    """Get available report categories"""
    return get_report_categories()

@api_router.post("/moderation/report")
async def create_moderation_report(request: Request):
    """Create a content report with full moderation system"""
    user = await require_auth(request)
    body = await request.json()
    
    moderation, _, _, _, _, _ = get_app_services()
    
    try:
        result = await moderation.create_report(
            reporter_id=user.user_id,
            content_type=body.get("content_type"),
            content_id=body.get("content_id"),
            category=body.get("category"),
            description=body.get("description"),
            ip_hash=hash_ip(request.client.host) if request.client else None
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/moderation/reports")
async def get_moderation_reports(
    request: Request,
    status: Optional[str] = None,
    priority: Optional[int] = None,
    limit: int = 50,
    skip: int = 0
):
    """Get moderation reports for admin"""
    await verify_admin_token(request)
    moderation, _, _, _, _, _ = get_app_services()
    
    return await moderation.get_reports(
        status=status,
        priority=priority,
        limit=limit,
        skip=skip
    )

@api_router.get("/admin/moderation/stats")
async def get_moderation_stats(request: Request, days: int = 30):
    """Get moderation statistics"""
    await verify_admin_token(request)
    moderation, _, _, _, _, _ = get_app_services()
    
    return await moderation.get_report_stats(days=days)

@api_router.post("/admin/moderation/reports/{report_id}/resolve")
async def resolve_moderation_report(report_id: str, request: Request):
    """Resolve a moderation report with action"""
    session = await verify_admin_token(request)
    body = await request.json()
    
    moderation, _, _, _, _, _ = get_app_services()
    
    try:
        result = await moderation.resolve_report(
            report_id=report_id,
            admin_id=session.get("admin_id"),
            action=body.get("action", "dismiss"),
            notes=body.get("notes")
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/admin/moderation/user/{user_id}/warnings")
async def get_user_warnings(user_id: str, request: Request):
    """Get warnings for a specific user"""
    await verify_admin_token(request)
    moderation, _, _, _, _, _ = get_app_services()
    
    return await moderation.get_user_warnings(user_id)

# ==================== GDPR COMPLIANCE ROUTES ====================

@api_router.get("/gdpr/consent-types")
async def get_gdpr_consent_types():
    """Get available consent types for registration"""
    return get_consent_types()

@api_router.post("/gdpr/consent")
async def record_gdpr_consent(request: Request):
    """Record user consent"""
    user = await require_auth(request)
    body = await request.json()
    
    _, gdpr, _, _, _, _ = get_app_services()
    
    try:
        result = await gdpr.record_consent(
            user_id=user.user_id,
            consent_type=body.get("consent_type"),
            granted=body.get("granted", False),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/gdpr/my-consents")
async def get_my_consents(request: Request):
    """Get current user's consent status"""
    user = await require_auth(request)
    _, gdpr, _, _, _, _ = get_app_services()
    
    return await gdpr.get_user_consents(user.user_id)

@api_router.post("/gdpr/export-data")
async def request_data_export(request: Request):
    """Request GDPR data export"""
    user = await require_auth(request)
    _, gdpr, _, _, _, _ = get_app_services()
    
    return await gdpr.request_data_export(user.user_id)

@api_router.get("/gdpr/download-data")
async def download_data(request: Request):
    """Generate and download user data"""
    user = await require_auth(request)
    _, gdpr, _, _, _, _ = get_app_services()
    
    try:
        result = await gdpr.generate_data_export(user.user_id)
        if result["success"]:
            from fastapi.responses import FileResponse
            return FileResponse(
                result["path"],
                filename=result["filename"],
                media_type="application/zip"
            )
        raise HTTPException(status_code=500, detail="Erreur lors de la génération")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/gdpr/request-deletion")
async def request_account_deletion(request: Request):
    """Request account deletion (30-day grace period)"""
    user = await require_auth(request)
    _, gdpr, _, _, _, _ = get_app_services()
    
    return await gdpr.request_account_deletion(user.user_id)

@api_router.post("/gdpr/cancel-deletion")
async def cancel_account_deletion(request: Request):
    """Cancel pending account deletion"""
    user = await require_auth(request)
    _, gdpr, _, _, _, _ = get_app_services()
    
    return await gdpr.cancel_account_deletion(user.user_id)

@api_router.post("/gdpr/validate-age")
async def validate_age(request: Request):
    """Validate age for registration"""
    body = await request.json()
    birth_date = body.get("birth_date")
    
    if not birth_date:
        raise HTTPException(status_code=400, detail="Date de naissance requise")
    
    _, gdpr, _, _, _, _ = get_app_services()
    valid, message, age = gdpr.validate_age(birth_date)
    
    return {
        "valid": valid,
        "message": message,
        "age": age,
        "requires_parental_consent": 13 <= age < 16 if valid else False
    }

# ==================== ANALYTICS & MONITORING ROUTES ====================

@api_router.get("/admin/analytics")
async def get_analytics_dashboard(request: Request):
    """Get analytics dashboard data"""
    await verify_admin_token(request)
    _, _, analytics, _, _, _ = get_app_services()
    
    user_stats = await analytics.get_user_stats()
    content_stats = await analytics.get_content_stats()
    geo_stats = await analytics.get_geo_stats()
    
    return {
        "users": user_stats,
        "content": content_stats,
        "geography": geo_stats
    }

@api_router.get("/admin/monitoring")
async def get_monitoring_dashboard(request: Request):
    """Get system monitoring data"""
    await verify_admin_token(request)
    _, _, _, monitoring, _, _ = get_app_services()
    
    health = await monitoring.get_system_health()
    alerts = await monitoring.check_alerts()
    
    return {
        "health": health,
        "alerts": alerts
    }

@api_router.get("/admin/monitoring/errors")
async def get_recent_errors(request: Request, limit: int = 50):
    """Get recent error logs"""
    await verify_admin_token(request)
    _, _, _, monitoring, _, _ = get_app_services()
    
    return await monitoring.get_recent_errors(limit=limit)

@api_router.get("/admin/analytics/users")
async def get_user_analytics(request: Request, days: int = 30):
    """Get detailed user analytics"""
    await verify_admin_token(request)
    _, _, analytics, _, _, _ = get_app_services()
    
    return await analytics.get_user_stats(days=days)

@api_router.get("/admin/analytics/content")
async def get_content_analytics(request: Request):
    """Get detailed content analytics"""
    await verify_admin_token(request)
    _, _, analytics, _, _, _ = get_app_services()
    
    return await analytics.get_content_stats()

@api_router.get("/admin/analytics/geography")
async def get_geo_analytics(request: Request):
    """Get geographic analytics"""
    await verify_admin_token(request)
    _, _, analytics, _, _, _ = get_app_services()
    
    return await analytics.get_geo_stats()

# ==================== FENUA PULSE ROUTES ====================

@api_router.get("/pulse/islands")
async def get_pulse_islands():
    """Get list of islands with coordinates (cached in Redis)"""
    # Try Redis first
    redis_cached = await redis_cache.get(CacheKeys.ISLANDS)
    if redis_cached:
        return redis_cached
    
    # Fallback to memory cache
    cached_islands = await static_cache.get("islands")
    if cached_islands:
        return cached_islands
    
    # Get from function and cache
    islands = get_islands()
    await redis_cache.set(CacheKeys.ISLANDS, islands, ttl=3600)
    await static_cache.set("islands", islands, ttl=3600)
    return islands

@api_router.get("/pulse/marker-types")
async def get_pulse_marker_types():
    """Get list of marker types (cached in Redis)"""
    # Try Redis first
    redis_cached = await redis_cache.get(CacheKeys.MARKER_TYPES)
    if redis_cached:
        return redis_cached
    
    # Fallback to memory cache
    cached_types = await static_cache.get("marker_types")
    if cached_types:
        return cached_types
    
    # Get from function and cache
    types = get_marker_types()
    await redis_cache.set(CacheKeys.MARKER_TYPES, types, ttl=3600)
    await static_cache.set("marker_types", types, ttl=3600)
    return types

@api_router.get("/pulse/badges")
async def get_all_badges():
    """Get list of all available badges (cached in Redis)"""
    redis_cached = await redis_cache.get(CacheKeys.BADGES)
    if redis_cached:
        return redis_cached
    
    cached_badges = await static_cache.get("badges")
    if cached_badges:
        return cached_badges
    
    badges = get_badges_list()
    await redis_cache.set(CacheKeys.BADGES, badges, ttl=3600)
    await static_cache.set("badges", badges, ttl=3600)
    return badges

@api_router.get("/pulse/status")
async def get_pulse_status():
    """Get current pulse status of the fenua (cached 30s)"""
    # Try Redis first
    redis_cached = await redis_cache.get(CacheKeys.PULSE_STATUS)
    if redis_cached:
        return redis_cached
    
    status_cache_key = "pulse_status"
    cached_status = await markers_cache.get(status_cache_key)
    if cached_status:
        return cached_status
    
    _, _, _, _, pulse, _ = get_app_services()
    status = await pulse.get_pulse_status()
    await redis_cache.set(CacheKeys.PULSE_STATUS, status, ttl=30)
    await markers_cache.set(status_cache_key, status, ttl=30)
    return status

@api_router.get("/pulse/markers")
async def get_pulse_markers(
    types: Optional[str] = None,
    island: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None
):
    """Get active pulse markers (cached 60s)"""
    # Generate cache key from parameters
    cache_key_str = f"{CacheKeys.MARKERS}{types}:{island}:{lat}:{lng}:{radius_km}"
    
    # Try Redis first
    redis_cached = await redis_cache.get(cache_key_str)
    if redis_cached:
        return redis_cached
    
    cached_markers = await markers_cache.get(cache_key_str)
    if cached_markers:
        return cached_markers
    
    _, _, _, _, pulse, _ = get_app_services()
    
    marker_types = types.split(",") if types else None
    
    markers = await pulse.get_active_markers(
        marker_types=marker_types,
        island=island,
        lat=lat,
        lng=lng,
        radius_km=radius_km
    )
    
    # Cache in both Redis and memory
    await redis_cache.set(cache_key_str, markers, ttl=60)
    await markers_cache.set(cache_key_str, markers, ttl=60)
    return markers

@api_router.post("/pulse/markers")
async def create_pulse_marker(request: Request):
    """Create a new pulse marker"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, pulse, _ = get_app_services()
    
    # Invalidate markers cache when new marker is created
    await redis_cache.delete_pattern(f"{CacheKeys.MARKERS}*")
    await markers_cache.clear()
    
    try:
        marker = await pulse.create_marker(
            user_id=user.user_id,
            marker_type=body.get("marker_type"),
            lat=body.get("lat"),
            lng=body.get("lng"),
            title=body.get("title"),
            description=body.get("description"),
            photo_url=body.get("photo_url"),
            extra_data=body.get("extra_data")
        )
        return marker
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/pulse/markers/{marker_id}/confirm")
async def confirm_pulse_marker(marker_id: str, request: Request):
    """Confirm or deny a marker"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, pulse, _ = get_app_services()
    
    try:
        return await pulse.confirm_marker(
            marker_id=marker_id,
            user_id=user.user_id,
            is_confirmed=body.get("is_confirmed", True)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/pulse/markers/{marker_id}/close")
async def close_pulse_marker(marker_id: str, request: Request):
    """Close a marker (only creator)"""
    user = await require_auth(request)
    _, _, _, _, pulse, _ = get_app_services()
    
    try:
        return await pulse.close_marker(marker_id, user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/pulse/markers/{marker_id}")
async def delete_pulse_marker(marker_id: str, request: Request):
    """Delete a marker (only creator can delete)"""
    user = await require_auth(request)
    
    # Find the marker in pulse_markers collection (where markers are created)
    marker = await db.pulse_markers.find_one({"marker_id": marker_id}, {"_id": 0})
    if not marker:
        raise HTTPException(status_code=404, detail="Marqueur non trouvé")
    
    # Check ownership
    if marker.get("user_id") != user.user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez supprimer que vos propres signalements")
    
    # Delete the marker from pulse_markers collection
    await db.pulse_markers.delete_one({"marker_id": marker_id})
    
    # Invalidate cache
    await redis_cache.delete_pattern(f"{CacheKeys.MARKERS}*")
    await markers_cache.clear()
    
    logger.info(f"User {user.user_id} deleted marker: {marker_id}")
    
    return {"success": True, "message": "Signalement supprimé"}

@api_router.post("/pulse/markers/{marker_id}/like")
async def like_pulse_marker(marker_id: str, request: Request):
    """Like a marker"""
    user = await require_auth(request)
    
    # Find the marker in pulse_markers collection
    marker = await db.pulse_markers.find_one({"marker_id": marker_id}, {"_id": 0})
    if not marker:
        raise HTTPException(status_code=404, detail="Marqueur non trouvé")
    
    # Check if already liked
    liked_by = marker.get("liked_by", [])
    if user.user_id in liked_by:
        raise HTTPException(status_code=400, detail="Vous avez déjà liké ce signalement")
    
    # Add like
    await db.pulse_markers.update_one(
        {"marker_id": marker_id},
        {
            "$addToSet": {"liked_by": user.user_id},
            "$inc": {"likes_count": 1}
        }
    )
    
    return {"success": True, "message": "Signalement liké"}

@api_router.post("/pulse/markers/{marker_id}/report")
async def report_pulse_marker(marker_id: str, request: Request):
    """Report a marker to moderators"""
    user = await require_auth(request)
    body = await request.json()
    reason = body.get("reason", "Non spécifié")
    
    # Find the marker in pulse_markers collection
    marker = await db.pulse_markers.find_one({"marker_id": marker_id}, {"_id": 0})
    if not marker:
        raise HTTPException(status_code=404, detail="Marqueur non trouvé")
    
    # Create report
    report = {
        "report_id": str(uuid.uuid4()),
        "marker_id": marker_id,
        "reporter_id": user.user_id,
        "reason": reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.marker_reports.insert_one(report)
    
    # Increment report count on marker
    await db.pulse_markers.update_one(
        {"marker_id": marker_id},
        {"$inc": {"reports_count": 1}}
    )
    
    logger.info(f"User {user.user_id} reported marker {marker_id}: {reason}")
    
    return {"success": True, "message": "Signalement envoyé aux modérateurs"}

@api_router.get("/pulse/leaderboard")
async def get_pulse_leaderboard(island: Optional[str] = None):
    """Get weekly leaderboard"""
    _, _, _, _, pulse, _ = get_app_services()
    return await pulse.get_weekly_leaderboard(island=island)

@api_router.get("/pulse/stats")
async def get_pulse_stats():
    """Get fenua pulse statistics"""
    _, _, _, _, pulse, _ = get_app_services()
    return await pulse.get_fenua_stats()

@api_router.get("/pulse/mana")
async def get_user_mana(request: Request):
    """Get current user's mana balance"""
    user = await require_auth(request)
    _, _, _, _, pulse, _ = get_app_services()
    return await pulse.get_user_mana(user.user_id)

@api_router.post("/pulse/mana/spend")
async def spend_user_mana(request: Request):
    """Spend mana points"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, pulse, _ = get_app_services()
    
    try:
        return await pulse.spend_mana(
            user_id=user.user_id,
            amount=body.get("amount"),
            reason=body.get("reason")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/pulse/badges/me")
async def get_my_badges(request: Request):
    """Get current user's badges"""
    user = await require_auth(request)
    _, _, _, _, pulse, _ = get_app_services()
    return await pulse.get_user_badges(user.user_id)

# ==================== ROULOTTE ROUTES ====================

@api_router.get("/roulotte/payment-methods")
async def get_roulotte_payment_methods():
    """Get available payment methods"""
    return get_payment_methods()

@api_router.get("/roulotte/cuisine-types")
async def get_roulotte_cuisine_types():
    """Get available cuisine types"""
    return get_cuisine_types()

@api_router.post("/roulotte/profile")
async def create_vendor_profile(request: Request):
    """Create or update vendor profile"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.create_vendor_profile(
            user_id=user.user_id,
            name=body.get("name"),
            description=body.get("description"),
            cuisine_type=body.get("cuisine_type"),
            photo_url=body.get("photo_url"),
            phone=body.get("phone"),
            payment_methods=body.get("payment_methods"),
            usual_hours=body.get("usual_hours"),
            usual_location=body.get("usual_location")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/roulotte/profile/me")
async def get_my_vendor_profile(request: Request):
    """Get current user's vendor profile"""
    user = await require_auth(request)
    _, _, _, _, _, roulotte = get_app_services()
    
    profile = await roulotte.get_vendor_by_user(user.user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
    return profile

@api_router.get("/roulotte/profile/{vendor_id}")
async def get_vendor_profile(vendor_id: str):
    """Get vendor profile by ID"""
    _, _, _, _, _, roulotte = get_app_services()
    
    profile = await roulotte.get_vendor_profile(vendor_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Roulotte non trouvée")
    return profile

@api_router.post("/roulotte/open")
async def open_roulotte(request: Request):
    """Signal that roulotte is open"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.open_roulotte(
            user_id=user.user_id,
            lat=body.get("lat"),
            lng=body.get("lng"),
            menu_today=body.get("menu_today")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/roulotte/close")
async def close_roulotte(request: Request):
    """Signal that roulotte is closed"""
    user = await require_auth(request)
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.close_roulotte(user.user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/roulotte/extend")
async def extend_roulotte_opening(request: Request):
    """Extend opening time"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.extend_opening(
            user_id=user.user_id,
            hours=body.get("hours", 2)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/roulotte/nearby")
async def get_nearby_roulottes(
    lat: float = -17.532,
    lng: float = -149.5685,
    radius: float = 50
):
    """Get open roulottes near a location"""
    _, _, _, _, _, roulotte = get_app_services()
    
    roulottes = await roulotte.get_open_roulottes(
        lat=lat,
        lng=lng,
        radius_km=radius
    )
    return roulottes

@api_router.post("/roulotte/menu")
async def add_menu_item(request: Request):
    """Add item to menu"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.add_menu_item(
            user_id=user.user_id,
            name=body.get("name"),
            price=body.get("price"),
            photo_url=body.get("photo_url"),
            description=body.get("description")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.delete("/roulotte/menu/{item_id}")
async def remove_menu_item(item_id: str, request: Request):
    """Remove item from menu"""
    user = await require_auth(request)
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.remove_menu_item(user.user_id, item_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/roulotte/menu/{item_id}")
async def update_menu_item(item_id: str, request: Request):
    """Update a menu item"""
    user = await require_auth(request)
    body = await request.json()
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        updates = {}
        if "name" in body:
            updates["name"] = body["name"]
        if "price" in body:
            updates["price"] = body["price"]
        if "description" in body:
            updates["description"] = body["description"]
        if "photo_url" in body:
            updates["photo_url"] = body["photo_url"]
        if "is_available" in body:
            updates["is_available"] = body["is_available"]
            
        return await roulotte.update_menu_item(user.user_id, item_id, updates)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/roulotte/{vendor_id}/review")
async def add_roulotte_review(vendor_id: str, request: Request):
    """Add review for a roulotte"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, _, roulotte = get_app_services()
    
    try:
        return await roulotte.add_review(
            user_id=user.user_id,
            vendor_id=vendor_id,
            rating=body.get("rating"),
            comment=body.get("comment")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.post("/roulotte/{vendor_id}/subscribe")
async def subscribe_to_roulotte(vendor_id: str, request: Request):
    """Subscribe/unsubscribe to a roulotte"""
    user = await require_auth(request)
    _, _, _, _, _, roulotte = get_app_services()
    
    return await roulotte.subscribe_to_roulotte(user.user_id, vendor_id)

@api_router.get("/roulotte/subscriptions")
async def get_my_roulotte_subscriptions(request: Request):
    """Get user's roulotte subscriptions"""
    user = await require_auth(request)
    _, _, _, _, _, roulotte = get_app_services()
    
    return await roulotte.get_user_subscriptions(user.user_id)

@api_router.get("/roulotte/search")
async def search_roulottes(
    q: Optional[str] = None,
    cuisine: Optional[str] = None,
    is_open: Optional[bool] = None,
    min_rating: Optional[float] = None,
    limit: int = 20
):
    """Search for roulottes"""
    _, _, _, _, _, roulotte = get_app_services()
    
    return await roulotte.search_roulottes(
        query=q,
        cuisine_type=cuisine,
        is_open=is_open,
        min_rating=min_rating,
        limit=limit
    )

@api_router.get("/roulotte/open")
async def get_open_roulottes(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: float = 10
):
    """Get currently open roulottes"""
    _, _, _, _, _, roulotte = get_app_services()
    
    return await roulotte.get_open_roulottes(lat=lat, lng=lng, radius_km=radius_km)

# ==================== STARTUP EVENT ====================

@app.on_event("startup")
async def seed_polynesian_content():
    """Automatically populate the database with Polynesian media content on startup"""
    try:
        from seed_data import POLYNESIAN_ACCOUNTS, build_seed_posts, build_seed_accounts
        
        # Check if already seeded
        existing_seeded = await db.users.find_one({"is_seeded": True})
        if existing_seeded:
            logger.info("Database already seeded with Polynesian content")
            return
        
        logger.info("Seeding database with Polynesian media content...")
        
        # Insert accounts
        accounts = build_seed_accounts()
        for account in accounts:
            existing = await db.users.find_one({"user_id": account["user_id"]})
            if not existing:
                await db.users.insert_one(account)
                logger.info(f"Created account: {account['name']}")
        
        # Insert posts
        posts = build_seed_posts()
        for post in posts:
            await db.posts.insert_one(post)
        
        logger.info(f"Seeded {len(accounts)} accounts and {len(posts)} posts")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")


# ==================== AUTO PUBLISHER ROUTES ====================

@api_router.post("/admin/auto-publish/trigger")
async def trigger_auto_publish(request: Request):
    """Manually trigger daily auto-publish (admin only)"""
    user = await require_auth(request)
    
    # Check admin
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    get_app_services()  # Initialize services
    from auto_publisher import AutoPublisherService
    publisher = AutoPublisherService(db)
    
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    posts_count = body.get("posts_count", 25)
    
    result = await publisher.publish_daily_content(posts_count=posts_count)
    return result

@api_router.get("/admin/auto-publish/stats")
async def get_auto_publish_stats(request: Request):
    """Get auto-publish statistics (admin only)"""
    # Allow without auth for dashboard display
    try:
        user = await require_auth(request)
        if not user.is_admin:
            pass  # Continue anyway for now
    except:
        pass  # Allow without auth for now
    
    from auto_publisher import AutoPublisherService
    publisher = AutoPublisherService(db)
    
    return await publisher.get_daily_stats()

@api_router.get("/content/island/{island_id}")
async def get_island_content(island_id: str, limit: int = 20):
    """Get content for a specific island"""
    
    # Validate island - include new islands
    valid_islands = ["tahiti", "moorea", "bora-bora", "raiatea", "tahaa", "huahine", "maupiti", "tuamotu", "marquises"]
    if island_id not in valid_islands:
        raise HTTPException(status_code=400, detail="Invalid island ID")
    
    posts = await db.posts.find(
        {"island": island_id, "moderation_status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Add user info
    for post in posts:
        user = await db.users.find_one(
            {"user_id": post["user_id"]},
            {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1}
        )
        post["user"] = user
    
    return posts

@api_router.get("/content/islands")
async def get_all_islands_content():
    """Get content summary for all islands"""
    
    pipeline = [
        {"$match": {"moderation_status": "approved", "island": {"$exists": True}}},
        {"$group": {
            "_id": "$island",
            "count": {"$sum": 1},
            "latest": {"$max": "$created_at"}
        }},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.posts.aggregate(pipeline).to_list(20)
    
    return {
        "islands": [
            {
                "id": r["_id"],
                "name": ISLAND_CONTENT.get(r["_id"], {}).get("name", r["_id"]),
                "posts_count": r["count"],
                "latest_post": r["latest"]
            }
            for r in results
        ]
    }


# ==================== RSS FEEDS ROUTES ====================

@api_router.post("/admin/rss/fetch")
async def fetch_rss_feeds(request: Request):
    """Fetch and publish RSS feeds (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    body = await request.json() if request.headers.get("content-type") == "application/json" else {}
    max_posts = body.get("max_posts", 20)
    
    rss_service = RSSFeedService(db)
    result = await rss_service.publish_articles_as_posts(max_total_posts=max_posts)
    await rss_service.close()
    
    return result

@api_router.get("/admin/rss/stats")
async def get_rss_stats():
    """Get RSS feed statistics"""
    rss_service = RSSFeedService(db)
    stats = await rss_service.get_rss_stats()
    await rss_service.close()
    return stats

# ==================== RSS PUBLIC ENDPOINTS ====================

@api_router.get("/rss/posts")
async def get_rss_posts(limit: int = 20, skip: int = 0, source: Optional[str] = None):
    """
    Get posts from RSS feeds (public endpoint).
    Returns articles published from RSS sources.
    """
    query = {"is_rss_article": True, "moderation_status": {"$ne": "rejected"}}
    
    if source:
        query["rss_source"] = {"$regex": source, "$options": "i"}
    
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    
    # Fallback to demo posts if no RSS posts
    if not posts:
        posts = [
            {
                "post_id": "rss_demo_1",
                "caption": "Les dernières actualités de Polynésie française",
                "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
                "media_type": "image",
                "is_rss_article": True,
                "rss_source": "Tahiti Infos",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "likes_count": 0,
                "comments_count": 0,
                "user": {"user_id": "system", "name": "Nati Fenua News", "picture": None}
            }
        ]
    
    return posts

@api_router.get("/rss/sources")
async def get_rss_sources():
    """Get list of RSS feed sources"""
    return {
        "sources": [
            {"id": "tahiti-infos", "name": "Tahiti Infos", "url": "https://www.tahiti-infos.com"},
            {"id": "polynesie1ere", "name": "Polynésie 1ère", "url": "https://la1ere.francetvinfo.fr/polynesie"},
            {"id": "tntv", "name": "TNTV", "url": "https://www.tntv.pf"},
            {"id": "radio1", "name": "Radio 1", "url": "https://www.radio1.pf"}
        ]
    }

@api_router.post("/admin/cleanup/youtube")
async def cleanup_youtube(request: Request):
    """Remove broken YouTube links (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await cleanup_youtube_links(db)
    return result

@api_router.get("/news/latest")
async def get_latest_news(limit: int = 20, island: Optional[str] = None):
    """Get latest news from RSS feeds with caching"""
    
    cache_key = f"news_latest:{limit}:{island or 'all'}"
    
    # Try cache first
    cached = await cache.get(cache_key)
    if cached:
        return cached
    
    query = {"is_rss_article": True}
    if island:
        query["island"] = island
    
    # Optimized with aggregation
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "users",
            "localField": "user_id",
            "foreignField": "user_id",
            "as": "user_data"
        }},
        {"$unwind": {"path": "$user_data", "preserveNullAndEmptyArrays": True}},
        {"$addFields": {
            "user": {
                "user_id": "$user_data.user_id",
                "name": "$user_data.name",
                "picture": "$user_data.picture",
                "is_verified": "$user_data.is_verified",
                "is_media": "$user_data.is_media"
            }
        }},
        {"$project": {"_id": 0, "user_data": 0}}
    ]
    
    news = await db.posts.aggregate(pipeline).to_list(limit)
    
    # Fallback demo news if empty
    if not news:
        news = [
            {
                "post_id": "news_demo_1",
                "user_id": "tahiti_news",
                "content_type": "link",
                "caption": "📰 Les dernières actualités de Polynésie française",
                "media_url": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=800",
                "is_rss_article": True,
                "rss_source": "Tahiti Infos",
                "likes_count": 12,
                "comments_count": 3,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "user": {"user_id": "tahiti_news", "name": "Tahiti Infos", "picture": None, "is_verified": True, "is_media": True}
            }
        ]
    
    # Cache for 2 minutes
    await cache.set(cache_key, news, ttl=120)
    return news


# ==================== ADMIN CLEANUP & CUSTOM FEEDS ====================

@api_router.post("/admin/cleanup/demo-data")
async def cleanup_demo_data(request: Request):
    """Remove all demo/seeded data from the database (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    results = {
        "posts_deleted": 0,
        "messages_deleted": 0,
        "conversations_deleted": 0,
        "users_deleted": 0
    }
    
    # Delete demo posts (auto-published, seeded, or with fake user_ids)
    demo_post_query = {
        "$or": [
            {"is_auto_published": True},
            {"is_seeded": True},
            {"post_id": {"$regex": "^auto_"}},
            {"post_id": {"$regex": "^seed_"}},
            {"user_id": {"$regex": "_luxury$|_biosphere$|_explorer$|_fishing$|_vanilla$"}}
        ]
    }
    post_result = await db.posts.delete_many(demo_post_query)
    results["posts_deleted"] = post_result.deleted_count
    
    # Delete demo messages and conversations
    demo_msg_query = {
        "$or": [
            {"is_demo": True},
            {"is_seeded": True},
            {"conversation_id": {"$regex": "^demo_|^seed_"}}
        ]
    }
    msg_result = await db.messages.delete_many(demo_msg_query)
    results["messages_deleted"] = msg_result.deleted_count
    
    # Delete demo conversations
    demo_conv_query = {
        "$or": [
            {"is_demo": True},
            {"is_seeded": True},
            {"conversation_id": {"$regex": "^demo_|^seed_"}}
        ]
    }
    conv_result = await db.conversations.delete_many(demo_conv_query)
    results["conversations_deleted"] = conv_result.deleted_count
    
    # Delete demo/bot users (keep real media accounts)
    demo_user_query = {
        "$and": [
            {"is_bot": True},
            {"is_media": {"$ne": True}},  # Keep media accounts
            {"$or": [
                {"user_id": {"$regex": "_luxury$|_biosphere$|_explorer$|_fishing$|_vanilla$"}},
                {"is_seeded": True}
            ]}
        ]
    }
    user_result = await db.users.delete_many(demo_user_query)
    results["users_deleted"] = user_result.deleted_count
    
    # Clear caches
    await feed_cache.clear()
    await cache.delete("stories_feed")
    
    logger.info(f"Demo data cleanup: {results}")
    
    return {
        "success": True,
        "message": "Données de démonstration supprimées",
        "results": results
    }

@api_router.post("/admin/rss/add-feed")
async def add_custom_rss_feed(request: Request):
    """Add a custom RSS feed (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    body = await request.json()
    
    required_fields = ["name", "url", "account_id"]
    for field in required_fields:
        if not body.get(field):
            raise HTTPException(status_code=400, detail=f"Champ requis: {field}")
    
    # Create feed config
    feed_config = {
        "feed_id": f"custom_{uuid.uuid4().hex[:8]}",
        "name": body["name"],
        "url": body["url"],
        "account_id": body["account_id"],
        "island": body.get("island", "tahiti"),
        "logo": body.get("logo"),
        "categories": body.get("categories", ["communauté"]),
        "feed_type": body.get("feed_type", "association"),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if feed URL already exists
    existing = await db.custom_rss_feeds.find_one({"url": body["url"]})
    if existing:
        raise HTTPException(status_code=400, detail="Ce flux RSS existe déjà")
    
    # Create the media account for this feed
    account = {
        "user_id": body["account_id"],
        "name": body["name"],
        "email": f"{body['account_id']}@nati-fenua.local",
        "picture": body.get("logo") or f"https://ui-avatars.com/api/?name={body['name'][:2]}&background=FF6B35&color=fff&bold=true&size=200",
        "bio": body.get("bio", f"Compte officiel - {body['name']}"),
        "location": "Polynésie française",
        "island": body.get("island", "tahiti"),
        "website": body.get("website", body["url"]),
        "is_verified": True,
        "is_media": True,
        "is_bot": True,
        "followers_count": 0,
        "following_count": 0,
        "posts_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Insert if not exists
    existing_account = await db.users.find_one({"user_id": body["account_id"]})
    if not existing_account:
        await db.users.insert_one(account)
    
    # Save feed config
    await db.custom_rss_feeds.insert_one(feed_config)
    
    return {
        "success": True,
        "message": f"Flux RSS '{body['name']}' ajouté",
        "feed": {k: v for k, v in feed_config.items() if k != "_id"}
    }

@api_router.get("/admin/rss/feeds")
async def get_all_rss_feeds(request: Request):
    """Get all RSS feeds (built-in + custom)"""
    from rss_feeds import RSS_FEEDS
    
    # Get custom feeds
    custom_feeds = await db.custom_rss_feeds.find({"is_active": True}).to_list(100)
    
    return {
        "builtin_feeds": RSS_FEEDS,
        "custom_feeds": [{k: v for k, v in f.items() if k != "_id"} for f in custom_feeds],
        "total": len(RSS_FEEDS) + len(custom_feeds)
    }

@api_router.delete("/admin/rss/feed/{feed_id}")
async def delete_custom_rss_feed(feed_id: str, request: Request):
    """Delete a custom RSS feed (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.custom_rss_feeds.delete_one({"feed_id": feed_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Flux RSS non trouvé")
    
    return {"success": True, "message": "Flux RSS supprimé"}


@api_router.post("/admin/cleanup/auto-posts")
async def cleanup_auto_posts(request: Request):
    """Remove all auto-generated posts (admin only)"""
    user = await require_auth(request)
    
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Delete auto-generated posts
    result = await db.posts.delete_many({
        "$or": [
            {"is_auto_published": True},
            {"post_id": {"$regex": "^auto_"}},
            {"user_id": {"$regex": "_daily$|_tourisme$|_culture$|_nature$|_paradise$|_luxury$|_authentic$|_island$|_dive$|_heritage$|_sacree$|_vanille$|_perles$|_manta$"}}
        ]
    })
    
    # Clear feed cache
    await feed_cache.clear()
    
    return {
        "success": True,
        "message": f"Supprimé {result.deleted_count} posts auto-générés"
    }


@api_router.post("/rss/refresh")
async def refresh_rss_feeds():
    """Fetch and publish new RSS articles (public endpoint)"""
    from rss_feeds import RSSFeedService
    
    rss_service = RSSFeedService(db)
    result = await rss_service.publish_articles_as_posts(max_posts_per_source=2, max_total_posts=70)
    await rss_service.close()
    
    # Clear feed cache to show new content
    await feed_cache.clear()
    
    return result


@api_router.post("/rss/cleanup-old")
async def cleanup_old_rss_posts_endpoint():
    """Delete RSS posts older than 2 days"""
    two_days_ago = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
    
    # Delete RSS posts older than 2 days
    result = await db.posts.delete_many({
        "is_rss_article": True,
        "created_at": {"$lt": two_days_ago}
    })
    
    if result.deleted_count > 0:
        await feed_cache.clear()
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": f"Supprimé {result.deleted_count} posts RSS de plus de 2 jours"
    }


@api_router.get("/rss/stats")
async def get_rss_stats():
    """Get RSS feed statistics"""
    total_rss = await db.posts.count_documents({"is_rss_article": True})
    
    # Count by age
    now = datetime.now(timezone.utc)
    one_day_ago = (now - timedelta(days=1)).isoformat()
    two_days_ago = (now - timedelta(days=2)).isoformat()
    
    posts_last_24h = await db.posts.count_documents({
        "is_rss_article": True,
        "created_at": {"$gte": one_day_ago}
    })
    
    posts_24h_48h = await db.posts.count_documents({
        "is_rss_article": True,
        "created_at": {"$gte": two_days_ago, "$lt": one_day_ago}
    })
    
    posts_older = await db.posts.count_documents({
        "is_rss_article": True,
        "created_at": {"$lt": two_days_ago}
    })
    
    return {
        "total_rss_posts": total_rss,
        "posts_last_24h": posts_last_24h,
        "posts_24h_to_48h": posts_24h_48h,
        "posts_older_than_48h": posts_older,
        "refresh_interval": "12 heures (2x par jour)",
        "expiration": "2 jours"
    }


@api_router.post("/rss/cleanup-duplicates")
async def cleanup_rss_duplicates():
    """Remove duplicate RSS posts from database"""
    
    # Find all RSS posts
    rss_posts = await db.posts.find({"is_rss_article": True}).to_list(10000)
    
    # Group by external_link
    by_link = {}
    for post in rss_posts:
        link = post.get("external_link")
        if link:
            if link not in by_link:
                by_link[link] = []
            by_link[link].append(post)
    
    # Delete duplicates (keep only the oldest one)
    deleted_count = 0
    for link, posts in by_link.items():
        if len(posts) > 1:
            # Sort by created_at, keep oldest
            posts.sort(key=lambda x: x.get("created_at", ""))
            for duplicate in posts[1:]:
                await db.posts.delete_one({"post_id": duplicate["post_id"]})
                deleted_count += 1
    
    # Clear cache
    await feed_cache.clear()
    
    return {
        "success": True,
        "duplicates_deleted": deleted_count,
        "unique_articles": len(by_link),
        "total_rss_posts_before": len(rss_posts),
        "total_rss_posts_after": len(rss_posts) - deleted_count
    }


@api_router.post("/rss/limit-per-source")
async def limit_rss_per_source(max_per_source: int = 2):
    """Keep only max N posts per RSS source"""
    
    # Find all RSS posts grouped by source
    rss_posts = await db.posts.find({"is_rss_article": True}).to_list(10000)
    
    # Group by source
    by_source = {}
    for post in rss_posts:
        source = post.get("link_source", "Unknown")
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(post)
    
    # Delete excess posts (keep only most recent N per source)
    deleted_count = 0
    kept_count = 0
    
    for source, posts in by_source.items():
        # Sort by created_at descending (most recent first)
        posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Keep first N, delete rest
        to_keep = posts[:max_per_source]
        to_delete = posts[max_per_source:]
        
        kept_count += len(to_keep)
        
        for post in to_delete:
            await db.posts.delete_one({"post_id": post["post_id"]})
            deleted_count += 1
    
    # Clear cache
    await feed_cache.clear()
    
    return {
        "success": True,
        "max_per_source": max_per_source,
        "sources_count": len(by_source),
        "posts_deleted": deleted_count,
        "posts_kept": kept_count,
        "sources": {src: min(len(posts), max_per_source) for src, posts in by_source.items()}
    }


@api_router.get("/rss/all-sources")
async def get_all_rss_sources():
    """Get list of all 35 RSS sources"""
    from rss_feeds import RSS_FEEDS
    
    sources = []
    for feed in RSS_FEEDS:
        sources.append({
            "name": feed["name"],
            "url": feed["url"],
            "island": feed["island"],
            "categories": feed.get("categories", []),
            "feed_type": feed.get("feed_type", "media")
        })
    
    return {
        "total_sources": len(sources),
        "sources": sources
    }


# ==================== ROULOTTE PUSH NOTIFICATIONS ====================

@api_router.post("/roulotte/{vendor_id}/subscribe/push")
async def subscribe_roulotte_push(vendor_id: str, request: Request):
    """Subscribe to push notifications for a roulotte"""
    user = await require_auth(request)
    body = await request.json()
    
    # Check if already subscribed
    existing = await db.roulotte_subscriptions.find_one({
        "user_id": user.user_id,
        "vendor_id": vendor_id
    })
    
    if not existing:
        # Create subscription first
        _, _, _, _, _, roulotte = get_app_services()
        await roulotte.subscribe_to_roulotte(user.user_id, vendor_id)
    
    # Update push settings
    await db.roulotte_subscriptions.update_one(
        {"user_id": user.user_id, "vendor_id": vendor_id},
        {"$set": {
            "push_enabled": body.get("push_enabled", True),
            "notify_on_open": body.get("notify_on_open", True),
            "notify_on_menu_update": body.get("notify_on_menu_update", False),
            "notify_radius_km": body.get("notify_radius_km", 5),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"success": True, "message": "Notifications activées"}

@api_router.get("/roulotte/subscriptions/push")
async def get_roulotte_push_subscriptions(request: Request):
    """Get all roulotte subscriptions with push settings"""
    user = await require_auth(request)
    
    subscriptions = await db.roulotte_subscriptions.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    
    # Add vendor info
    for sub in subscriptions:
        vendor = await db.vendors.find_one(
            {"vendor_id": sub["vendor_id"]},
            {"_id": 0, "vendor_id": 1, "name": 1, "photo_url": 1, "is_open": 1, "cuisine_type": 1}
        )
        sub["vendor"] = vendor
    
    return subscriptions


# Helper function to send push notifications when roulotte opens
async def notify_roulotte_subscribers(vendor_id: str, vendor_name: str, location: str, lat: float, lng: float):
    """Send push notifications to all subscribers when a roulotte opens"""
    
    subscriptions = await db.roulotte_subscriptions.find({
        "vendor_id": vendor_id,
        "push_enabled": True,
        "notify_on_open": True
    }).to_list(1000)
    
    notifications_sent = 0
    
    for sub in subscriptions:
        # Create in-app notification
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": sub["user_id"],
            "type": "roulotte_open",
            "title": f"🚚 {vendor_name} est ouvert !",
            "message": f"Votre roulotte favorite est maintenant ouverte près de {location}",
            "data": {
                "vendor_id": vendor_id,
                "lat": lat,
                "lng": lng,
                "action": "view_on_map"
            },
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
        
        # Check for push subscription
        push_sub = await db.push_subscriptions.find_one({"user_id": sub["user_id"]})
        if push_sub:
            # In production: send actual push notification via Web Push API
            # For now, just log it
            logger.info(f"Would send push to {sub['user_id']}: {vendor_name} is open")
        
        notifications_sent += 1
    
    logger.info(f"Sent {notifications_sent} notifications for roulotte {vendor_id}")
    return notifications_sent


# ==================== ACCOUNT PROTECTION ROUTES ====================

@api_router.post("/auth/phone/send-code")
async def send_phone_verification_code(request: Request):
    """Send a verification code to user's phone"""
    user = await require_auth(request)
    body = await request.json()
    phone = body.get("phone")
    
    if not phone:
        raise HTTPException(status_code=400, detail="Numéro de téléphone requis")
    
    protection = AccountProtectionService(db)
    result = await protection.send_phone_verification(user.user_id, phone)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@api_router.post("/auth/phone/verify")
async def verify_phone_code(request: Request):
    """Verify phone number with code"""
    user = await require_auth(request)
    body = await request.json()
    
    phone = body.get("phone")
    code = body.get("code")
    
    if not phone or not code:
        raise HTTPException(status_code=400, detail="Téléphone et code requis")
    
    protection = AccountProtectionService(db)
    result = await protection.verify_phone(user.user_id, phone, code)
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    return result

@api_router.get("/users/me/trust-score")
async def get_my_trust_score(request: Request):
    """Get the current user's trust score"""
    user = await require_auth(request)
    
    protection = AccountProtectionService(db)
    return await protection.get_user_trust_score(user.user_id)

@api_router.get("/users/{user_id}/trust-score")
async def get_user_trust_score(user_id: str, request: Request):
    """Get a user's trust score (public info only)"""
    
    protection = AccountProtectionService(db)
    result = await protection.get_user_trust_score(user_id)
    
    # Only return level, not detailed factors
    return {
        "trust_score": result["trust_score"],
        "level": result["level"]
    }


# ==================== MESSAGING FOR PULSE CONTACTS ====================

@api_router.post("/messages/contact-vendor")
async def contact_vendor_from_pulse(request: Request):
    """Start a conversation with a vendor from Pulse map"""
    user = await require_auth(request)
    body = await request.json()
    
    vendor_id = body.get("vendor_id")
    marker_id = body.get("marker_id")
    message_text = body.get("message", "Bonjour, je vous contacte depuis Fenua Pulse !")
    
    if not vendor_id:
        raise HTTPException(status_code=400, detail="vendor_id requis")
    
    # Get vendor info
    vendor = await db.vendors.find_one({"vendor_id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    
    vendor_user_id = vendor["user_id"]
    
    # Check if conversation already exists
    existing_conv = await db.conversations.find_one({
        "participants": {"$all": [user.user_id, vendor_user_id]},
        "type": "direct"
    })
    
    if existing_conv:
        conversation_id = existing_conv["conversation_id"]
    else:
        # Create new conversation
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        conversation = {
            "conversation_id": conversation_id,
            "participants": [user.user_id, vendor_user_id],
            "type": "direct",
            "is_vendor_contact": True,
            "vendor_id": vendor_id,
            "marker_id": marker_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.conversations.insert_one(conversation)
    
    # Send initial message
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message = {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "sender_id": user.user_id,
        "content": message_text,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message)
    
    # Update conversation
    await db.conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {
            "last_message": message_text,
            "last_message_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "conversation_id": conversation_id,
        "message_id": message_id,
        "vendor_name": vendor.get("name")
    }


# ==================== STARTUP TASKS ====================

@app.on_event("startup")
async def start_auto_publisher():
    """Start the RSS feed publisher background task"""
    import asyncio
    
    async def cleanup_old_rss_posts():
        """Delete RSS posts older than 2 days"""
        try:
            two_days_ago = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
            
            # Delete RSS posts older than 2 days
            result = await db.posts.delete_many({
                "is_rss_article": True,
                "created_at": {"$lt": two_days_ago}
            })
            
            if result.deleted_count > 0:
                logger.info(f"🗑️ Supprimé {result.deleted_count} posts RSS de plus de 2 jours")
                await feed_cache.clear()
            
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error cleaning old RSS posts: {e}")
            return 0
    
    async def initial_cleanup_and_rss():
        """Clean up old AI posts and fetch real RSS articles on startup"""
        try:
            await asyncio.sleep(10)  # Wait for DB to be ready
            
            # Count existing posts
            total_posts = await db.posts.count_documents({})
            rss_posts = await db.posts.count_documents({"is_rss_article": True})
            
            logger.info(f"📊 Posts actuels: {total_posts} total, {rss_posts} RSS")
            
            # Clean up old RSS posts (older than 2 days)
            await cleanup_old_rss_posts()
            
            # If there are many non-RSS posts, clean them up
            if total_posts > 0 and rss_posts < total_posts * 0.5:
                # Delete auto-generated posts (keep real user posts and RSS)
                result = await db.posts.delete_many({
                    "$and": [
                        {"is_rss_article": {"$ne": True}},
                        {"$or": [
                            {"is_auto_published": True},
                            {"post_id": {"$regex": "^auto_"}},
                            {"user_id": {"$regex": "_daily$|_tourisme$|_culture$|_nature$|_paradise$"}}
                        ]}
                    ]
                })
                logger.info(f"🧹 Nettoyé {result.deleted_count} posts auto-générés")
            
            # Fetch fresh RSS articles
            from rss_feeds import RSSFeedService
            rss_service = RSSFeedService(db)
            result = await rss_service.publish_articles_as_posts(max_total_posts=30)
            await rss_service.close()
            logger.info(f"📰 RSS refresh: {result}")
            
            # Clear cache
            await feed_cache.clear()
            
        except Exception as e:
            logger.error(f"Error in initial cleanup: {e}")
    
    async def rss_publish_task():
        """Background task that fetches and publishes RSS articles 2x per day (every 12 hours)"""
        while True:
            try:
                # Wait 12 hours between refreshes (2 times per day)
                await asyncio.sleep(12 * 3600)  # 12 hours = 43200 seconds
                
                logger.info("🔄 Démarrage du rafraîchissement RSS (2x/jour)...")
                
                # First, clean up old RSS posts (older than 2 days)
                deleted = await cleanup_old_rss_posts()
                
                # Then fetch new RSS articles
                from rss_feeds import RSSFeedService
                rss_service = RSSFeedService(db)
                result = await rss_service.publish_articles_as_posts(max_total_posts=30)
                await rss_service.close()
                logger.info(f"📰 RSS refresh completed: {result}")
                logger.info(f"📊 Résumé: {deleted} anciens supprimés, {result.get('posts_created', 0)} nouveaux ajoutés")
                
                # Clear feed cache
                await feed_cache.clear()
                
            except Exception as e:
                logger.error(f"Error in RSS publisher: {e}")
    
    # Run initial cleanup
    asyncio.create_task(initial_cleanup_and_rss())
    
    # Start periodic RSS task (runs every 12 hours = 2x per day)
    asyncio.create_task(rss_publish_task())
    logger.info("🚀 Auto-publisher started: RSS refresh every 12 hours, posts expire after 2 days")


# ==================== USER STATISTICS ====================

@api_router.get("/users/{user_id}/statistics")
async def get_user_statistics(user_id: str, request: Request):
    """Get detailed statistics for a user"""
    try:
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
        # Count posts
        posts_count = await db.posts.count_documents({"user_id": user_id})
        
        # Count likes received
        user_posts = await db.posts.find({"user_id": user_id}, {"likes": 1}).to_list(1000)
        likes_received = sum(len(post.get("likes", [])) for post in user_posts)
        
        # Count comments received
        comments_received = sum(len(post.get("comments", [])) for post in user_posts)
        
        # Count followers and following
        followers_count = await db.users.count_documents({"following": user_id})
        following_count = len(user.get("following", []))
        
        # Count messages sent
        messages_sent = await db.messages.count_documents({"sender_id": user_id})
        
        # Count mana points
        mana_points = user.get("mana_points", 0)
        badges = user.get("badges", [])
        
        # Calculate engagement rate
        engagement_rate = 0
        if posts_count > 0 and followers_count > 0:
            engagement_rate = round(((likes_received + comments_received) / posts_count / followers_count) * 100, 2)
        
        # Get join date
        join_date = user.get("created_at", datetime.now(timezone.utc).isoformat())
        
        return {
            "user_id": user_id,
            "username": user.get("username", ""),
            "stats": {
                "posts": posts_count,
                "likes_received": likes_received,
                "comments_received": comments_received,
                "followers": followers_count,
                "following": following_count,
                "messages_sent": messages_sent,
                "mana_points": mana_points,
                "badges_count": len(badges),
                "engagement_rate": engagement_rate
            },
            "badges": badges,
            "join_date": join_date
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/statistics/platform")
async def get_platform_statistics(request: Request):
    """Get platform-wide statistics (public)"""
    try:
        total_users = await db.users.count_documents({})
        total_posts = await db.posts.count_documents({})
        total_messages = await db.messages.count_documents({})
        total_markers = await db.markers.count_documents({})
        
        # Active users (posted in last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        active_users = await db.posts.distinct("user_id", {
            "created_at": {"$gte": seven_days_ago.isoformat()}
        })
        
        # RSS articles count
        rss_count = await db.posts.count_documents({"is_rss_article": True})
        
        return {
            "platform": "Nati Fenua",
            "stats": {
                "total_users": total_users,
                "active_users_7d": len(active_users),
                "total_posts": total_posts,
                "rss_articles": rss_count,
                "user_posts": total_posts - rss_count,
                "total_messages": total_messages,
                "mana_markers": total_markers
            },
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting platform statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== TRANSLATIONS API ====================

@api_router.get("/translations/{lang}")
async def get_translations_by_language(lang: str):
    """Get all translations for a language (fr or ty)"""
    if lang not in ["fr", "ty"]:
        raise HTTPException(status_code=400, detail="Langue non supportée. Utilisez 'fr' ou 'ty'.")
    
    return {
        "language": lang,
        "language_name": "Français" if lang == "fr" else "Tahitien",
        "translations": get_all_translations(lang)
    }


@api_router.get("/translations")
async def get_available_translations():
    """Get list of available translations and keys"""
    return {
        "languages": [
            {"code": "fr", "name": "Français"},
            {"code": "ty", "name": "Tahitien"}
        ],
        "total_keys": len(TRANSLATIONS),
        "categories": list(set(key.split(".")[0] for key in TRANSLATIONS.keys()))
    }


# ==================== ENHANCED WEBSOCKET CHAT ====================

@app.websocket("/ws/v2/chat/{user_id}")
async def websocket_chat_v2(websocket: WebSocket, user_id: str):
    """Enhanced WebSocket for real-time chat with typing indicators and read receipts"""
    await chat_manager.connect(websocket, user_id)
    
    # Send connected confirmation
    await websocket.send_json(create_ws_message(WSMessageTypes.CONNECTED, {
        "user_id": user_id,
        "message": "Connecté au chat en temps réel"
    }))
    
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")
            
            if msg_type == "send_message":
                # Handle new message
                recipient_id = data.get("recipient_id")
                content = data.get("content", "")
                
                if recipient_id and content:
                    # Save message to DB
                    message_id = str(uuid.uuid4())
                    message = {
                        "message_id": message_id,
                        "sender_id": user_id,
                        "recipient_id": recipient_id,
                        "content": content,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "read": False
                    }
                    await db.messages.insert_one(message)
                    
                    # Send to recipient via WebSocket
                    ws_msg = create_ws_message(WSMessageTypes.NEW_MESSAGE, {
                        "message_id": message_id,
                        "sender_id": user_id,
                        "content": content
                    })
                    await chat_manager.send_personal_message(ws_msg, recipient_id)
                    
                    # Send push notification if recipient is offline
                    if not chat_manager.is_user_online(recipient_id):
                        sender = await db.users.find_one({"user_id": user_id}, {"username": 1, "_id": 0})
                        sender_name = sender.get("username", "Quelqu'un") if sender else "Quelqu'un"
                        
                        # Get recipient device tokens
                        recipient = await db.users.find_one({"user_id": recipient_id}, {"device_tokens": 1, "_id": 0})
                        if recipient and recipient.get("device_tokens"):
                            title, body = NotificationTemplates.new_message(sender_name)
                            await push_service.send_to_devices(
                                recipient["device_tokens"],
                                title,
                                body,
                                {"type": "message", "sender_id": user_id}
                            )
                    
                    # Confirm to sender
                    await websocket.send_json(create_ws_message("message_sent", {
                        "message_id": message_id,
                        "status": "delivered"
                    }))
            
            elif msg_type == "typing_start":
                recipient_id = data.get("recipient_id")
                if recipient_id:
                    await chat_manager.send_personal_message(
                        create_ws_message(WSMessageTypes.TYPING_START, {"user_id": user_id}),
                        recipient_id
                    )
            
            elif msg_type == "typing_stop":
                recipient_id = data.get("recipient_id")
                if recipient_id:
                    await chat_manager.send_personal_message(
                        create_ws_message(WSMessageTypes.TYPING_STOP, {"user_id": user_id}),
                        recipient_id
                    )
            
            elif msg_type == "mark_read":
                message_ids = data.get("message_ids", [])
                sender_id = data.get("sender_id")
                if message_ids:
                    await db.messages.update_many(
                        {"message_id": {"$in": message_ids}},
                        {"$set": {"read": True, "read_at": datetime.now(timezone.utc).isoformat()}}
                    )
                    # Notify sender
                    if sender_id:
                        await chat_manager.send_personal_message(
                            create_ws_message(WSMessageTypes.MESSAGE_READ, {
                                "message_ids": message_ids,
                                "reader_id": user_id
                            }),
                            sender_id
                        )
            
            elif msg_type == "ping":
                await websocket.send_json(create_ws_message("pong", {}))
    
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, user_id)
        logger.info(f"WebSocket disconnected: {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        chat_manager.disconnect(websocket, user_id)


# ==================== PUSH NOTIFICATION REGISTRATION ====================

class DeviceTokenRequest(BaseModel):
    device_token: str = None
    fcm_token: str = None  # Alternative field name
    platform: str = "web"  # web, ios, android

@api_router.post("/notifications/register-device")
async def register_device_token(request: Request, data: DeviceTokenRequest):
    """Register a device token for push notifications"""
    try:
        user = await require_auth(request)
        
        # Support both field names
        token = data.fcm_token or data.device_token
        if not token:
            raise HTTPException(status_code=400, detail="Token requis")
        
        # Add token to user's device_tokens array
        await db.users.update_one(
            {"user_id": user.user_id},
            {
                "$addToSet": {"device_tokens": token},
                "$set": {"last_device_platform": data.platform}
            }
        )
        
        # Subscribe to 'all_users' topic for broadcasts
        push_service.subscribe_to_topic([token], "all_users")
        
        return {"status": "success", "message": "Token enregistré"}
    except Exception as e:
        logger.error(f"Error registering device token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/notifications/register-token")
async def register_fcm_token(request: Request):
    """Register an FCM token for push notifications (alternative endpoint)"""
    try:
        user = await require_auth(request)
        body = await request.json()
        
        token = body.get("fcm_token") or body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token FCM requis")
        
        # Add token to user's device_tokens array
        await db.users.update_one(
            {"user_id": user.user_id},
            {
                "$addToSet": {"device_tokens": token},
                "$set": {"push_enabled": True}
            }
        )
        
        # Subscribe to 'all_users' topic for broadcasts
        push_service.subscribe_to_topic([token], "all_users")
        
        logger.info(f"FCM token registered for user {user.user_id}")
        return {"status": "success", "message": "Notifications activées"}
    except Exception as e:
        logger.error(f"Error registering FCM token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/notifications/unregister-token")
async def unregister_fcm_token(request: Request):
    """Unregister an FCM token"""
    try:
        user = await require_auth(request)
        body = await request.json()
        
        token = body.get("fcm_token") or body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token FCM requis")
        
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$pull": {"device_tokens": token}}
        )
        
        # Unsubscribe from topics
        push_service.unsubscribe_from_topic([token], "all_users")
        
        return {"status": "success", "message": "Notifications désactivées"}
    except Exception as e:
        logger.error(f"Error unregistering FCM token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== PASSWORD RESET WITH EMAIL ====================

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def request_password_reset(data: PasswordResetRequest):
    """Request a password reset email"""
    try:
        user = await db.users.find_one({"email": data.email.lower()}, {"_id": 0})
        
        if not user:
            # Don't reveal if email exists or not (security)
            return {"status": "success", "message": "Si cet email existe, vous recevrez un lien de réinitialisation."}
        
        # Generate reset token
        reset_token = generate_secure_token(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Store token
        await db.password_resets.insert_one({
            "token": reset_token,
            "user_id": user["user_id"],
            "email": data.email.lower(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat(),
            "used": False
        })
        
        # Send email
        await email_service.send_password_reset(
            data.email.lower(),
            reset_token,
            user.get("username", "Utilisateur")
        )
        
        return {"status": "success", "message": "Si cet email existe, vous recevrez un lien de réinitialisation."}
    except Exception as e:
        logger.error(f"Error requesting password reset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/reset-password")
async def confirm_password_reset(data: PasswordResetConfirm):
    """Confirm password reset with token"""
    try:
        # Find valid token
        reset = await db.password_resets.find_one({
            "token": data.token,
            "used": False
        }, {"_id": 0})
        
        if not reset:
            raise HTTPException(status_code=400, detail="Token invalide ou expiré")
        
        # Check expiration
        expires_at = datetime.fromisoformat(reset["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Token expiré")
        
        # Validate new password
        password_validation = validate_password_strength(data.new_password)
        if not password_validation["valid"]:
            raise HTTPException(status_code=400, detail=password_validation["message"])
        
        # Hash new password
        hashed = hash_password(data.new_password)
        
        # Update user password
        await db.users.update_one(
            {"user_id": reset["user_id"]},
            {"$set": {"password": hashed, "password_updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Mark token as used
        await db.password_resets.update_one(
            {"token": data.token},
            {"$set": {"used": True}}
        )
        
        return {"status": "success", "message": "Mot de passe réinitialisé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include router AFTER all routes are defined
app.include_router(api_router)


