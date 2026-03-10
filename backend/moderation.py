# Content Moderation System for Hui Fenua
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict
import logging
import uuid
import os

logger = logging.getLogger(__name__)

# Report categories
REPORT_CATEGORIES = {
    "inappropriate": {
        "label": "Contenu inapproprié",
        "description": "Contenu sexuel, violent ou choquant",
        "priority": 1
    },
    "harassment": {
        "label": "Harcèlement",
        "description": "Harcèlement, intimidation ou menaces",
        "priority": 1
    },
    "spam": {
        "label": "Spam",
        "description": "Spam ou contenu non pertinent",
        "priority": 3
    },
    "misinformation": {
        "label": "Fausses informations",
        "description": "Informations fausses ou trompeuses",
        "priority": 2
    },
    "copyright": {
        "label": "Droits d'auteur",
        "description": "Violation des droits d'auteur",
        "priority": 2
    },
    "other": {
        "label": "Autre",
        "description": "Autre type de problème",
        "priority": 3
    }
}

# Warning levels and actions
WARNING_LEVELS = {
    1: {
        "action": "warning",
        "description": "Premier avertissement",
        "suspension_days": 0
    },
    2: {
        "action": "suspension",
        "description": "Suspension temporaire de 7 jours",
        "suspension_days": 7
    },
    3: {
        "action": "ban",
        "description": "Bannissement définitif",
        "suspension_days": -1  # Permanent
    }
}


class ModerationService:
    def __init__(self, db):
        self.db = db

    async def create_report(
        self,
        reporter_id: str,
        content_type: str,  # post, comment, user, message, profile
        content_id: str,
        category: str,
        description: Optional[str] = None,
        ip_hash: Optional[str] = None
    ) -> dict:
        """Create a new content report"""
        
        if category not in REPORT_CATEGORIES:
            raise ValueError("Catégorie de signalement invalide")
        
        # Get content info
        content_info = await self._get_content_info(content_type, content_id)
        
        report = {
            "report_id": f"report_{uuid.uuid4().hex[:12]}",
            "reporter_id": reporter_id,
            "content_type": content_type,
            "content_id": content_id,
            "reported_user_id": content_info.get("user_id"),
            "category": category,
            "category_label": REPORT_CATEGORIES[category]["label"],
            "description": description,
            "status": "pending",  # pending, reviewed, resolved, dismissed
            "priority": REPORT_CATEGORIES[category]["priority"],
            "content_preview": content_info.get("preview", ""),
            "ip_hash": ip_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "reviewed_at": None,
            "reviewed_by": None,
            "action_taken": None
        }
        
        await self.db.reports.insert_one(report)
        
        # Check if this content has multiple reports
        report_count = await self.db.reports.count_documents({
            "content_type": content_type,
            "content_id": content_id,
            "status": {"$in": ["pending", "reviewed"]}
        })
        
        # Auto-escalate if multiple reports
        if report_count >= 3:
            await self._escalate_report(report["report_id"])
        
        logger.info(f"Report created: {report['report_id']} - {category} for {content_type}/{content_id}")
        
        # TODO: Send email notification to admin
        await self._notify_admin_new_report(report)
        
        return {
            "success": True,
            "report_id": report["report_id"],
            "message": "Signalement reçu, nous allons examiner ce contenu"
        }

    async def _get_content_info(self, content_type: str, content_id: str) -> dict:
        """Get information about reported content"""
        info = {"user_id": None, "preview": ""}
        
        if content_type == "post":
            post = await self.db.posts.find_one({"post_id": content_id}, {"_id": 0})
            if post:
                info["user_id"] = post.get("user_id")
                info["preview"] = (post.get("caption") or "")[:100]
        elif content_type == "comment":
            comment = await self.db.comments.find_one({"comment_id": content_id}, {"_id": 0})
            if comment:
                info["user_id"] = comment.get("user_id")
                info["preview"] = (comment.get("content") or "")[:100]
        elif content_type == "user" or content_type == "profile":
            user = await self.db.users.find_one({"user_id": content_id}, {"_id": 0})
            if user:
                info["user_id"] = content_id
                info["preview"] = f"Profil: {user.get('name', '')}"
        elif content_type == "message":
            message = await self.db.messages.find_one({"message_id": content_id}, {"_id": 0})
            if message:
                info["user_id"] = message.get("sender_id")
                info["preview"] = (message.get("content") or "")[:100]
        
        return info

    async def _escalate_report(self, report_id: str):
        """Escalate a report to high priority"""
        await self.db.reports.update_one(
            {"report_id": report_id},
            {"$set": {"priority": 0, "escalated": True}}
        )
        logger.warning(f"Report escalated: {report_id}")

    async def _notify_admin_new_report(self, report: dict):
        """Send email notification to admin about new report"""
        # Create admin notification
        notification = {
            "notification_id": f"admin_notif_{uuid.uuid4().hex[:12]}",
            "type": "new_report",
            "report_id": report["report_id"],
            "category": report["category"],
            "priority": report["priority"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.admin_notifications.insert_one(notification)
        
        # TODO: Implement actual email sending
        logger.info(f"Admin notification created for report {report['report_id']}")

    async def resolve_report(
        self,
        report_id: str,
        admin_id: str,
        action: str,  # dismiss, warn, delete, suspend, ban
        notes: Optional[str] = None
    ) -> dict:
        """Resolve a report with an action"""
        
        report = await self.db.reports.find_one({"report_id": report_id}, {"_id": 0})
        if not report:
            raise ValueError("Signalement non trouvé")
        
        # Update report status
        await self.db.reports.update_one(
            {"report_id": report_id},
            {"$set": {
                "status": "resolved",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
                "reviewed_by": admin_id,
                "action_taken": action,
                "admin_notes": notes
            }}
        )
        
        # Take action based on resolution
        if action == "warn":
            await self._send_warning(report["reported_user_id"], report)
        elif action == "delete":
            await self._delete_content(report["content_type"], report["content_id"])
        elif action == "suspend":
            await self._suspend_user(report["reported_user_id"], 7)
        elif action == "ban":
            await self._ban_user(report["reported_user_id"])
        
        logger.info(f"Report {report_id} resolved with action: {action}")
        
        return {"success": True, "action": action}

    async def _send_warning(self, user_id: str, report: dict):
        """Send a warning to a user"""
        
        # Get current warning count
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        current_warnings = user.get("warning_count", 0) if user else 0
        new_warning_count = current_warnings + 1
        
        # Create warning record
        warning = {
            "warning_id": f"warn_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "report_id": report["report_id"],
            "category": report["category"],
            "level": new_warning_count,
            "message": f"Avertissement pour {REPORT_CATEGORIES[report['category']]['label']}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.warnings.insert_one(warning)
        
        # Update user warning count
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {"warning_count": new_warning_count}}
        )
        
        # Check if user should be suspended/banned
        if new_warning_count >= 3:
            await self._ban_user(user_id)
        elif new_warning_count >= 2:
            await self._suspend_user(user_id, 7)
        
        # Create notification for user
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": "warning",
            "title": "Avertissement",
            "message": warning["message"],
            "data": {"warning_id": warning["warning_id"], "level": new_warning_count},
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.notifications.insert_one(notification)
        
        # TODO: Send email
        logger.info(f"Warning sent to user {user_id}, level {new_warning_count}")

    async def _delete_content(self, content_type: str, content_id: str):
        """Delete reported content"""
        if content_type == "post":
            await self.db.posts.delete_one({"post_id": content_id})
        elif content_type == "comment":
            await self.db.comments.delete_one({"comment_id": content_id})
        elif content_type == "message":
            await self.db.messages.delete_one({"message_id": content_id})
        
        logger.info(f"Content deleted: {content_type}/{content_id}")

    async def _suspend_user(self, user_id: str, days: int):
        """Suspend a user for a number of days"""
        suspend_until = datetime.now(timezone.utc) + timedelta(days=days)
        
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "is_suspended": True,
                "suspended_until": suspend_until.isoformat(),
                "suspended_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Delete active sessions
        await self.db.user_sessions.delete_many({"user_id": user_id})
        
        # Create notification
        notification = {
            "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": "suspension",
            "title": "Compte suspendu",
            "message": f"Votre compte a été suspendu pour {days} jours suite à des violations de nos règles.",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await self.db.notifications.insert_one(notification)
        
        logger.info(f"User {user_id} suspended for {days} days")

    async def _ban_user(self, user_id: str):
        """Permanently ban a user"""
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "is_banned": True,
                "banned_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Delete active sessions
        await self.db.user_sessions.delete_many({"user_id": user_id})
        
        logger.info(f"User {user_id} permanently banned")

    async def get_reports(
        self,
        status: Optional[str] = None,
        priority: Optional[int] = None,
        limit: int = 50,
        skip: int = 0
    ) -> List[dict]:
        """Get reports with filters"""
        query = {}
        if status:
            query["status"] = status
        if priority is not None:
            query["priority"] = priority
        
        reports = await self.db.reports.find(
            query, {"_id": 0}
        ).sort([
            ("priority", 1),
            ("created_at", -1)
        ]).skip(skip).limit(limit).to_list(limit)
        
        # Add reporter info
        for report in reports:
            reporter = await self.db.users.find_one(
                {"user_id": report.get("reporter_id")},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
            )
            report["reporter"] = reporter
            
            reported = await self.db.users.find_one(
                {"user_id": report.get("reported_user_id")},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
            )
            report["reported_user"] = reported
        
        return reports

    async def get_report_stats(self, days: int = 30) -> dict:
        """Get moderation statistics"""
        now = datetime.now(timezone.utc)
        
        # Today's reports
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = await self.db.reports.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        # This week's reports
        week_start = today_start - timedelta(days=today_start.weekday())
        week_count = await self.db.reports.count_documents({
            "created_at": {"$gte": week_start.isoformat()}
        })
        
        # This month's reports
        month_start = today_start.replace(day=1)
        month_count = await self.db.reports.count_documents({
            "created_at": {"$gte": month_start.isoformat()}
        })
        
        # Pending reports
        pending_count = await self.db.reports.count_documents({"status": "pending"})
        
        # By category
        by_category = {}
        for cat in REPORT_CATEGORIES:
            by_category[cat] = await self.db.reports.count_documents({
                "category": cat,
                "created_at": {"$gte": (now - timedelta(days=days)).isoformat()}
            })
        
        return {
            "today": today_count,
            "this_week": week_count,
            "this_month": month_count,
            "pending": pending_count,
            "by_category": by_category
        }

    async def get_user_warnings(self, user_id: str) -> List[dict]:
        """Get warnings for a specific user"""
        return await self.db.warnings.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(100)


def get_report_categories():
    """Return report categories for frontend"""
    return [
        {"value": key, "label": val["label"], "description": val["description"]}
        for key, val in REPORT_CATEGORIES.items()
    ]
