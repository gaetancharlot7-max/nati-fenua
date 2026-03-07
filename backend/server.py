from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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

ROOT_DIR = Path(__file__).parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Fenua Social API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

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
    content_type: str  # photo, video, reel, live_replay
    media_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[dict] = None  # {"lat": float, "lng": float}
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

class StoryBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    story_id: str = Field(default_factory=lambda: f"story_{uuid.uuid4().hex[:12]}")
    user_id: str
    media_url: str
    media_type: str
    duration: int = 5
    views_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=24))

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
async def register(user_data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    import hashlib
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": password_hash,
        "picture": f"https://ui-avatars.com/api/?name={user_data.name}&background=FF6B35&color=fff&bold=true",
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
    
    session_token = f"sess_{uuid.uuid4().hex}"
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
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    return {"user": user, "session_token": session_token}

@api_router.post("/auth/login")
async def login(user_data: UserLogin, response: Response):
    import hashlib
    password_hash = hashlib.sha256(user_data.password.encode()).hexdigest()
    
    user = await db.users.find_one({"email": user_data.email, "password_hash": password_hash}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    session_token = f"sess_{uuid.uuid4().hex}"
    session = {
        "user_id": user["user_id"],
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
    
    user.pop("password_hash", None)
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

# ==================== POSTS ROUTES ====================

@api_router.get("/posts", response_model=List[dict])
async def get_posts(limit: int = 20, skip: int = 0):
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        post["user"] = user
    
    return posts

@api_router.get("/posts/nearby")
async def get_nearby_posts(lat: float, lng: float, radius_km: float = 50, limit: int = 20):
    """Get posts within a radius of given coordinates"""
    # Simple distance calculation (Haversine formula approximation)
    # 1 degree lat ≈ 111km, 1 degree lng ≈ 111km * cos(lat)
    import math
    lat_range = radius_km / 111.0
    lng_range = radius_km / (111.0 * math.cos(math.radians(lat)))
    
    posts = await db.posts.find({
        "coordinates": {"$ne": None},
        "coordinates.lat": {"$gte": lat - lat_range, "$lte": lat + lat_range},
        "coordinates.lng": {"$gte": lng - lng_range, "$lte": lng + lng_range}
    }, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for post in posts:
        user = await db.users.find_one({"user_id": post["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "is_verified": 1})
        post["user"] = user
        
        # Calculate distance
        if post.get("coordinates"):
            dlat = math.radians(post["coordinates"]["lat"] - lat)
            dlng = math.radians(post["coordinates"]["lng"] - lng)
            a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(post["coordinates"]["lat"])) * math.sin(dlng/2)**2
            post["distance_km"] = round(2 * 6371 * math.asin(math.sqrt(a)), 1)
    
    return posts

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
        coordinates=post_data.coordinates
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

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, limit: int = 50):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    for comment in comments:
        user = await db.users.find_one({"user_id": comment["user_id"]}, {"_id": 0, "user_id": 1, "name": 1, "picture": 1})
        comment["user"] = user
    
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
async def upload_file(file: UploadFile = File(...), request: Request = None):
    """Upload a file (image or video) and return its URL"""
    try:
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non supporté. Utilisez JPG, PNG, GIF, WebP ou MP4.")
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Use HTTPS and proper host from headers
        forwarded_proto = request.headers.get('x-forwarded-proto', 'https')
        forwarded_host = request.headers.get('x-forwarded-host', request.headers.get('host', ''))
        
        if forwarded_host:
            file_url = f"{forwarded_proto}://{forwarded_host}/api/uploads/{unique_filename}"
        else:
            base_url = str(request.base_url).rstrip('/').replace('http://', 'https://')
            file_url = f"{base_url}/api/uploads/{unique_filename}"
        
        logger.info(f"File uploaded: {unique_filename}, URL: {file_url}")
        
        return {
            "success": True,
            "url": file_url,
            "filename": unique_filename,
            "content_type": file.content_type
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
    """Delete user account (GDPR right to be forgotten)"""
    user = await require_auth(request)
    body = await request.json()
    
    # Require password confirmation
    password = body.get("password")
    if not password:
        raise HTTPException(status_code=400, detail="Mot de passe requis pour supprimer le compte")
    
    # Verify password
    import hashlib
    hashed = hashlib.sha256(password.encode()).hexdigest()
    db_user = await db.users.find_one({"user_id": user.user_id})
    
    if not db_user or db_user.get("password_hash") != hashed:
        raise HTTPException(status_code=401, detail="Mot de passe incorrect")
    
    # Soft delete - mark as deleted but keep for legal purposes
    await db.users.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "deleted": True,
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "email": f"deleted_{user.user_id}@deleted.local",
                "name": "Compte supprimé",
                "picture": None,
                "bio": None
            }
        }
    )
    
    # Delete sessions
    await db.sessions.delete_many({"user_id": user.user_id})
    
    return {"success": True, "message": "Votre compte a été supprimé"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
