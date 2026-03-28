"""
Optimisations MongoDB pour Hui Fenua
====================================
Index, Connection Pooling, et optimisations de requêtes
"""

import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional

logger = logging.getLogger(__name__)

# Configuration optimisée pour 10000+ utilisateurs simultanés
MONGO_POOL_CONFIG = {
    "maxPoolSize": 200,           # Connexions max dans le pool (augmenté)
    "minPoolSize": 20,            # Connexions min maintenues (augmenté)
    "maxIdleTimeMS": 60000,       # Ferme connexions inactives après 60s
    "waitQueueTimeoutMS": 15000,  # Timeout pour obtenir une connexion (augmenté)
    "connectTimeoutMS": 10000,    # Timeout de connexion (augmenté)
    "socketTimeoutMS": 45000,     # Timeout socket (augmenté)
    "serverSelectionTimeoutMS": 15000,
    "retryWrites": True,
    "retryReads": True,
    "w": 1,                       # Write concern
    "journal": False,             # Désactive journal pour perf
    "compressors": ["zstd", "snappy", "zlib"],  # Compression des données
}


def create_optimized_client(mongo_url: str) -> AsyncIOMotorClient:
    """Crée un client MongoDB avec connection pooling optimisé"""
    return AsyncIOMotorClient(mongo_url, **MONGO_POOL_CONFIG)


async def create_indexes(db) -> dict:
    """Crée tous les index nécessaires pour optimiser les requêtes"""
    created_indexes = []
    
    try:
        # ==================== POSTS ====================
        # Index pour le feed (tri par date)
        await db.posts.create_index([("created_at", -1)], background=True)
        created_indexes.append("posts.created_at")
        
        # Index pour les posts par utilisateur
        await db.posts.create_index([("user_id", 1), ("created_at", -1)], background=True)
        created_indexes.append("posts.user_id_created_at")
        
        # Index pour le statut de modération
        await db.posts.create_index([("moderation_status", 1), ("created_at", -1)], background=True)
        created_indexes.append("posts.moderation_status")
        
        # Index composé pour feed optimisé
        await db.posts.create_index([
            ("moderation_status", 1),
            ("created_at", -1),
            ("user_id", 1)
        ], background=True)
        created_indexes.append("posts.feed_optimized")
        
        # ==================== USERS ====================
        # Index unique sur user_id
        await db.users.create_index([("user_id", 1)], unique=True, background=True)
        created_indexes.append("users.user_id")
        
        # Index unique sur email
        await db.users.create_index([("email", 1)], unique=True, background=True)
        created_indexes.append("users.email")
        
        # Index pour recherche de nom (text search)
        await db.users.create_index([("name", "text")], background=True)
        created_indexes.append("users.name_text")
        
        # Index pour recherche par nom (regex)
        await db.users.create_index([("name", 1)], background=True)
        created_indexes.append("users.name_asc")
        
        # Index pour recherche par location
        await db.users.create_index([("location", 1)], background=True)
        created_indexes.append("users.location")
        
        # Index composé pour recherche utilisateurs
        await db.users.create_index([("is_banned", 1), ("name", 1)], background=True)
        created_indexes.append("users.search_optimized")
        
        # ==================== PRODUCTS (Marketplace) ====================
        # Index pour recherche de produits
        await db.products.create_index([("title", "text"), ("description", "text")], background=True)
        created_indexes.append("products.text_search")
        
        # Index pour produits disponibles
        await db.products.create_index([("is_available", 1), ("created_at", -1)], background=True)
        created_indexes.append("products.available")
        
        # Index pour catégorie
        await db.products.create_index([("category", 1), ("is_available", 1)], background=True)
        created_indexes.append("products.category")
        
        # ==================== MARKERS (Fenua Pulse) ====================
        # Index pour les markers par île
        await db.markers.create_index([("island", 1), ("expires_at", 1)], background=True)
        created_indexes.append("markers.island_expires")
        
        # Index pour les markers par type
        await db.markers.create_index([("marker_type", 1), ("expires_at", 1)], background=True)
        created_indexes.append("markers.type_expires")
        
        # Index composé pour requêtes Fenua Pulse
        await db.markers.create_index([
            ("island", 1),
            ("marker_type", 1),
            ("expires_at", 1),
            ("is_active", 1)
        ], background=True)
        created_indexes.append("markers.pulse_optimized")
        
        # Index géospatial pour markers (si coordonnées 2dsphere)
        try:
            await db.markers.create_index([("location", "2dsphere")], background=True)
            created_indexes.append("markers.location_geo")
        except Exception:
            # Ignore si pas de données géospatiales
            pass
        
        # ==================== CONVERSATIONS ====================
        # Index pour conversations par utilisateur
        await db.conversations.create_index([("participants", 1), ("updated_at", -1)], background=True)
        created_indexes.append("conversations.participants")
        
        # Index pour conversation_id
        await db.conversations.create_index([("conversation_id", 1)], unique=True, background=True)
        created_indexes.append("conversations.conversation_id")
        
        # ==================== MESSAGES ====================
        # Index pour messages par conversation
        await db.messages.create_index([("conversation_id", 1), ("created_at", -1)], background=True)
        created_indexes.append("messages.conversation_created")
        
        # ==================== VENDORS (Roulottes) ====================
        # Index pour vendors par user_id
        await db.vendors.create_index([("user_id", 1)], unique=True, background=True)
        created_indexes.append("vendors.user_id")
        
        # Index pour vendors ouverts
        await db.vendors.create_index([("is_open", 1), ("opened_at", -1)], background=True)
        created_indexes.append("vendors.is_open")
        
        # Index géospatial pour roulottes
        try:
            await db.vendors.create_index([
                ("current_lat", 1),
                ("current_lng", 1),
                ("is_open", 1)
            ], background=True)
            created_indexes.append("vendors.location_open")
        except Exception:
            pass
        
        # ==================== STORIES ====================
        # Index pour stories par utilisateur et expiration
        await db.stories.create_index([("user_id", 1), ("expires_at", 1)], background=True)
        created_indexes.append("stories.user_expires")
        
        # Index pour stories actives
        await db.stories.create_index([("expires_at", 1), ("created_at", -1)], background=True)
        created_indexes.append("stories.expires_created")
        
        # ==================== NOTIFICATIONS ====================
        # Index pour notifications par utilisateur
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)], background=True)
        created_indexes.append("notifications.user_created")
        
        # Index pour notifications non lues
        await db.notifications.create_index([("user_id", 1), ("read", 1), ("created_at", -1)], background=True)
        created_indexes.append("notifications.user_unread")
        
        # ==================== PRODUCTS & SERVICES ====================
        # Index pour produits
        await db.products.create_index([("is_available", 1), ("created_at", -1)], background=True)
        created_indexes.append("products.available_created")
        
        await db.products.create_index([("category", 1), ("is_available", 1)], background=True)
        created_indexes.append("products.category_available")
        
        # Index pour services
        await db.services.create_index([("is_available", 1), ("created_at", -1)], background=True)
        created_indexes.append("services.available_created")
        
        # ==================== SESSIONS ====================
        # Index pour sessions avec TTL
        await db.sessions.create_index([("session_token", 1)], unique=True, background=True)
        created_indexes.append("sessions.token")
        
        # TTL index pour auto-suppression des sessions expirées
        await db.sessions.create_index([("expires_at", 1)], expireAfterSeconds=0, background=True)
        created_indexes.append("sessions.expires_ttl")
        
        logger.info(f"Created {len(created_indexes)} indexes successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
    
    return {
        "created_indexes": created_indexes,
        "total": len(created_indexes)
    }


async def get_db_stats(db) -> dict:
    """Récupère les statistiques de la base de données"""
    try:
        stats = await db.command("dbStats")
        return {
            "collections": stats.get("collections", 0),
            "objects": stats.get("objects", 0),
            "dataSize_mb": round(stats.get("dataSize", 0) / 1024 / 1024, 2),
            "indexSize_mb": round(stats.get("indexSize", 0) / 1024 / 1024, 2),
            "storageSize_mb": round(stats.get("storageSize", 0) / 1024 / 1024, 2)
        }
    except Exception as e:
        logger.error(f"Error getting DB stats: {e}")
        return {}


async def get_collection_stats(db, collection_name: str) -> dict:
    """Récupère les statistiques d'une collection"""
    try:
        stats = await db.command("collStats", collection_name)
        indexes = await db[collection_name].index_information()
        return {
            "count": stats.get("count", 0),
            "size_mb": round(stats.get("size", 0) / 1024 / 1024, 2),
            "avg_obj_size_bytes": stats.get("avgObjSize", 0),
            "indexes": list(indexes.keys()),
            "index_count": len(indexes)
        }
    except Exception as e:
        return {"error": str(e)}
