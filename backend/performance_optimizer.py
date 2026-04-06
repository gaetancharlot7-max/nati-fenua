"""
Performance Optimizer pour Nati Fenua
=====================================
Optimisations pour supporter 1500-2000 utilisateurs simultanés
"""

import asyncio
import logging
from functools import wraps
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Callable
import time
import hashlib
import json

logger = logging.getLogger(__name__)

# ============================================================
# IN-MEMORY CACHE OPTIMISÉ
# ============================================================

class HighPerformanceCache:
    """Cache en mémoire ultra-rapide avec TTL et LRU"""
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._access_order: list = []
        self._max_size = max_size
        self._default_ttl = default_ttl
        self._hits = 0
        self._misses = 0
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Génère une clé de cache unique"""
        key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        if key in self._cache:
            entry = self._cache[key]
            if entry["expires_at"] > datetime.now():
                self._hits += 1
                # Update access order for LRU
                if key in self._access_order:
                    self._access_order.remove(key)
                self._access_order.append(key)
                return entry["value"]
            else:
                # Expired, remove it
                del self._cache[key]
                if key in self._access_order:
                    self._access_order.remove(key)
        self._misses += 1
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke une valeur dans le cache"""
        ttl = ttl or self._default_ttl
        
        # Evict oldest entries if cache is full (LRU)
        while len(self._cache) >= self._max_size:
            if self._access_order:
                oldest_key = self._access_order.pop(0)
                if oldest_key in self._cache:
                    del self._cache[oldest_key]
        
        self._cache[key] = {
            "value": value,
            "expires_at": datetime.now() + timedelta(seconds=ttl),
            "created_at": datetime.now()
        }
        self._access_order.append(key)
    
    def delete(self, key: str) -> bool:
        """Supprime une entrée du cache"""
        if key in self._cache:
            del self._cache[key]
            if key in self._access_order:
                self._access_order.remove(key)
            return True
        return False
    
    def clear(self) -> None:
        """Vide le cache"""
        self._cache.clear()
        self._access_order.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du cache"""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": f"{hit_rate:.2f}%",
            "memory_entries": len(self._cache)
        }

# Instance globale du cache
perf_cache = HighPerformanceCache(max_size=10000, default_ttl=300)

# Caches spécialisés
feed_cache = HighPerformanceCache(max_size=1000, default_ttl=60)  # Feed: 1 min
user_cache = HighPerformanceCache(max_size=5000, default_ttl=300)  # Users: 5 min
translation_cache = HighPerformanceCache(max_size=100, default_ttl=3600)  # Translations: 1h
marker_cache = HighPerformanceCache(max_size=2000, default_ttl=120)  # Markers: 2 min


# ============================================================
# DECORATEURS DE CACHE
# ============================================================

def cached_response(cache_instance: HighPerformanceCache, ttl: int = 300, key_prefix: str = ""):
    """Décorateur pour mettre en cache les réponses d'API"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{cache_instance._generate_key(*args[1:], **kwargs)}"
            
            # Try to get from cache
            cached = cache_instance.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            cache_instance.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator


def cache_feed(ttl: int = 60):
    """Cache spécialisé pour le feed"""
    return cached_response(feed_cache, ttl, "feed")


def cache_user(ttl: int = 300):
    """Cache spécialisé pour les utilisateurs"""
    return cached_response(user_cache, ttl, "user")


def cache_markers(ttl: int = 120):
    """Cache spécialisé pour les marqueurs"""
    return cached_response(marker_cache, ttl, "marker")


# ============================================================
# OPTIMISATIONS DE REQUÊTES MONGODB
# ============================================================

# Projections optimisées (évite de charger des champs inutiles)
USER_PROJECTION_MINIMAL = {
    "_id": 0,
    "user_id": 1,
    "name": 1,
    "picture": 1,
    "is_verified": 1
}

USER_PROJECTION_PROFILE = {
    "_id": 0,
    "user_id": 1,
    "name": 1,
    "email": 1,
    "picture": 1,
    "bio": 1,
    "location": 1,
    "is_verified": 1,
    "is_business": 1,
    "followers_count": 1,
    "following_count": 1,
    "posts_count": 1,
    "created_at": 1
}

POST_PROJECTION_FEED = {
    "_id": 0,
    "post_id": 1,
    "user_id": 1,
    "caption": 1,
    "media_url": 1,
    "thumbnail_url": 1,
    "content_type": 1,
    "link_type": 1,
    "external_link": 1,
    "link_title": 1,
    "link_source": 1,
    "location": 1,
    "likes_count": 1,
    "comments_count": 1,
    "reactions": 1,
    "created_at": 1,
    "is_ad": 1,
    "is_rss_article": 1,
    "feed_type": 1
}

MARKER_PROJECTION = {
    "_id": 0,
    "marker_id": 1,
    "marker_type": 1,
    "name": 1,
    "description": 1,
    "latitude": 1,
    "longitude": 1,
    "island": 1,
    "image_url": 1,
    "is_boosted": 1,
    "boost_expires_at": 1,
    "created_at": 1,
    "expires_at": 1,
    "extra_data": 1
}


# ============================================================
# BATCH OPERATIONS
# ============================================================

async def batch_get_users(db, user_ids: list, projection: dict = None) -> Dict[str, dict]:
    """Récupère plusieurs utilisateurs en une seule requête"""
    projection = projection or USER_PROJECTION_MINIMAL
    
    # Check cache first
    cached_users = {}
    missing_ids = []
    
    for uid in user_ids:
        cache_key = f"user:{uid}"
        cached = user_cache.get(cache_key)
        if cached:
            cached_users[uid] = cached
        else:
            missing_ids.append(uid)
    
    # Fetch missing from DB
    if missing_ids:
        cursor = db.users.find(
            {"user_id": {"$in": missing_ids}},
            projection
        )
        async for user in cursor:
            uid = user["user_id"]
            cached_users[uid] = user
            user_cache.set(f"user:{uid}", user, 300)
    
    return cached_users


async def enrich_posts_with_users(db, posts: list) -> list:
    """Enrichit une liste de posts avec les données utilisateurs (optimisé)"""
    if not posts:
        return posts
    
    # Get unique user IDs
    user_ids = list(set(p.get("user_id") for p in posts if p.get("user_id")))
    
    # Batch fetch users
    users_map = await batch_get_users(db, user_ids)
    
    # Enrich posts
    for post in posts:
        uid = post.get("user_id")
        if uid and uid in users_map:
            post["user"] = users_map[uid]
    
    return posts


# ============================================================
# RATE LIMITING AVANCÉ
# ============================================================

class AdaptiveRateLimiter:
    """Rate limiter adaptatif basé sur la charge"""
    
    def __init__(self):
        self._request_counts: Dict[str, list] = {}
        self._window_size = 60  # 1 minute
        self._base_limit = 100
        self._load_multiplier = 1.0
    
    def is_allowed(self, client_id: str, limit: Optional[int] = None) -> bool:
        """Vérifie si une requête est autorisée"""
        limit = limit or int(self._base_limit * self._load_multiplier)
        now = time.time()
        
        # Clean old entries
        if client_id in self._request_counts:
            self._request_counts[client_id] = [
                t for t in self._request_counts[client_id]
                if now - t < self._window_size
            ]
        else:
            self._request_counts[client_id] = []
        
        # Check limit
        if len(self._request_counts[client_id]) >= limit:
            return False
        
        # Record request
        self._request_counts[client_id].append(now)
        return True
    
    def adjust_for_load(self, current_load: float):
        """Ajuste les limites en fonction de la charge (0-1)"""
        if current_load > 0.8:
            self._load_multiplier = 0.5  # Reduce limits under heavy load
        elif current_load > 0.6:
            self._load_multiplier = 0.75
        else:
            self._load_multiplier = 1.0


adaptive_limiter = AdaptiveRateLimiter()


# ============================================================
# STATISTIQUES DE PERFORMANCE
# ============================================================

class PerformanceMonitor:
    """Moniteur de performance en temps réel"""
    
    def __init__(self):
        self._request_times: list = []
        self._error_count = 0
        self._request_count = 0
        self._start_time = datetime.now()
    
    def record_request(self, duration_ms: float, success: bool = True):
        """Enregistre une requête"""
        self._request_count += 1
        self._request_times.append(duration_ms)
        
        # Keep only last 1000 requests
        if len(self._request_times) > 1000:
            self._request_times = self._request_times[-1000:]
        
        if not success:
            self._error_count += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques de performance"""
        if not self._request_times:
            return {"status": "no_data"}
        
        sorted_times = sorted(self._request_times)
        uptime = (datetime.now() - self._start_time).total_seconds()
        
        return {
            "uptime_seconds": uptime,
            "total_requests": self._request_count,
            "requests_per_second": self._request_count / uptime if uptime > 0 else 0,
            "error_count": self._error_count,
            "error_rate": f"{(self._error_count / self._request_count * 100):.2f}%" if self._request_count > 0 else "0%",
            "avg_response_ms": sum(self._request_times) / len(self._request_times),
            "min_response_ms": min(self._request_times),
            "max_response_ms": max(self._request_times),
            "p50_response_ms": sorted_times[len(sorted_times) // 2],
            "p95_response_ms": sorted_times[int(len(sorted_times) * 0.95)],
            "p99_response_ms": sorted_times[int(len(sorted_times) * 0.99)] if len(sorted_times) > 100 else sorted_times[-1],
            "cache_stats": {
                "feed": feed_cache.get_stats(),
                "user": user_cache.get_stats(),
                "marker": marker_cache.get_stats(),
                "translation": translation_cache.get_stats()
            }
        }


perf_monitor = PerformanceMonitor()


# ============================================================
# FONCTIONS D'INITIALISATION
# ============================================================

async def initialize_performance_optimizations(db):
    """Initialise toutes les optimisations de performance"""
    logger.info("🚀 Initializing performance optimizations...")
    
    # 1. Create indexes
    from db_optimization import create_indexes
    try:
        index_result = await create_indexes(db)
        logger.info(f"✅ Created {len(index_result.get('created', []))} indexes")
    except Exception as e:
        logger.warning(f"⚠️ Index creation warning: {e}")
    
    # 2. Warm up caches with common data
    try:
        # Cache translations
        from translations import TRANSLATIONS
        for lang in ["fr", "tah"]:
            translation_cache.set(f"translations:{lang}", TRANSLATIONS.get(lang, {}), 3600)
        logger.info("✅ Translations cached")
        
        # Cache marker types
        from fenua_pulse import MARKER_TYPES, ISLANDS
        marker_cache.set("marker_types", MARKER_TYPES, 3600)
        marker_cache.set("islands", ISLANDS, 3600)
        logger.info("✅ Marker types cached")
        
    except Exception as e:
        logger.warning(f"⚠️ Cache warmup warning: {e}")
    
    logger.info("✅ Performance optimizations initialized")
    
    return {
        "status": "initialized",
        "caches": ["feed", "user", "marker", "translation"],
        "indexes": "created"
    }


def get_performance_report() -> Dict[str, Any]:
    """Génère un rapport de performance complet"""
    return {
        "timestamp": datetime.now().isoformat(),
        "performance": perf_monitor.get_stats(),
        "recommendations": _get_recommendations()
    }


def _get_recommendations() -> list:
    """Génère des recommandations basées sur les stats"""
    recommendations = []
    stats = perf_monitor.get_stats()
    
    if stats.get("status") == "no_data":
        return ["Pas assez de données pour générer des recommandations"]
    
    # Check response times
    if stats.get("avg_response_ms", 0) > 1000:
        recommendations.append("⚠️ Temps de réponse élevé - Considérer l'upgrade Render")
    
    if stats.get("p95_response_ms", 0) > 3000:
        recommendations.append("⚠️ P95 > 3s - Optimiser les requêtes lentes")
    
    # Check cache hit rates
    for cache_name, cache_stats in stats.get("cache_stats", {}).items():
        hit_rate = float(cache_stats.get("hit_rate", "0%").replace("%", ""))
        if hit_rate < 50:
            recommendations.append(f"💡 Cache {cache_name} sous-utilisé ({hit_rate}%) - Augmenter TTL")
    
    # Check error rate
    error_rate = float(stats.get("error_rate", "0%").replace("%", ""))
    if error_rate > 5:
        recommendations.append(f"🔴 Taux d'erreur élevé ({error_rate}%) - Investiguer les logs")
    
    if not recommendations:
        recommendations.append("✅ Performances nominales - Aucune action requise")
    
    return recommendations
