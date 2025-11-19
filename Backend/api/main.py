"""
FastAPI main application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Backend.config.settings import API_TITLE, API_VERSION, CORS_ORIGINS
from Backend.api.routes import scan, protection, detections, stats, alerts
from Backend.database.db import init_db

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description="TPSec Antivirus Backend API"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("[API] FastAPI server started")

# Include routers
app.include_router(scan.router, prefix="/api/scan", tags=["Scan"])
app.include_router(protection.router, prefix="/api/protection", tags=["Protection"])
app.include_router(detections.router, prefix="/api/detections", tags=["Detections"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "TPSec AV Backend API",
        "version": API_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}