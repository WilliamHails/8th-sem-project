# backend/routers/subjects.py
from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from typing import List

from ..deps import get_db
from ..models import Subject
from ..schemas import SubjectOut

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("", response_model=List[SubjectOut])
def list_subjects(db: Session = Depends(get_db)):
    """List all subjects"""
    subjects = db.query(Subject).all()
    return subjects


@router.post("", response_model=SubjectOut)
def create_subject(
    name: str = Form(...),
    code: str = Form(...),
    db: Session = Depends(get_db),
):
    """Create a new subject"""
    # Check if subject with this code already exists
    existing = db.query(Subject).filter(Subject.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject = Subject(name=name, code=code)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectOut)
def get_subject(subject_id: str, db: Session = Depends(get_db)):
    """Get a specific subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.put("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: str,
    name: str = Form(...),
    code: str = Form(...),
    db: Session = Depends(get_db),
):
    """Update a subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Check if another subject has the same code
    existing = (
        db.query(Subject)
        .filter(Subject.code == code, Subject.id != subject_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")

    subject.name = name
    subject.code = code
    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}")
def delete_subject(subject_id: str, db: Session = Depends(get_db)):
    """Delete a subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}
