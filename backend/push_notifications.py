# Firebase Push Notifications Service
# Nati Fenua - Push notifications using Firebase HTTP API (no SDK dependency)

import os
import json
import logging
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Firebase HTTP API v1 endpoint
FCM_API_URL = "https://fcm.googleapis.com/v1/projects/{project_id}/messages:send"

# Global state
_access_token = None
_token_expiry = None
_project_id = None


def _load_service_account():
    """Load service account credentials from JSON file."""
    global _project_id
    
    service_account_path = os.path.join(
        os.path.dirname(__file__), 
        'firebase-service-account.json'
    )
    
    if not os.path.exists(service_account_path):
        logger.warning("Firebase service account not found - push notifications disabled")
        return None
    
    try:
        with open(service_account_path, 'r') as f:
            credentials = json.load(f)
            _project_id = credentials.get('project_id')
            return credentials
    except Exception as e:
        logger.error(f"Failed to load service account: {e}")
        return None


def _create_jwt(credentials: dict) -> str:
    """Create a JWT for Firebase authentication using PyJWT."""
    import jwt
    import time
    
    now = int(time.time())
    
    payload = {
        "iss": credentials["client_email"],
        "sub": credentials["client_email"],
        "aud": "https://oauth2.googleapis.com/token",
        "iat": now,
        "exp": now + 3600,
        "scope": "https://www.googleapis.com/auth/firebase.messaging"
    }
    
    # Sign with RS256
    token = jwt.encode(
        payload,
        credentials["private_key"],
        algorithm="RS256"
    )
    
    return token


async def _get_access_token() -> Optional[str]:
    """Get OAuth2 access token for Firebase API."""
    global _access_token, _token_expiry
    
    import time
    
    # Return cached token if still valid
    if _access_token and _token_expiry and time.time() < _token_expiry - 60:
        return _access_token
    
    credentials = _load_service_account()
    if not credentials:
        return None
    
    try:
        # Create JWT
        jwt_token = _create_jwt(credentials)
        
        # Exchange JWT for access token
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": jwt_token
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                _access_token = data["access_token"]
                _token_expiry = time.time() + data.get("expires_in", 3600)
                logger.info("Firebase access token obtained successfully")
                return _access_token
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error getting access token: {e}")
        return None


class PushNotificationService:
    """Service for sending push notifications via Firebase Cloud Messaging HTTP API"""
    
    def __init__(self):
        credentials = _load_service_account()
        self.enabled = credentials is not None
        self.project_id = _project_id
        
        if not self.enabled:
            logger.warning("Firebase not configured - push notifications disabled")
        else:
            logger.info(f"Firebase HTTP API initialized for project: {self.project_id}")
    
    async def send_to_device(self, device_token: str, title: str, body: str, data: dict = None, image: str = None) -> bool:
        """Send a push notification to a specific device"""
        if not self.enabled:
            logger.debug("Push notifications disabled")
            return False
        
        access_token = await _get_access_token()
        if not access_token:
            return False
        
        try:
            message = {
                "message": {
                    "token": device_token,
                    "notification": {
                        "title": title,
                        "body": body
                    },
                    "webpush": {
                        "notification": {
                            "icon": "/icons/nati-fenua-192.png",
                            "badge": "/icons/nati-fenua-64.png",
                            "vibrate": [100, 50, 100]
                        },
                        "fcm_options": {
                            "link": "https://natifenua.pf"
                        }
                    }
                }
            }
            
            if image:
                message["message"]["notification"]["image"] = image
            
            if data:
                message["message"]["data"] = {k: str(v) for k, v in data.items()}
            
            url = FCM_API_URL.format(project_id=self.project_id)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=message,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Push notification sent successfully")
                    return True
                elif response.status_code == 404 or "UNREGISTERED" in response.text:
                    logger.warning(f"Token is no longer valid: {device_token[:20]}...")
                    return False
                else:
                    logger.error(f"Push notification error: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Push notification error: {e}")
            return False
    
    async def send_to_devices(self, device_tokens: List[str], title: str, body: str, data: dict = None) -> int:
        """Send push notification to multiple devices"""
        if not self.enabled or not device_tokens:
            return 0
        
        success_count = 0
        for token in device_tokens:
            if await self.send_to_device(token, title, body, data):
                success_count += 1
        
        logger.info(f"Multicast: {success_count}/{len(device_tokens)} success")
        return success_count
    
    async def send_to_topic(self, topic: str, title: str, body: str, data: dict = None) -> bool:
        """Send push notification to all devices subscribed to a topic"""
        if not self.enabled:
            return False
        
        access_token = await _get_access_token()
        if not access_token:
            return False
        
        try:
            message = {
                "message": {
                    "topic": topic,
                    "notification": {
                        "title": title,
                        "body": body
                    },
                    "webpush": {
                        "notification": {
                            "icon": "/icons/nati-fenua-192.png"
                        }
                    }
                }
            }
            
            if data:
                message["message"]["data"] = {k: str(v) for k, v in data.items()}
            
            url = FCM_API_URL.format(project_id=self.project_id)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    json=message,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Topic notification sent to '{topic}'")
                    return True
                else:
                    logger.error(f"Topic notification error: {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Topic notification error: {e}")
            return False
    
    def subscribe_to_topic(self, tokens: List[str], topic: str) -> dict:
        """Subscribe tokens to a topic (placeholder - requires IID API)"""
        logger.info(f"Topic subscription not implemented in HTTP-only mode")
        return {"success_count": 0, "failure_count": len(tokens)}
    
    def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> dict:
        """Unsubscribe tokens from a topic (placeholder - requires IID API)"""
        logger.info(f"Topic unsubscription not implemented in HTTP-only mode")
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
