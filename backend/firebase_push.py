# Firebase Push Notifications Service
import firebase_admin
from firebase_admin import credentials, messaging
import os
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
_firebase_app = None

def init_firebase():
    """Initialize Firebase Admin SDK with service account credentials."""
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        # Get the path to the service account file
        service_account_path = os.path.join(
            os.path.dirname(__file__), 
            'firebase-service-account.json'
        )
        
        if not os.path.exists(service_account_path):
            logger.error(f"Firebase service account file not found: {service_account_path}")
            return None
        
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return _firebase_app
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        return None


def send_push_notification(
    token: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    image: Optional[str] = None
) -> bool:
    """
    Send a push notification to a single device.
    
    Args:
        token: FCM device token
        title: Notification title
        body: Notification body
        data: Optional data payload
        image: Optional image URL
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Initialize Firebase if not already done
        if _firebase_app is None:
            init_firebase()
        
        # Build notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image
        )
        
        # Build message
        message = messaging.Message(
            notification=notification,
            data=data or {},
            token=token,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/icons/nati-fenua-192.png',
                    badge='/icons/nati-fenua-64.png',
                    vibrate=[100, 50, 100],
                    actions=[
                        messaging.WebpushNotificationAction(
                            action='open',
                            title='Ouvrir'
                        )
                    ]
                ),
                fcm_options=messaging.WebpushFCMOptions(
                    link='https://natifenua.pf'
                )
            )
        )
        
        # Send message
        response = messaging.send(message)
        logger.info(f"Successfully sent notification: {response}")
        return True
        
    except messaging.UnregisteredError:
        logger.warning(f"Token is no longer valid: {token[:20]}...")
        return False
    except Exception as e:
        logger.error(f"Failed to send notification: {e}")
        return False


def send_push_to_multiple(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[dict] = None,
    image: Optional[str] = None
) -> dict:
    """
    Send push notifications to multiple devices.
    
    Args:
        tokens: List of FCM device tokens
        title: Notification title
        body: Notification body
        data: Optional data payload
        image: Optional image URL
    
    Returns:
        Dict with success_count, failure_count, and failed_tokens
    """
    if not tokens:
        return {"success_count": 0, "failure_count": 0, "failed_tokens": []}
    
    try:
        # Initialize Firebase if not already done
        if _firebase_app is None:
            init_firebase()
        
        # Build notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image
        )
        
        # Build multicast message
        message = messaging.MulticastMessage(
            notification=notification,
            data=data or {},
            tokens=tokens,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/icons/nati-fenua-192.png',
                    badge='/icons/nati-fenua-64.png',
                    vibrate=[100, 50, 100]
                )
            )
        )
        
        # Send messages
        response = messaging.send_each_for_multicast(message)
        
        # Collect failed tokens
        failed_tokens = []
        for idx, result in enumerate(response.responses):
            if not result.success:
                failed_tokens.append(tokens[idx])
        
        logger.info(f"Multicast: {response.success_count} success, {response.failure_count} failures")
        
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count,
            "failed_tokens": failed_tokens
        }
        
    except Exception as e:
        logger.error(f"Failed to send multicast notification: {e}")
        return {
            "success_count": 0,
            "failure_count": len(tokens),
            "failed_tokens": tokens
        }


def send_topic_notification(
    topic: str,
    title: str,
    body: str,
    data: Optional[dict] = None,
    image: Optional[str] = None
) -> bool:
    """
    Send a push notification to all devices subscribed to a topic.
    
    Args:
        topic: Topic name (e.g., 'all_users', 'new_posts')
        title: Notification title
        body: Notification body
        data: Optional data payload
        image: Optional image URL
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Initialize Firebase if not already done
        if _firebase_app is None:
            init_firebase()
        
        # Build notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image
        )
        
        # Build message for topic
        message = messaging.Message(
            notification=notification,
            data=data or {},
            topic=topic,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon='/icons/nati-fenua-192.png',
                    badge='/icons/nati-fenua-64.png',
                    vibrate=[100, 50, 100]
                )
            )
        )
        
        # Send message
        response = messaging.send(message)
        logger.info(f"Successfully sent topic notification to '{topic}': {response}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send topic notification: {e}")
        return False


def subscribe_to_topic(tokens: List[str], topic: str) -> dict:
    """Subscribe tokens to a topic."""
    try:
        if _firebase_app is None:
            init_firebase()
        
        response = messaging.subscribe_to_topic(tokens, topic)
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count
        }
    except Exception as e:
        logger.error(f"Failed to subscribe to topic: {e}")
        return {"success_count": 0, "failure_count": len(tokens)}


def unsubscribe_from_topic(tokens: List[str], topic: str) -> dict:
    """Unsubscribe tokens from a topic."""
    try:
        if _firebase_app is None:
            init_firebase()
        
        response = messaging.unsubscribe_from_topic(tokens, topic)
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count
        }
    except Exception as e:
        logger.error(f"Failed to unsubscribe from topic: {e}")
        return {"success_count": 0, "failure_count": len(tokens)}
