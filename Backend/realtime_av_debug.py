#!/usr/bin/env python3
"""
realtime_av_debug.py — Real-time protection prototype with tamper debug printing

Features:
- Monitors Downloads and Documents folders
- Triggers on file creation, modification, move, and deletion
- Checks PE files using EMBER feature extractor + XGBoost model
- Caches scanned file hashes to avoid rescanning unchanged files
- Prints debug info including which files are being tampered (hash changed)
- Prints event type and file path for easy debugging
"""

import os
import sys
import time
import hashlib
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileMovedEvent, FileDeletedEvent

import numpy as np
import xgboost as xgb

# ---------------------- Paths & Settings ---------------------- #
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EMBER_PATH = os.path.join(BASE_DIR, "../ember/ember")
sys.path.insert(0, EMBER_PATH)

MODEL_PATH = os.path.join(BASE_DIR, "../MLModule/Model/xgboost_bodmas.json")
PE_EXTS = {".exe", ".dll", ".sys", ".cpl", ".ocx"}
ML_THRESHOLD = 0.6

# ---------------------- Import EMBER extractor ---------------------- #
try:
    from features import PEFeatureExtractor
except Exception as e:
    print("ERROR importing EMBER feature extractor. Check EMBER_PATH:", EMBER_PATH)
    raise

# ---------------------- Load XGBoost model ---------------------- #
xgb_model = xgb.XGBClassifier()
xgb_model.load_model(MODEL_PATH)

# Initialize PE feature extractor once
extractor = PEFeatureExtractor(feature_version=2)

# ---------------------- Cache ---------------------- #
# Dictionary: {file_path: last_scanned_sha256}
scan_cache = {}

# ---------------------- Helpers ---------------------- #
def sha256_file(path, block_size=65536):
    """Compute SHA256 of a file. Returns None on read error."""
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(block_size), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None

def is_pe_file(path):
    _, ext = os.path.splitext(path)
    return ext.lower() in PE_EXTS

def scan_file(path):
    """
    Scan a single file with ML model, using cache to avoid rescans.
    Prints debug messages indicating new/modified/unchanged/tampered states.
    """
    if not os.path.isfile(path) or not is_pe_file(path):
        # For debug, print that non-PE or non-file event was ignored
        print(f"[DEBUG] Ignored (not PE or not file): {path}")
        return

    try:
        current_hash = sha256_file(path)
        if current_hash is None:
            print(f"[ERROR] Could not read file for hashing: {path}")
            return

        prev_hash = scan_cache.get(path)

        # Determine state
        if prev_hash is None:
            state = "new"
            print(f"[EVENT] New file detected: {path} (hash={current_hash})")
        elif prev_hash == current_hash:
            state = "unchanged"
            print(f"[EVENT] File unchanged (skipping scan): {path} (hash={current_hash})")
        else:
            state = "tampered"
            print(f"[EVENT] File tampered/modified: {path}\n    previous_hash={prev_hash}\n    current_hash = {current_hash}")

        # If unchanged, skip heavy scan
        if state == "unchanged":
            return

        # Update cache (so new/tampered will be recorded)
        scan_cache[path] = current_hash

        # Read bytes and extract features
        with open(path, "rb") as f:
            data = f.read()
        features = extractor.feature_vector(data).reshape(1, -1)
        score = xgb_model.predict_proba(features)[0][1]

        if score >= ML_THRESHOLD:
            print(f"[REALTIME][ALERT] Potential malicious file: {path}, score={score:.2f}")
        else:
            print(f"[REALTIME] File scanned and allowed: {path}, score={score:.2f}")

    except Exception as e:
        print(f"[ERROR] Failed to scan {path}: {e}")

# ---------------------- Event Handler ---------------------- #
class DebugRealtimeHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        print(f"[WATCH] Created: {event.src_path}")
        scan_file(event.src_path)

    def on_modified(self, event):
        if event.is_directory:
            return
        print(f"[WATCH] Modified: {event.src_path}")
        scan_file(event.src_path)

    def on_moved(self, event):
        # event is FileMovedEvent
        if not isinstance(event, FileMovedEvent):
            # fallback
            print(f"[WATCH] Moved (unknown event): {getattr(event, 'src_path', '?')} -> {getattr(event, 'dest_path', '?')}")
            return
        src = event.src_path
        dest = event.dest_path
        print(f"[WATCH] Moved: {src} -> {dest}")

        # If the file moved within watched tree, transfer cache entry
        if src in scan_cache:
            scan_cache[dest] = scan_cache.pop(src)
            print(f"[DEBUG] Transferred cache entry from {src} to {dest}")

        # Scan destination path (new file)
        scan_file(dest)

    def on_deleted(self, event):
        if event.is_directory:
            return
        path = event.src_path
        print(f"[WATCH] Deleted: {path}")
        # Remove from cache if present
        if path in scan_cache:
            scan_cache.pop(path, None)
            print(f"[DEBUG] Removed {path} from scan cache")

# ---------------------- Main ---------------------- #
def main():
    # Folders to monitor
    download_folder = os.path.expanduser("~/Downloads")
    documents_folder = r"C:\Users\tridu\Documents"
    paths_to_watch = [download_folder, documents_folder]

    observers = []
    for path in paths_to_watch:
        if not os.path.exists(path):
            print(f"[WARN] Folder does not exist, skipping: {path}")
            continue
        observer = Observer()
        handler = DebugRealtimeHandler()
        observer.schedule(handler, path, recursive=True)
        observer.start()
        observers.append(observer)
        print(f"[INFO] Monitoring folder: {path}")

    print("[INFO] Real-time monitoring started. Press Ctrl+C to stop.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[INFO] Stopping real-time AV...")
        for obs in observers:
            obs.stop()
        for obs in observers:
            obs.join()
        print("[INFO] Observers stopped. Exiting.")

if __name__ == "__main__":
    main()
