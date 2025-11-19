"""
Statistics API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from Backend.database.db import get_db
from Backend.database import crud

router = APIRouter()


@router.get("/overview")
async def get_overview_stats_endpoint(db: Session = Depends(get_db)):
    """Get overview statistics"""
    try:
        stats = crud.get_overview_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.get("/timeline")
async def get_timeline_stats_endpoint(days: int = 7, db: Session = Depends(get_db)):
    """Get detection timeline"""
    try:
        timeline = crud.get_timeline_stats(db, days)
        return {"timeline": timeline, "days": days}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get timeline: {str(e)}")