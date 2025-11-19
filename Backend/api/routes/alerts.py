"""
Real-time alerts API routes (WebSocket support)
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from Backend.database.db import get_db
from Backend.database import crud
from Backend.services.realtime_service import register_alert_callback, unregister_alert_callback
import json

router = APIRouter()


@router.get("/recent")
async def get_recent_alerts(limit: int = 20, db: Session = Depends(get_db)):
    """Get recent real-time alerts"""
    try:
        alerts = crud.get_recent_alerts(db, limit)
        return {
            "alerts": [
                {
                    "id": a.id,
                    "file_path": a.file_path,
                    "file_name": a.file_name,
                    "ml_score": a.ml_score,
                    "action": a.action,
                    "detection_reason": a.detection_reason,
                    "event_type": a.event_type,
                    "scanned_at": a.scanned_at.isoformat()
                }
                for a in alerts
            ]
        }
    except Exception as e:
        return {"error": str(e), "alerts": []}


@router.websocket("/stream")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alert streaming"""
    await websocket.accept()
    
    # Callback to send alerts to this WebSocket client
    async def send_alert(alert_data):
        try:
            await websocket.send_json(alert_data)
        except:
            pass
    
    # Register callback
    register_alert_callback(send_alert)
    
    try:
        # Keep connection alive
        while True:
            # Wait for messages from client (ping/pong)
            data = await websocket.receive_text()
            
            # Echo back to confirm connection
            if data == "ping":
                await websocket.send_text("pong")
    
    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected")
    finally:
        # Unregister callback when client disconnects
        unregister_alert_callback(send_alert)