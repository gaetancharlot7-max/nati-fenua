# Friend Requests Module - Nati Fenua
# Gestion des demandes d'amis avec statuts et validation explicite

from datetime import datetime, timezone, timedelta
from typing import Optional, List
import logging
import uuid

logger = logging.getLogger(__name__)

# Statuts possibles pour une demande d'ami
class FriendRequestStatus:
    PENDING = "pending"      # Demande envoyée, en attente de réponse
    ACCEPTED = "accepted"    # Demande acceptée, amitié créée
    REJECTED = "rejected"    # Demande refusée
    CANCELLED = "cancelled"  # Demande annulée par l'émetteur
    BLOCKED = "blocked"      # Utilisateur bloqué


class FriendRequestService:
    def __init__(self, db):
        self.db = db
    
    async def send_request(self, sender_id: str, receiver_id: str) -> dict:
        """Envoyer une demande d'ami"""
        
        # Vérification : pas d'auto-demande
        if sender_id == receiver_id:
            return {"success": False, "error": "Vous ne pouvez pas vous ajouter vous-même"}
        
        # Vérifier si le destinataire existe
        receiver = await self.db.users.find_one({"user_id": receiver_id})
        if not receiver:
            return {"success": False, "error": "Utilisateur non trouvé"}
        
        # Vérifier si une demande existe déjà (dans les deux sens)
        existing = await self.db.friend_requests.find_one({
            "$or": [
                {"sender_id": sender_id, "receiver_id": receiver_id, "status": {"$in": ["pending", "accepted"]}},
                {"sender_id": receiver_id, "receiver_id": sender_id, "status": {"$in": ["pending", "accepted"]}}
            ]
        })
        
        if existing:
            if existing["status"] == "accepted":
                return {"success": False, "error": "Vous êtes déjà amis"}
            elif existing["sender_id"] == sender_id:
                return {"success": False, "error": "Demande déjà envoyée"}
            else:
                # L'autre personne a déjà envoyé une demande - accepter automatiquement
                return await self.accept_request(existing["request_id"], sender_id)
        
        # Vérifier si l'utilisateur n'est pas bloqué
        blocked = await self.db.blocks.find_one({
            "$or": [
                {"blocker_id": sender_id, "blocked_id": receiver_id},
                {"blocker_id": receiver_id, "blocked_id": sender_id}
            ]
        })
        if blocked:
            return {"success": False, "error": "Impossible d'envoyer une demande à cet utilisateur"}
        
        # Créer la demande
        request_id = f"freq_{uuid.uuid4().hex[:12]}"
        friend_request = {
            "request_id": request_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "status": FriendRequestStatus.PENDING,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "responded_at": None
        }
        
        await self.db.friend_requests.insert_one(friend_request)
        
        logger.info(f"Friend request sent: {sender_id} -> {receiver_id}")
        
        return {
            "success": True,
            "request_id": request_id,
            "status": FriendRequestStatus.PENDING,
            "message": "Demande d'ami envoyée"
        }
    
    async def accept_request(self, request_id: str, user_id: str) -> dict:
        """Accepter une demande d'ami"""
        
        # Trouver la demande
        request = await self.db.friend_requests.find_one({
            "request_id": request_id,
            "receiver_id": user_id,
            "status": FriendRequestStatus.PENDING
        })
        
        if not request:
            return {"success": False, "error": "Demande non trouvée ou déjà traitée"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Mettre à jour le statut de la demande
        await self.db.friend_requests.update_one(
            {"request_id": request_id},
            {"$set": {
                "status": FriendRequestStatus.ACCEPTED,
                "updated_at": now,
                "responded_at": now
            }}
        )
        
        # Créer la relation d'amitié bidirectionnelle
        friendship_id = f"friend_{uuid.uuid4().hex[:12]}"
        friendship = {
            "friendship_id": friendship_id,
            "user1_id": request["sender_id"],
            "user2_id": request["receiver_id"],
            "created_at": now,
            "source_request_id": request_id
        }
        await self.db.friendships.insert_one(friendship)
        
        # Mettre à jour les compteurs d'amis
        await self.db.users.update_one(
            {"user_id": request["sender_id"]},
            {"$inc": {"friends_count": 1}}
        )
        await self.db.users.update_one(
            {"user_id": request["receiver_id"]},
            {"$inc": {"friends_count": 1}}
        )
        
        logger.info(f"Friend request accepted: {request['sender_id']} <-> {request['receiver_id']}")
        
        return {
            "success": True,
            "status": FriendRequestStatus.ACCEPTED,
            "friendship_id": friendship_id,
            "message": "Demande acceptée ! Vous êtes maintenant amis"
        }
    
    async def reject_request(self, request_id: str, user_id: str) -> dict:
        """Refuser une demande d'ami"""
        
        request = await self.db.friend_requests.find_one({
            "request_id": request_id,
            "receiver_id": user_id,
            "status": FriendRequestStatus.PENDING
        })
        
        if not request:
            return {"success": False, "error": "Demande non trouvée ou déjà traitée"}
        
        now = datetime.now(timezone.utc).isoformat()
        
        await self.db.friend_requests.update_one(
            {"request_id": request_id},
            {"$set": {
                "status": FriendRequestStatus.REJECTED,
                "updated_at": now,
                "responded_at": now
            }}
        )
        
        logger.info(f"Friend request rejected: {request['sender_id']} -> {request['receiver_id']}")
        
        return {
            "success": True,
            "status": FriendRequestStatus.REJECTED,
            "message": "Demande refusée"
        }
    
    async def cancel_request(self, request_id: str, user_id: str) -> dict:
        """Annuler une demande d'ami envoyée"""
        
        request = await self.db.friend_requests.find_one({
            "request_id": request_id,
            "sender_id": user_id,
            "status": FriendRequestStatus.PENDING
        })
        
        if not request:
            return {"success": False, "error": "Demande non trouvée ou déjà traitée"}
        
        await self.db.friend_requests.update_one(
            {"request_id": request_id},
            {"$set": {
                "status": FriendRequestStatus.CANCELLED,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Friend request cancelled: {request['sender_id']} -> {request['receiver_id']}")
        
        return {
            "success": True,
            "status": FriendRequestStatus.CANCELLED,
            "message": "Demande annulée"
        }
    
    async def remove_friend(self, user_id: str, friend_id: str) -> dict:
        """Supprimer un ami"""
        
        # Trouver l'amitié
        friendship = await self.db.friendships.find_one({
            "$or": [
                {"user1_id": user_id, "user2_id": friend_id},
                {"user1_id": friend_id, "user2_id": user_id}
            ]
        })
        
        if not friendship:
            return {"success": False, "error": "Amitié non trouvée"}
        
        # Supprimer l'amitié
        await self.db.friendships.delete_one({"friendship_id": friendship["friendship_id"]})
        
        # Mettre à jour les compteurs
        await self.db.users.update_one(
            {"user_id": user_id},
            {"$inc": {"friends_count": -1}}
        )
        await self.db.users.update_one(
            {"user_id": friend_id},
            {"$inc": {"friends_count": -1}}
        )
        
        # Mettre à jour la demande originale si elle existe
        if friendship.get("source_request_id"):
            await self.db.friend_requests.update_one(
                {"request_id": friendship["source_request_id"]},
                {"$set": {"status": "removed", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        logger.info(f"Friendship removed: {user_id} <-> {friend_id}")
        
        return {"success": True, "message": "Ami supprimé"}
    
    async def get_sent_requests(self, user_id: str, limit: int = 50, skip: int = 0) -> List[dict]:
        """Obtenir les demandes envoyées par l'utilisateur"""
        
        requests = await self.db.friend_requests.find(
            {"sender_id": user_id, "status": FriendRequestStatus.PENDING},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrichir avec les infos utilisateur
        for req in requests:
            user = await self.db.users.find_one(
                {"user_id": req["receiver_id"]},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
            )
            req["receiver"] = user
        
        return requests
    
    async def get_received_requests(self, user_id: str, limit: int = 50, skip: int = 0) -> List[dict]:
        """Obtenir les demandes reçues par l'utilisateur"""
        
        requests = await self.db.friend_requests.find(
            {"receiver_id": user_id, "status": FriendRequestStatus.PENDING},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrichir avec les infos utilisateur
        for req in requests:
            user = await self.db.users.find_one(
                {"user_id": req["sender_id"]},
                {"_id": 0, "user_id": 1, "name": 1, "picture": 1}
            )
            req["sender"] = user
        
        return requests
    
    async def get_friends(self, user_id: str, limit: int = 50, skip: int = 0) -> List[dict]:
        """Obtenir la liste des amis confirmés"""
        
        friendships = await self.db.friendships.find(
            {"$or": [{"user1_id": user_id}, {"user2_id": user_id}]},
            {"_id": 0}
        ).skip(skip).limit(limit).to_list(limit)
        
        friends = []
        for f in friendships:
            friend_id = f["user2_id"] if f["user1_id"] == user_id else f["user1_id"]
            friend = await self.db.users.find_one(
                {"user_id": friend_id},
                {"_id": 0, "password_hash": 0, "email": 0}
            )
            if friend:
                friend["friendship_id"] = f["friendship_id"]
                friend["friends_since"] = f["created_at"]
                friends.append(friend)
        
        return friends
    
    async def get_friendship_status(self, user_id: str, other_user_id: str) -> dict:
        """Obtenir le statut d'amitié entre deux utilisateurs"""
        
        # Vérifier s'ils sont déjà amis
        friendship = await self.db.friendships.find_one({
            "$or": [
                {"user1_id": user_id, "user2_id": other_user_id},
                {"user1_id": other_user_id, "user2_id": user_id}
            ]
        })
        
        if friendship:
            return {
                "status": "friends",
                "friendship_id": friendship["friendship_id"],
                "since": friendship["created_at"]
            }
        
        # Vérifier s'il y a une demande en cours
        pending_request = await self.db.friend_requests.find_one({
            "$or": [
                {"sender_id": user_id, "receiver_id": other_user_id, "status": FriendRequestStatus.PENDING},
                {"sender_id": other_user_id, "receiver_id": user_id, "status": FriendRequestStatus.PENDING}
            ]
        })
        
        if pending_request:
            if pending_request["sender_id"] == user_id:
                return {
                    "status": "request_sent",
                    "request_id": pending_request["request_id"],
                    "created_at": pending_request["created_at"]
                }
            else:
                return {
                    "status": "request_received",
                    "request_id": pending_request["request_id"],
                    "created_at": pending_request["created_at"]
                }
        
        return {"status": "none"}
    
    async def cleanup_old_requests(self, days: int = 10):
        """Nettoyer les demandes rejetées/annulées de plus de X jours"""
        
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        
        result = await self.db.friend_requests.delete_many({
            "status": {"$in": [FriendRequestStatus.REJECTED, FriendRequestStatus.CANCELLED]},
            "updated_at": {"$lt": cutoff}
        })
        
        if result.deleted_count > 0:
            logger.info(f"Cleaned up {result.deleted_count} old friend requests")
        
        return result.deleted_count
