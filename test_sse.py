#!/usr/bin/env python3
"""
Simple test script to simulate attendance marking and trigger the real-time broadcast.
This helps debug the SSE real-time update flow without requiring face recognition.

Usage:
    python test_sse.py <session_id> <student_id> <student_name> <enrollment_no>

Example:
    python test_sse.py 3079513f-0191-41f7-a3ff-cf7eacc08535 abc123 "John Doe" STU001
"""

import asyncio
import json
import sys
from sqlalchemy.orm import Session
from backend.db import SessionLocal
from backend.routers.attendance import broadcast_attendance_record
from backend.models import AttendanceRecord


async def simulate_attendance(session_id: str, student_id: str, name: str, enrollment_no: str):
    """Simulate attendance marking by broadcasting a test record."""
    payload = {
        "id": "test-id-123",
        "session_id": session_id,
        "student_id": student_id,
        "timestamp": "2026-03-15T16:40:00",
        "status": "PRESENT",
        "confidence": "0.95",
        "name": name,
        "enrollment_no": enrollment_no,
    }
    
    print(f"[TEST] Broadcasting attendance record: {json.dumps(payload, indent=2)}")
    await broadcast_attendance_record(session_id, payload)
    print("[TEST] Broadcast complete")


if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python test_sse.py <session_id> <student_id> <name> <enrollment_no>")
        print("\nExample:")
        print("  python test_sse.py 3079513f-0191-41f7-a3ff-cf7eacc08535 abc123 'John Doe' STU001")
        sys.exit(1)
    
    session_id = sys.argv[1]
    student_id = sys.argv[2]
    name = sys.argv[3]
    enrollment_no = sys.argv[4]
    
    print(f"[TEST] Simulating attendance marking:")
    print(f"[TEST]   Session ID: {session_id}")
    print(f"[TEST]   Student ID: {student_id}")
    print(f"[TEST]   Name: {name}")
    print(f"[TEST]   Enrollment: {enrollment_no}")
    print()
    
    asyncio.run(simulate_attendance(session_id, student_id, name, enrollment_no))
