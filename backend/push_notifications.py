# Firebase Push Notifications Service
# Nati Fenua - Push notifications for mobile and web using Firebase Admin SDK

import os
import logging
from typing import List, Dict, Optional
from datetime import datetime, timezone

# Import Firebase Admin SDK
import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app = None

def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        service_account_path = os.path.join(
            os.path.dirname(__file__), 
            'firebase-service-account.json'
        )
        
        if not os.path.exists(service_account_path):
            logger.warning(f"Firebase service account not found - push notifications disabled")
            return None
        
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return None


class PushNotificationService:
    """Service for sending push notifications via Firebase Cloud Messaging"""
    
    def __init__(self):
        self.enabled = init_firebase() is not None
        
        if not self.enabled:
            logger.warning("Firebase not configured - push notifications disabled")
    
    async def send_to_device(self, device_token: str, title: str, body: str, data: dict = None, image: str = None) -> bool:
        """Send a push notification to a specific device"""
        if not self.enabled:
            logger.debug("Push notifications disabled")
            return False
        
        try:
            notification = messaging.Notification(
                title=title,
                body=body,
                image=image
            )
            
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in (data or {}).items()},
                token=device_token,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/icons/nati-fenua-192.png',
                        badge='/icons/nati-fenua-64.png',
                        vibrate=[100, 50, 100]
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link='https://natifenua.pf'
                    )
                )
            )
            
            response = messaging.send(message)
            logger.info(f"Push notification sent successfully: {response}")
            return True
            
        except messaging.UnregisteredError:
            logger.warning(f"Token is no longer valid: {device_token[:20]}...")
            return False
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return False
    
    async def send_to_devices(self, device_tokens: List[str], title: str, body: str, data: dict = None) -> int:
        """Send push notification to multiple devices"""
        if not self.enabled or not device_tokens:
            return 0
        
        try:
            notification = messaging.Notification(title=title, body=body)
            
            message = messaging.MulticastMessage(
                notification=notification,
                data={k: str(v) for k, v in (data or {}).items()},
                tokens=device_tokens,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/icons/nati-fenua-192.png',
                        badge='/icons/nati-fenua-64.png'
                    )
                )
            )
            
            response = messaging.send_each_for_multicast(message)
            logger.info(f"Multicast: {response.success_count} success, {response.failure_count} failures")
            return response.success_count
            
        except Exception as e:
            logger.error(f"Multicast notification error: {e}")
            return 0
    
    async def send_to_topic(self, topic: str, title: str, body: str, data: dict = None) -> bool:
        """Send push notification to all devices subscribed to a topic"""
        if not self.enabled:
            return False
        
        try:
            notification = messaging.Notification(title=title, body=body)
            
            message = messaging.Message(
                notification=notification,
                data={k: str(v) for k, v in (data or {}).items()},
                topic=topic,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon='/icons/nati-fenua-192.png'
                    )
                )
            )
            
            response = messaging.send(message)
            logger.info(f"Topic notification sent to '{topic}': {response}")
            return True
            
        except Exception as e:
            logger.error(f"Topic notification error: {e}")
            return False
    
    def subscribe_to_topic(self, tokens: List[str], topic: str) -> dict:
        """Subscribe tokens to a topic"""
        if not self.enabled:
            return {"success_count": 0, "failure_count": len(tokens)}
        
        try:
            response = messaging.subscribe_to_topic(tokens, topic)
            return {
                "success_count": response.success_count,
                "failure_count": response.failure_count
            }
        except Exception as e:
            logger.error(f"Subscribe to topic error: {e}")
            return {"success_count": 0, "failure_count": len(tokens)}
    
    def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> dict:
        """Unsubscribe tokens from a topic"""
        if not self.enabled:
            return {"success_count": 0, "failure_count": len(tokens)}
        
        try:
            response = messaging.unsubscribe_from_topic(tokens, topic)
            return {
                "success_count": response.success_count,
                "failure_count": response.failure_count
            }
        except Exception as e:
            logger.error(f"Unsubscribe from topic error: {e}")
            return {"success_count": 0, "failure_count": len(tokens)}


# Global instance
push_service = PushNotificationService()


# Notification templates
class NotificationTemplates:
    """Pre-defined notification templates for common events"""
    
    @staticmethod
    def new_message(sender_name: str, preview: str = None) -> dict:
        return {
            "title": f"Message de {sender_name}",
            "body": preview or "Vous avez recu un nouveau message",
            "data": {"type": "message"}
        }
    
    @staticmethod
    def new_comment(commenter_name: str, post_id: str) -> dict:
        return {
            "title": f"{commenter_name} a commente votre post",
            "body": "Cliquez pour voir le commentaire",
            "data": {"type": "comment", "postId": post_id}
        }
    
    @staticmethod
    def new_like(liker_name: str, post_id: str) -> dict:
        return {
            "title": f"{liker_name} a aime votre post",
            "body": "Votre publication est populaire !",
            "data": {"type": "like", "postId": post_id}
        }
    
    @staticmethod
    def new_follower(follower_name: str, follower_id: str) -> dict:
        return {
            "title": f"{follower_name} vous suit maintenant",
            "body": "Vous avez un nouveau follower !",
            "data": {"type": "follow", "userId": follower_id}
        }
    
    @staticmethod
    def mana_event(event_type: str, location: str = None) -> dict:
        return {
            "title": "Nouveau signalement Mana",
            "body": f"{event_type}" + (f" a {location}" if location else ""),
            "data": {"type": "mana"}
        }
    
    @staticmethod
    def marketplace_response(item_title: str) -> dict:
        return {
            "title": "Reponse a votre annonce",
            "body": f"Quelqu'un est interesse par: {item_title}",
            "data": {"type": "marketplace"}
        }
