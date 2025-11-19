"""
Real-time protection API routes
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from Backend.services.realtime_service import (
    start_realtime_protection,
    stop_realtime_protection,
    get_protection_status
)

router = APIRouter()


class ProtectionStartRequest(BaseModel):
    folders: Optional[List[str]] = None


@router.post("/start")
async def start_protection(request: ProtectionStartRequest = None):
    """Start real-time protection"""
    try:
        folders = request.folders if request else None
        result = start_realtime_protection(folders)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start protection: {str(e)}")


@router.post("/stop")
async def stop_protection():
    """Stop real-time protection"""
    try:
        result = stop_realtime_protection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop protection: {str(e)}")


@router.get("/status")
async def get_status():
    """Get real-time protection status"""
    try:
        status = get_protection_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")