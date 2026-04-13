# FENUA PULSE - Backend Module
# Real-time interactive map of French Polynesia

from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import logging
import uuid
import math

logger = logging.getLogger(__name__)

# Island coordinates for quick navigation
ISLANDS = {
    "tahiti": {
        "name": "Tahiti",
        "lat": -17.6509,
        "lng": -149.4260,
        "zoom": 11
    },
    "moorea": {
        "name": "Moorea",
        "lat": -17.5388,
        "lng": -149.8295,
        "zoom": 12
    },
    "bora-bora": {
        "name": "Bora Bora",
        "lat": -16.5004,
        "lng": -151.7415,
        "zoom": 13
    },
    "huahine": {
        "name": "Huahine",
        "lat": -16.7333,
        "lng": -150.9833,
        "zoom": 12
    },
    "raiatea": {
        "name": "Raiatea",
        "lat": -16.8333,
        "lng": -151.4333,
        "zoom": 12
    },
    "tahaa": {
        "name": "Taha'a",
        "lat": -16.6167,
        "lng": -151.4833,
        "zoom": 12
    },
    "maupiti": {
        "name": "Maupiti",
        "lat": -16.4500,
        "lng": -152.2500,
        "zoom": 14
    },
    "marquises": {
        "name": "Marquises",
        "lat": -9.4333,
        "lng": -140.0667,
        "zoom": 8
    },
    "tuamotu": {
        "name": "Tuamotu",
        "lat": -15.0000,
        "lng": -145.0000,
        "zoom": 7
    },
    "australes": {
        "name": "Australes",
        "lat": -23.3500,
        "lng": -149.4667,
        "zoom": 8
    },
    "gambier": {
        "name": "Gambier",
        "lat": -23.1167,
        "lng": -134.9667,
        "zoom": 11
    },
    "rurutu": {
        "name": "Rurutu",
        "lat": -22.4500,
        "lng": -151.3500,
        "zoom": 13
    },
    "tubuai": {
        "name": "Tubuai",
        "lat": -23.3500,
        "lng": -149.4667,
        "zoom": 13
    },
    "raivavae": {
        "name": "Raivavae",
        "lat": -23.8667,
        "lng": -147.6667,
        "zoom": 13
    },
    "mangareva": {
        "name": "Mangareva",
        "lat": -23.1167,
        "lng": -134.9667,
        "zoom": 13
    }
}

# Marker types with colors and icons
MARKER_TYPES = {
    "roulotte": {
        "color": "#FF6B35",  # Orange
        "icon": "truck",
        "label": "Roulotte / Vendeur",
        "duration_hours": 3
    },
    "accident": {
        "color": "#EF4444",  # Red
        "icon": "flame",
        "label": "Accident / Route bloquée",
        "duration_hours": 4
    },
    "surf": {
        "color": "#3B82F6",  # Blue
        "icon": "waves",
        "label": "Conditions surf",
        "duration_hours": 4
    },
    "event": {
        "color": "#22C55E",  # Green
        "icon": "calendar",
        "label": "Événement",
        "duration_hours": 24  # Events last longer
    },
    "webcam": {
        "color": "#8B5CF6",  # Purple
        "icon": "video",
        "label": "Webcam Live",
        "duration_hours": 999999  # Permanent
    },
    "woofing": {
        "color": "#84CC16",  # Lime green
        "icon": "leaf",
        "label": "Woofing / Ferme bio",
        "duration_hours": 24
    },
    "market": {
        "color": "#F59E0B",  # Amber
        "icon": "shopping-bag",
        "label": "Bonne affaire / Marché",
        "duration_hours": 3
    },
    "carpool": {
        "color": "#10B981",  # Emerald
        "icon": "car",
        "label": "Covoiturage",
        "duration_hours": 8
    },
    "other": {
        "color": "#06B6D4",  # Cyan
        "icon": "map-pin",
        "label": "Autre signalement",
        "duration_hours": 4
    }
}

# Live webcams locations in French Polynesia
# Using REAL working webcam URLs verified in 2025
# external_url = direct link to webcam page (opens in new tab)
WEBCAMS = [
    # === TAHITI ===
    {
        "id": "webcam_tahiti_papeete",
        "name": "Papeete - Port",
        "island": "tahiti",
        "lat": -17.5350,
        "lng": -149.5696,
        "video_url": "https://www.windy.com/webcams/1515199127",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1515199127/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1515199127/day",
        "external_url": "https://www.windy.com/webcams/1515199127",
        "thumbnail": "https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    {
        "id": "webcam_tahiti_faaa_airport",
        "name": "Faaa - Aéroport International",
        "island": "tahiti",
        "lat": -17.5537,
        "lng": -149.6071,
        "video_url": "https://www.windy.com/webcams/1193101765",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1193101765/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1193101765/day",
        "external_url": "https://www.windy.com/webcams/1193101765",
        "thumbnail": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    {
        "id": "webcam_tahiti_arue",
        "name": "Arue - Vue sur Moorea",
        "island": "tahiti",
        "lat": -17.5200,
        "lng": -149.5000,
        "video_url": "https://www.windy.com/webcams/1366567855",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1366567855/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1366567855/day",
        "external_url": "https://www.windy.com/webcams/1366567855",
        "thumbnail": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    {
        "id": "webcam_tahiti_papara",
        "name": "Papara - Taharuu Beach",
        "island": "tahiti",
        "lat": -17.7500,
        "lng": -149.5167,
        "video_url": "https://www.windy.com/webcams/1366568190",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1366568190/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1366568190/day",
        "external_url": "https://www.windy.com/webcams/1366568190",
        "thumbnail": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    {
        "id": "webcam_teahupoo",
        "name": "Teahupo'o - Spot de Surf",
        "island": "tahiti",
        "lat": -17.8686,
        "lng": -149.2561,
        "video_url": "https://tahiti-webcam.online",
        "embed_url": "https://tahiti-webcam.online",
        "iframe_url": "https://tahiti-webcam.online",
        "external_url": "https://tahiti-webcam.online",
        "thumbnail": "https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400",
        "is_live": True,
        "source": "Tahiti Webcam",
        "type": "external"
    },
    
    # === MOOREA ===
    {
        "id": "webcam_moorea_ferry",
        "name": "Moorea - Ferry Tahiti-Moorea",
        "island": "moorea",
        "lat": -17.4903,
        "lng": -149.7620,
        "video_url": "https://www.skylinewebcams.com/fr/webcam/polynesie-francaise/iles-du-vent/tahiti/ferry-tahiti-and-moorea-islands.html",
        "embed_url": "https://www.skylinewebcams.com/fr/webcam/polynesie-francaise/iles-du-vent/tahiti/ferry-tahiti-and-moorea-islands.html",
        "iframe_url": "https://www.skylinewebcams.com/fr/webcam/polynesie-francaise/iles-du-vent/tahiti/ferry-tahiti-and-moorea-islands.html",
        "external_url": "https://www.skylinewebcams.com/fr/webcam/polynesie-francaise/iles-du-vent/tahiti/ferry-tahiti-and-moorea-islands.html",
        "thumbnail": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
        "is_live": True,
        "source": "SkylineWebcams",
        "type": "external"
    },
    
    # === BORA BORA ===
    {
        "id": "webcam_borabora_1",
        "name": "Bora Bora - Vue Lagon",
        "island": "bora-bora",
        "lat": -16.5004,
        "lng": -151.7415,
        "video_url": "https://www.windy.com/webcams/1342115286",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1342115286/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1342115286/day",
        "external_url": "https://www.windy.com/webcams/1342115286",
        "thumbnail": "https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    {
        "id": "webcam_borabora_2",
        "name": "Bora Bora - Plage",
        "island": "bora-bora",
        "lat": -16.5282,
        "lng": -151.7486,
        "video_url": "https://www.windy.com/webcams/1342115287",
        "embed_url": "https://webcams.windy.com/webcams/public/embed/player/1342115287/day",
        "iframe_url": "https://webcams.windy.com/webcams/public/embed/player/1342115287/day",
        "external_url": "https://www.windy.com/webcams/1342115287",
        "thumbnail": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
        "is_live": True,
        "source": "Windy",
        "type": "iframe"
    },
    
    # === AUTRES ÎLES (liens vers portails webcam) ===
    {
        "id": "webcam_raiatea",
        "name": "Raiatea - Îles Sous-le-Vent",
        "island": "raiatea",
        "lat": -16.7333,
        "lng": -151.4417,
        "video_url": "https://fr.worldcam.eu/webcams/australia-oceania/french-polynesia",
        "embed_url": "https://fr.worldcam.eu/webcams/australia-oceania/french-polynesia",
        "iframe_url": "https://fr.worldcam.eu/webcams/australia-oceania/french-polynesia",
        "external_url": "https://fr.worldcam.eu/webcams/australia-oceania/french-polynesia",
        "thumbnail": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
        "is_live": True,
        "source": "WorldCam",
        "type": "external"
    },
    {
        "id": "webcam_huahine",
        "name": "Huahine - Îles Sous-le-Vent",
        "island": "huahine",
        "lat": -16.7083,
        "lng": -151.0333,
        "video_url": "https://www.toutesleswebcams.com/webcams-pacifique.html",
        "embed_url": "https://www.toutesleswebcams.com/webcams-pacifique.html",
        "iframe_url": "https://www.toutesleswebcams.com/webcams-pacifique.html",
        "external_url": "https://www.toutesleswebcams.com/webcams-pacifique.html",
        "thumbnail": "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=400",
        "is_live": True,
        "source": "ToutesLesWebcams",
        "type": "external"
    },
    {
        "id": "webcam_rangiroa",
        "name": "Rangiroa - Tuamotu",
        "island": "tuamotu",
        "lat": -14.9667,
        "lng": -147.6333,
        "video_url": "https://www.cruisingearth.com/port-webcams/pacific-ocean/papeete-tahiti-french-polynesia/",
        "embed_url": "https://www.cruisingearth.com/port-webcams/pacific-ocean/papeete-tahiti-french-polynesia/",
        "iframe_url": "https://www.cruisingearth.com/port-webcams/pacific-ocean/papeete-tahiti-french-polynesia/",
        "external_url": "https://www.cruisingearth.com/port-webcams/pacific-ocean/papeete-tahiti-french-polynesia/",
        "thumbnail": "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400",
        "is_live": True,
        "source": "CruisingEarth",
        "type": "external"
    }
]

# Mana rewards
MANA_REWARDS = {
    "report_confirmed": 10,
    "review_roulotte": 5,
    "report_verified": 25,
    "daily_login": 2,
    "event_shared": 15,
    "refer_subscribers": 20,
    "first_report": 5,
    "streak_7_days": 50
}

# Badges definitions
BADGES = {
    "explorateur": {
        "name": "Explorateur du Fenua",
        "description": "Signalé dans 5 îles différentes",
        "icon": "🗺️",
        "requirement": {"type": "islands_count", "value": 5}
    },
    "gardien_route": {
        "name": "Gardien de la Route",
        "description": "50 signalements de route confirmés",
        "icon": "🛡️",
        "requirement": {"type": "accident_reports", "value": 50}
    },
    "gourmet": {
        "name": "Gourmet du Fenua",
        "description": "Noté 20 roulottes différentes",
        "icon": "🍽️",
        "requirement": {"type": "roulotte_reviews", "value": 20}
    },
    "surfeur": {
        "name": "Surfeur Connecté",
        "description": "30 signalements de conditions surf",
        "icon": "🏄",
        "requirement": {"type": "surf_reports", "value": 30}
    },
    "pilier_marche": {
        "name": "Pilier du Marché",
        "description": "Abonné à plus de 10 roulottes",
        "icon": "🏪",
        "requirement": {"type": "roulotte_subscriptions", "value": 10}
    },
    "voix_fenua": {
        "name": "Voix du Fenua",
        "description": "100 signalements confirmés au total",
        "icon": "📢",
        "requirement": {"type": "total_confirmed", "value": 100}
    },
    "coup_coeur": {
        "name": "Coup de cœur du Fenua",
        "description": "Roulotte avec plus de 4.5 étoiles",
        "icon": "💖",
        "requirement": {"type": "roulotte_rating", "value": 4.5}
    }
}


class FenuaPulseService:
    def __init__(self, db):
        self.db = db

    # ==================== MARKERS ====================
    
    async def create_marker(
        self,
        user_id: str,
        marker_type: str,
        lat: float,
        lng: float,
        title: str,
        description: Optional[str] = None,
        photo_url: Optional[str] = None,
        extra_data: Optional[dict] = None
    ) -> dict:
        """Create a new pulse marker"""
        
        if marker_type not in MARKER_TYPES:
            raise ValueError("Type de marqueur invalide")
        
        marker_config = MARKER_TYPES[marker_type]
        expires_at = datetime.now(timezone.utc) + timedelta(hours=marker_config["duration_hours"])
        
        # Detect island based on coordinates
        island = self._detect_island(lat, lng)
        
        marker = {
            "marker_id": f"marker_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "marker_type": marker_type,
            "lat": lat,
            "lng": lng,
            "title": title,
            "description": description,
            "photo_url": photo_url,
            "island": island,
            "color": marker_config["color"],
            "icon": marker_config["icon"],
            "confirmations": 0,
            "confirmed_by": [],
            "denied_by": [],
            "is_verified": False,
            "is_active": True,
            "extra_data": extra_data or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat()
        }
        
        await self.db.pulse_markers.insert_one(marker)
        
        # Award mana for first report
        await self._award_mana(user_id, "first_report", 5)
        
        logger.info(f"Marker created: {marker['marker_id']} by {user_id}")
        
        return {k: v for k, v in marker.items() if k != "_id"}

    def _detect_island(self, lat: float, lng: float) -> str:
        """Detect which island based on coordinates"""
        min_distance = float('inf')
        closest_island = "tahiti"
        
        for island_id, island in ISLANDS.items():
            distance = math.sqrt(
                (lat - island["lat"]) ** 2 + 
                (lng - island["lng"]) ** 2
            )
            if distance < min_distance:
                min_distance = distance
                closest_island = island_id
        
        return closest_island

    async def get_active_markers(
        self,
        marker_types: Optional[List[str]] = None,
        island: Optional[str] = None,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius_km: Optional[float] = None,
        include_webcams: bool = True
    ) -> List[dict]:
        """Get active markers with optional filters"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        query = {
            "is_active": True,
            "expires_at": {"$gt": now}
        }
        
        if marker_types:
            query["marker_type"] = {"$in": marker_types}
        
        if island:
            query["island"] = island
        
        markers = await self.db.pulse_markers.find(
            query, {"_id": 0}
        ).sort("created_at", -1).to_list(500)
        
        # Filter by radius if coordinates provided
        if lat is not None and lng is not None and radius_km:
            filtered = []
            for marker in markers:
                distance = self._calculate_distance(
                    lat, lng, marker["lat"], marker["lng"]
                )
                if distance <= radius_km:
                    marker["distance_km"] = round(distance, 2)
                    filtered.append(marker)
            markers = filtered
        
        # Add user info
        for marker in markers:
            user = await self.db.users.find_one(
                {"user_id": marker["user_id"]},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
            )
            marker["user"] = user
        
        # Add webcams if requested and type filter allows
        if include_webcams and (not marker_types or "webcam" in marker_types):
            webcam_markers = self._get_webcam_markers(island)
            markers.extend(webcam_markers)
        
        return markers
    
    def _get_webcam_markers(self, island: Optional[str] = None) -> List[dict]:
        """Get webcam markers for the specified island or all islands"""
        webcam_markers = []
        
        for webcam in WEBCAMS:
            if island and webcam["island"] != island:
                continue
            
            marker = {
                "marker_id": webcam["id"],
                "user_id": "system_webcam",
                "marker_type": "webcam",
                "lat": webcam["lat"],
                "lng": webcam["lng"],
                "title": webcam["name"],
                "description": f"Webcam en direct - {webcam['name']}",
                "photo_url": webcam["thumbnail"],
                "video_url": webcam.get("video_url"),
                "embed_url": webcam.get("embed_url"),
                "iframe_url": webcam.get("iframe_url"),
                "type": webcam.get("type", "iframe"),
                "source": webcam.get("source", "Webcam"),
                "island": webcam["island"],
                "color": MARKER_TYPES["webcam"]["color"],
                "icon": "video",
                "is_webcam": True,
                "is_verified": True,
                "is_active": True,
                "confirmations": 999,
                "user": {
                    "user_id": "system_webcam",
                    "name": "Webcam Officielle",
                    "picture": None
                }
            }
            webcam_markers.append(marker)
        
        return webcam_markers

    def _calculate_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points in km (Haversine formula)"""
        R = 6371  # Earth radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    async def confirm_marker(self, marker_id: str, user_id: str, is_confirmed: bool) -> dict:
        """Confirm or deny a marker"""
        
        marker = await self.db.pulse_markers.find_one({"marker_id": marker_id})
        if not marker:
            raise ValueError("Marqueur non trouvé")
        
        # Check if user already voted
        if user_id in marker.get("confirmed_by", []) or user_id in marker.get("denied_by", []):
            raise ValueError("Vous avez déjà voté pour ce signalement")
        
        if is_confirmed:
            update = {
                "$inc": {"confirmations": 1},
                "$push": {"confirmed_by": user_id}
            }
            
            # Check if verified (5+ confirmations)
            if marker.get("confirmations", 0) + 1 >= 5:
                update["$set"] = {"is_verified": True}
                # Award mana to creator
                await self._award_mana(marker["user_id"], "report_verified", 25)
        else:
            update = {"$push": {"denied_by": user_id}}
            
            # Check if should be hidden (3+ denials)
            if len(marker.get("denied_by", [])) + 1 >= 3:
                update["$set"] = {"is_active": False}
        
        await self.db.pulse_markers.update_one(
            {"marker_id": marker_id},
            update
        )
        
        # Award mana for confirmation
        await self._award_mana(user_id, "report_confirmed", 2)
        
        return {"success": True, "confirmed": is_confirmed}

    async def close_marker(self, marker_id: str, user_id: str) -> dict:
        """Close a marker (only creator can close)"""
        
        marker = await self.db.pulse_markers.find_one({"marker_id": marker_id})
        if not marker:
            raise ValueError("Marqueur non trouvé")
        
        if marker["user_id"] != user_id:
            raise ValueError("Seul le créateur peut fermer ce signalement")
        
        await self.db.pulse_markers.update_one(
            {"marker_id": marker_id},
            {"$set": {"is_active": False}}
        )
        
        return {"success": True}

    # ==================== PULSE STATUS ====================
    
    async def get_pulse_status(self) -> dict:
        """Get the current pulse status of the fenua"""
        
        now = datetime.now(timezone.utc).isoformat()
        
        active_count = await self.db.pulse_markers.count_documents({
            "is_active": True,
            "expires_at": {"$gt": now}
        })
        
        if active_count < 10:
            status = {
                "emoji": "☀️",
                "text": "Journée tranquille",
                "level": "calm",
                "color": "#22C55E"
            }
        elif active_count < 50:
            status = {
                "emoji": "🌊",
                "text": "Ça bouge au fenua !",
                "level": "normal",
                "color": "#3B82F6"
            }
        elif active_count < 100:
            status = {
                "emoji": "🔥",
                "text": "Le fenua est en feu !",
                "level": "busy",
                "color": "#F59E0B"
            }
        else:
            status = {
                "emoji": "💥",
                "text": "Journée historique !",
                "level": "exceptional",
                "color": "#EF4444"
            }
        
        status["active_count"] = active_count
        status["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        return status

    # ==================== MANA SYSTEM ====================
    
    async def _award_mana(self, user_id: str, action: str, amount: int):
        """Award mana points to a user"""
        
        mana_record = {
            "mana_id": f"mana_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "action": action,
            "amount": amount,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.mana_transactions.insert_one(mana_record)
        
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"mana_points": amount}}
        )
        
        # Check for badge unlocks
        await self._check_badges(user_id)

    async def get_user_mana(self, user_id: str) -> dict:
        """Get user's mana balance and history"""
        
        user = await self.db.users.find_one(
            {"user_id": user_id},
            {"_id": 0, "mana_points": 1}
        )
        
        transactions = await self.db.mana_transactions.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).limit(20).to_list(20)
        
        return {
            "balance": user.get("mana_points", 0) if user else 0,
            "recent_transactions": transactions
        }

    async def spend_mana(self, user_id: str, amount: int, reason: str) -> dict:
        """Spend mana points"""
        
        user = await self.db.users.find_one({"user_id": user_id})
        current_mana = user.get("mana_points", 0) if user else 0
        
        if current_mana < amount:
            raise ValueError("Mana insuffisant")
        
        mana_record = {
            "mana_id": f"mana_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "action": reason,
            "amount": -amount,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.mana_transactions.insert_one(mana_record)
        
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"mana_points": -amount}}
        )
        
        return {"success": True, "new_balance": current_mana - amount}

    # ==================== BADGES ====================
    
    async def _check_badges(self, user_id: str):
        """Check and award badges based on user activity"""
        
        user = await self.db.users.find_one({"user_id": user_id})
        current_badges = user.get("badges", []) if user else []
        
        # Check each badge
        for badge_id, badge_info in BADGES.items():
            if badge_id in current_badges:
                continue
            
            req = badge_info["requirement"]
            earned = False
            
            if req["type"] == "islands_count":
                islands = await self.db.pulse_markers.distinct(
                    "island",
                    {"user_id": user_id, "is_verified": True}
                )
                earned = len(islands) >= req["value"]
            
            elif req["type"] == "accident_reports":
                count = await self.db.pulse_markers.count_documents({
                    "user_id": user_id,
                    "marker_type": "accident",
                    "confirmations": {"$gte": 1}
                })
                earned = count >= req["value"]
            
            elif req["type"] == "roulotte_reviews":
                count = await self.db.roulotte_reviews.count_documents({
                    "user_id": user_id
                })
                earned = count >= req["value"]
            
            elif req["type"] == "surf_reports":
                count = await self.db.pulse_markers.count_documents({
                    "user_id": user_id,
                    "marker_type": "surf",
                    "confirmations": {"$gte": 1}
                })
                earned = count >= req["value"]
            
            elif req["type"] == "roulotte_subscriptions":
                count = await self.db.roulotte_subscriptions.count_documents({
                    "user_id": user_id
                })
                earned = count >= req["value"]
            
            elif req["type"] == "total_confirmed":
                count = await self.db.pulse_markers.count_documents({
                    "user_id": user_id,
                    "confirmations": {"$gte": 1}
                })
                earned = count >= req["value"]
            
            if earned:
                await self.db.users.update_one(
                    {"user_id": user_id},
                    {"$push": {"badges": badge_id}}
                )
                
                # Create notification
                notification = {
                    "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
                    "user_id": user_id,
                    "type": "badge_earned",
                    "title": f"Nouveau badge : {badge_info['icon']} {badge_info['name']}",
                    "message": badge_info["description"],
                    "read": False,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await self.db.notifications.insert_one(notification)
                
                logger.info(f"Badge {badge_id} awarded to {user_id}")

    async def get_user_badges(self, user_id: str) -> List[dict]:
        """Get user's badges with details"""
        
        user = await self.db.users.find_one({"user_id": user_id})
        user_badges = user.get("badges", []) if user else []
        
        badges = []
        for badge_id in user_badges:
            if badge_id in BADGES:
                badge = BADGES[badge_id].copy()
                badge["badge_id"] = badge_id
                badges.append(badge)
        
        return badges

    # ==================== LEADERBOARD ====================
    
    async def get_weekly_leaderboard(self, island: Optional[str] = None) -> List[dict]:
        """Get weekly leaderboard by island or global"""
        
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        match_query = {"created_at": {"$gte": week_ago}}
        if island:
            match_query["island"] = island
        
        pipeline = [
            {"$match": match_query},
            {"$group": {
                "_id": "$user_id",
                "report_count": {"$sum": 1},
                "confirmed_count": {"$sum": {"$cond": [{"$gte": ["$confirmations", 1]}, 1, 0]}},
                "verified_count": {"$sum": {"$cond": ["$is_verified", 1, 0]}}
            }},
            {"$sort": {"confirmed_count": -1, "report_count": -1}},
            {"$limit": 10}
        ]
        
        results = await self.db.pulse_markers.aggregate(pipeline).to_list(10)
        
        leaderboard = []
        for i, result in enumerate(results):
            user = await self.db.users.find_one(
                {"user_id": result["_id"]},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1, "mana_points": 1}
            )
            if user:
                leaderboard.append({
                    "rank": i + 1,
                    "user": user,
                    "report_count": result["report_count"],
                    "confirmed_count": result["confirmed_count"],
                    "verified_count": result["verified_count"]
                })
        
        return leaderboard

    # ==================== STATS ====================
    
    async def get_fenua_stats(self) -> dict:
        """Get overall Fenua Pulse statistics"""
        
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        # Weekly report count
        weekly_reports = await self.db.pulse_markers.count_documents({
            "created_at": {"$gte": week_ago}
        })
        
        # Most active island
        island_pipeline = [
            {"$match": {"created_at": {"$gte": week_ago}}},
            {"$group": {"_id": "$island", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        island_result = await self.db.pulse_markers.aggregate(island_pipeline).to_list(1)
        most_active_island = ISLANDS.get(island_result[0]["_id"], {}).get("name") if island_result else "Tahiti"
        
        # Most popular roulotte
        roulotte_pipeline = [
            {"$match": {"created_at": {"$gte": week_ago}}},
            {"$group": {"_id": "$vendor_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        
        # Most reported surf spot
        surf_pipeline = [
            {"$match": {"marker_type": "surf", "created_at": {"$gte": week_ago}}},
            {"$group": {"_id": "$title", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 1}
        ]
        surf_result = await self.db.pulse_markers.aggregate(surf_pipeline).to_list(1)
        top_surf_spot = surf_result[0]["_id"] if surf_result else "Teahupo'o"
        
        return {
            "weekly_reports": weekly_reports,
            "most_active_island": most_active_island,
            "top_surf_spot": top_surf_spot,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }


def get_islands():
    """Return island list for frontend"""
    return [
        {"id": k, **v}
        for k, v in ISLANDS.items()
    ]


def get_marker_types():
    """Return marker types for frontend"""
    return [
        {"type": k, **v}
        for k, v in MARKER_TYPES.items()
    ]


def get_badges_list():
    """Return all badges for frontend"""
    return [
        {"badge_id": k, **v}
        for k, v in BADGES.items()
    ]
