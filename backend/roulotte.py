# FENUA PULSE - Roulotte/Vendor System
# Special vendor profiles for food trucks and street vendors

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import logging
import uuid

logger = logging.getLogger(__name__)

# Payment methods
PAYMENT_METHODS = [
    {"id": "cash", "label": "Espèces", "icon": "💵"},
    {"id": "card", "label": "Carte bancaire", "icon": "💳"},
    {"id": "virement", "label": "Virement", "icon": "🏦"},
    {"id": "fenua_tokens", "label": "Tokens Fenua", "icon": "🪙"}
]

# Cuisine types
CUISINE_TYPES = [
    {"id": "tahitien", "label": "Cuisine tahitienne"},
    {"id": "chinois", "label": "Cuisine chinoise"},
    {"id": "francais", "label": "Cuisine française"},
    {"id": "pizza", "label": "Pizzas"},
    {"id": "burger", "label": "Burgers"},
    {"id": "poisson", "label": "Poisson cru / Fruits de mer"},
    {"id": "crepes", "label": "Crêpes / Gaufres"},
    {"id": "glaces", "label": "Glaces / Desserts"},
    {"id": "boissons", "label": "Boissons / Jus frais"},
    {"id": "fruits", "label": "Fruits / Légumes"},
    {"id": "artisanat", "label": "Artisanat"},
    {"id": "autre", "label": "Autre"}
]


class RouletteService:
    def __init__(self, db, pulse_service):
        self.db = db
        self.pulse_service = pulse_service

    # ==================== VENDOR PROFILE ====================
    
    async def create_vendor_profile(
        self,
        user_id: str,
        name: str,
        description: str,
        cuisine_type: str,
        photo_url: Optional[str] = None,
        phone: Optional[str] = None,
        payment_methods: Optional[List[str]] = None,
        usual_hours: Optional[str] = None,
        usual_location: Optional[str] = None
    ) -> dict:
        """Create or update a vendor profile"""
        
        existing = await self.db.vendors.find_one({"user_id": user_id})
        
        vendor = {
            "vendor_id": existing.get("vendor_id") if existing else f"vendor_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "name": name,
            "description": description,
            "cuisine_type": cuisine_type,
            "photo_url": photo_url,
            "phone": phone,
            "payment_methods": payment_methods or ["cash"],
            "usual_hours": usual_hours,
            "usual_location": usual_location,
            "rating_avg": existing.get("rating_avg", 0) if existing else 0,
            "rating_count": existing.get("rating_count", 0) if existing else 0,
            "is_open": False,
            "open_marker_id": None,
            "subscriber_count": existing.get("subscriber_count", 0) if existing else 0,
            "is_verified": existing.get("is_verified", False) if existing else False,
            "is_coup_coeur": existing.get("is_coup_coeur", False) if existing else False,
            "menu_items": existing.get("menu_items", []) if existing else [],
            "created_at": existing.get("created_at") if existing else datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if existing:
            await self.db.vendors.update_one(
                {"vendor_id": vendor["vendor_id"]},
                {"$set": vendor}
            )
        else:
            await self.db.vendors.insert_one(vendor)
            
            # Update user to mark as vendor
            await self.db.users.update_one(
                {"user_id": user_id},
                {"$set": {"is_vendor": True, "vendor_id": vendor["vendor_id"]}}
            )
        
        logger.info(f"Vendor profile {'updated' if existing else 'created'}: {vendor['vendor_id']}")
        
        return {k: v for k, v in vendor.items() if k != "_id"}

    async def get_vendor_profile(self, vendor_id: str) -> Optional[dict]:
        """Get vendor profile by ID"""
        vendor = await self.db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})
        
        if vendor:
            # Get recent reviews
            reviews = await self.db.roulotte_reviews.find(
                {"vendor_id": vendor_id}, {"_id": 0}
            ).sort("created_at", -1).limit(3).to_list(3)
            
            for review in reviews:
                user = await self.db.users.find_one(
                    {"user_id": review["user_id"]},
                    {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
                )
                review["user"] = user
            
            vendor["recent_reviews"] = reviews
        
        return vendor

    async def get_vendor_by_user(self, user_id: str) -> Optional[dict]:
        """Get vendor profile by user ID"""
        return await self.db.vendors.find_one({"user_id": user_id}, {"_id": 0})

    # ==================== OPEN/CLOSE ====================
    
    async def open_roulotte(
        self,
        user_id: str,
        lat: float,
        lng: float,
        menu_today: Optional[str] = None
    ) -> dict:
        """Signal that the roulotte is open"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor:
            raise ValueError("Profil vendeur non trouvé")
        
        if vendor.get("is_open"):
            raise ValueError("Votre roulotte est déjà ouverte")
        
        # Create marker on pulse map
        marker = await self.pulse_service.create_marker(
            user_id=user_id,
            marker_type="roulotte",
            lat=lat,
            lng=lng,
            title=vendor["name"],
            description=menu_today or vendor.get("description"),
            photo_url=vendor.get("photo_url"),
            extra_data={
                "vendor_id": vendor["vendor_id"],
                "cuisine_type": vendor.get("cuisine_type"),
                "phone": vendor.get("phone"),
                "payment_methods": vendor.get("payment_methods", [])
            }
        )
        
        # Update vendor status
        await self.db.vendors.update_one(
            {"vendor_id": vendor["vendor_id"]},
            {"$set": {
                "is_open": True,
                "open_marker_id": marker["marker_id"],
                "current_lat": lat,
                "current_lng": lng,
                "opened_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Notify subscribers
        await self._notify_subscribers(vendor, lat, lng)
        
        logger.info(f"Roulotte opened: {vendor['vendor_id']}")
        
        return {
            "success": True,
            "marker_id": marker["marker_id"],
            "expires_at": marker["expires_at"]
        }

    async def close_roulotte(self, user_id: str) -> dict:
        """Signal that the roulotte is closed"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor:
            raise ValueError("Profil vendeur non trouvé")
        
        if not vendor.get("is_open"):
            return {"success": True, "message": "Déjà fermé"}
        
        # Close marker
        if vendor.get("open_marker_id"):
            await self.pulse_service.close_marker(vendor["open_marker_id"], user_id)
        
        # Update vendor status
        await self.db.vendors.update_one(
            {"vendor_id": vendor["vendor_id"]},
            {"$set": {
                "is_open": False,
                "open_marker_id": None,
                "current_lat": None,
                "current_lng": None
            }}
        )
        
        logger.info(f"Roulotte closed: {vendor['vendor_id']}")
        
        return {"success": True}

    async def extend_opening(self, user_id: str, hours: int = 2) -> dict:
        """Extend the opening time"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor or not vendor.get("is_open"):
            raise ValueError("Roulotte non ouverte")
        
        marker_id = vendor.get("open_marker_id")
        if marker_id:
            new_expires = datetime.now(timezone.utc) + timedelta(hours=hours)
            await self.db.pulse_markers.update_one(
                {"marker_id": marker_id},
                {"$set": {"expires_at": new_expires.isoformat()}}
            )
        
        return {"success": True, "extended_by_hours": hours}

    async def _notify_subscribers(self, vendor: dict, lat: float, lng: float):
        """Notify subscribers that roulotte is open"""
        
        # Get location name (simplified)
        island = self.pulse_service._detect_island(lat, lng)
        location_name = island.title()
        
        subscriptions = await self.db.roulotte_subscriptions.find(
            {"vendor_id": vendor["vendor_id"]}
        ).to_list(1000)
        
        for sub in subscriptions:
            notification = {
                "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                "user_id": sub["user_id"],
                "type": "roulotte_open",
                "title": f"🚚 {vendor['name']} est ouvert !",
                "message": f"Près de {location_name}",
                "data": {
                    "vendor_id": vendor["vendor_id"],
                    "lat": lat,
                    "lng": lng
                },
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.notifications.insert_one(notification)

    # ==================== MENU ====================
    
    async def add_menu_item(
        self,
        user_id: str,
        name: str,
        price: int,
        photo_url: Optional[str] = None,
        description: Optional[str] = None
    ) -> dict:
        """Add item to menu"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor:
            raise ValueError("Profil vendeur non trouvé")
        
        item = {
            "item_id": f"item_{uuid.uuid4().hex[:8]}",
            "name": name,
            "price": price,
            "photo_url": photo_url,
            "description": description,
            "is_available": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.vendors.update_one(
            {"vendor_id": vendor["vendor_id"]},
            {"$push": {"menu_items": item}}
        )
        
        return item

    async def update_menu_item(
        self,
        user_id: str,
        item_id: str,
        updates: dict
    ) -> dict:
        """Update a menu item"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor:
            raise ValueError("Profil vendeur non trouvé")
        
        await self.db.vendors.update_one(
            {"vendor_id": vendor["vendor_id"], "menu_items.item_id": item_id},
            {"$set": {f"menu_items.$.{k}": v for k, v in updates.items()}}
        )
        
        return {"success": True}

    async def remove_menu_item(self, user_id: str, item_id: str) -> dict:
        """Remove item from menu"""
        
        vendor = await self.db.vendors.find_one({"user_id": user_id})
        if not vendor:
            raise ValueError("Profil vendeur non trouvé")
        
        await self.db.vendors.update_one(
            {"vendor_id": vendor["vendor_id"]},
            {"$pull": {"menu_items": {"item_id": item_id}}}
        )
        
        return {"success": True}

    # ==================== REVIEWS ====================
    
    async def add_review(
        self,
        user_id: str,
        vendor_id: str,
        rating: int,
        comment: Optional[str] = None
    ) -> dict:
        """Add review for a roulotte"""
        
        if not 1 <= rating <= 5:
            raise ValueError("Note entre 1 et 5")
        
        vendor = await self.db.vendors.find_one({"vendor_id": vendor_id})
        if not vendor:
            raise ValueError("Roulotte non trouvée")
        
        # Check if already reviewed recently
        existing = await self.db.roulotte_reviews.find_one({
            "user_id": user_id,
            "vendor_id": vendor_id,
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
        })
        
        if existing:
            raise ValueError("Vous avez déjà donné un avis cette semaine")
        
        review = {
            "review_id": f"review_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "vendor_id": vendor_id,
            "rating": rating,
            "comment": comment,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.roulotte_reviews.insert_one(review)
        
        # Update vendor rating
        all_reviews = await self.db.roulotte_reviews.find(
            {"vendor_id": vendor_id}
        ).to_list(10000)
        
        total_rating = sum(r["rating"] for r in all_reviews)
        count = len(all_reviews)
        avg_rating = round(total_rating / count, 1) if count > 0 else 0
        
        is_coup_coeur = avg_rating >= 4.5 and count >= 10
        
        await self.db.vendors.update_one(
            {"vendor_id": vendor_id},
            {"$set": {
                "rating_avg": avg_rating,
                "rating_count": count,
                "is_coup_coeur": is_coup_coeur
            }}
        )
        
        # Award mana
        await self.pulse_service._award_mana(user_id, "review_roulotte", 5)
        
        logger.info(f"Review added for {vendor_id} by {user_id}: {rating} stars")
        
        return {
            "success": True,
            "review_id": review["review_id"],
            "new_avg": avg_rating
        }

    # ==================== SUBSCRIPTIONS ====================
    
    async def subscribe_to_roulotte(self, user_id: str, vendor_id: str) -> dict:
        """Subscribe to a roulotte for notifications"""
        
        existing = await self.db.roulotte_subscriptions.find_one({
            "user_id": user_id,
            "vendor_id": vendor_id
        })
        
        if existing:
            # Unsubscribe
            await self.db.roulotte_subscriptions.delete_one({
                "user_id": user_id,
                "vendor_id": vendor_id
            })
            
            await self.db.vendors.update_one(
                {"vendor_id": vendor_id},
                {"$inc": {"subscriber_count": -1}}
            )
            
            return {"subscribed": False}
        else:
            # Subscribe
            subscription = {
                "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
                "user_id": user_id,
                "vendor_id": vendor_id,
                "notify_radius_km": 5,  # Default 5km
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            await self.db.roulotte_subscriptions.insert_one(subscription)
            
            await self.db.vendors.update_one(
                {"vendor_id": vendor_id},
                {"$inc": {"subscriber_count": 1}}
            )
            
            return {"subscribed": True}

    async def update_notification_radius(
        self,
        user_id: str,
        vendor_id: str,
        radius_km: int
    ) -> dict:
        """Update notification radius for a subscription"""
        
        if radius_km not in [1, 3, 5]:
            raise ValueError("Rayon invalide (1, 3 ou 5 km)")
        
        await self.db.roulotte_subscriptions.update_one(
            {"user_id": user_id, "vendor_id": vendor_id},
            {"$set": {"notify_radius_km": radius_km}}
        )
        
        return {"success": True}

    async def get_user_subscriptions(self, user_id: str) -> List[dict]:
        """Get user's roulotte subscriptions"""
        
        subscriptions = await self.db.roulotte_subscriptions.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(100)
        
        for sub in subscriptions:
            vendor = await self.db.vendors.find_one(
                {"vendor_id": sub["vendor_id"]},
                {"_id": 0, "vendor_id": 1, "name": 1, "photo_url": 1, "is_open": 1, "rating_avg": 1}
            )
            sub["vendor"] = vendor
        
        return subscriptions

    # ==================== SEARCH ====================
    
    async def search_roulottes(
        self,
        query: Optional[str] = None,
        cuisine_type: Optional[str] = None,
        is_open: Optional[bool] = None,
        min_rating: Optional[float] = None,
        limit: int = 20
    ) -> List[dict]:
        """Search for roulottes"""
        
        filter_query = {}
        
        if query:
            filter_query["$or"] = [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}}
            ]
        
        if cuisine_type:
            filter_query["cuisine_type"] = cuisine_type
        
        if is_open is not None:
            filter_query["is_open"] = is_open
        
        if min_rating:
            filter_query["rating_avg"] = {"$gte": min_rating}
        
        vendors = await self.db.vendors.find(
            filter_query, {"_id": 0}
        ).sort([
            ("is_coup_coeur", -1),
            ("rating_avg", -1),
            ("rating_count", -1)
        ]).limit(limit).to_list(limit)
        
        return vendors

    async def get_open_roulottes(
        self,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: float = 10
    ) -> List[dict]:
        """Get currently open roulottes"""
        
        vendors = await self.db.vendors.find(
            {"is_open": True},
            {"_id": 0}
        ).to_list(100)
        
        if lat is not None and lng is not None:
            # Filter by distance and add distance info
            filtered = []
            for vendor in vendors:
                if vendor.get("current_lat") and vendor.get("current_lng"):
                    distance = self.pulse_service._calculate_distance(
                        lat, lng,
                        vendor["current_lat"], vendor["current_lng"]
                    )
                    if distance <= radius_km:
                        vendor["distance_km"] = round(distance, 2)
                        filtered.append(vendor)
            
            vendors = sorted(filtered, key=lambda x: x["distance_km"])
        
        return vendors


def get_payment_methods():
    """Return payment methods for frontend"""
    return PAYMENT_METHODS


def get_cuisine_types():
    """Return cuisine types for frontend"""
    return CUISINE_TYPES
