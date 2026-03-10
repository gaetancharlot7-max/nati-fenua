# Analytics and Monitoring Module for Hui Fenua
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
import logging
import uuid
import time
import asyncio
from collections import defaultdict

logger = logging.getLogger(__name__)

# In-memory metrics storage (for real-time monitoring)
_api_response_times = []
_error_counts = defaultdict(int)
_request_counts = defaultdict(int)

# Islands of French Polynesia for geo stats
ISLANDS = {
    "tahiti": "Tahiti",
    "moorea": "Moorea",
    "bora-bora": "Bora Bora",
    "raiatea": "Raiatea",
    "huahine": "Huahine",
    "rangiroa": "Rangiroa",
    "fakarava": "Fakarava",
    "marquises": "Marquises",
    "australes": "Australes",
    "tuamotu": "Tuamotu",
    "autres": "Autres"
}


class AnalyticsService:
    def __init__(self, db):
        self.db = db

    async def track_event(
        self,
        event_type: str,
        user_id: Optional[str] = None,
        event_data: Optional[dict] = None,
        device_info: Optional[dict] = None,
        location: Optional[str] = None
    ):
        """Track an analytics event"""
        event = {
            "event_id": f"evt_{uuid.uuid4().hex[:12]}",
            "event_type": event_type,
            "user_id": user_id,
            "event_data": event_data or {},
            "device_info": device_info,
            "location": location,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.analytics_events.insert_one(event)

    async def get_user_stats(self, days: int = 30) -> dict:
        """Get user statistics"""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)
        period_start = now - timedelta(days=days)

        # Total users
        total_users = await self.db.users.count_documents({})

        # Active users (users who logged in)
        active_today = await self.db.user_sessions.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        active_week = await self.db.user_sessions.count_documents({
            "created_at": {"$gte": week_start.isoformat()}
        })
        
        active_month = await self.db.user_sessions.count_documents({
            "created_at": {"$gte": month_start.isoformat()}
        })

        # New registrations
        new_today = await self.db.users.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        new_week = await self.db.users.count_documents({
            "created_at": {"$gte": week_start.isoformat()}
        })
        
        new_month = await self.db.users.count_documents({
            "created_at": {"$gte": month_start.isoformat()}
        })

        # User growth over time (last 30 days)
        growth_data = []
        for i in range(days):
            day = today_start - timedelta(days=days - 1 - i)
            next_day = day + timedelta(days=1)
            count = await self.db.users.count_documents({
                "created_at": {
                    "$gte": day.isoformat(),
                    "$lt": next_day.isoformat()
                }
            })
            growth_data.append({
                "date": day.strftime("%Y-%m-%d"),
                "count": count
            })

        return {
            "total_users": total_users,
            "active_today": active_today,
            "active_this_week": active_week,
            "active_this_month": active_month,
            "new_today": new_today,
            "new_this_week": new_week,
            "new_this_month": new_month,
            "growth_30_days": growth_data
        }

    async def get_content_stats(self) -> dict:
        """Get content statistics"""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Posts
        total_posts = await self.db.posts.count_documents({})
        posts_today = await self.db.posts.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })

        # Messages
        total_messages = await self.db.messages.count_documents({})
        messages_today = await self.db.messages.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })

        # Stories
        active_stories = await self.db.stories.count_documents({
            "expires_at": {"$gt": now.isoformat()}
        })

        # Live streams
        active_lives = await self.db.lives.count_documents({"status": "live"})

        # Products
        total_products = await self.db.products.count_documents({"is_available": True})

        return {
            "total_posts": total_posts,
            "posts_today": posts_today,
            "total_messages": total_messages,
            "messages_today": messages_today,
            "active_stories": active_stories,
            "active_lives": active_lives,
            "total_products": total_products
        }

    async def get_geo_stats(self) -> dict:
        """Get geographic distribution of users by island"""
        
        # Get users by location
        pipeline = [
            {"$match": {"location": {"$exists": True, "$ne": None}}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        results = await self.db.users.aggregate(pipeline).to_list(100)
        
        # Map to islands
        island_counts = defaultdict(int)
        for result in results:
            location = (result["_id"] or "").lower()
            matched = False
            for key, name in ISLANDS.items():
                if key in location or name.lower() in location:
                    island_counts[name] += result["count"]
                    matched = True
                    break
            if not matched:
                island_counts["Autres"] += result["count"]
        
        # Format for chart
        return {
            "by_island": [
                {"island": island, "count": count}
                for island, count in sorted(island_counts.items(), key=lambda x: -x[1])
            ]
        }


class MonitoringService:
    def __init__(self, db):
        self.db = db
        self.start_time = time.time()

    def record_response_time(self, duration_ms: float):
        """Record an API response time"""
        global _api_response_times
        _api_response_times.append({
            "time": time.time(),
            "duration": duration_ms
        })
        # Keep only last hour
        cutoff = time.time() - 3600
        _api_response_times = [r for r in _api_response_times if r["time"] > cutoff]

    def record_error(self, error_type: str):
        """Record an error occurrence"""
        global _error_counts
        hour_key = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H")
        _error_counts[hour_key] += 1

    def record_request(self, endpoint: str):
        """Record a request"""
        global _request_counts
        hour_key = datetime.now(timezone.utc).strftime("%Y-%m-%d-%H")
        _request_counts[f"{hour_key}:{endpoint}"] += 1

    async def get_system_health(self) -> dict:
        """Get system health status"""
        
        # Database status
        db_status = "connected"
        try:
            await self.db.command("ping")
        except Exception as e:
            db_status = f"error: {str(e)}"

        # Calculate average response time (last hour)
        global _api_response_times
        recent_times = [r["duration"] for r in _api_response_times if r["time"] > time.time() - 3600]
        avg_response_time = sum(recent_times) / len(recent_times) if recent_times else 0

        # Get error count (last 24 hours)
        now = datetime.now(timezone.utc)
        error_count_24h = 0
        for i in range(24):
            hour = (now - timedelta(hours=i)).strftime("%Y-%m-%d-%H")
            error_count_24h += _error_counts.get(hour, 0)

        # Storage usage
        storage_info = await self._get_storage_info()

        # Uptime
        uptime_seconds = int(time.time() - self.start_time)
        uptime_str = str(timedelta(seconds=uptime_seconds))

        # Status indicators
        response_status = "ok" if avg_response_time < 2000 else "warning" if avg_response_time < 5000 else "critical"
        error_status = "ok" if error_count_24h < 10 else "warning" if error_count_24h < 50 else "critical"
        storage_status = "ok" if storage_info["usage_percent"] < 80 else "warning" if storage_info["usage_percent"] < 90 else "critical"

        return {
            "database": {
                "status": db_status,
                "healthy": db_status == "connected"
            },
            "api": {
                "avg_response_time_ms": round(avg_response_time, 2),
                "status": response_status,
                "requests_last_hour": len(_api_response_times)
            },
            "errors": {
                "count_24h": error_count_24h,
                "status": error_status
            },
            "storage": {
                "used_gb": storage_info["used_gb"],
                "total_gb": storage_info["total_gb"],
                "usage_percent": storage_info["usage_percent"],
                "status": storage_status
            },
            "uptime": uptime_str,
            "overall_status": "critical" if "critical" in [response_status, error_status, storage_status] else "warning" if "warning" in [response_status, error_status, storage_status] else "ok"
        }

    async def _get_storage_info(self) -> dict:
        """Get storage information"""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/app/backend/uploads")
            return {
                "used_gb": round(used / (1024**3), 2),
                "total_gb": round(total / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2),
                "usage_percent": round((used / total) * 100, 1)
            }
        except Exception:
            return {"used_gb": 0, "total_gb": 0, "free_gb": 0, "usage_percent": 0}

    async def get_recent_errors(self, limit: int = 50) -> List[dict]:
        """Get recent error logs"""
        errors = await self.db.error_logs.find(
            {}, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return errors

    async def log_error(
        self,
        error_type: str,
        message: str,
        stack_trace: Optional[str] = None,
        endpoint: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        """Log an error to the database"""
        error_log = {
            "error_id": f"err_{uuid.uuid4().hex[:12]}",
            "error_type": error_type,
            "message": message,
            "stack_trace": stack_trace,
            "endpoint": endpoint,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.error_logs.insert_one(error_log)
        self.record_error(error_type)

    async def check_alerts(self) -> List[dict]:
        """Check for alert conditions"""
        alerts = []
        health = await self.get_system_health()

        # Response time alert
        if health["api"]["avg_response_time_ms"] > 2000:
            alerts.append({
                "type": "response_time",
                "severity": "critical" if health["api"]["avg_response_time_ms"] > 5000 else "warning",
                "message": f"Temps de réponse API élevé: {health['api']['avg_response_time_ms']}ms"
            })

        # Error rate alert
        if health["errors"]["count_24h"] > 10:
            alerts.append({
                "type": "error_rate",
                "severity": "critical" if health["errors"]["count_24h"] > 50 else "warning",
                "message": f"Nombre d'erreurs élevé: {health['errors']['count_24h']} en 24h"
            })

        # Storage alert
        if health["storage"]["usage_percent"] > 80:
            alerts.append({
                "type": "storage",
                "severity": "critical" if health["storage"]["usage_percent"] > 90 else "warning",
                "message": f"Espace de stockage: {health['storage']['usage_percent']}% utilisé"
            })

        # Database alert
        if not health["database"]["healthy"]:
            alerts.append({
                "type": "database",
                "severity": "critical",
                "message": f"Base de données: {health['database']['status']}"
            })

        return alerts

    async def get_login_attempts_stats(self) -> dict:
        """Get login attempts statistics for security monitoring"""
        now = datetime.now(timezone.utc)
        hour_ago = now - timedelta(hours=1)

        # Get suspicious activity (more than 20 failed attempts from same IP)
        # This would need to be implemented with proper logging

        return {
            "suspicious_ips": [],
            "failed_attempts_1h": 0,
            "successful_logins_1h": await self.db.user_sessions.count_documents({
                "created_at": {"$gte": hour_ago.isoformat()}
            })
        }


# Middleware helper for tracking response times
class MonitoringMiddleware:
    def __init__(self, monitoring_service: MonitoringService):
        self.monitoring = monitoring_service

    async def __call__(self, request, call_next):
        start_time = time.time()
        
        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000
            self.monitoring.record_response_time(duration_ms)
            self.monitoring.record_request(request.url.path)
            return response
        except Exception as e:
            self.monitoring.record_error(type(e).__name__)
            raise
