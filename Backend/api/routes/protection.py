"""
Real-time protection API routes
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Optional
from Backend.services.realtime_service import (
    start_realtime_protection,
    stop_realtime_protection,
    get_protection_status,
    get_recent_events,
    get_event_statistics,
    register_event_callback,
    unregister_event_callback
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
    """Get real-time protection status with activity statistics"""
    try:
        status = get_protection_status()
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/events/recent")
async def get_recent_events_endpoint(limit: int = 50):
    """Get recent file system events observed by Watchdog"""
    try:
        events = get_recent_events(limit)
        return {
            "total": len(events),
            "events": events
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get events: {str(e)}")


@router.get("/events/statistics")
async def get_event_stats():
    """Get file system event statistics"""
    try:
        stats = get_event_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get statistics: {str(e)}")


@router.websocket("/events/stream")
async def websocket_file_events(websocket: WebSocket):
    """WebSocket endpoint for real-time file system event streaming"""
    await websocket.accept()
    
    # Callback to send ALL file events to this WebSocket client
    async def send_event(event_data):
        try:
            await websocket.send_json(event_data)
        except:
            pass
    
    # Register callback
    register_event_callback(send_event)
    
    try:
        # Keep connection alive
        while True:
            # Wait for messages from client (ping/pong)
            data = await websocket.receive_text()
            
            # Echo back to confirm connection
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        print("[WebSocket] File events client disconnected")
    finally:
        # Unregister callback when client disconnects
        unregister_event_callback(send_event)