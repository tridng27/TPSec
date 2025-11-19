"""
Core scanning logic shared between batch and real-time scanning
"""

import os
import sys
import hashlib
import numpy as np
import xgboost as xgb
from Backend.config.settings import (
    EMBER_PATH, MODEL_PATH, PE_EXTENSIONS, 
    ML_THRESHOLD, SUSPICIOUS_PATTERNS, MAX_FILE_SIZE
)

# Add EMBER to path
sys.path.insert(0, str(EMBER_PATH))

try:
    from features import PEFeatureExtractor
except Exception as e:
    print(f"ERROR importing EMBER feature extractor: {e}")
    raise


class Scanner:
    """Shared scanner logic"""
    
    def __init__(self):
        """Initialize scanner with ML model and feature extractor"""
        self.extractor = PEFeatureExtractor(feature_version=2)
        self.model = xgb.XGBClassifier()
        self.model.load_model(str(MODEL_PATH))
        print(f"[Scanner] Initialized with ML threshold: {ML_THRESHOLD}")
    
    def is_pe_file(self, path: str) -> bool:
        """Check if file is a PE file by extension"""
        _, ext = os.path.splitext(path)
        return ext.lower() in PE_EXTENSIONS
    
    def sha256_and_read_file(self, path: str, block_size: int = 65536):
        """Read file once and compute SHA256 simultaneously"""
        h = hashlib.sha256()
        chunks = []
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(block_size), b""):
                h.update(chunk)
                chunks.append(chunk)
        return b"".join(chunks), h.hexdigest()
    
    def sha256_file(self, path: str, block_size: int = 65536):
        """Compute SHA256 of a file"""
        try:
            h = hashlib.sha256()
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(block_size), b""):
                    h.update(chunk)
            return h.hexdigest()
        except Exception:
            return None
    
    def check_suspicious_heuristics(self, path: str, ml_score: float):
        """
        Apply heuristic checks for suspicious patterns
        Returns: (is_suspicious, reason)
        """
        path_lower = path.lower()
        filename = os.path.basename(path_lower)
        
        # Check suspicious path patterns
        for pattern in SUSPICIOUS_PATTERNS["paths"]:
            if pattern in path_lower:
                return True, f"suspicious_path:{pattern}"
        
        # Check suspicious filename patterns
        for pattern in SUSPICIOUS_PATTERNS["filenames"]:
            if pattern in filename:
                return True, f"suspicious_filename:{pattern}"
        
        # Check for random-looking filenames (common in malware)
        name_without_ext = os.path.splitext(filename)[0]
        if len(name_without_ext) >= 10:
            # Count consonant clusters (malware often has random names)
            consonants = sum(1 for c in name_without_ext.lower() 
                           if c in "bcdfghjklmnpqrstvwxyz")
            if consonants / len(name_without_ext) > 0.7:
                return True, "random_filename"
        
        # Suspicious even if ML score is moderate (10%+) in certain contexts
        if ml_score >= 0.1 and any(p in path_lower for p in ["temp", "appdata", "programdata"]):
            return True, f"suspicious_location_with_score:{ml_score:.2f}"
        
        return False, None
    
    def scan_file(self, path: str, check_size: bool = True):
        """
        Scan a single file
        Returns: dict with scan results
        """
        result = {
            "file_path": path,
            "file_name": os.path.basename(path),
            "sha256": None,
            "ml_score": None,
            "action": None,
            "detection_reason": None,
            "error": None,
            "file_size": None
        }
        
        try:
            # Check if file exists and is PE
            if not os.path.isfile(path) or not self.is_pe_file(path):
                result["action"] = "skipped"
                result["error"] = "Not a PE file"
                return result
            
            # Check file size
            file_size = os.path.getsize(path)
            result["file_size"] = file_size
            
            if check_size and file_size > MAX_FILE_SIZE:
                result["action"] = "skipped"
                result["error"] = f"File too large ({file_size} bytes)"
                return result
            
            # Read file and compute hash
            data, sha256 = self.sha256_and_read_file(path)
            result["sha256"] = sha256
            
            # Extract features and predict
            features = self.extractor.feature_vector(data).reshape(1, -1)
            score = float(self.model.predict_proba(features)[0][1])
            result["ml_score"] = score
            
            # Apply ML threshold
            action = "potential_malicious" if score >= ML_THRESHOLD else "allow"
            detection_reason = f"ml_score:{score:.2f}" if action == "potential_malicious" else None
            
            # Apply heuristic checks
            is_suspicious, heuristic_reason = self.check_suspicious_heuristics(path, score)
            if is_suspicious:
                action = "potential_malicious"
                detection_reason = heuristic_reason
            
            result["action"] = action
            result["detection_reason"] = detection_reason
            
        except Exception as e:
            result["action"] = "error"
            result["error"] = str(e)
        
        return result


# Global scanner instance for workers
_scanner_instance = None


def get_scanner():
    """Get or create scanner instance"""
    global _scanner_instance
    if _scanner_instance is None:
        _scanner_instance = Scanner()
    return _scanner_instance