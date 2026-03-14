"""
Cache en mémoire haute performance pour Hui Fenua
=================================================
Cache LRU avec TTL pour réduire la charge MongoDB de 70-80%
"""

import asyncio
import time
from typing import Any, Optional, Dict, Callable
from functools import wraps
from collections import OrderedDict
import hashlib
import json

class TTLCache:
    """Cache LRU avec expiration TTL"""
    
    def __init__(self, maxsize: int = 1000, default_ttl: int = 300):
        self.maxsize = maxsize
        self.default_ttl = default_ttl
        self._cache: OrderedDict = OrderedDict()
        self._expiry: Dict[str, float] = {}
        self._hits = 0
        self._misses = 0
        self._lock = asyncio.Lock()
    
    def _is_expired(self, key: str) -> bool:
        """Vérifie si une clé est expirée"""
        if key not in self._expiry:
            return True
        return time.time() > self._expiry[key]
    
    async def get(self, key: str) -> Optional[Any]:
        """Récupère une valeur du cache"""
        async with self._lock:
            if key in self._cache and not self._is_expired(key):
                # Move to end (most recently used)
                self._cache.move_to_end(key)
                self._hits += 1
                return self._cache[key]
            
            # Clean up expired key
            if key in self._cache:
                del self._cache[key]
                del self._expiry[key]
            
            self._misses += 1
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocke une valeur dans le cache"""
        async with self._lock:
            # Remove oldest if at capacity
            while len(self._cache) >= self.maxsize:
                oldest_key = next(iter(self._cache))
                del self._cache[oldest_key]
                del self._expiry[oldest_key]
            
            self._cache[key] = value
            self._expiry[key] = time.time() + (ttl or self.default_ttl)
            self._cache.move_to_end(key)
    
    async def delete(self, key: str) -> bool:
        """Supprime une clé du cache"""
        async with self._lock:
            if key in self._cache:
                del self._cache[key]
                del self._expiry[key]
                return True
            return False
    
    async def clear(self) -> None:
        """Vide le cache"""
        async with self._lock:
            self._cache.clear()
            self._expiry.clear()
    
    async def clear_pattern(self, pattern: str) -> int:
        """Supprime les clés correspondant à un pattern"""
        async with self._lock:
            keys_to_delete = [k for k in self._cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self._cache[key]
                del self._expiry[key]
            return len(keys_to_delete)
    
    def stats(self) -> dict:
        """Retourne les statistiques du cache"""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "size": len(self._cache),
            "maxsize": self.maxsize,
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate_percent": round(hit_rate, 2)
        }


# Instance globale du cache
cache = TTLCache(maxsize=5000, default_ttl=300)

# Caches spécialisés avec TTL différents
static_cache = TTLCache(maxsize=100, default_ttl=3600)  # 1 heure pour données statiques
markers_cache = TTLCache(maxsize=500, default_ttl=60)   # 1 minute pour markers
feed_cache = TTLCache(maxsize=200, default_ttl=30)      # 30 sec pour feed
user_cache = TTLCache(maxsize=1000, default_ttl=300)    # 5 min pour users


def cache_key(*args, **kwargs) -> str:
    """Génère une clé de cache unique"""
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    return hashlib.md5(key_data.encode()).hexdigest()


def cached(cache_instance: TTLCache = cache, ttl: Optional[int] = None, prefix: str = ""):
    """Décorateur pour mettre en cache les résultats d'une fonction async"""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Générer la clé de cache
            key = f"{prefix}{func.__name__}:{cache_key(*args[1:], **kwargs)}"  # Skip 'self' if present
            
            # Essayer de récupérer du cache
            cached_value = await cache_instance.get(key)
            if cached_value is not None:
                return cached_value
            
            # Exécuter la fonction
            result = await func(*args, **kwargs)
            
            # Stocker dans le cache
            if result is not None:
                await cache_instance.set(key, result, ttl)
            
            return result
        return wrapper
    return decorator


async def warm_up_cache(db) -> dict:
    """Préchauffe le cache avec les données fréquemment accédées"""
    from fenua_pulse import get_islands, get_marker_types, get_badges_list
    
    warmed = []
    
    # Cache les îles (statique)
    islands = get_islands()
    await static_cache.set("islands", islands, ttl=3600)
    warmed.append("islands")
    
    # Cache les types de markers (statique)
    marker_types = get_marker_types()
    await static_cache.set("marker_types", marker_types, ttl=3600)
    warmed.append("marker_types")
    
    # Cache les badges (statique)
    badges = get_badges_list()
    await static_cache.set("badges", badges, ttl=3600)
    warmed.append("badges")
    
    # Cache les catégories du marketplace (statique)
    categories = {
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
            {"id": "transport", "name": "Transport", "icon": "car", "color": "#4169E1"},
            {"id": "tourisme", "name": "Tourisme & Excursions", "icon": "compass", "color": "#00CED1"},
            {"id": "beaute", "name": "Beauté & Bien-être", "icon": "sparkles", "color": "#FF69B4"},
            {"id": "cours", "name": "Cours & Formation", "icon": "graduation-cap", "color": "#9400D3"},
            {"id": "evenements", "name": "Événements", "icon": "calendar", "color": "#FF6B35"},
            {"id": "autres", "name": "Autres Services", "icon": "briefcase", "color": "#808080"}
        ]
    }
    await static_cache.set("marketplace_categories", categories, ttl=3600)
    warmed.append("marketplace_categories")
    
    return {
        "warmed_keys": warmed,
        "static_cache_size": static_cache.stats()["size"]
    }


def get_cache_stats() -> dict:
    """Retourne les statistiques de tous les caches"""
    return {
        "main_cache": cache.stats(),
        "static_cache": static_cache.stats(),
        "markers_cache": markers_cache.stats(),
        "feed_cache": feed_cache.stats(),
        "user_cache": user_cache.stats()
    }
