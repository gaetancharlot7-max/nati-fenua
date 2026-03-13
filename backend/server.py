from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import json
import shutil
import base64

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

# Import RSS Feed module
from rss_feeds import RSSFeedService, cleanup_youtube_links

# Import Account Protection module
from account_protection import AccountProtectionService

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Hui Fenua API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

# Add CORS Middleware - CRITICAL for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

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
async def register(user_data: UserCreate, request: Request, response: Response):
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
async def login(user_data: UserLogin, request: Request, response: Response):
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
async def request_password_reset(request: Request):
    """Request a password reset link"""
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
    
    # In production, send email with reset link
    # For now, just log it
    logger.info(f"Password reset requested for {email}, token: {token}")
    
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
async def get_posts(limit: int = 20, skip: int = 0):
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
            }
        }},
        {"$project": {"user_data": 0}}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    return posts

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
        link_type=post_data.link_type
    )
    post_dict = post.model_dump()
    post_dict["created_at"] = post_dict["created_at"].isoformat()
    post_dict["moderation_status"] = "approved" if not (post_data.caption and moderate_text_content(post_data.caption).requires_review) else "pending_review"
    
    await db.posts.insert_one(post_dict)
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"posts_count": 1}})
    
    # Notify followers about new post
    await notify_followers_new_post(user.user_id, post.post_id, post_data.content_type)
    
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
    
    comment_dict.pop("_id", None)
    return comment_dict

# ==================== STORIES ROUTES ====================

@api_router.get("/stories")
async def get_stories():
    """Get stories for the feed (expires after 3 days)"""
    now = datetime.now(timezone.utc).isoformat()
    stories = await db.stories.find({"expires_at": {"$gt": now}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    users_stories = {}
    for story in stories:
        user_id = story["user_id"]
        if user_id not in users_stories:
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
            users_stories[user_id] = {"user": user, "stories": []}
        users_stories[user_id]["stories"].append(story)
    
    return list(users_stories.values())

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

# ==================== REELS ROUTES ====================

@api_router.get("/reels")
async def get_reels(limit: int = 20, skip: int = 0):
    reels = await db.posts.find({"content_type": "reel"}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for reel in reels:
        user = await db.users.find_one({"user_id": reel["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        reel["user"] = user
    
    return reels

# ==================== LIVE STREAMING ROUTES ====================

@api_router.get("/lives")
async def get_active_lives():
    lives = await db.lives.find({"status": "live"}, {"_id": 0}).sort("viewer_count", -1).to_list(50)
    
    for live in lives:
        user = await db.users.find_one({"user_id": live["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        live["user"] = user
    
    return lives

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
    
    message_dict.pop("_id", None)
    return message_dict

# ==================== MARKETPLACE ROUTES ====================

@api_router.get("/marketplace/products")
async def get_products(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for product in products:
        user = await db.users.find_one({"user_id": product["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        product["seller"] = user
    
    return products

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

@api_router.get("/marketplace/services")
async def get_services(category: Optional[str] = None, limit: int = 20, skip: int = 0):
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for service in services:
        user = await db.users.find_one({"user_id": service["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        service["provider"] = user
    
    return services

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
        return {"following": True}

@api_router.put("/users/profile")
async def update_profile(request: Request):
    user = await require_auth(request)
    body = await request.json()
    
    allowed_fields = ["name", "bio", "location", "picture", "is_business"]
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
            upload_dir = "/app/uploads/profiles"
            os.makedirs(upload_dir, exist_ok=True)
            file_path = os.path.join(upload_dir, filename)
            
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
    for media in user_media:
        file_path = media.get("file_path", "").replace("/uploads/", "/app/uploads/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
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
os.makedirs("/app/uploads/profiles", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ==================== ADMIN ROUTES ====================

import hashlib
import secrets

# Admin credentials (should be in env in production)
ADMIN_EMAIL = "admin@fenuasocial.com"
ADMIN_PASSWORD_HASH = None  # Will be set on first access or via env

async def get_or_create_admin():
    """Get or create admin account"""
    admin = await db.admin_users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if not admin:
        # Create default admin with password "FenuaAdmin2024!"
        default_password = "FenuaAdmin2024!"
        password_hash = hashlib.sha256(default_password.encode()).hexdigest()
        admin = {
            "admin_id": f"admin_{uuid.uuid4().hex[:12]}",
            "email": ADMIN_EMAIL,
            "password_hash": password_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_users.insert_one(admin)
        logger.info(f"Created default admin account: {ADMIN_EMAIL}")
    return admin

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

@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, request: Request):
    """Delete a post as admin"""
    await verify_admin_token(request)
    
    result = await db.posts.delete_one({"post_id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post non trouvé")
    
    logger.info(f"Post deleted by admin: {post_id}")
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
    file_path = media.get("file_path", "").replace("/uploads/", "/app/uploads/")
    if os.path.exists(file_path):
        os.remove(file_path)
    
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
    """Get list of islands with coordinates"""
    return get_islands()

@api_router.get("/pulse/marker-types")
async def get_pulse_marker_types():
    """Get list of marker types"""
    return get_marker_types()

@api_router.get("/pulse/badges")
async def get_all_badges():
    """Get list of all available badges"""
    return get_badges_list()

@api_router.get("/pulse/status")
async def get_pulse_status():
    """Get current pulse status of the fenua"""
    _, _, _, _, pulse, _ = get_app_services()
    return await pulse.get_pulse_status()

@api_router.get("/pulse/markers")
async def get_pulse_markers(
    types: Optional[str] = None,
    island: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_km: Optional[float] = None
):
    """Get active pulse markers"""
    _, _, _, _, pulse, _ = get_app_services()
    
    marker_types = types.split(",") if types else None
    
    return await pulse.get_active_markers(
        marker_types=marker_types,
        island=island,
        lat=lat,
        lng=lng,
        radius_km=radius_km
    )

@api_router.post("/pulse/markers")
async def create_pulse_marker(request: Request):
    """Create a new pulse marker"""
    user = await require_auth(request)
    body = await request.json()
    
    _, _, _, _, pulse, _ = get_app_services()
    
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
    result = await rss_service.publish_articles_as_posts(max_posts=max_posts)
    await rss_service.close()
    
    return result

@api_router.get("/admin/rss/stats")
async def get_rss_stats():
    """Get RSS feed statistics"""
    rss_service = RSSFeedService(db)
    stats = await rss_service.get_rss_stats()
    await rss_service.close()
    return stats

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
    """Get latest news from RSS feeds"""
    
    query = {"is_rss_article": True, "moderation_status": "approved"}
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
    return news


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
    """Start the auto publisher background task"""
    import asyncio
    
    async def daily_publish_task():
        """Background task that runs daily auto-publish"""
        while True:
            try:
                # Wait a bit for app to fully start
                await asyncio.sleep(60)
                
                # Check if we already published today
                today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                
                existing = await db.publication_logs.find_one({
                    "type": "daily_auto_publish",
                    "created_at": {"$gte": today_start.isoformat()}
                })
                
                if not existing:
                    # Publish new content
                    from auto_publisher import AutoPublisherService
                    import random
                    publisher = AutoPublisherService(db)
                    result = await publisher.publish_daily_content(posts_count=random.randint(20, 30))
                    logger.info(f"Daily auto-publish completed: {result}")
                
            except Exception as e:
                logger.error(f"Error in daily publisher: {e}")
            
            # Check every 6 hours
            await asyncio.sleep(6 * 3600)
    
    # Start background task
    asyncio.create_task(daily_publish_task())
    logger.info("Auto-publisher background task started")


# Include router AFTER all routes are defined
app.include_router(api_router)


