# WebSocket Manager for Real-time Chat
# Nati Fenua - Real-time messaging system

import asyncio
import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # user_id -> list of WebSocket connections (user can have multiple devices)
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # conversation_id -> set of user_ids currently viewing
        self.conversation_viewers: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WebSocket connected: user {user_id} (total connections: {len(self.active_connections[user_id])})")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WebSocket disconnected: user {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user (all their devices)"""
        if user_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
                    disconnected.append(connection)
            
            # Clean up disconnected sockets
            for conn in disconnected:
                self.active_connections[user_id].remove(conn)
    
    async def send_to_conversation(self, message: dict, conversation_id: str, exclude_user: str = None):
        """Send a message to all users in a conversation"""
        if conversation_id in self.conversation_viewers:
            for user_id in self.conversation_viewers[conversation_id]:
                if user_id != exclude_user:
                    await self.send_personal_message(message, user_id)
    
    async def broadcast_to_users(self, message: dict, user_ids: List[str]):
        """Send a message to multiple users"""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    def join_conversation(self, user_id: str, conversation_id: str):
        """Mark a user as viewing a conversation"""
        if conversation_id not in self.conversation_viewers:
            self.conversation_viewers[conversation_id] = set()
        self.conversation_viewers[conversation_id].add(user_id)
    
    def leave_conversation(self, user_id: str, conversation_id: str):
        """Remove a user from viewing a conversation"""
        if conversation_id in self.conversation_viewers:
            self.conversation_viewers[conversation_id].discard(user_id)
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently connected"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_online_users(self) -> List[str]:
        """Get list of all online user IDs"""
        return list(self.active_connections.keys())


# Global connection manager instance
chat_manager = ConnectionManager()


# Message types for WebSocket communication
class WSMessageTypes:
    # Chat messages
    NEW_MESSAGE = "new_message"
    MESSAGE_READ = "message_read"
    TYPING_START = "typing_start"
    TYPING_STOP = "typing_stop"
    
    # Notifications
    NOTIFICATION = "notification"
    MANA_ALERT = "mana_alert"
    
    # User status
    USER_ONLINE = "user_online"
    USER_OFFLINE = "user_offline"
    
    # System
    ERROR = "error"
    CONNECTED = "connected"


def create_ws_message(msg_type: str, data: dict) -> dict:
    """Create a standardized WebSocket message"""
    return {
        "type": msg_type,
        "data": data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
