"""
Batch scanning service - optimized for scanning multiple files
"""

import os
import time
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, as_completed
from collections import defaultdict
from datetime import datetime

from Backend.scanner.core import get_scanner
from Backend.database.db import get_db_context
from Backend.database import crud
from Backend.config.settings import BATCH_SIZE, SCAN_BATCH_TIMEOUT, SCAN_RESULT_TIMEOUT


# Current scan state (shared across threads)
current_scan_state = {
    "scan_id": None,
    "status": "idle",
    "total_files": 0,
    "scanned_files": 0,
    "malicious_count": 0
}


def init_worker():
    """Initialize worker process with scanner"""
    global scanner
    scanner = get_scanner()


def process_file_batch(file_paths):
    """Process a batch of files in one worker process"""
    global scanner
    results = []
    
    for path in file_paths:
        result = scanner.scan_file(path)
        results.append(result)
    
    return results


def find_files_generator(root):
    """Generator to find PE files"""
    scanner = get_scanner()
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        for fname in filenames:
            full = os.path.join(dirpath, fname)
            if scanner.is_pe_file(full):
                yield full


def start_batch_scan(folders: list):
    """
    Start a batch scan of specified folders
    Returns: scan_id
    """
    global current_scan_state
    
    if current_scan_state["status"] == "running":
        raise ValueError("A scan is already running")
    
    # Create scan record in database
    with get_db_context() as db:
        scan = crud.create_scan(db, folders)
        scan_id = scan.id
    
    # Update state
    current_scan_state["scan_id"] = scan_id
    current_scan_state["status"] = "running"
    current_scan_state["scanned_files"] = 0
    current_scan_state["malicious_count"] = 0
    
    # Collect files
    print(f"[Batch Scan] Starting scan {scan_id}")
    all_files = []
    for folder in folders:
        if os.path.exists(folder):
            files = list(find_files_generator(folder))
            all_files.extend(files)
            print(f"[Batch Scan] Found {len(files)} PE files in {folder}")
    
    current_scan_state["total_files"] = len(all_files)
    
    # Update database
    with get_db_context() as db:
        crud.update_scan(db, scan_id, total_files=len(all_files))
    
    if not all_files:
        current_scan_state["status"] = "completed"
        with get_db_context() as db:
            crud.update_scan(db, scan_id, status="completed", scan_duration=0)
        return scan_id
    
    # Split into batches
    file_batches = [all_files[i:i+BATCH_SIZE] for i in range(0, len(all_files), BATCH_SIZE)]
    
    # Determine worker count
    max_workers = min(multiprocessing.cpu_count(), len(file_batches), 8)
    print(f"[Batch Scan] Using {max_workers} workers for {len(file_batches)} batches")
    
    start_time = time.time()
    
    # Process batches
    with ProcessPoolExecutor(max_workers=max_workers, initializer=init_worker) as executor:
        future_to_batch = {
            executor.submit(process_file_batch, batch): batch 
            for batch in file_batches
        }
        
        for fut in as_completed(future_to_batch, timeout=SCAN_BATCH_TIMEOUT):
            try:
                results = fut.result(timeout=SCAN_RESULT_TIMEOUT)
                
                # Save results to database
                with get_db_context() as db:
                    for result in results:
                        detection_data = {
                            "scan_id": scan_id,
                            "detection_type": "batch_scan",
                            "file_path": result["file_path"],
                            "file_name": result["file_name"],
                            "file_size": result.get("file_size"),
                            "sha256": result.get("sha256"),
                            "ml_score": result.get("ml_score"),
                            "action": result.get("action"),
                            "detection_reason": result.get("detection_reason"),
                            "error": result.get("error")
                        }
                        crud.create_detection(db, detection_data)
                        
                        # Update cache if successful
                        if result.get("sha256") and result.get("action") in ["allow", "potential_malicious"]:
                            try:
                                stat = os.stat(result["file_path"])
                                crud.update_cache(
                                    db,
                                    result["file_path"],
                                    result["sha256"],
                                    result.get("file_size", 0),
                                    stat.st_mtime,
                                    result.get("ml_score", 0),
                                    result["action"]
                                )
                            except:
                                pass
                        
                        # Update counters
                        current_scan_state["scanned_files"] += 1
                        if result.get("action") == "potential_malicious":
                            current_scan_state["malicious_count"] += 1
                            print(f"[Batch Scan] MALICIOUS: {result['file_name']} "
                                  f"(score: {result.get('ml_score', 0):.2f})")
                
                # Update scan record
                with get_db_context() as db:
                    crud.update_scan(
                        db, 
                        scan_id,
                        scanned_files=current_scan_state["scanned_files"],
                        malicious_count=current_scan_state["malicious_count"]
                    )
                
            except Exception as e:
                print(f"[Batch Scan] Error processing batch: {e}")
    
    # Finalize scan
    scan_duration = time.time() - start_time
    clean_count = current_scan_state["scanned_files"] - current_scan_state["malicious_count"]
    
    with get_db_context() as db:
        crud.update_scan(
            db,
            scan_id,
            status="completed",
            scan_duration=scan_duration,
            clean_count=clean_count
        )
    
    current_scan_state["status"] = "completed"
    print(f"[Batch Scan] Completed scan {scan_id} in {scan_duration:.2f}s")
    
    return scan_id


def get_scan_status(scan_id: int = None):
    """Get current or specific scan status"""
    if scan_id is None:
        # Return current scan state
        progress = 0
        if current_scan_state["total_files"] > 0:
            progress = (current_scan_state["scanned_files"] / current_scan_state["total_files"]) * 100
        
        return {
            "scan_id": current_scan_state["scan_id"],
            "status": current_scan_state["status"],
            "total_files": current_scan_state["total_files"],
            "scanned_files": current_scan_state["scanned_files"],
            "malicious_count": current_scan_state["malicious_count"],
            "progress": round(progress, 2)
        }
    else:
        # Get from database
        with get_db_context() as db:
            scan = crud.get_scan(db, scan_id)
            if scan:
                progress = 0
                if scan.total_files > 0:
                    progress = (scan.scanned_files / scan.total_files) * 100
                
                return {
                    "scan_id": scan.id,
                    "status": scan.status,
                    "total_files": scan.total_files,
                    "scanned_files": scan.scanned_files,
                    "malicious_count": scan.malicious_count,
                    "clean_count": scan.clean_count,
                    "scan_duration": scan.scan_duration,
                    "progress": round(progress, 2)
                }
        return None