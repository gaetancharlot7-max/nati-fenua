# GDPR Compliance Module for Hui Fenua
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, List
import logging
import uuid
import json
import os
import zipfile
import tempfile
import shutil

logger = logging.getLogger(__name__)

# Minimum age requirement
MINIMUM_AGE = 13
PARENTAL_CONSENT_AGE = 16

# Consent types
CONSENT_TYPES = {
    "terms_of_service": {
        "label": "Conditions Générales d'Utilisation",
        "required": True,
        "url": "/legal#cgu"
    },
    "privacy_policy": {
        "label": "Politique de Confidentialité",
        "required": True,
        "url": "/legal#privacy"
    },
    "marketing_notifications": {
        "label": "Notifications marketing",
        "required": False,
        "description": "Recevoir des offres et actualités par email"
    },
    "analytics": {
        "label": "Cookies analytiques",
        "required": False,
        "description": "Aider à améliorer l'application"
    }
}


class GDPRService:
    def __init__(self, db):
        self.db = db

    async def record_consent(
        self,
        user_id: str,
        consent_type: str,
        granted: bool,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> dict:
        """Record user consent for GDPR compliance"""
        
        if consent_type not in CONSENT_TYPES:
            raise ValueError("Type de consentement invalide")
        
        consent_record = {
            "consent_id": f"consent_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "consent_type": consent_type,
            "granted": granted,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "version": "1.0"  # Track policy version
        }
        
        await self.db.consent_records.insert_one(consent_record)
        
        # Update user's consent status
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {f"consents.{consent_type}": {
                "granted": granted,
                "recorded_at": consent_record["recorded_at"]
            }}}
        )
        
        logger.info(f"Consent recorded: {user_id} - {consent_type} = {granted}")
        
        return {"success": True, "consent_id": consent_record["consent_id"]}

    async def get_user_consents(self, user_id: str) -> dict:
        """Get all consent records for a user"""
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0, "consents": 1})
        
        # Build response with all consent types
        consents = {}
        for consent_type, info in CONSENT_TYPES.items():
            user_consent = (user.get("consents") or {}).get(consent_type, {})
            consents[consent_type] = {
                "label": info["label"],
                "required": info["required"],
                "granted": user_consent.get("granted", False),
                "recorded_at": user_consent.get("recorded_at"),
                "url": info.get("url"),
                "description": info.get("description")
            }
        
        return consents

    async def validate_registration_consents(self, consents: Dict[str, bool]) -> tuple:
        """Validate that required consents are given during registration"""
        missing = []
        
        for consent_type, info in CONSENT_TYPES.items():
            if info["required"] and not consents.get(consent_type, False):
                missing.append(info["label"])
        
        if missing:
            return False, f"Vous devez accepter: {', '.join(missing)}"
        
        return True, ""

    def validate_age(self, birth_date: str) -> tuple:
        """Validate user age for registration"""
        try:
            dob = datetime.fromisoformat(birth_date.replace('Z', '+00:00'))
            if dob.tzinfo is None:
                dob = dob.replace(tzinfo=timezone.utc)
            
            today = datetime.now(timezone.utc)
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            
            if age < MINIMUM_AGE:
                return False, f"Tu dois avoir au moins {MINIMUM_AGE} ans pour utiliser Hui Fenua", age
            
            if age < PARENTAL_CONSENT_AGE:
                return True, "Nous recommandons l'autorisation parentale pour les moins de 16 ans", age
            
            return True, "", age
            
        except Exception as e:
            logger.error(f"Age validation error: {e}")
            return False, "Date de naissance invalide", 0

    async def request_data_export(self, user_id: str) -> dict:
        """Request a GDPR data export"""
        
        # Check rate limit (1 per week)
        last_request = await self.db.data_requests.find_one(
            {"user_id": user_id, "type": "export"},
            sort=[("created_at", -1)]
        )
        
        if last_request:
            last_time = datetime.fromisoformat(last_request["created_at"].replace('Z', '+00:00'))
            if datetime.now(timezone.utc) - last_time < timedelta(days=7):
                return {
                    "success": False,
                    "message": "Vous ne pouvez demander vos données qu'une fois par semaine"
                }
        
        request_record = {
            "request_id": f"export_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": "export",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None,
            "download_url": None,
            "expires_at": None
        }
        
        await self.db.data_requests.insert_one(request_record)
        
        logger.info(f"Data export requested: {user_id}")
        
        return {
            "success": True,
            "request_id": request_record["request_id"],
            "message": "Votre demande a été enregistrée. Vous recevrez un email sous 48h."
        }

    async def generate_data_export(self, user_id: str) -> dict:
        """Generate a complete data export for a user (GDPR Article 20)"""
        
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
        if not user:
            raise ValueError("Utilisateur non trouvé")
        
        export_data = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "data": {
                "profile": user,
                "posts": [],
                "comments": [],
                "messages": [],
                "likes": [],
                "follows": [],
                "consents": [],
                "notifications": [],
                "sessions": []
            }
        }
        
        # Collect all user data
        export_data["data"]["posts"] = await self.db.posts.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(10000)
        
        export_data["data"]["comments"] = await self.db.comments.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(10000)
        
        export_data["data"]["messages"] = await self.db.messages.find(
            {"sender_id": user_id}, {"_id": 0}
        ).to_list(10000)
        
        export_data["data"]["likes"] = await self.db.likes.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(10000)
        
        export_data["data"]["follows"] = await self.db.follows.find(
            {"$or": [{"follower_id": user_id}, {"following_id": user_id}]}, {"_id": 0}
        ).to_list(10000)
        
        export_data["data"]["consents"] = await self.db.consent_records.find(
            {"user_id": user_id}, {"_id": 0}
        ).to_list(1000)
        
        export_data["data"]["notifications"] = await self.db.notifications.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).limit(1000).to_list(1000)
        
        # Create ZIP file
        temp_dir = tempfile.mkdtemp()
        try:
            json_path = os.path.join(temp_dir, "my_data.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2, default=str)
            
            zip_filename = f"fenua_data_{user_id}_{datetime.now().strftime('%Y%m%d')}.zip"
            zip_path = os.path.join("/app/uploads/exports", zip_filename)
            os.makedirs("/app/uploads/exports", exist_ok=True)
            
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(json_path, "my_data.json")
            
            logger.info(f"Data export generated for {user_id}: {zip_filename}")
            
            return {
                "success": True,
                "filename": zip_filename,
                "path": zip_path
            }
        finally:
            shutil.rmtree(temp_dir)

    async def request_account_deletion(self, user_id: str) -> dict:
        """Request account deletion (30-day grace period)"""
        
        deletion_date = datetime.now(timezone.utc) + timedelta(days=30)
        
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "deletion_requested": True,
                "deletion_request_date": datetime.now(timezone.utc).isoformat(),
                "scheduled_deletion_date": deletion_date.isoformat()
            }}
        )
        
        request_record = {
            "request_id": f"delete_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "type": "deletion",
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "scheduled_for": deletion_date.isoformat()
        }
        
        await self.db.data_requests.insert_one(request_record)
        
        logger.info(f"Account deletion scheduled for {user_id} on {deletion_date}")
        
        # TODO: Send confirmation email
        
        return {
            "success": True,
            "message": f"Votre compte sera supprimé le {deletion_date.strftime('%d/%m/%Y')}. Vous pouvez annuler cette demande avant cette date.",
            "scheduled_date": deletion_date.isoformat()
        }

    async def cancel_account_deletion(self, user_id: str) -> dict:
        """Cancel a pending account deletion request"""
        
        user = await self.db.users.find_one({"user_id": user_id}, {"_id": 0})
        
        if not user or not user.get("deletion_requested"):
            return {"success": False, "message": "Aucune demande de suppression en cours"}
        
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$unset": {
                "deletion_requested": "",
                "deletion_request_date": "",
                "scheduled_deletion_date": ""
            }}
        )
        
        await self.db.data_requests.update_one(
            {"user_id": user_id, "type": "deletion", "status": "scheduled"},
            {"$set": {"status": "cancelled"}}
        )
        
        logger.info(f"Account deletion cancelled for {user_id}")
        
        return {"success": True, "message": "Demande de suppression annulée"}

    async def process_scheduled_deletions(self):
        """Process scheduled account deletions (run as background job)"""
        now = datetime.now(timezone.utc)
        
        users_to_delete = await self.db.users.find({
            "deletion_requested": True,
            "scheduled_deletion_date": {"$lte": now.isoformat()}
        }).to_list(100)
        
        for user in users_to_delete:
            await self.delete_user_data(user["user_id"])
            logger.info(f"Scheduled deletion completed for {user['user_id']}")


    async def delete_user_data(self, user_id: str):
        """Completely delete all user data (GDPR Article 17 - Right to be forgotten)"""
        
        # Delete posts and their media
        posts = await self.db.posts.find({"user_id": user_id}).to_list(10000)
        for post in posts:
            # Delete media files
            if post.get("media_url"):
                media_path = post["media_url"].replace("/api/uploads/", "/app/backend/uploads/")
                if os.path.exists(media_path):
                    try:
                        os.remove(media_path)
                    except:
                        pass
        
        # Delete all user data from collections
        await self.db.posts.delete_many({"user_id": user_id})
        await self.db.stories.delete_many({"user_id": user_id})
        await self.db.comments.delete_many({"user_id": user_id})
        await self.db.likes.delete_many({"user_id": user_id})
        await self.db.reactions.delete_many({"user_id": user_id})
        await self.db.messages.delete_many({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
        await self.db.conversations.delete_many({"participants": user_id})
        await self.db.follows.delete_many({"$or": [{"follower_id": user_id}, {"following_id": user_id}]})
        await self.db.notifications.delete_many({"user_id": user_id})
        await self.db.products.delete_many({"user_id": user_id})
        await self.db.services.delete_many({"user_id": user_id})
        await self.db.saved_posts.delete_many({"user_id": user_id})
        await self.db.blocks.delete_many({"$or": [{"blocker_id": user_id}, {"blocked_id": user_id}]})
        await self.db.user_sessions.delete_many({"user_id": user_id})
        await self.db.media_files.delete_many({"user_id": user_id})
        await self.db.consent_records.delete_many({"user_id": user_id})
        
        # Finally delete the user
        await self.db.users.delete_one({"user_id": user_id})
        
        logger.info(f"All data deleted for user {user_id}")


def get_consent_types():
    """Return consent types for frontend"""
    return [
        {
            "type": key,
            "label": val["label"],
            "required": val["required"],
            "url": val.get("url"),
            "description": val.get("description")
        }
        for key, val in CONSENT_TYPES.items()
    ]
