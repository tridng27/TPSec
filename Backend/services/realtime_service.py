"""
Real-time protection service - monitors file system for changes
"""

import os
import time
import threading
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileMovedEvent

from Backend.scanner.core import get_scanner
from Backend.database.db import get_db_context
from Backend.database import crud
from Backend.config.settings import DEFAULT_MONITORED_FOLDERS


# Service state
service_state = {
    "status": "stopped",
    "observers": [],
    "monitored_folders": [],
    "scan_cache": {},  # In-memory cache for quick checks
    "alert_callbacks": [],  # WebSocket callbacks for malicious alerts
    "event_callbacks": [],  # WebSocket callbacks for ALL file events
    "recent_events": [],  # Keep last 100 events in memory
    "event_counts": {  # Event statistics
        "created": 0,
        "modified": 0,
        "moved": 0,
        "deleted": 0,
        "scanned": 0,
        "malicious": 0
    }
}


class RealtimeProtectionHandler(FileSystemEventHandler):
    """File system event handler for real-time protection"""
    
    def __init__(self):
        self.scanner = get_scanner()
    
    def _add_event_to_history(self, event_type: str, path: str, action: str = None, ml_score: float = None):
        """Add event to recent history"""
        event_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "file_path": path,
            "file_name": os.path.basename(path),
            "action": action,
            "ml_score": ml_score
        }
        
        # Keep only last 100 events
        service_state["recent_events"].insert(0, event_data)
        if len(service_state["recent_events"]) > 100:
            service_state["recent_events"].pop()
        
        # Update counters
        service_state["event_counts"][event_type] = service_state["event_counts"].get(event_type, 0) + 1
        if action:
            service_state["event_counts"]["scanned"] += 1
            if action == "potential_malicious":
                service_state["event_counts"]["malicious"] += 1
        
        # Notify event stream listeners (for ALL events)
        event_stream_data = {
            "type": "file_event",
            "data": event_data
        }
        
        for callback in service_state["event_callbacks"]:
            try:
                callback(event_stream_data)
            except:
                pass
    
    def _scan_and_log(self, path: str, event_type: str):
        """Scan file and log to database"""
        if not os.path.isfile(path) or not self.scanner.is_pe_file(path):
            # Still log non-PE events to history (for activity monitoring)
            if os.path.isfile(path):
                self._add_event_to_history(event_type, path)
            return
        
        try:
            # Check in-memory cache first
            current_hash = self.scanner.sha256_file(path)
            if current_hash is None:
                return
            
            prev_hash = service_state["scan_cache"].get(path)
            
            # Skip if unchanged
            if prev_hash == current_hash and event_type == "modified":
                return
            
            # Update cache
            service_state["scan_cache"][path] = current_hash
            
            # Scan file
            result = self.scanner.scan_file(path, check_size=False)
            
            # Add to event history
            self._add_event_to_history(
                event_type, 
                path, 
                result.get("action"), 
                result.get("ml_score")
            )
            
            # Save to database
            with get_db_context() as db:
                detection_data = {
                    "detection_type": "realtime",
                    "event_type": event_type,
                    "file_path": result["file_path"],
                    "file_name": result["file_name"],
                    "file_size": result.get("file_size"),
                    "sha256": result.get("sha256"),
                    "ml_score": result.get("ml_score"),
                    "action": result.get("action"),
                    "detection_reason": result.get("detection_reason"),
                    "error": result.get("error")
                }
                detection = crud.create_detection(db, detection_data)
                
                # If malicious, trigger alerts
                if result.get("action") == "potential_malicious":
                    print(f"[REALTIME ALERT] Malicious file detected: {result['file_name']}")
                    print(f"                 Reason: {result.get('detection_reason')}, "
                          f"Score: {result.get('ml_score', 0):.2f}")
                    
                    # Notify WebSocket clients (MALICIOUS ALERTS ONLY)
                    alert_data = {
                        "type": "alert",
                        "data": {
                            "id": detection.id,
                            "file_path": result["file_path"],
                            "file_name": result["file_name"],
                            "action": result["action"],
                            "ml_score": result.get("ml_score"),
                            "detection_reason": result.get("detection_reason"),
                            "event_type": event_type,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    }
                    
                    # Call all registered alert callbacks
                    for callback in service_state["alert_callbacks"]:
                        try:
                            callback(alert_data)
                        except:
                            pass
        
        except Exception as e:
            print(f"[Realtime] Error scanning {path}: {e}")
    
    def on_created(self, event):
        if not event.is_directory:
            self._scan_and_log(event.src_path, "created")
    
    def on_modified(self, event):
        if not event.is_directory:
            self._scan_and_log(event.src_path, "modified")
    
    def on_moved(self, event):
        if isinstance(event, FileMovedEvent) and not event.is_directory:
            # Transfer cache entry
            if event.src_path in service_state["scan_cache"]:
                service_state["scan_cache"][event.dest_path] = \
                    service_state["scan_cache"].pop(event.src_path)
            
            # Scan destination
            self._scan_and_log(event.dest_path, "moved")
    
    def on_deleted(self, event):
        if not event.is_directory:
            # Remove from cache
            service_state["scan_cache"].pop(event.src_path, None)


def start_realtime_protection(folders: list = None):
    """Start real-time protection service"""
    if service_state["status"] == "running":
        return {"status": "already_running", "message": "Real-time protection is already running"}
    
    if folders is None:
        folders = DEFAULT_MONITORED_FOLDERS
    
    # Filter existing folders
    valid_folders = [f for f in folders if os.path.exists(f)]
    if not valid_folders:
        return {"status": "error", "message": "No valid folders to monitor"}
    
    # Create observers
    observers = []
    for folder in valid_folders:
        observer = Observer()
        handler = RealtimeProtectionHandler()
        observer.schedule(handler, folder, recursive=True)
        observer.start()
        observers.append(observer)
        print(f"[Realtime] Monitoring: {folder}")
    
    service_state["status"] = "running"
    service_state["observers"] = observers
    service_state["monitored_folders"] = valid_folders
    
    # Update database
    with get_db_context() as db:
        crud.update_service_status(db, "realtime_protection", "running")
    
    print("[Realtime] Real-time protection started")
    
    return {
        "status": "running",
        "message": "Real-time protection started successfully",
        "monitored_folders": valid_folders
    }


def stop_realtime_protection():
    """Stop real-time protection service"""
    if service_state["status"] != "running":
        return {"status": "not_running", "message": "Real-time protection is not running"}
    
    # Stop all observers
    for observer in service_state["observers"]:
        observer.stop()
    
    for observer in service_state["observers"]:
        observer.join()
    
    service_state["status"] = "stopped"
    service_state["observers"] = []
    
    # Update database
    with get_db_context() as db:
        crud.update_service_status(db, "realtime_protection", "stopped")
    
    print("[Realtime] Real-time protection stopped")
    
    return {
        "status": "stopped",
        "message": "Real-time protection stopped successfully"
    }


def get_protection_status():
    """Get real-time protection status with detailed activity info"""
    with get_db_context() as db:
        service = crud.get_service_status(db, "realtime_protection")
        
        uptime = 0
        if service and service.status == "running" and service.started_at:
            uptime = int((datetime.utcnow() - service.started_at).total_seconds())
        
        # Get detection count
        detections_count = db.query(crud.Detection)\
            .filter(crud.Detection.detection_type == "realtime")\
            .count()
        
        return {
            "status": service_state["status"],
            "uptime_seconds": uptime,
            "monitored_folders": service_state["monitored_folders"],
            "detections_count": detections_count,
            "event_counts": service_state["event_counts"].copy(),
            "recent_events_count": len(service_state["recent_events"])
        }


def get_recent_events(limit: int = 50):
    """Get recent file system events"""
    return service_state["recent_events"][:limit]


def get_event_statistics():
    """Get detailed event statistics"""
    return {
        "event_counts": service_state["event_counts"].copy(),
        "total_events": sum(service_state["event_counts"].values()),
        "monitored_folders": service_state["monitored_folders"],
        "cache_size": len(service_state["scan_cache"])
    }


def register_alert_callback(callback):
    """Register a callback for real-time MALICIOUS alerts (for WebSocket)"""
    service_state["alert_callbacks"].append(callback)


def unregister_alert_callback(callback):
    """Unregister alert callback"""
    if callback in service_state["alert_callbacks"]:
        service_state["alert_callbacks"].remove(callback)


def register_event_callback(callback):
    """Register a callback for ALL file system events (for WebSocket)"""
    service_state["event_callbacks"].append(callback)


def unregister_event_callback(callback):
    """Unregister event callback"""
    if callback in service_state["event_callbacks"]:
        service_state["event_callbacks"].remove(callback)


def run_realtime_protection_thread():
    """Run real-time protection in a background thread"""
    start_realtime_protection()
    
    try:
        while service_state["status"] == "running":
            time.sleep(1)
    except KeyboardInterrupt:
        stop_realtime_protection()