# Cloudinary Integration for Nati Fenua
# Handles image and video uploads with signed URLs

import os
import time
import logging
import cloudinary
import cloudinary.uploader
import cloudinary.utils
from typing import Optional

logger = logging.getLogger(__name__)

# Initialize Cloudinary
def init_cloudinary():
    """Initialize Cloudinary with environment variables"""
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    api_key = os.environ.get("CLOUDINARY_API_KEY")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    
    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        logger.info(f"Cloudinary configured: {cloud_name}")
        return True
    else:
        logger.warning("Cloudinary not configured - missing credentials")
        return False

# Check if Cloudinary is available
CLOUDINARY_ENABLED = init_cloudinary()

def is_cloudinary_enabled():
    return CLOUDINARY_ENABLED

def generate_upload_signature(folder: str = "posts", resource_type: str = "image"):
    """Generate a signed upload signature for frontend direct upload"""
    if not CLOUDINARY_ENABLED:
        return None
    
    # Validate folder
    allowed_folders = ("posts/", "users/", "stories/", "messages/")
    if not folder.endswith("/"):
        folder = folder + "/"
    
    if not any(folder.startswith(f) for f in allowed_folders):
        folder = "posts/"
    
    timestamp = int(time.time())
    
    params = {
        "timestamp": timestamp,
        "folder": folder.rstrip("/"),
    }
    
    signature = cloudinary.utils.api_sign_request(
        params,
        os.environ.get("CLOUDINARY_API_SECRET")
    )
    
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder.rstrip("/"),
        "resource_type": resource_type
    }

async def upload_image(file_data, folder: str = "posts", public_id: Optional[str] = None):
    """Upload image directly from backend (for admin/automation) - Optimized for 5000+ users"""
    if not CLOUDINARY_ENABLED:
        return {"error": "Cloudinary not configured"}
    
    try:
        options = {
            "folder": folder,
            "resource_type": "image",
            "overwrite": True,
            "transformation": [
                {"quality": "auto:good", "fetch_format": "auto", "flags": "progressive"}
            ],
            "eager": [  # Pre-generate optimized versions
                {"width": 400, "height": 400, "crop": "fill", "quality": "auto:low"},  # Thumbnail
                {"width": 800, "quality": "auto:good"},  # Medium
            ],
            "eager_async": True  # Generate in background for performance
        }
        
        if public_id:
            options["public_id"] = public_id
        
        result = cloudinary.uploader.upload(file_data, **options)
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format")
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return {"error": str(e)}

async def upload_video(file_data, folder: str = "posts", public_id: Optional[str] = None):
    """Upload video directly from backend"""
    if not CLOUDINARY_ENABLED:
        return {"error": "Cloudinary not configured"}
    
    try:
        options = {
            "folder": folder,
            "resource_type": "video",
            "overwrite": True,
        }
        
        if public_id:
            options["public_id"] = public_id
        
        result = cloudinary.uploader.upload(file_data, **options)
        
        return {
            "success": True,
            "url": result["secure_url"],
            "public_id": result["public_id"],
            "duration": result.get("duration"),
            "format": result.get("format")
        }
    except Exception as e:
        logger.error(f"Cloudinary video upload error: {e}")
        return {"error": str(e)}

def delete_asset(public_id: str, resource_type: str = "image"):
    """Delete an asset from Cloudinary"""
    if not CLOUDINARY_ENABLED:
        return {"error": "Cloudinary not configured"}
    
    try:
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True
        )
        return {"success": result.get("result") == "ok"}
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        return {"error": str(e)}

def get_optimized_url(public_id: str, width: int = None, height: int = None, crop: str = "fill"):
    """Get optimized CDN URL for an image"""
    if not CLOUDINARY_ENABLED:
        return None
    
    transformations = ["q_auto", "f_auto"]
    
    if width:
        transformations.append(f"w_{width}")
    if height:
        transformations.append(f"h_{height}")
    if crop:
        transformations.append(f"c_{crop}")
    
    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME")
    transform_str = ",".join(transformations)
    
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/{transform_str}/{public_id}"
