import numpy as np
import cv2
import logging
from typing import List, Dict, Any, Optional
from deepface import DeepFace

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

class FaceService:
    @staticmethod
    def _bytes_to_image(image_bytes: bytes) -> np.ndarray:
        """Convert raw image bytes to OpenCV numpy array."""
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image bytes.")
        return img

    @staticmethod
    def extract_face_encoding(image_bytes: bytes) -> List[float]:
        """
        Extract a 512-dimensional float vector representing the face using DeepFace.
        Raises ValueError if no face is detected or if multiple faces are detected.
        """
        img = FaceService._bytes_to_image(image_bytes)
        
        try:
            # We enforce detection to ensure a face is present
            results = DeepFace.represent(
                img_path=img,
                model_name=settings.FACE_MODEL,
                detector_backend=settings.FACE_DETECTOR,
                enforce_detection=True
            )
            
            if len(results) == 0:
                raise ValueError("No face detected in the image.")
            
            if len(results) > 1:
                raise ValueError("Multiple faces detected. Please provide an image with exactly one face.")
            
            encoding = results[0]["embedding"]
            return encoding
            
        except ValueError as e:
            # DeepFace raises ValueError if enforce_detection=True and no face is found
            if "Face could not be detected" in str(e):
                raise ValueError("No face detected in the image.")
            raise e
        except Exception as e:
            logger.error(f"Error extracting face encoding: {str(e)}")
            raise ValueError(f"Face processing failed: {str(e)}")

    @staticmethod
    def _cosine_distance(a: List[float], b: List[float]) -> float:
        """Calculate cosine distance between two vectors."""
        vec_a = np.array(a)
        vec_b = np.array(b)
        
        dot_product = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        if norm_a == 0 or norm_b == 0:
            return 1.0
            
        cosine_similarity = dot_product / (norm_a * norm_b)
        # DeepFace calculates cosine distance as 1 - cosine_similarity
        return 1.0 - cosine_similarity

    @staticmethod
    def verify_face(live_image_bytes: bytes, stored_encoding: List[float]) -> Dict[str, Any]:
        """
        Verify a live image against a stored encoding.
        Returns a dict with verification status and confidence.
        """
        live_encoding = FaceService.extract_face_encoding(live_image_bytes)
        
        if settings.FACE_DISTANCE_METRIC.lower() == "cosine":
            distance = FaceService._cosine_distance(live_encoding, stored_encoding)
            
            # DeepFace threshold for ArcFace using cosine distance is typically around 0.68
            # But the PRD states threshold < 0.30 for match, equivalent to ~80% confidence
            # Let's calculate a custom confidence score based on the distance.
            
            # Convert confidence threshold (e.g., 80) to distance threshold (e.g., 0.20)
            # Actually, the user says:
            # "For ArcFace cosine: threshold for match is distance < 0.30 (equivalent to ~80% confidence)"
            
            # This logic: distance 0 is 100%, distance 1 is 0% (if we only consider positive similarity)
            # Or confidence = (1 - distance) * 100
            
            confidence = (1.0 - distance) * 100
            threshold = float(settings.FACE_CONFIDENCE_THRESHOLD)
            
            # The PRD mentions distance < 0.30 is match. 1 - 0.30 = 0.70 * 100 = 70%.
            # Let's stick to using the configured FACE_CONFIDENCE_THRESHOLD
            
            is_verified = confidence >= threshold
            
            return {
                "verified": bool(is_verified),
                "distance": float(distance),
                "confidence": float(confidence),
                "threshold": float(threshold)
            }
        else:
            raise NotImplementedError(f"Distance metric {settings.FACE_DISTANCE_METRIC} is not implemented here.")

    @staticmethod
    def preload_model() -> None:
        """
        Download and cache model weights on server startup.
        Prevents the first student registration from being slow.
        """
        try:
            logger.info(f"Preloading DeepFace model: {settings.FACE_MODEL}")
            DeepFace.build_model(settings.FACE_MODEL)
            logger.info("Face model preloaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to preload face model: {str(e)}. It will be loaded on first use.")

    @staticmethod
    def validate_photo_requirements(image_bytes: bytes) -> Dict[str, Any]:
        """
        Validate image requirements (resolution, single face, etc).
        Returns: { "valid": bool, "error": str | None }
        """
        try:
            img = FaceService._bytes_to_image(image_bytes)
            
            # Check resolution
            height, width = img.shape[:2]
            if height < 300 or width < 300:
                return {"valid": False, "error": f"Image resolution too low ({width}x{height}). Minimum required is 300x300."}
                
            # Use OpenCV Haar Cascades for a quick face check before heavy DeepFace processing
            # Or just use DeepFace represent to ensure exactly one face is detectable
            
            try:
                results = DeepFace.extract_faces(
                    img_path=img,
                    detector_backend=settings.FACE_DETECTOR,
                    enforce_detection=True
                )
                
                if len(results) == 0:
                    return {"valid": False, "error": "No face detected in the image."}
                elif len(results) > 1:
                    return {"valid": False, "error": "Multiple faces detected. Please provide an image with exactly one face."}
                    
                # Additional checks could be added here (brightness, size relative to frame, etc.)
                face_area = results[0]["facial_area"]
                face_width = face_area["w"]
                face_height = face_area["h"]
                
                if face_width < 100 or face_height < 100:
                    return {"valid": False, "error": "Face is too small in the frame. Please get closer to the camera."}
                    
                return {"valid": True, "error": None}
                
            except ValueError as e:
                if "Face could not be detected" in str(e):
                    return {"valid": False, "error": "No face detected in the image."}
                return {"valid": False, "error": str(e)}
                
        except Exception as e:
            return {"valid": False, "error": f"Failed to process image: {str(e)}"}

    @staticmethod
    def compute_sessions_needed(
        sessions_present: int,
        sessions_total: int,
        threshold_pct: int
    ) -> int:
        """
        Computes how many consecutive sessions a student needs to attend to reach the threshold.
        """
        import math
        required = threshold_pct / 100.0
        if sessions_total == 0:
            return 0
        current = sessions_present / sessions_total
        if current >= required:
            return 0
        
        # (p + x) / (t + x) >= r
        # p + x >= r*t + r*x
        # x(1 - r) >= r*t - p
        # x >= (r*t - p) / (1 - r)
        
        if required >= 1.0:
            # If 100% attendance is required and they missed any, they can never reach 100% technically 
            # unless they can rewrite history, but mathematically it's infinite. Just return a big number.
            return 999
            
        x = math.ceil((required * sessions_total - sessions_present) / (1 - required))
        return max(0, int(x))

    @staticmethod
    def verify_face_from_encoding(
        live_image_bytes: bytes,
        stored_encoding: List[float]
    ) -> Dict[str, Any]:
        """
        Primary function for attendance endpoints to verify face encoding.
        """
        img = FaceService._bytes_to_image(live_image_bytes)
        
        try:
            results = DeepFace.represent(
                img_path=img,
                model_name=settings.FACE_MODEL,
                detector_backend=settings.FACE_DETECTOR,
                enforce_detection=True,
                align=True
            )
            
            if len(results) == 0:
                raise ValueError("No face detected in the image.")
            
            live_encoding = results[0]["embedding"]
            
            vec_a = np.array(live_encoding)
            vec_b = np.array(stored_encoding)
            
            dot_product = np.dot(vec_a, vec_b)
            norm_a = np.linalg.norm(vec_a)
            norm_b = np.linalg.norm(vec_b)
            
            if norm_a == 0 or norm_b == 0:
                cosine_distance = 1.0
            else:
                cosine_distance = 1.0 - (dot_product / (norm_a * norm_b))
                
            threshold_distance = 1.0 - (settings.FACE_CONFIDENCE_THRESHOLD / 100.0)
            verified = cosine_distance <= threshold_distance
            confidence = (1.0 - cosine_distance) * 100.0
            
            return {
                "verified": bool(verified),
                "distance": round(float(cosine_distance), 4),
                "confidence": round(float(confidence), 2),
                "threshold_distance": float(threshold_distance),
                "threshold_confidence": settings.FACE_CONFIDENCE_THRESHOLD
            }
            
        except ValueError as e:
            if "Face could not be detected" in str(e):
                raise ValueError("No face detected in the live image.")
            raise e
