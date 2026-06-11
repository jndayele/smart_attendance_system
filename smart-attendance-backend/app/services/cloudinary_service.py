import cloudinary
import cloudinary.uploader
from app.config import get_settings

settings = get_settings()

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

async def upload_image(file_bytes: bytes, folder: str = "institution_logos", 
                       public_id: str = None) -> str:
    """Upload image bytes to Cloudinary and return the secure URL."""
    result = cloudinary.uploader.upload(
        file_bytes,
        folder=folder,
        public_id=public_id,
        overwrite=True,
        resource_type="image"
    )
    return result["secure_url"]

async def delete_image(public_id: str) -> bool:
    """Delete an image from Cloudinary by public_id."""
    result = cloudinary.uploader.destroy(public_id)
    return result.get("result") == "ok"
