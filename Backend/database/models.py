"""
SQLAlchemy database models
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()


class Scan(Base):
    """Batch scan sessions"""
    __tablename__ = "scans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_date = Column(DateTime, default=func.now())
    total_files = Column(Integer, default=0)
    scanned_files = Column(Integer, default=0)
    malicious_count = Column(Integer, default=0)
    clean_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    scan_duration = Column(Float, nullable=True)
    status = Column(String(20), default="running")  # running, completed, failed
    folders = Column(Text, nullable=True)  # JSON string of monitored folders


class Detection(Base):
    """Individual file detections"""
    __tablename__ = "detections"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=True)
    detection_type = Column(String(20))  # batch_scan, realtime
    event_type = Column(String(20), nullable=True)  # created, modified, moved, deleted
    file_path = Column(Text)
    file_name = Column(String(255))
    file_size = Column(Integer, nullable=True)
    sha256 = Column(String(64), nullable=True)
    ml_score = Column(Float, nullable=True)
    action = Column(String(30))  # allow, potential_malicious, skipped, timeout
    detection_reason = Column(String(100), nullable=True)
    error = Column(Text, nullable=True)
    scanned_at = Column(DateTime, default=func.now())


class FileCache(Base):
    """Cache for scanned files"""
    __tablename__ = "file_cache"
    
    file_path = Column(Text, primary_key=True)
    sha256 = Column(String(64))
    file_size = Column(Integer)
    modified_time = Column(Float)
    ml_score = Column(Float)
    action = Column(String(30))
    last_scanned = Column(DateTime, default=func.now())


class Whitelist(Base):
    """Whitelisted files"""
    __tablename__ = "whitelist"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    file_path = Column(Text, nullable=True)
    sha256 = Column(String(64), nullable=True)
    reason = Column(Text, nullable=True)
    added_at = Column(DateTime, default=func.now())


class ServiceStatus(Base):
    """Track service status"""
    __tablename__ = "service_status"
    
    service_name = Column(String(50), primary_key=True)
    status = Column(String(20))  # running, stopped
    started_at = Column(DateTime, nullable=True)
    stopped_at = Column(DateTime, nullable=True)
    uptime_seconds = Column(Integer, default=0)