#!/usr/bin/env python3
"""
mini_av_batch_dynamic_progress.py — scalable batch AV with dynamic process count and per-folder progress

Features:
- One PEFeatureExtractor per process
- Batch processing of files per process
- Batch ML inference for efficiency
- Prints potentially malicious files (score >= 0.6)
- Dynamically sets number of worker processes based on number of files and CPU cores
- Tracks scanning progress per folder
"""

import os
import sys
import json
import hashlib
import time
import math
import multiprocessing
from concurrent.futures import ProcessPoolExecutor, as_completed
from collections import defaultdict

import numpy as np
import xgboost as xgb

# ---------------------- Paths ---------------------- #
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EMBER_PATH = os.path.join(BASE_DIR, "../ember/ember")
sys.path.insert(0, EMBER_PATH)

MODEL_PATH = os.path.join(BASE_DIR, "../MLModule/Model/xgboost_bodmas.json")
DEFAULT_LOG = os.path.join(BASE_DIR, "detections.jsonl")

# ---------------------- Import EMBER extractor ---------------------- #
try:
    from features import PEFeatureExtractor
except Exception as e:
    print("ERROR importing EMBER feature extractor. Check EMBER_PATH:", EMBER_PATH)
    raise

# ---------------------- Load XGBoost model ---------------------- #
xgb_model = xgb.XGBClassifier()
xgb_model.load_model(MODEL_PATH)

# ---------------------- Globals ---------------------- #
PE_EXTS = {".exe", ".dll", ".sys", ".cpl", ".ocx"}
ML_THRESHOLD = 0.6
BATCH_SIZE = 16  # number of files per ML prediction batch

# Process-local extractor (initialized once per process)
extractor = None

# ---------------------- Worker Initialization ---------------------- #
def init_worker():
    """Initialize one PEFeatureExtractor per process"""
    global extractor
    extractor = PEFeatureExtractor(feature_version=2)

# ---------------------- Helpers ---------------------- #
def sha256_file(path, block_size=65536):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(block_size), b""):
            h.update(chunk)
    return h.hexdigest()

def is_pe_by_ext(path):
    _, ext = os.path.splitext(path)
    return ext.lower() in PE_EXTS

def process_file_batch(file_paths):
    """Process a batch of files in one process"""
    global extractor
    results = []
    features_list = []
    paths_list = []
    hashes_list = []

    # 1. Extract features
    for path in file_paths:
        try:
            with open(path, "rb") as f:
                data = f.read()
            feats = extractor.feature_vector(data).reshape(1, -1)
            h = sha256_file(path)
            features_list.append(feats)
            paths_list.append(path)
            hashes_list.append(h)
        except Exception as e:
            results.append({
                "path": path,
                "sha256": None,
                "ml_score": None,
                "action": None,
                "error": str(e),
                "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            })

    # 2. Batch ML prediction
    if features_list:
        X = np.vstack(features_list)
        scores = xgb_model.predict_proba(X)[:, 1]
        for path, h, score in zip(paths_list, hashes_list, scores):
            action = "potential_malicious" if score >= ML_THRESHOLD else "allow"
            if action == "potential_malicious":
                print(f"[ML] Potential malicious file: {path}, score={score:.2f}")
            results.append({
                "path": path,
                "sha256": h,
                "ml_score": float(score),
                "action": action,
                "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            })
    return results

# ---------------------- File discovery ---------------------- #
def find_files(root):
    """Recursively find PE files in a folder"""
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        for fname in filenames:
            full = os.path.join(dirpath, fname)
            if is_pe_by_ext(full):
                yield full

# ---------------------- Main ---------------------- #
def main():
    # Multiple root folders: Downloads + Documents
    download_folder = os.path.expanduser("~/Downloads")
    documents_folder = os.path.expanduser("~/Documents")
    roots = [download_folder, documents_folder]

    log_file = DEFAULT_LOG
    os.makedirs(os.path.dirname(log_file) or ".", exist_ok=True)

    # Collect all PE files from all roots
    files_by_root = {}
    total_files = 0
    for root in roots:
        files = list(find_files(root))
        files_by_root[root] = files
        total_files += len(files)
        print(f"Found {len(files)} PE files in {root}")

    # Flatten files for batching
    all_files = [f for files in files_by_root.values() for f in files]

    # Split files into batches
    file_batches = [all_files[i:i+BATCH_SIZE] for i in range(0, total_files, BATCH_SIZE)]

    # Dynamically determine number of worker processes
    max_workers = min(multiprocessing.cpu_count(), len(file_batches))
    print(f"Using {max_workers} worker processes")

    submitted = 0
    scanned_count = defaultdict(int)  # track files scanned per root

    with ProcessPoolExecutor(max_workers=max_workers, initializer=init_worker) as executor:
        future_to_batch = {executor.submit(process_file_batch, batch): batch for batch in file_batches}
        for fut in as_completed(future_to_batch):
            results = fut.result()
            submitted += len(future_to_batch[fut])
            # Log results
            with open(log_file, "a", encoding="utf-8") as lf:
                for r in results:
                    lf.write(json.dumps(r, ensure_ascii=False) + "\n")
                    # Update per-root progress
                    for root in roots:
                        if r["path"].startswith(root):
                            scanned_count[root] += 1

            # Print per-folder progress
            for root in roots:
                total_in_root = len(files_by_root[root])
                scanned = scanned_count[root]
                print(f"[Progress] {root}: {scanned}/{total_in_root} files scanned", end="\r")
        print()  # new line after progress

    print("Submitted files for analysis:", submitted)
    print("Done.")

if __name__ == "__main__":
    main()
