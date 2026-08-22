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
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            admin = User(
                email="admin@talentbridge.com",
                password_hash=get_password_hash("Admin@123"),
                first_name="Admin",
                last_name="",
                role="admin"
            )
            db.add(admin)
            db.commit()

        # Seed Jobs if no requisitions exist
        if db.query(JobRequisition).count() == 0:
            now = datetime.datetime.utcnow()
            default_jobs = [
                JobRequisition(
                    requisition_id="REQ-2026-00101",
                    job_title="Senior Python & AI Engineer",
                    department="Engineering",
                    location="Bangalore, India",
                    employment_type="Full-time",
                    experience_range="4-7 years",
                    openings=3,
                    hiring_manager="Admin",
                    max_salary_budget="₹2,500,000 - ₹3,500,000 PA",
                    hiring_target_date="2026-10-31",
                    job_description="We are seeking an experienced Senior Python Developer with expertise in FastAPI, SQLAlchemy, and LLM orchestration to lead core backend architectural services.",
                    status="Published",
                    created_at=now,
                    posted_at=now
                ),
                JobRequisition(
                    requisition_id="REQ-2026-00201",
                    job_title="Junior Python & AI Trainee (Fresher)",
                    department="Engineering",
                    location="Pune, India",
                    employment_type="Full-time",
                    experience_range="Fresher (0-1 year)",
                    openings=5,
                    hiring_manager="Admin",
                    max_salary_budget="₹600,000 - ₹900,000 PA",
                    hiring_target_date="2026-11-15",
                    job_description="Exciting entry-level role for fresh computer science graduates. Receive hands-on training in Python microservices, FastAPI, and AI integration.",
                    status="Published",
                    created_at=now,
                    posted_at=now
                ),
                JobRequisition(
                    requisition_id="REQ-2026-00202",
                    job_title="Graduate Engineer Trainee - Full Stack React",
                    department="Engineering",
                    location="Hyderabad, India",
                    employment_type="Full-time",
                    experience_range="Fresher (0-1 year)",
                    openings=4,
                    hiring_manager="Admin",
                    max_salary_budget="₹550,000 - ₹850,000 PA",
                    hiring_target_date="2026-11-15",
                    job_description="Great opportunity for entry-level developers passionate about modern frontend engineering with React, JavaScript, Vite, and Tailwind CSS.",
                    status="Published",
                    created_at=now,
                    posted_at=now
                ),
                JobRequisition(
                    requisition_id="REQ-2026-00203",
                    job_title="Associate Data Analyst - Fresher Batch 2026",
                    department="Data Science",
                    location="Chennai, India",
                    employment_type="Full-time",
                    experience_range="Fresher (0-1 year)",
                    openings=3,
                    hiring_manager="Admin",
                    max_salary_budget="₹650,000 - ₹950,000 PA",
                    hiring_target_date="2026-11-15",
                    job_description="Analyze datasets, build SQL queries, and construct interactive performance dashboards for enterprise candidate sourcing pipelines.",
                    status="Published",
                    created_at=now,
                    posted_at=now
                ),
                JobRequisition(
                    requisition_id="REQ-2026-00204",
                    job_title="Junior QA & Software Tester (Fresher)",
                    department="Engineering",
                    location="Kolkata, India",
                    employment_type="Full-time",
                    experience_range="Fresher (0-1 year)",
                    openings=2,
                    hiring_manager="Admin",
                    max_salary_budget="₹500,000 - ₹750,000 PA",
                    hiring_target_date="2026-11-15",
                    job_description="Entry-level quality assurance position focusing on automated API testing, regression test suites, and UI user flow verification.",
                    status="Published",
                    created_at=now,
                    posted_at=now
                )
            ]
            for job in default_jobs:
                db.add(job)
            db.commit()
            print("[AUTO SEED] Default job requisitions created successfully.")
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

# Include API Routers with /api prefix AND root / prefix for universal router matching
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(requisitions.router, prefix=settings.API_V1_STR)
app.include_router(applications.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(notifications.ws_router, prefix=settings.API_V1_STR)

app.include_router(auth.router)
app.include_router(requisitions.router)
app.include_router(applications.router)
app.include_router(notifications.router)
app.include_router(notifications.ws_router)

# Mount Built React Frontend Dist Bundle for Full-Stack Cloud Serving
from fastapi.responses import FileResponse
from fastapi import HTTPException

dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("uploads") or full_path.startswith("docs") or full_path == "openapi.json":
            raise HTTPException(status_code=404, detail="API route not found")
        
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(dist_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        
        return {"status": "online"}
else:
    @app.get("/")
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
