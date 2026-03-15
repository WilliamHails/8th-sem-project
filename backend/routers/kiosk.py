# backend/routers/kiosk.py
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import base64
import numpy as np
import asyncio

from ..deps import get_db
from ..models import (
    User,
    RoleEnum,
    FaceEmbedding,
    ClassSession,
    AttendanceRecord,
    CourseEnrollment,
)
from .. import face_service, config
from .attendance import broadcast_attendance_record

router = APIRouter(prefix="/api/kiosk", tags=["kiosk"])


@router.post("/mark-attendance")
async def kiosk_mark_attendance(
    session_id: str = Form(...),
    imageBase64: str = Form(...),
    db: Session = Depends(get_db),
):
    session = db.query(ClassSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    probe_path = config.PROBES_DIR / f"{session_id}_{ts}.jpg"

    try:
        face_service.save_probe_image_from_b64(imageBase64, probe_path)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid imageBase64 data (not valid base64 image)",
        )

    embedding, bbox = face_service.get_embedding_from_b64(imageBase64)
    if embedding is None:
        return JSONResponse({"status": "no_face"}, status_code=200)

    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()

    probe_vec = np.array(embedding)
    best = {"student_id": None, "score": -1.0, "name": None, "enrollment_no": None}
    for s in students:
        embs = db.query(FaceEmbedding).filter_by(user_id=s.id).all()
        if not embs:
            continue
        mat = np.array([e.embedding for e in embs])
        centroid = mat.mean(axis=0)
        denom = np.linalg.norm(centroid)
        if denom == 0:
            continue
        c_norm = centroid / denom
        score = float(np.dot(probe_vec, c_norm))
        if score > best["score"]:
            best = {
                "student_id": s.id,
                "score": score,
                "name": s.full_name,
                "enrollment_no": s.enrollment_no,
            }

    if best["student_id"] is None:
        return {"status": "no_embeddings"}

    if best["score"] >= config.MATCH_SIMILARITY_THRESHOLD:
        enrolled = (
            db.query(CourseEnrollment)
            .filter_by(user_id=best["student_id"], subject_id=session.subject_id)
            .first()
        )
        if not enrolled:
            return {
                "status": "not_enrolled",
                "student_id": str(best["student_id"]),
                "enrollment_no": best.get("enrollment_no"),
                "score": best["score"],
            }

        already = (
            db.query(AttendanceRecord)
            .filter_by(session_id=session_id, student_id=best["student_id"])
            .first()
        )
        if already:
            return {
                "status": "already_marked",
                "student_id": str(best["student_id"]),
                "score": best["score"],
            }

        att = AttendanceRecord(
            session_id=session_id,
            student_id=best["student_id"],
            status="PRESENT",
            confidence=str(best["score"]),
            image_path=str(probe_path),
        )
        db.add(att)
        db.commit()
        
        # Broadcast this attendance record to all connected faculty dashboard clients
        attendance_payload = {
            "id": str(att.id),
            "session_id": str(session_id),
            "student_id": str(best["student_id"]),
            "timestamp": att.timestamp.isoformat(),
            "status": "PRESENT",
            "confidence": str(best["score"]),
            "name": best["name"],
            "enrollment_no": best.get("enrollment_no"),
        }
        
        # Run broadcast in background (non-blocking)
        print(f"[KIOSK] Attendance marked for {best['name']}, broadcasting to session {session_id}")
        try:
            asyncio.create_task(broadcast_attendance_record(session_id, attendance_payload))
            print(f"[KIOSK] Broadcast task created for session {session_id}")
        except RuntimeError as e:
            # If no event loop, try to run it synchronously (shouldn't happen in async context)
            print(f"[KIOSK] Error creating broadcast task: {e}")
            pass
        
        return {
            "status": "matched",
            "student_id": str(best["student_id"]),
            "name": best["name"],
            "enrollment_no": best.get("enrollment_no"),
            "score": best["score"],
        }
    else:
        return {
            "status": "unresolved",
            "top_score": best["score"],
            "probes": str(probe_path),
        }

@router.post("/mark-attendance-multicam")
async def kiosk_mark_attendance_multicam(
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Enhanced multi-camera endpoint that supports dual-camera mode.
    - If frames from 2+ cameras: averages confidence scores per student across cameras
    - If frames from 1 camera: uses best match (backward compatible)
    
    This enables 3D-like recognition using both built-in and external cameras.
    """

    # 1) Validate session
    session = db.query(ClassSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    # 2) Load all students
    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()

    # 3) OPTIMIZATION: Batch load all embeddings at once instead of N+1 queries
    all_embeddings = db.query(FaceEmbedding).all()
    embeddings_by_user: dict[str, list] = {}
    for emb in all_embeddings:
        if emb.user_id not in embeddings_by_user:
            embeddings_by_user[emb.user_id] = []
        embeddings_by_user[emb.user_id].append(emb)

    # 4) Process files and group by camera
    camera_scores = {}  # {student_id: {camera_id: [scores]}}
    best_per_camera = {}  # {camera_id: {student_id: best_score, name, enrollment_no}}
    detected_cameras = set()
    probe_b64_per_camera = {}  # Store one b64 per camera for saving later

    for idx, uploaded in enumerate(files):
        content = await uploaded.read()
        if not content:
            continue

        # Estimate camera index from file naming (cam{N}_frame{M}.jpg)
        filename = uploaded.filename or f"file_{idx}"
        camera_id = 0  # default
        if "cam" in filename.lower():
            try:
                parts = filename.lower().split("cam")
                if len(parts) > 1:
                    cam_num = parts[1].split("_")[0]
                    camera_id = int(cam_num) - 1  # Convert from 1-indexed to 0-indexed
            except:
                camera_id = idx // 2  # Fallback: estimate from file order
        
        detected_cameras.add(camera_id)

        # Convert to base64 and get embedding
        b64_str = base64.b64encode(content).decode("utf-8")
        embedding, bbox = face_service.get_embedding_from_b64(b64_str)
        
        if embedding is None:
            continue

        probe_vec = np.array(embedding, dtype=np.float32)

        # Initialize camera score tracking if needed
        if camera_id not in best_per_camera:
            best_per_camera[camera_id] = {
                "student_id": None,
                "score": -1.0,
                "name": None,
                "enrollment_no": None,
            }
            probe_b64_per_camera[camera_id] = b64_str  # Store one b64 per camera

        # Find best match for this frame using pre-loaded embeddings
        for student in students:
            embs = embeddings_by_user.get(student.id, [])
            if not embs:
                continue

            mat = np.array([e.embedding for e in embs], dtype=np.float32)
            if mat.size == 0:
                continue

            centroid = mat.mean(axis=0)
            denom = np.linalg.norm(centroid)
            if denom == 0:
                continue

            centroid_norm = centroid / denom
            similarity = float(np.dot(probe_vec, centroid_norm))

            # Update best for this camera if better
            if similarity > best_per_camera[camera_id].get("score", -1.0):
                best_per_camera[camera_id].update({
                    "student_id": student.id,
                    "score": similarity,
                    "name": getattr(student, "full_name", None) or getattr(student, "name", None),
                    "enrollment_no": getattr(student, "enrollment_no", None),
                })

    # =========================================================================
    # MULTI-CAMERA LOGIC: Average scores across cameras
    # =========================================================================
    num_cameras = len(detected_cameras)
    
    if num_cameras == 0:
        return {"status": "no_face", "message": "No face detected in any frame"}

    best_student = None
    best_avg_score = -1.0
    best_info = None
    final_score = -1.0  # Initialize explicitly to avoid NameError

    if num_cameras >= 2:
        # DUAL-CAMERA MODE: Average scores across cameras
        print(f"[DEBUG] Processing {num_cameras} cameras with multi-camera averaging")
        
        student_scores = {}  # {student_id: [scores]}

        # Collect scores for each student across cameras
        for cam_id, cam_data in best_per_camera.items():
            if cam_data["student_id"] and cam_data["score"] > -1.0:
                sid = cam_data["student_id"]
                if sid not in student_scores:
                    student_scores[sid] = []
                student_scores[sid].append(cam_data["score"])

        # Compute average score per student
        for sid, scores in student_scores.items():
            if len(scores) > 0:
                avg_score = float(np.mean(scores))
                if avg_score > best_avg_score:
                    best_avg_score = avg_score
                    best_student = sid
                    # Get student info from camera
                    for cam_data in best_per_camera.values():
                        if cam_data["student_id"] == sid:
                            best_info = cam_data
                            break

        final_score = best_avg_score

    else:
        # SINGLE-CAMERA MODE: Use best match (backward compatible)
        print(f"[DEBUG] Single camera mode - using best match logic")
        
        best_cam_data = list(best_per_camera.values())[0] if best_per_camera else None
        if best_cam_data and best_cam_data["student_id"]:
            best_student = best_cam_data["student_id"]
            final_score = best_cam_data["score"]
            best_info = best_cam_data

    # =========================================================================
    # CRITICAL: Check confidence threshold BEFORE making attendance decisions
    # This prevents unrecognized faces from triggering "already marked" errors
    # =========================================================================
    if final_score < config.MATCH_SIMILARITY_THRESHOLD:
        if best_student is not None:
            return {
                "status": "unresolved",
                "message": f"Face confidence too low ({final_score:.3f} < {config.MATCH_SIMILARITY_THRESHOLD}). Please try again.",
                "score": final_score,
                "camera_count": num_cameras,
            }
        else:
            return {
                "status": "no_face",
                "message": "No face detected or confidence too low. Please try again.",
                "score": final_score,
                "camera_count": num_cameras,
            }

    # =========================================================================
    # DECISION MAKING (Only reached if threshold check passes)
    # =========================================================================
    if best_student is None:
        return {"status": "no_face", "message": "No face detected or recognized in any frame"}

    student = db.query(User).filter_by(id=best_student).first()
    if not student:
        return {"status": "unresolved", "message": "Could not determine student identity"}

    name = best_info.get("name") if best_info else None
    enr = best_info.get("enrollment_no") if best_info else None

    # Check enrollment
    enrolled = (
        db.query(CourseEnrollment)
        .filter_by(user_id=best_student, subject_id=session.subject_id)
        .first()
    )
    if not enrolled:
        return {
            "status": "not_enrolled",
            "student_id": str(best_student),
            "name": name,
            "enrollment_no": enr,
            "score": final_score,
            "camera_count": num_cameras,
        }

    # Check if already marked
    existing = (
        db.query(AttendanceRecord)
        .filter_by(session_id=session_id, student_id=best_student)
        .first()
    )
    if existing:
        return {
            "status": "already_marked",
            "student_id": str(best_student),
            "name": name,
            "enrollment_no": enr,
            "score": final_score,
            "camera_count": num_cameras,
        }

    # =========================================================================
    # MARK ATTENDANCE
    # =========================================================================
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    probe_path = config.PROBES_DIR / f"{session_id}_{ts}.jpg"
    
    # Save probe image from best camera
    if best_per_camera and best_info:
        for cam_id, cam_data in best_per_camera.items():
            if cam_data["student_id"] == best_student:
                # Found the camera that matched this student
                if cam_id in probe_b64_per_camera:
                    try:
                        face_service.save_probe_image_from_b64(probe_b64_per_camera[cam_id], probe_path)
                    except Exception as e:
                        print(f"[WARNING] Could not save probe image: {e}")
                break

    record = AttendanceRecord(
        session_id=session_id,
        student_id=best_student,
        status="PRESENT",
        confidence=str(final_score),
        image_path=str(probe_path),
    )
    db.add(record)
    db.commit()

    # Broadcast this attendance record to all connected faculty dashboard clients
    attendance_payload = {
        "id": str(record.id),
        "session_id": str(session_id),
        "student_id": str(best_student),
        "timestamp": record.timestamp.isoformat(),
        "status": "PRESENT",
        "confidence": str(final_score),
        "name": name,
        "enrollment_no": enr,
    }
    
    # Run broadcast in background (non-blocking)
    print(f"[KIOSK] Attendance marked for {name}, broadcasting to session {session_id}")
    try:
        asyncio.create_task(broadcast_attendance_record(session_id, attendance_payload))
        print(f"[KIOSK] Broadcast task created for session {session_id}")
    except RuntimeError as e:
        # If no event loop, try to run it synchronously (shouldn't happen in async context)
        print(f"[KIOSK] Error creating broadcast task: {e}")
        pass

    return {
        "status": "matched",
        "student_id": str(best_student),
        "name": name,
        "enrollment_no": enr,
        "score": final_score,
        "camera_count": num_cameras,
    }
