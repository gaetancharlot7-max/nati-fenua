# Media Processing and Storage Management for Fenua Social
import os
import subprocess
import shutil
from datetime import datetime, timezone, timedelta
import logging
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

# Storage limits
STORAGE_LIMITS = {
    "max_storage_per_user_mb": 5120,  # 5 GB
    "max_reels_per_user": 500,
    "max_photos_per_user": 2000,
}

# Media specifications
MEDIA_SPECS = {
    "video": {
        "max_resolution": "1920x1080",
        "codec": "libx264",
        "video_bitrate": "3M",
        "audio_bitrate": "128k",
        "max_duration_seconds": 90,
        "max_size_mb": 50,
        "format": "mp4"
    },
    "story": {
        "max_resolution": "1280x720",
        "codec": "libx264",
        "video_bitrate": "2M",
        "audio_bitrate": "96k",
        "max_duration_seconds": 30,
        "max_size_mb": 15,
        "format": "mp4"
    },
    "live_archive": {
        "max_resolution": "854x480",
        "codec": "libx264",
        "video_bitrate": "1M",
        "audio_bitrate": "96k",
        "format": "mp4",
        "retention_days": 30
    },
    "photo": {
        "format": "webp",
        "quality": 85,
        "max_size_mb": 2
    }
}

# Retention periods
RETENTION_PERIODS = {
    "story_feed": timedelta(days=3),
    "story_profile": timedelta(days=30),
    "live_archive": timedelta(days=30),
    "deleted_account_media": timedelta(days=30)
}


def get_video_duration(file_path: str) -> float:
    """Get video duration in seconds using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', file_path
        ], capture_output=True, text=True, timeout=30)
        return float(result.stdout.strip())
    except Exception as e:
        logger.error(f"Error getting video duration: {e}")
        return 0


def get_file_size_mb(file_path: str) -> float:
    """Get file size in MB"""
    return os.path.getsize(file_path) / (1024 * 1024)


async def compress_video(input_path: str, output_path: str, media_type: str = "video") -> dict:
    """
    Compress video according to specifications
    Returns: {"success": bool, "output_path": str, "size_mb": float, "message": str}
    """
    specs = MEDIA_SPECS.get(media_type, MEDIA_SPECS["video"])
    
    # Check duration
    duration = get_video_duration(input_path)
    max_duration = specs.get("max_duration_seconds", 90)
    
    if duration > max_duration:
        return {
            "success": False,
            "message": f"La vidéo dépasse la durée maximale de {max_duration} secondes. Durée actuelle: {int(duration)} secondes."
        }
    
    # Build ffmpeg command
    resolution = specs["max_resolution"]
    width, height = resolution.split("x")
    
    cmd = [
        'ffmpeg', '-y', '-i', input_path,
        '-c:v', specs["codec"],
        '-preset', 'fast',
        '-b:v', specs["video_bitrate"],
        '-maxrate', specs["video_bitrate"],
        '-bufsize', str(int(specs["video_bitrate"].replace("M", "")) * 2) + "M",
        '-vf', f'scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2',
        '-c:a', 'aac',
        '-b:a', specs["audio_bitrate"],
        '-movflags', '+faststart',
        output_path
    ]
    
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            logger.error(f"FFmpeg error: {stderr.decode()}")
            return {
                "success": False,
                "message": "Erreur lors de la compression de la vidéo. Veuillez réessayer."
            }
        
        # Check output size
        output_size = get_file_size_mb(output_path)
        max_size = specs["max_size_mb"]
        
        if output_size > max_size:
            # Try with lower bitrate
            os.remove(output_path)
            return {
                "success": False,
                "message": f"La vidéo est trop volumineuse après compression ({output_size:.1f} MB). Maximum: {max_size} MB."
            }
        
        return {
            "success": True,
            "output_path": output_path,
            "size_mb": output_size,
            "message": f"Vidéo compressée avec succès ({output_size:.1f} MB)"
        }
        
    except Exception as e:
        logger.error(f"Video compression error: {e}")
        return {
            "success": False,
            "message": "Erreur technique lors de la compression. Veuillez réessayer."
        }


async def compress_image(input_path: str, output_path: str) -> dict:
    """
    Compress and convert image to WebP format
    Returns: {"success": bool, "output_path": str, "size_mb": float, "message": str}
    """
    specs = MEDIA_SPECS["photo"]
    
    try:
        # Use ffmpeg for image conversion
        cmd = [
            'ffmpeg', '-y', '-i', input_path,
            '-vf', 'scale=1920:-1:force_original_aspect_ratio=decrease',
            '-quality', str(specs["quality"]),
            output_path
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        
        if process.returncode != 0:
            # Fallback: just copy the file if conversion fails
            shutil.copy(input_path, output_path)
        
        output_size = get_file_size_mb(output_path)
        max_size = specs["max_size_mb"]
        
        if output_size > max_size:
            return {
                "success": False,
                "message": f"L'image est trop volumineuse ({output_size:.1f} MB). Maximum: {max_size} MB."
            }
        
        return {
            "success": True,
            "output_path": output_path,
            "size_mb": output_size,
            "message": f"Image optimisée ({output_size:.1f} MB)"
        }
        
    except Exception as e:
        logger.error(f"Image compression error: {e}")
        return {
            "success": False,
            "message": "Erreur lors de l'optimisation de l'image."
        }


async def check_user_storage_limits(db, user_id: str) -> dict:
    """
    Check if user has reached storage limits
    Returns: {"can_upload": bool, "storage_used_mb": float, "message": str}
    """
    # Calculate user's total storage usage
    user_media = await db.media_files.find({"user_id": user_id}).to_list(10000)
    
    total_storage_mb = sum(m.get("size_mb", 0) for m in user_media)
    photo_count = sum(1 for m in user_media if m.get("media_type") == "photo")
    video_count = sum(1 for m in user_media if m.get("media_type") in ["video", "reel"])
    
    limits = STORAGE_LIMITS
    
    if total_storage_mb >= limits["max_storage_per_user_mb"]:
        return {
            "can_upload": False,
            "storage_used_mb": total_storage_mb,
            "message": f"Limite de stockage atteinte ({total_storage_mb:.0f} MB / {limits['max_storage_per_user_mb']} MB). Supprimez du contenu pour continuer."
        }
    
    if photo_count >= limits["max_photos_per_user"]:
        return {
            "can_upload": False,
            "storage_used_mb": total_storage_mb,
            "message": f"Limite de photos atteinte ({photo_count} / {limits['max_photos_per_user']}). Supprimez des photos pour continuer."
        }
    
    if video_count >= limits["max_reels_per_user"]:
        return {
            "can_upload": False,
            "storage_used_mb": total_storage_mb,
            "message": f"Limite de vidéos atteinte ({video_count} / {limits['max_reels_per_user']}). Supprimez des vidéos pour continuer."
        }
    
    return {
        "can_upload": True,
        "storage_used_mb": total_storage_mb,
        "storage_remaining_mb": limits["max_storage_per_user_mb"] - total_storage_mb,
        "message": "OK"
    }


async def cleanup_expired_media(db):
    """
    Clean up expired stories and live archives
    Run this as a scheduled task
    """
    now = datetime.now(timezone.utc)
    deleted_count = 0
    
    # Clean up expired stories (based on profile_expires_at for complete removal)
    expired_stories = await db.stories.find({
        "profile_expires_at": {"$lt": now.isoformat()}
    }).to_list(1000)
    
    for story in expired_stories:
        # Delete the media file
        if story.get("media_url"):
            file_path = story["media_url"].replace("/uploads/", "/app/uploads/")
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_count += 1
        
        # Delete the database entry
        await db.stories.delete_one({"story_id": story["story_id"]})
        await db.media_files.delete_one({"file_path": story.get("media_url")})
    
    # Clean up expired live archives
    live_archive_expiry = now - RETENTION_PERIODS["live_archive"]
    expired_lives = await db.live_archives.find({
        "created_at": {"$lt": live_archive_expiry.isoformat()}
    }).to_list(1000)
    
    for live in expired_lives:
        if live.get("archive_url"):
            file_path = live["archive_url"].replace("/uploads/", "/app/uploads/")
            if os.path.exists(file_path):
                os.remove(file_path)
                deleted_count += 1
        
        await db.live_archives.delete_one({"live_id": live["live_id"]})
    
    logger.info(f"Cleanup completed: deleted {deleted_count} expired media files")
    return deleted_count


async def delete_user_media(db, user_id: str, immediate: bool = False):
    """
    Delete all media for a user (when account is deleted)
    If immediate=False, schedule for deletion in 30 days
    """
    if immediate:
        # Delete immediately
        user_media = await db.media_files.find({"user_id": user_id}).to_list(10000)
        
        for media in user_media:
            file_path = media.get("file_path", "").replace("/uploads/", "/app/uploads/")
            if os.path.exists(file_path):
                os.remove(file_path)
        
        await db.media_files.delete_many({"user_id": user_id})
        await db.posts.delete_many({"user_id": user_id})
        await db.stories.delete_many({"user_id": user_id})
        
    else:
        # Schedule for deletion in 30 days
        deletion_date = datetime.now(timezone.utc) + RETENTION_PERIODS["deleted_account_media"]
        await db.scheduled_deletions.insert_one({
            "user_id": user_id,
            "scheduled_for": deletion_date.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })


async def delete_post_media(db, post_id: str):
    """
    Delete media files associated with a post
    """
    post = await db.posts.find_one({"post_id": post_id})
    
    if post and post.get("media_url"):
        file_path = post["media_url"].replace("/uploads/", "/app/uploads/")
        if os.path.exists(file_path):
            os.remove(file_path)
        
        await db.media_files.delete_one({"post_id": post_id})


async def get_storage_stats(db) -> dict:
    """
    Get overall storage statistics for admin dashboard
    """
    # Total storage used
    all_media = await db.media_files.find({}).to_list(100000)
    total_storage_mb = sum(m.get("size_mb", 0) for m in all_media)
    
    # Storage by media type
    storage_by_type = {}
    for media in all_media:
        media_type = media.get("media_type", "unknown")
        if media_type not in storage_by_type:
            storage_by_type[media_type] = 0
        storage_by_type[media_type] += media.get("size_mb", 0)
    
    # Top 10 users by storage
    user_storage = {}
    for media in all_media:
        user_id = media.get("user_id")
        if user_id not in user_storage:
            user_storage[user_id] = 0
        user_storage[user_id] += media.get("size_mb", 0)
    
    top_users = sorted(user_storage.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Get user details for top users
    top_users_details = []
    for user_id, storage_mb in top_users:
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "name": 1, "email": 1, "picture": 1})
        if user:
            top_users_details.append({
                "user_id": user_id,
                "name": user.get("name"),
                "email": user.get("email"),
                "picture": user.get("picture"),
                "storage_mb": round(storage_mb, 2)
            })
    
    return {
        "total_storage_mb": round(total_storage_mb, 2),
        "total_storage_gb": round(total_storage_mb / 1024, 2),
        "storage_by_type": {k: round(v, 2) for k, v in storage_by_type.items()},
        "total_files": len(all_media),
        "top_users": top_users_details
    }
