"""
Redis Cache pour Hui Fenua - Production Ready
==============================================
Compatible avec Upstash Redis (serverless) ou Redis standard.
Fallback automatique vers cache mémoire si Redis non disponible.
"""

import os
import json
import logging
import asyncio
from typing import Any, Optional, Dict, List
from datetime import datetime, timezone
import hashlib

logger = logging.getLogger(__name__)

# Try to import redis
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Redis not installed, using memory cache only")


class RedisCache:
    """
    Cache Redis haute performance avec fallback mémoire.
    Compatible Upstash Redis (REST API) et Redis standard.
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.connected = False
        self.memory_fallback: Dict[str, tuple] = {}  # {key: (value, expiry_time)}
        self.stats = {
            "hits": 0,
            "misses": 0,
            "redis_errors": 0,
            "memory_fallback_used": 0
        }
    
    async def connect(self, redis_url: Optional[str] = None) -> bool:
        """
        Connecte au serveur Redis.
        
        Args:
            redis_url: URL Redis (redis://... ou rediss://... pour SSL)
                      Supporte Upstash: rediss://default:PASSWORD@HOST:PORT
        """
        if not REDIS_AVAILABLE:
            logger.info("Redis library not available, using memory cache")
            return False
        
        url = redis_url or os.environ.get("REDIS_URL")
        
        if not url:
            logger.info("REDIS_URL not configured, using memory cache")
            return False
        
        try:
            # Upstash requires SSL (rediss://)
            self.redis_client = redis.from_url(
                url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            
            # Test connection
            await self.redis_client.ping()
            self.connected = True
            logger.info("✅ Connected to Redis successfully")
            return True
            
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed: {e}. Using memory cache.")
            self.connected = False
            return False
    
    async def disconnect(self):
        """Ferme la connexion Redis"""
        if self.redis_client:
            await self.redis_client.close()
            self.connected = False
    
    def _serialize(self, value: Any) -> str:
        """Sérialise une valeur pour stockage"""
        return json.dumps(value, default=str)
    
    def _deserialize(self, value: str) -> Any:
        """Désérialise une valeur depuis le stockage"""
        if value is None:
            return None
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    
    async def get(self, key: str) -> Optional[Any]:
        """
        Récupère une valeur du cache.
        Utilise Redis si disponible, sinon fallback mémoire.
        """
        # Try Redis first
        if self.connected and self.redis_client:
            try:
                value = await self.redis_client.get(key)
                if value is not None:
                    self.stats["hits"] += 1
                    return self._deserialize(value)
                self.stats["misses"] += 1
                return None
            except Exception as e:
                self.stats["redis_errors"] += 1
                logger.debug(f"Redis get error: {e}")
        
        # Fallback to memory
        self.stats["memory_fallback_used"] += 1
        if key in self.memory_fallback:
            value, expiry = self.memory_fallback[key]
            if expiry is None or datetime.now(timezone.utc).timestamp() < expiry:
                self.stats["hits"] += 1
                return value
            else:
                del self.memory_fallback[key]
        
        self.stats["misses"] += 1
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Stocke une valeur dans le cache.
        
        Args:
            key: Clé unique
            value: Valeur à stocker (sera sérialisée en JSON)
            ttl: Durée de vie en secondes (défaut: 5 minutes)
        """
        # Try Redis first
        if self.connected and self.redis_client:
            try:
                serialized = self._serialize(value)
                await self.redis_client.setex(key, ttl, serialized)
                return True
            except Exception as e:
                self.stats["redis_errors"] += 1
                logger.debug(f"Redis set error: {e}")
        
        # Fallback to memory
        expiry = datetime.now(timezone.utc).timestamp() + ttl
        self.memory_fallback[key] = (value, expiry)
        
        # Cleanup old entries if memory cache gets too large
        if len(self.memory_fallback) > 10000:
            await self._cleanup_memory_cache()
        
        return True
    
    async def delete(self, key: str) -> bool:
        """Supprime une clé du cache"""
        deleted = False
        
        if self.connected and self.redis_client:
            try:
                await self.redis_client.delete(key)
                deleted = True
            except Exception as e:
                self.stats["redis_errors"] += 1
                logger.debug(f"Redis delete error: {e}")
        
        if key in self.memory_fallback:
            del self.memory_fallback[key]
            deleted = True
        
        return deleted
    
    async def delete_pattern(self, pattern: str) -> int:
        """
        Supprime toutes les clés correspondant à un pattern.
        Ex: delete_pattern("feed:*") supprime toutes les clés commençant par "feed:"
        """
        count = 0
        
        if self.connected and self.redis_client:
            try:
                keys = []
                async for key in self.redis_client.scan_iter(match=pattern):
                    keys.append(key)
                if keys:
                    count = await self.redis_client.delete(*keys)
            except Exception as e:
                self.stats["redis_errors"] += 1
                logger.debug(f"Redis delete_pattern error: {e}")
        
        # Also clean memory fallback
        pattern_prefix = pattern.replace("*", "")
        keys_to_delete = [k for k in self.memory_fallback if k.startswith(pattern_prefix)]
        for key in keys_to_delete:
            del self.memory_fallback[key]
            count += 1
        
        return count
    
    async def mget(self, keys: List[str]) -> Dict[str, Any]:
        """Récupère plusieurs valeurs en une seule requête"""
        result = {}
        
        if self.connected and self.redis_client and keys:
            try:
                values = await self.redis_client.mget(keys)
                for key, value in zip(keys, values):
                    if value is not None:
                        result[key] = self._deserialize(value)
                        self.stats["hits"] += 1
                    else:
                        self.stats["misses"] += 1
                return result
            except Exception as e:
                self.stats["redis_errors"] += 1
                logger.debug(f"Redis mget error: {e}")
        
        # Fallback to memory
        for key in keys:
            value = await self.get(key)
            if value is not None:
                result[key] = value
        
        return result
    
    async def _cleanup_memory_cache(self):
        """Nettoie les entrées expirées du cache mémoire"""
        now = datetime.now(timezone.utc).timestamp()
        expired_keys = [
            k for k, (_, expiry) in self.memory_fallback.items()
            if expiry is not None and now > expiry
        ]
        for key in expired_keys:
            del self.memory_fallback[key]
        
        # If still too large, remove oldest entries
        if len(self.memory_fallback) > 8000:
            # Keep only the 5000 most recent
            sorted_keys = sorted(
                self.memory_fallback.keys(),
                key=lambda k: self.memory_fallback[k][1] or 0
            )
            for key in sorted_keys[:3000]:
                del self.memory_fallback[key]
    
    async def clear(self) -> bool:
        """Vide tout le cache"""
        if self.connected and self.redis_client:
            try:
                await self.redis_client.flushdb()
            except Exception as e:
                logger.debug(f"Redis flush error: {e}")
        
        self.memory_fallback.clear()
        return True
    
    def get_stats(self) -> dict:
        """Retourne les statistiques du cache"""
        total = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total * 100) if total > 0 else 0
        
        return {
            "connected": self.connected,
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate_percent": round(hit_rate, 2),
            "redis_errors": self.stats["redis_errors"],
            "memory_fallback_used": self.stats["memory_fallback_used"],
            "memory_cache_size": len(self.memory_fallback)
        }


# Instance globale
redis_cache = RedisCache()


# Helper functions for common cache patterns
def cache_key(*args, **kwargs) -> str:
    """Génère une clé de cache unique à partir des arguments"""
    key_data = json.dumps({"a": args, "k": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()[:16]


async def cached_query(
    cache_key: str,
    query_fn,
    ttl: int = 300,
    force_refresh: bool = False
) -> Any:
    """
    Helper pour mettre en cache le résultat d'une requête.
    
    Args:
        cache_key: Clé unique pour cette requête
        query_fn: Fonction async qui exécute la requête
        ttl: Durée de vie du cache en secondes
        force_refresh: Si True, ignore le cache et rafraîchit
    """
    if not force_refresh:
        cached = await redis_cache.get(cache_key)
        if cached is not None:
            return cached
    
    result = await query_fn()
    await redis_cache.set(cache_key, result, ttl)
    return result


# Cache keys prefixes
class CacheKeys:
    """Préfixes de clés de cache standardisés"""
    FEED = "feed:"
    MARKERS = "markers:"
    ISLANDS = "static:islands"
    MARKER_TYPES = "static:marker_types"
    BADGES = "static:badges"
    USER = "user:"
    CONVERSATIONS = "conv:"
    PULSE_STATUS = "pulse:status"
    LEADERBOARD = "pulse:leaderboard"
    STORIES = "stories:"
    NOTIFICATIONS = "notif:"
