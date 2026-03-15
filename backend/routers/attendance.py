# backend/routers/attendance.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import csv
import asyncio
import json

from ..deps import get_db
from ..models import AttendanceRecord

router = APIRouter(prefix="/api/attendance", tags=["attendance"])

# ==================== Real-time SSE Broadcasting ====================
# In-memory registry: {session_id: [asyncio.Queue, ...]}
_attendance_subscribers: dict[str, list[asyncio.Queue]] = {}

async def broadcast_attendance_record(session_id: str, record: dict):
    """
    Broadcast an attendance record to all connected clients for a session.
    Called after a student marks attendance in the kiosk.
    """
    print(f"[BROADCAST] Starting broadcast for session {session_id}")
    print(f"[BROADCAST] Active sessions: {list(_attendance_subscribers.keys())}")
    print(f"[BROADCAST] Subscribers for session: {len(_attendance_subscribers.get(session_id, []))}")
    
    if session_id not in _attendance_subscribers:
        print(f"[BROADCAST] No subscribers for session {session_id}, aborting broadcast")
        return
    
    # Format as SSE event
    event_data = json.dumps(record)
    sse_event = f"data: {event_data}\n\n"
    
    print(f"[BROADCAST] Sending event to {len(_attendance_subscribers[session_id])} clients")
    
    # Send to all connected clients for this session
    for i, queue in enumerate(_attendance_subscribers[session_id]):
        try:
            await queue.put(sse_event)
            print(f"[BROADCAST] Event sent to client {i} successfully")
        except asyncio.QueueFull:
            print(f"[BROADCAST] Client {i} queue is full, skipping")
        except Exception as e:
            print(f"[BROADCAST] Error sending to client {i}: {e}")
    
    print(f"[BROADCAST] Broadcast complete for session {session_id}")

# ========================================================================


@router.get("")
def list_attendance(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(AttendanceRecord)
    if session_id:
        q = q.filter(AttendanceRecord.session_id == session_id)

    rows = q.all()
    return [
        {
            "id": str(r.id),
            "session_id": str(r.session_id),
            "student_id": str(r.student_id),
            "timestamp": r.timestamp,
            "status": r.status,
            "confidence": r.confidence,
        }
        for r in rows
    ]


@router.get("/export")
def export_attendance(session_id: str, db: Session = Depends(get_db)):
    rows = db.query(AttendanceRecord).filter_by(session_id=session_id).all()

    def iter_csv():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["student_id", "timestamp", "status", "confidence"])
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)
        for r in rows:
            writer.writerow(
                [
                    str(r.student_id),
                    r.timestamp.isoformat(),
                    r.status,
                    r.confidence,
                ]
            )
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"
        },
    )


@router.get("/stream/{session_id}")
async def stream_attendance(session_id: str):
    """
    SSE endpoint for real-time attendance updates.
    Faculty dashboard connects here and receives instant updates when students mark attendance.
    """
    
    async def event_generator():
        # Create a queue for this client
        queue: asyncio.Queue = asyncio.Queue(maxsize=100)
        
        # Register this client
        if session_id not in _attendance_subscribers:
            _attendance_subscribers[session_id] = []
        _attendance_subscribers[session_id].append(queue)
        
        print(f"[EVENT_GEN] Client connected to session {session_id}, total subscribers: {len(_attendance_subscribers[session_id])}")
        
        try:
            # Send initial connection confirmation
            yield 'data: {"type":"connected","message":"Listening for attendance updates"}\n\n'
            print(f"[EVENT_GEN] Sent connection confirmation to client")
            
            # Yield events as they arrive
            while True:
                try:
                    # Get event with 60 second timeout
                    event_data = await asyncio.wait_for(queue.get(), timeout=60.0)
                    print(f"[EVENT_GEN] Got event from queue for session {session_id}, yielding: {event_data[:100]}...")
                    yield event_data
                except asyncio.TimeoutError:
                    # Send keep-alive every 60 seconds
                    print(f"[EVENT_GEN] Sending keep-alive for session {session_id}")
                    yield ": keep-alive\n\n"
                    
        except asyncio.CancelledError:
            print(f"[EVENT_GEN] Client cancelled for session {session_id}")
        except Exception as e:
            print(f"[EVENT_GEN] Exception in event generator: {e}")
        finally:
            # Clean up
            try:
                _attendance_subscribers[session_id].remove(queue)
                if not _attendance_subscribers[session_id]:
                    del _attendance_subscribers[session_id]
                print(f"[EVENT_GEN] Client cleaned up, remaining: {len(_attendance_subscribers.get(session_id, []))}")
            except (ValueError, KeyError):
                pass
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
