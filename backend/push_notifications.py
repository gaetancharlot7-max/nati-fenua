# Firebase Push Notifications Service
# Nati Fenua - Push notifications for mobile and web

import os
import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Firebase configuration
FIREBASE_SERVER_KEY = os.environ.get("FIREBASE_SERVER_KEY", "")
FIREBASE_FCM_URL = "https://fcm.googleapis.com/fcm/send"


class PushNotificationService:
    """Service for sending push notifications via Firebase Cloud Messaging"""
    
    def __init__(self, server_key: str = None):
        self.server_key = server_key or FIREBASE_SERVER_KEY
        self.enabled = bool(self.server_key)
        
        if not self.enabled:
            logger.warning("Firebase not configured - push notifications disabled")
    
    async def send_to_device(self, device_token: str, title: str, body: str, data: dict = None) -> bool:
        """Send a push notification to a specific device"""
        if not self.enabled:
            logger.debug("Push notifications disabled")
            return False
        
        payload = {
            "to": device_token,
            "notification": {
                "title": title,
                "body": body,
                "icon": "/logo192.png",
                "click_action": "OPEN_APP"
            },
            "data": data or {}
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    FIREBASE_FCM_URL,
                    json=payload,
                    headers={
                        "Authorization": f"key={self.server_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success", 0) > 0:
                        logger.info(f"Push notification sent successfully")
                        return True
                    else:
                        logger.error(f"FCM error: {result}")
                        return False
                else:
                    logger.error(f"FCM HTTP error: {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return False
    
    async def send_to_devices(self, device_tokens: List[str], title: str, body: str, data: dict = None) -> int:
        """Send push notification to multiple devices"""
        if not self.enabled or not device_tokens:
            return 0
        
        # FCM allows up to 1000 tokens per request
        success_count = 0
        
        for i in range(0, len(device_tokens), 1000):
            batch = device_tokens[i:i+1000]
            
            payload = {
                "registration_ids": batch,
                "notification": {
                    "title": title,
                    "body": body,
                    "icon": "/logo192.png"
                },
                "data": data or {}
            }
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        FIREBASE_FCM_URL,
                        json=payload,
                        headers={
                            "Authorization": f"key={self.server_key}",
                            "Content-Type": "application/json"
                        },
                        timeout=30.0
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        success_count += result.get("success", 0)
                        
            except Exception as e:
                logger.error(f"Batch push error: {e}")
        
        logger.info(f"Sent {success_count} push notifications")
        return success_count
    
    async def send_to_topic(self, topic: str, title: str, body: str, data: dict = None) -> bool:
        """Send push notification to a topic (e.g., all users on an island)"""
        if not self.enabled:
            return False
        
        payload = {
            "to": f"/topics/{topic}",
            "notification": {
                "title": title,
                "body": body,
                "icon": "/logo192.png"
            },
            "data": data or {}
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    FIREBASE_FCM_URL,
                    json=payload,
                    headers={
                        "Authorization": f"key={self.server_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=10.0
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Topic push error: {e}")
            return False


# Notification templates
class NotificationTemplates:
    """Pre-defined notification templates"""
    
    @staticmethod
    def new_message(sender_name: str) -> tuple:
        return (
            "Nouveau message",
            f"{sender_name} vous a envoyé un message"
        )
    
    @staticmethod
    def new_follower(follower_name: str) -> tuple:
        return (
            "Nouvel abonné",
            f"{follower_name} vous suit maintenant"
        )
    
    @staticmethod
    def post_liked(liker_name: str) -> tuple:
        return (
            "J'aime",
            f"{liker_name} a aimé votre publication"
        )
    
    @staticmethod
    def post_comment(commenter_name: str) -> tuple:
        return (
            "Nouveau commentaire",
            f"{commenter_name} a commenté votre publication"
        )
    
    @staticmethod
    def mana_alert(title: str, island: str) -> tuple:
        return (
            f"🔔 Alerte Mana - {island}",
            title
        )
    
    @staticmethod
    def sponsored_content(business_name: str) -> tuple:
        return (
            "Offre spéciale",
            f"Découvrez l'offre de {business_name}"
        )


# Global instance
push_service = PushNotificationService()
