"""
CRUD operations for database
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from Backend.database.models import Scan, Detection, FileCache, Whitelist, ServiceStatus
import json


# ===== SCANS =====
def create_scan(db: Session, folders: list) -> Scan:
    """Create a new scan session"""
    scan = Scan(
        status="running",
        folders=json.dumps(folders)
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def update_scan(db: Session, scan_id: int, **kwargs):
    """Update scan session"""
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if scan:
        for key, value in kwargs.items():
            setattr(scan, key, value)
        db.commit()
        db.refresh(scan)
    return scan


def get_scan(db: Session, scan_id: int) -> Scan:
    """Get scan by ID"""
    return db.query(Scan).filter(Scan.id == scan_id).first()


def get_latest_scan(db: Session) -> Scan:
    """Get most recent scan"""
    return db.query(Scan).order_by(desc(Scan.scan_date)).first()


# ===== DETECTIONS =====
def create_detection(db: Session, detection_data: dict) -> Detection:
    """Create a new detection record"""
    detection = Detection(**detection_data)
    db.add(detection)
    db.commit()
    db.refresh(detection)
    return detection


def get_detections(
    db: Session,
    limit: int = 50,
    offset: int = 0,
    detection_type: str = None,
    action: str = None
):
    """Get detections with filters"""
    query = db.query(Detection).order_by(desc(Detection.scanned_at))
    
    if detection_type and detection_type != "all":
        query = query.filter(Detection.detection_type == detection_type)
    
    if action:
        query = query.filter(Detection.action == action)
    
    total = query.count()
    detections = query.limit(limit).offset(offset).all()
    
    return {"total": total, "detections": detections}


def get_malicious_detections(db: Session, limit: int = 50):
    """Get only malicious detections"""
    return db.query(Detection)\
        .filter(Detection.action == "potential_malicious")\
        .order_by(desc(Detection.scanned_at))\
        .limit(limit)\
        .all()


def get_recent_alerts(db: Session, limit: int = 20):
    """Get recent real-time alerts"""
    return db.query(Detection)\
        .filter(Detection.detection_type == "realtime")\
        .filter(Detection.action == "potential_malicious")\
        .order_by(desc(Detection.scanned_at))\
        .limit(limit)\
        .all()


def delete_detection(db: Session, detection_id: int):
    """Delete a detection"""
    detection = db.query(Detection).filter(Detection.id == detection_id).first()
    if detection:
        db.delete(detection)
        db.commit()
        return True
    return False


# ===== FILE CACHE =====
def get_cache_entry(db: Session, file_path: str):
    """Get cache entry for a file"""
    return db.query(FileCache).filter(FileCache.file_path == file_path).first()


def should_skip_file(db: Session, file_path: str, file_size: int, mtime: float) -> bool:
    """Check if file should be skipped based on cache"""
    cache = get_cache_entry(db, file_path)
    if cache and cache.action == "allow":
        if cache.file_size == file_size and cache.modified_time == mtime:
            return True
    return False


def update_cache(db: Session, file_path: str, sha256: str, file_size: int, 
                 mtime: float, ml_score: float, action: str):
    """Update or create cache entry"""
    cache = get_cache_entry(db, file_path)
    if cache:
        cache.sha256 = sha256
        cache.file_size = file_size
        cache.modified_time = mtime
        cache.ml_score = ml_score
        cache.action = action
        cache.last_scanned = datetime.utcnow()
    else:
        cache = FileCache(
            file_path=file_path,
            sha256=sha256,
            file_size=file_size,
            modified_time=mtime,
            ml_score=ml_score,
            action=action
        )
        db.add(cache)
    db.commit()


# ===== WHITELIST =====
def get_whitelist(db: Session):
    """Get all whitelist entries"""
    return db.query(Whitelist).order_by(desc(Whitelist.added_at)).all()


def add_to_whitelist(db: Session, file_path: str = None, sha256: str = None, reason: str = None):
    """Add file to whitelist"""
    whitelist = Whitelist(
        file_path=file_path,
        sha256=sha256,
        reason=reason
    )
    db.add(whitelist)
    db.commit()
    db.refresh(whitelist)
    return whitelist


def is_whitelisted(db: Session, file_path: str = None, sha256: str = None) -> bool:
    """Check if file is whitelisted"""
    query = db.query(Whitelist)
    if file_path:
        if query.filter(Whitelist.file_path == file_path).first():
            return True
    if sha256:
        if query.filter(Whitelist.sha256 == sha256).first():
            return True
    return False


def remove_from_whitelist(db: Session, whitelist_id: int):
    """Remove from whitelist"""
    whitelist = db.query(Whitelist).filter(Whitelist.id == whitelist_id).first()
    if whitelist:
        db.delete(whitelist)
        db.commit()
        return True
    return False


# ===== SERVICE STATUS =====
def update_service_status(db: Session, service_name: str, status: str):
    """Update service status"""
    service = db.query(ServiceStatus).filter(ServiceStatus.service_name == service_name).first()
    
    if service:
        service.status = status
        if status == "running":
            service.started_at = datetime.utcnow()
            service.stopped_at = None
        elif status == "stopped":
            service.stopped_at = datetime.utcnow()
            if service.started_at:
                service.uptime_seconds = int((service.stopped_at - service.started_at).total_seconds())
    else:
        service = ServiceStatus(
            service_name=service_name,
            status=status,
            started_at=datetime.utcnow() if status == "running" else None
        )
        db.add(service)
    
    db.commit()
    db.refresh(service)
    return service


def get_service_status(db: Session, service_name: str):
    """Get service status"""
    return db.query(ServiceStatus).filter(ServiceStatus.service_name == service_name).first()


# ===== STATISTICS =====
def get_overview_stats(db: Session):
    """Get overview statistics"""
    total_scans = db.query(func.count(Scan.id)).scalar()
    total_files_scanned = db.query(func.sum(Scan.scanned_files)).scalar() or 0
    total_detections = db.query(func.count(Detection.id)).scalar()
    malicious_count = db.query(func.count(Detection.id))\
        .filter(Detection.action == "potential_malicious").scalar()
    clean_count = total_detections - malicious_count
    
    protection_service = get_service_status(db, "realtime_protection")
    protection_status = protection_service.status if protection_service else "stopped"
    protection_uptime = 0
    if protection_service and protection_service.status == "running" and protection_service.started_at:
        protection_uptime = int((datetime.utcnow() - protection_service.started_at).total_seconds())
    
    return {
        "total_scans": total_scans,
        "total_files_scanned": total_files_scanned,
        "total_detections": total_detections,
        "malicious_count": malicious_count,
        "clean_count": clean_count,
        "protection_status": protection_status,
        "protection_uptime": protection_uptime
    }


def get_timeline_stats(db: Session, days: int = 7):
    """Get detection timeline"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    detections = db.query(
        func.date(Detection.scanned_at).label("date"),
        func.count(Detection.id).label("count"),
        func.sum(func.case((Detection.action == "potential_malicious", 1), else_=0)).label("malicious")
    ).filter(Detection.scanned_at >= start_date)\
     .group_by(func.date(Detection.scanned_at))\
     .all()
    
    scans = db.query(
        func.date(Scan.scan_date).label("date"),
        func.count(Scan.id).label("scans")
    ).filter(Scan.scan_date >= start_date)\
     .group_by(func.date(Scan.scan_date))\
     .all()
    
    # Combine results
    timeline = {}
    for d in detections:
        timeline[str(d.date)] = {
            "date": str(d.date),
            "detections": d.count,
            "malicious": d.malicious,
            "scans": 0
        }
    
    for s in scans:
        if str(s.date) in timeline:
            timeline[str(s.date)]["scans"] = s.scans
        else:
            timeline[str(s.date)] = {
                "date": str(s.date),
                "detections": 0,
                "malicious": 0,
                "scans": s.scans
            }
    
    return sorted(timeline.values(), key=lambda x: x["date"])