"""
Configuration settings for TPSec AV Backend
"""

import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "MLModule"
EMBER_PATH = PROJECT_ROOT / "ember" / "ember"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)

# Database
DATABASE_URL = f"sqlite:///{DATA_DIR / 'av_scanner.db'}"

# ML Model
MODEL_PATH = MODEL_DIR / "xgboost_bodmas.json"
ML_THRESHOLD = 0.1  # 10% - Aggressive detection mode
BATCH_SIZE = 16

# File scanning
PE_EXTENSIONS = {".exe", ".dll", ".sys", ".cpl", ".ocx"}
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Suspicious patterns for heuristics
SUSPICIOUS_PATTERNS = {
    "paths": ["loader", "crack", "keygen", "patch", "activator", "bypass", "hack"],
    "filenames": ["loader", "inject", "hack", "cheat", "keyg", "crack", "trainer"]
}

# Real-time protection
DEFAULT_MONITORED_FOLDERS = [
    os.path.expanduser("~/Downloads"),
    os.path.expanduser("~/Documents")
]

# API Settings
API_HOST = "0.0.0.0"
API_PORT = 8000
API_TITLE = "TPSec AV Backend API"
API_VERSION = "1.0.0"

# CORS Settings (update with your frontend URL)
CORS_ORIGINS = [
    "http://localhost:3000",  # React default
    "http://localhost:5173",  # Vite default
    "http://localhost:8080",  # Vue default
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Timeouts
SCAN_BATCH_TIMEOUT = 300  # 5 minutes
SCAN_RESULT_TIMEOUT = 60  # 1 minute

# Logging
LOG_LEVEL = "INFO"