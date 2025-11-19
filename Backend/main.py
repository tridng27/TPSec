"""
Main entry point for TPSec AV Backend
Starts FastAPI server and real-time protection service
"""

import uvicorn
import threading
from Backend.config.settings import API_HOST, API_PORT
from Backend.services.realtime_service import start_realtime_protection


def main():
    print("=" * 60)
    print("TPSec AV Backend Starting...")
    print("=" * 60)
    
    # Start real-time protection in background thread
    print("\n[Main] Starting real-time protection service...")
    protection_thread = threading.Thread(
        target=start_realtime_protection,
        daemon=True
    )
    protection_thread.start()
    
    # Start FastAPI server
    print(f"\n[Main] Starting API server on {API_HOST}:{API_PORT}")
    print(f"[Main] API Documentation: http://localhost:{API_PORT}/docs")
    print(f"[Main] Health Check: http://localhost:{API_PORT}/health")
    print("\n" + "=" * 60 + "\n")
    
    uvicorn.run(
        "Backend.api.main:app",
        host=API_HOST,
        port=API_PORT,
        reload=False,  # Set to True for development
        log_level="info"
    )


if __name__ == "__main__":
    main()