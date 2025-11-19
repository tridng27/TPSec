"""
Detections API routes
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Optional
from Backend.database.db import get_db
from Backend.database import crud
from pydantic import BaseModel

router = APIRouter()


class WhitelistRequest(BaseModel):
    file_path: Optional[str] = None
    sha256: Optional[str] = None
    reason: Optional[str] = None


@router.get("/")
async def get_detections_endpoint(
    limit: int = 50,
    offset: int = 0,
    detection_type: str = "all",
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get detections with filters"""
    try:
        result = crud.get_detections(db, limit, offset, detection_type, action)
        
        # Format response
        detections = []
        for d in result["detections"]:
            detections.append({
                "id": d.id,
                "scan_id": d.scan_id,
                "detection_type": d.detection_type,
                "event_type": d.event_type,
                "file_path": d.file_path,
                "file_name": d.file_name,
                "file_size": d.file_size,
                "sha256": d.sha256,
                "ml_score": d.ml_score,
                "action": d.action,
                "detection_reason": d.detection_reason,
                "error": d.error,
                "scanned_at": d.scanned_at.isoformat()
            })
        
        return {
            "total": result["total"],
            "limit": limit,
            "offset": offset,
            "detections": detections
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detections: {str(e)}")


@router.get("/malicious")
async def get_malicious_detections(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get only malicious detections"""
    try:
        detections = crud.get_malicious_detections(db, limit)
        
        return {
            "total": len(detections),
            "detections": [
                {
                    "id": d.id,
                    "detection_type": d.detection_type,
                    "file_path": d.file_path,
                    "file_name": d.file_name,
                    "ml_score": d.ml_score,
                    "action": d.action,
                    "detection_reason": d.detection_reason,
                    "scanned_at": d.scanned_at.isoformat()
                }
                for d in detections
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get malicious detections: {str(e)}")


@router.delete("/{detection_id}")
async def delete_detection_endpoint(detection_id: int, db: Session = Depends(get_db)):
    """Delete a detection record"""
    try:
        success = crud.delete_detection(db, detection_id)
        if not success:
            raise HTTPException(status_code=404, detail="Detection not found")
        return {"message": "Detection removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete detection: {str(e)}")


@router.get("/whitelist")
async def get_whitelist_endpoint(db: Session = Depends(get_db)):
    """Get whitelist"""
    try:
        whitelist = crud.get_whitelist(db)
        return {
            "whitelist": [
                {
                    "id": w.id,
                    "file_path": w.file_path,
                    "sha256": w.sha256,
                    "reason": w.reason,
                    "added_at": w.added_at.isoformat()
                }
                for w in whitelist
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get whitelist: {str(e)}")


@router.post("/whitelist")
async def add_to_whitelist_endpoint(
    request: WhitelistRequest,
    db: Session = Depends(get_db)
):
    """Add file to whitelist"""
    try:
        whitelist = crud.add_to_whitelist(
            db,
            request.file_path,
            request.sha256,
            request.reason
        )
        return {
            "message": "File added to whitelist",
            "id": whitelist.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add to whitelist: {str(e)}")


@router.delete("/whitelist/{whitelist_id}")
async def remove_from_whitelist_endpoint(
    whitelist_id: int,
    db: Session = Depends(get_db)
):
    """Remove file from whitelist"""
    try:
        success = crud.remove_from_whitelist(db, whitelist_id)
        if not success:
            raise HTTPException(status_code=404, detail="Whitelist entry not found")
        return {"message": "File removed from whitelist"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove from whitelist: {str(e)}")