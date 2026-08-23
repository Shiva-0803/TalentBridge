import os
import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash

# CRITICAL FIX: Import all domain models BEFORE calling Base.metadata.create_all
from app.models.domain import (
    User,
    CandidateProfile,
    JobRequisition,
    Application,
    EducationRecord,
    WorkExperienceRecord,
    Notification
)

from app.api import auth, requisitions, applications, notifications

# Initialize database tables on application startup
Base.metadata.create_all(bind=engine)

def auto_seed_db():
    try:
        db = SessionLocal()
        # Seed Admin if not exists
        admin = db.query(User).filter(User.email == "admin@talentbridge.com").first()
        if not admin:
            admin = User(
                email="admin@talentbridge.com",
                password_hash=get_password_hash("admin123"),
                first_name="Admin",
                last_name="",
                role="admin"
            )
            db.add(admin)
            db.commit()
            print("[AUTO SEED] Admin account verified.")
        else:
            admin.password_hash = get_password_hash("admin123")
            db.commit()

        # Seed Test Candidate if not exists
        candidate = db.query(User).filter(User.email == "candidate@talentbridge.com").first()
        if not candidate:
            candidate = User(
                email="candidate@talentbridge.com",
                password_hash=get_password_hash("candidate123"),
                first_name="Test",
                last_name="Candidate",
                role="candidate"
            )
            db.add(candidate)
            db.commit()
            db.refresh(candidate)

            profile = CandidateProfile(
                user_id=candidate.id,
                mobile="+91 98765 43210",
                gender="Male",
                dob="1998-05-15",
                current_location="Bangalore, Karnataka",
                current_company="TalentBridge Labs",
                notice_period="Immediate",
                current_address="MG Road, Bangalore, Karnataka 560001"
            )
            db.add(profile)
            db.commit()
            print("[AUTO SEED] Test candidate account verified.")
        else:
            candidate.password_hash = get_password_hash("candidate123")
            db.commit()

        db.close()
    except Exception as e:
        print(f"[AUTO SEED ERROR] {e}")

auto_seed_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Candidate Sourcing System API - Job Requisitions, Candidate Applications & Real-time Tracking",
    version="1.0.0"
)

# Enable CORS for React frontend cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev/demo environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Uploads directory for resume download/preview access
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include API Routers with /api prefix
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(requisitions.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(notifications.ws_router, prefix=settings.API_V1_STR)

# Mount Built React Frontend Dist Bundle for Full-Stack Cloud Serving
from fastapi.responses import FileResponse
from fastapi.routing import APIRouter as _SpaRouter

dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # SPA fallback: use a separate router added LAST so it never overrides API POST routes
    _spa_router = _SpaRouter()

    @_spa_router.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend_spa(full_path: str):
        # Never intercept API, docs, or uploads paths
        if (full_path.startswith("api/") or full_path == "api"
                or full_path.startswith("uploads")
                or full_path.startswith("docs")
                or full_path == "openapi.json"
                or full_path.startswith("ws/")):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")

        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

        return {"status": "online"}

    app.include_router(_spa_router)
else:
    @app.get("/", include_in_schema=False)
    def root():
        return {
            "status": "online",
            "service": settings.PROJECT_NAME,
            "docs_url": "/docs",
            "version": "1.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
