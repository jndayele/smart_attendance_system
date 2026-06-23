import asyncio
import concurrent.futures
import numpy as np
import cv2
import logging
from typing import List, Dict, Any, Optional
from deepface import DeepFace

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# ─── Dedicated thread-pool for CPU-bound DeepFace inference ──────────────────
# Uses max_workers=None which defaults to min(32, os.cpu_count() + 4).
# Keeping it separate from the default loop executor avoids starving I/O tasks.
_FACE_EXECUTOR = concurrent.futures.ThreadPoolExecutor(
    max_workers=4, thread_name_prefix="deepface"
)

def _run_in_face_executor(fn):
    """Helper: schedule a synchronous callable on the face thread-pool and await it."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(_FACE_EXECUTOR, fn)

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
    def _extract_face_encoding_sync(img: np.ndarray) -> List[float]:
        """
        Synchronous (blocking) extraction — runs inside thread-pool only.
        Do NOT call directly from an async context.
        """
        try:
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
            return results[0]["embedding"]
        except ValueError as e:
            if "Face could not be detected" in str(e):
                raise ValueError("No face detected in the image.")
            raise
        except Exception as e:
            logger.error(f"Error extracting face encoding: {str(e)}")
            raise ValueError(f"Face processing failed: {str(e)}")

    @staticmethod
    def extract_face_encoding(image_bytes: bytes) -> List[float]:
        """
        SYNCHRONOUS version — kept for backwards compatibility with Celery tasks
        (Celery workers run in a regular thread, not inside an async event loop).
        """
        img = FaceService._bytes_to_image(image_bytes)
        return FaceService._extract_face_encoding_sync(img)

    @staticmethod
    async def extract_face_encoding_async(image_bytes: bytes) -> List[float]:
        """
        ASYNC version — offloads to thread-pool so the event loop is never blocked.
        Use this from FastAPI route handlers.
        """
        img = FaceService._bytes_to_image(image_bytes)
        return await _run_in_face_executor(
            lambda: FaceService._extract_face_encoding_sync(img)
        )

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
        Runs in the face thread-pool so startup doesn't block the event loop.
        """
        try:
            logger.info(f"Preloading DeepFace model: {settings.FACE_MODEL}")
            # Submit to the dedicated executor so it's warm and ready
            future = _FACE_EXECUTOR.submit(DeepFace.build_model, settings.FACE_MODEL)
            future.result()  # block startup until model is ready
            logger.info("Face model preloaded successfully.")
        except Exception as e:
            logger.warning(f"Failed to preload face model: {str(e)}. It will be loaded on first use.")

    @staticmethod
    def _validate_photo_requirements_sync(image_bytes: bytes) -> Dict[str, Any]:
        """Synchronous implementation — runs inside thread-pool only."""
        try:
            img = FaceService._bytes_to_image(image_bytes)
            if img is None:
                return {"valid": False, "error": "Invalid image file format or corrupted image."}
        except Exception as e:
            return {"valid": False, "error": f"Could not read image: {str(e)}"}

        # Check resolution
        height, width = img.shape[:2]
        if height < 300 or width < 300:
            return {
                "valid": False,
                "error": f"Image resolution too low ({width}x{height}). Minimum required is 300x300."
            }

        try:
            results = DeepFace.extract_faces(
                img_path=img,
                detector_backend=settings.FACE_DETECTOR,
                enforce_detection=True
            )
        except ValueError as e:
            msg = str(e)
            if "Face could not be detected" in msg or "face" in msg.lower():
                return {"valid": False, "error": "No face detected in the image. Please ensure you are in a well-lit area and looking directly at the camera."}
            return {"valid": False, "error": f"Face validation failed: {msg}"}
        except Exception as e:
            return {"valid": False, "error": f"Face processing error: {str(e)}"}

        if len(results) == 0:
            return {"valid": False, "error": "No face detected in the image. Please ensure you are in a well-lit area and looking directly at the camera."}
        if len(results) > 1:
            return {"valid": False, "error": "Multiple faces detected. Please provide an image with exactly one face."}

        face_area = results[0].get("facial_area", {})
        face_width = face_area.get("w", 0)
        face_height = face_area.get("h", 0)
        if face_width < 100 or face_height < 100:
            return {"valid": False, "error": "Face is too small in the frame. Please get closer to the camera."}

        return {"valid": True, "error": None}

    @staticmethod
    def validate_photo_requirements(image_bytes: bytes) -> Dict[str, Any]:
        """
        SYNCHRONOUS version — kept for Celery tasks.
        Validate image requirements (resolution, single face, etc).
        Returns: { "valid": bool, "error": str | None }
        """
        return FaceService._validate_photo_requirements_sync(image_bytes)

    @staticmethod
    async def validate_photo_requirements_async(image_bytes: bytes) -> Dict[str, Any]:
        """
        ASYNC version — offloads DeepFace to thread-pool.
        Use this from FastAPI route handlers.
        """
        return await _run_in_face_executor(
            lambda: FaceService._validate_photo_requirements_sync(image_bytes)
        )

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
    def _verify_face_from_encoding_sync(
        img: np.ndarray,
        stored_encoding: List[float]
    ) -> Dict[str, Any]:
        """
        Synchronous implementation — runs inside thread-pool only.
        Do NOT call directly from an async context.
        """
        try:
            if settings.LIVENESS_DETECTION_ENABLED:
                try:
                    face_objs = DeepFace.extract_faces(img_path=img, enforce_detection=True, anti_spoofing=True)
                    if len(face_objs) == 0:
                        raise ValueError("No face detected in the live image.")
                    is_real = face_objs[0].get("is_real")
                    if is_real is False:
                        return {
                            "verified": False,
                            "distance": 1.0,
                            "confidence": 0.0,
                            "threshold_distance": 1.0 - (settings.FACE_CONFIDENCE_THRESHOLD / 100.0),
                            "threshold_confidence": settings.FACE_CONFIDENCE_THRESHOLD,
                            "liveness_failed": True
                        }
                except ValueError as e:
                    if "Face could not be detected" in str(e):
                        raise ValueError("No face detected in the live image.")
                    if "spoof" in str(e).lower():
                        return {
                            "verified": False,
                            "distance": 1.0,
                            "confidence": 0.0,
                            "threshold_distance": 1.0 - (settings.FACE_CONFIDENCE_THRESHOLD / 100.0),
                            "threshold_confidence": settings.FACE_CONFIDENCE_THRESHOLD,
                            "liveness_failed": True
                        }
                    raise

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

            logger.info(
                f"[FaceVerify] distance={cosine_distance:.4f}, confidence={confidence:.2f}%, "
                f"threshold_distance={threshold_distance:.4f}, verified={verified}"
            )

            return {
                "verified": bool(verified),
                "distance": round(float(cosine_distance), 4),
                "confidence": round(float(confidence), 2),
                "threshold_distance": float(threshold_distance),
                "threshold_confidence": settings.FACE_CONFIDENCE_THRESHOLD
            }

        except ValueError as e:
            if "Face could not be detected" in str(e):
                raise ValueError("No face detected in the live image. Please ensure you are in a well-lit area and looking directly at the camera.")
            raise

    @staticmethod
    def verify_face_from_encoding(
        live_image_bytes: bytes,
        stored_encoding: List[float]
    ) -> Dict[str, Any]:
        """
        SYNCHRONOUS version — kept for Celery tasks.
        Primary function for attendance endpoints to verify face encoding.
        """
        img = FaceService._bytes_to_image(live_image_bytes)
        return FaceService._verify_face_from_encoding_sync(img, stored_encoding)

    @staticmethod
    async def verify_face_from_encoding_async(
        live_image_bytes: bytes,
        stored_encoding: List[float]
    ) -> Dict[str, Any]:
        """
        ASYNC version — offloads DeepFace inference to thread-pool.
        Use this from FastAPI route handlers to avoid blocking the event loop.
        """
        img = FaceService._bytes_to_image(live_image_bytes)
        return await _run_in_face_executor(
            lambda: FaceService._verify_face_from_encoding_sync(img, stored_encoding)
        )

    @classmethod
    async def check_duplicate_face(cls, db, live_encoding: List[float], exclude_student_id=None) -> None:
        """
        Queries all existing face encodings and ensures this face isn't already registered.
        Raises ValueError if a duplicate is found.

        NOTE: This is an O(N) Python loop over all registered students.
        When pgvector is enabled (after the vector migration), this will be replaced
        by a single SQL ANN query: ORDER BY face_vector <=> $1 LIMIT 1.
        For now the comparison runs in the dedicated face thread-pool so the event
        loop is not blocked.
        """
        from app.models.student import Student
        from sqlalchemy.future import select

        query = select(Student.id, Student.name, Student.face_encoding).where(
            Student.face_registered == True
        )
        if exclude_student_id:
            query = query.where(Student.id != exclude_student_id)

        result = await db.execute(query)
        students = result.all()

        threshold_distance = 1.0 - (settings.FACE_CONFIDENCE_THRESHOLD / 100.0)
        live_vec = np.array(live_encoding)

        def _compare_all():
            for st_id, st_name, stored_encoding in students:
                if not stored_encoding:
                    continue
                distance = cls._cosine_distance(live_vec.tolist(), stored_encoding)
                if distance <= threshold_distance:
                    return st_name
            return None

        duplicate_name = await _run_in_face_executor(_compare_all)
        if duplicate_name:
            raise ValueError(f"Face is already registered to another student ({duplicate_name}).")

