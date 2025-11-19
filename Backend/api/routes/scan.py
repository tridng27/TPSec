"""
Batch scanning API routes
"""

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List
from Backend.services.batch_scan_service import start_batch_scan, get_scan_status
from Backend.database.db import get_db_context
from Backend.database import crud

router = APIRouter()


class ScanRequest(BaseModel):
    folders: List[str]


@router.post("/start")
async def start_scan(request: ScanRequest, background_tasks: BackgroundTasks):
    """Start a new batch scan"""
    try:
        # Run scan in background
        background_tasks.add_task(start_batch_scan, request.folders)
        
        # Return immediately with pending status
        return {
            "message": "Scan started successfully",
            "status": "starting",
            "folders": request.folders
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start scan: {str(e)}")


@router.get("/status/{scan_id}")
async def get_scan_status_endpoint(scan_id: int):
    """Get status of a specific scan"""
    status = get_scan_status(scan_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Scan not found")
    return status


@router.get("/status")
async def get_current_scan_status():
    """Get status of current/latest scan"""
    return get_scan_status()


@router.get("/latest")
async def get_latest_scan_endpoint():
    """Get the most recent scan"""
    with get_db_context() as db:
        scan = crud.get_latest_scan(db)
        if not scan:
            raise HTTPException(status_code=404, detail="No scans found")
        
        progress = 0
        if scan.total_files > 0:
            progress = (scan.scanned_files / scan.total_files) * 100
        
        return {
            "scan_id": scan.id,
            "status": scan.status,
            "scan_date": scan.scan_date.isoformat(),
            "total_files": scan.total_files,
            "scanned_files": scan.scanned_files,
            "malicious_count": scan.malicious_count,
            "clean_count": scan.clean_count,
            "scan_duration": scan.scan_duration,
            "progress": round(progress, 2)
        }