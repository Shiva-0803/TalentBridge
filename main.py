import os
import sys
import traceback

print("[STARTUP] Initializing TalentBridge Application...")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from app.main import app
    print("[SUCCESS] TalentBridge FastAPI Application loaded successfully.")
except Exception as e:
    print("[FATAL ERROR] Exception occurred during FastAPI app initialization:")
    traceback.print_exc()
    sys.exit(1)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[STARTUP] Starting Uvicorn server on host 0.0.0.0 port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
