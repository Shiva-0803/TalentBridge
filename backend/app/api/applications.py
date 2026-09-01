import os
import json
import csv
import io
import datetime
import random
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.config import settings
from app.core.websockets import manager
from app.core.email import send_application_confirmation_email, send_status_update_email
from app.models.domain import (
    User, CandidateProfile, JobRequisition, Application,
    EducationRecord, WorkExperienceRecord, Notification
)
from app.api.auth import get_current_user, get_current_admin
from app.schemas.pydantic_schemas import ApplicationStatusUpdate

router = APIRouter(prefix="/applications", tags=["Candidate Applications"])

def generate_app_code(db: Session) -> str:
    code_num = random.randint(10000, 99999)
    return f"APP-{code_num}"

@router.post("")
async def submit_application(
    requisition_id: str = Form(...),
    bio_data: str = Form(...), # JSON string containing bio-data
    education: str = Form(...), # JSON string array of education records
    work_experience: str = Form(...), # JSON string array of work exp records
    cover_note: Optional[str] = Form(None),
    data_accuracy_consent: bool = Form(True),
    privacy_policy_consent: bool = Form(True),
    resume_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a candidate application with Bio-Data, Education, Work Experience, and Mandatory Resume Upload.
    """
    # 1. Validate Requisition
    req = None
    req_id_str = str(requisition_id).strip()
    if req_id_str.isdigit():
        req = db.query(JobRequisition).filter(JobRequisition.id == int(req_id_str)).first()

    if not req:
        clean_req_id = req_id_str.replace(" ", "-")
        req = db.query(JobRequisition).filter(
            or_(
                JobRequisition.requisition_id == req_id_str,
                JobRequisition.requisition_id == clean_req_id,
                JobRequisition.requisition_id.ilike(f"%{clean_req_id}%")
            )
        ).first()

    if not req or req.status != "Published":
        raise HTTPException(status_code=400, detail="Target job requisition is no longer active or published.")

    # 2. Check Duplicate Application
    existing_app = db.query(Application).filter(
        Application.requisition_id == req.id,
        Application.candidate_id == current_user.id
    ).first()
    if existing_app:
        raise HTTPException(
            status_code=400,
            detail=f"You have already submitted an application for '{req.job_title}' with Application Code '{existing_app.application_code}'. Candidates cannot submit duplicate applications for the same job role."
        )

    # 3. Validate Resume File
    filename = resume_file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOC, and DOCX files are allowed.")

    file_bytes = await resume_file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds limit of {settings.MAX_FILE_SIZE_MB} MB.")

    # Save file to disk
    app_code = generate_app_code(db)
    saved_filename = f"{app_code}_{current_user.id}_{filename.replace(' ', '_')}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # 4. Parse JSON Inputs
    try:
        bio_dict = json.loads(bio_data)
        edu_list = json.loads(education)
        exp_list = json.loads(work_experience)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid payload format: {str(e)}")

    # Update candidate profile with latest bio-data
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
    
    profile.mobile = bio_dict.get("mobile", profile.mobile)
    profile.gender = bio_dict.get("gender", profile.gender)
    profile.dob = bio_dict.get("dob", profile.dob)
    profile.current_location = bio_dict.get("current_location", profile.current_location)
    profile.current_company = bio_dict.get("current_company", profile.current_company)
    profile.notice_period = bio_dict.get("notice_period", profile.notice_period)
    profile.current_address = bio_dict.get("current_address", profile.current_address)

    current_user.first_name = bio_dict.get("first_name", current_user.first_name)
    current_user.last_name = bio_dict.get("last_name", current_user.last_name)

    # 5. Create Application Record
    new_app = Application(
        application_code=app_code,
        requisition_id=req.id,
        candidate_id=current_user.id,
        cover_note=cover_note,
        resume_file_path=saved_filename,
        resume_file_name=filename,
        data_accuracy_consent=data_accuracy_consent,
        privacy_policy_consent=privacy_policy_consent,
        status="New",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # 6. Save Education Records
    for edu in edu_list:
        e_rec = EducationRecord(
            application_id=new_app.id,
            candidate_id=current_user.id,
            degree=edu.get("degree", ""),
            specialization=edu.get("specialization"),
            institution=edu.get("institution", ""),
            year_of_passing=str(edu.get("year_of_passing", "")),
            grade=edu.get("grade"),
            education_level=edu.get("education_level", "Bachelor's")
        )
        db.add(e_rec)

    # 7. Save Work Experience Records
    for exp in exp_list:
        w_rec = WorkExperienceRecord(
            application_id=new_app.id,
            candidate_id=current_user.id,
            is_fresher=exp.get("is_fresher", False),
            employer=exp.get("employer"),
            job_title=exp.get("job_title"),
            start_date=exp.get("start_date"),
            end_date=exp.get("end_date"),
            currently_working=exp.get("currently_working", False),
            key_responsibilities=exp.get("key_responsibilities"),
            years_calculated=float(exp.get("years_calculated", 0.0))
        )
        db.add(w_rec)

    db.commit()

    # 8. Trigger Notifications
    # Create notification for System Admin
    admins = db.query(User).filter(User.role == "admin").all()
    candidate_name = f"{current_user.first_name} {current_user.last_name}"
    notif_msg = f"New application received from {candidate_name} for '{req.job_title}' ({req.requisition_id})."
    
    for admin in admins:
        notif = Notification(
            user_id=admin.id,
            title="New Application Submitted",
            message=notif_msg,
            requisition_id=req.id,
            application_id=new_app.id
        )
        db.add(notif)
    
    # Candidate Confirmation Notification
    cand_notif = Notification(
        user_id=current_user.id,
        title="Application Received",
        message=f"Your application for '{req.job_title}' has been submitted successfully with ID {app_code}.",
        requisition_id=req.id,
        application_id=new_app.id
    )
    db.add(cand_notif)
    db.commit()

    # WebSocket Real-Time Push to Admin UI
    await manager.broadcast({
        "event": "NEW_APPLICATION",
        "application_code": app_code,
        "candidate_name": candidate_name,
        "job_title": req.job_title,
        "requisition_id": req.requisition_id,
        "timestamp": new_app.submitted_at.isoformat()
    })

    # Send Confirmation Email to Candidate
    submitted_at_str = new_app.submitted_at.strftime("%d %b %Y, %I:%M %p")
    send_application_confirmation_email(
        to_email=current_user.email,
        candidate_name=candidate_name,
        application_code=app_code,
        job_title=req.job_title,
        department=req.department,
        location=req.location,
        requisition_id=req.requisition_id,
        submitted_at=submitted_at_str,
    )

    return {
        "success": True,
        "message": "Application submitted successfully!",
        "application_code": app_code,
        "submitted_at": submitted_at_str,
        "status": new_app.status,
        "job_title": req.job_title,
        "requisition_id": req.requisition_id
    }

@router.get("/my")
@router.get("/my-applications")
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FR-APP-11 Logged-in candidates can view a list of jobs they have applied to along with current status.
    """
    apps = db.query(Application).filter(Application.candidate_id == current_user.id).order_by(Application.submitted_at.desc()).all()
    result = []
    for app in apps:
        req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()
        result.append({
            "id": app.id,
            "application_code": app.application_code,
            "requisition_id": req.requisition_id if req else "N/A",
            "job_title": req.job_title if req else "N/A",
            "department": req.department if req else "N/A",
            "location": req.location if req else "N/A",
            "status": app.status,
            "submitted_at": app.submitted_at.strftime("%d %b %Y, %I:%M %p"),
            "resume_file_name": app.resume_file_name
        })
    return result

# Admin Application Management Endpoints

@router.get("/admin/grid")
def get_admin_applications_grid(
    requisition_id: Optional[str] = Query(None, description="Optional requisition ID filter"),
    search: Optional[str] = Query(None, description="Search candidate name or email"),
    status_filter: Optional[str] = Query(None, description="Filter by status: New, Reviewed, Shortlisted, Rejected"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    FR-ADM-01 & FR-ADM-07 Admin applications grid view listing all candidates who applied per requisition or consolidated across all requisitions.
    """
    query = db.query(Application)

    if requisition_id:
        req_target = None
        req_str = str(requisition_id).strip()
        if req_str.isdigit():
            req_target = db.query(JobRequisition).filter(JobRequisition.id == int(req_str)).first()
        if not req_target:
            req_target = db.query(JobRequisition).filter(JobRequisition.requisition_id == req_str).first()
        
        if req_target:
            query = query.filter(Application.requisition_id == req_target.id)

    if status_filter and status_filter != "All":
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.submitted_at.desc()).all()
    if not apps:
        return []

    # Batch load all related records in bulk (eliminates N+1 queries)
    cand_ids = list(set(a.candidate_id for a in apps if a.candidate_id))
    req_ids = list(set(a.requisition_id for a in apps if a.requisition_id))
    app_ids = [a.id for a in apps]

    users_map = {u.id: u for u in db.query(User).filter(User.id.in_(cand_ids)).all()} if cand_ids else {}
    profiles_map = {p.user_id: p for p in db.query(CandidateProfile).filter(CandidateProfile.user_id.in_(cand_ids)).all()} if cand_ids else {}
    reqs_map = {r.id: r for r in db.query(JobRequisition).filter(JobRequisition.id.in_(req_ids)).all()} if req_ids else {}
    
    work_exps_raw = db.query(WorkExperienceRecord).filter(WorkExperienceRecord.application_id.in_(app_ids)).all() if app_ids else []
    work_exps_map = {}
    for w in work_exps_raw:
        work_exps_map.setdefault(w.application_id, []).append(w)

    grid_items = []
    for app in apps:
        candidate = users_map.get(app.candidate_id)
        profile = profiles_map.get(app.candidate_id)
        req = reqs_map.get(app.requisition_id)

        cand_name = f"{candidate.first_name} {candidate.last_name}" if candidate else "Unknown Candidate"
        cand_email = candidate.email if candidate else ""

        # Filter by candidate name or email search
        if search:
            s_fmt = search.lower().strip()
            if s_fmt not in cand_name.lower() and s_fmt not in cand_email.lower() and s_fmt not in app.application_code.lower():
                continue

        # Calculate Total Experience
        work_exps = work_exps_map.get(app.id, [])
        total_years = sum(w.years_calculated for w in work_exps) if work_exps else 0.0
        exp_str = "Fresher" if not work_exps or all(w.is_fresher for w in work_exps) else f"{round(total_years, 1)} yrs"

        location = profile.current_location if profile and profile.current_location else "N/A"

        grid_items.append({
            "id": app.id,
            "application_code": app.application_code,
            "candidate_id": app.candidate_id,
            "candidate_name": cand_name,
            "candidate_email": cand_email,
            "mobile": profile.mobile if profile else "N/A",
            "requisition_db_id": req.id if req else None,
            "requisition_id": req.requisition_id if req else "N/A",
            "job_title": req.job_title if req else "N/A",
            "location": location,
            "experience": exp_str,
            "total_experience_years": total_years,
            "resume_file_name": app.resume_file_name,
            "status": app.status,
            "submitted_at": app.submitted_at.strftime("%d %b %Y"),
            "submitted_at_full": app.submitted_at.strftime("%d %b %Y, %I:%M %p")
        })

    return grid_items

@router.get("/admin/detail/{app_id}")
@router.get("/admin/{app_id}")
def get_full_candidate_application(
    app_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    FR-ADM-06 View full candidate application details (bio-data, education, experience, resume, cover note).
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")

    candidate = db.query(User).filter(User.id == app.candidate_id).first()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_id).first()
    req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()
    education = db.query(EducationRecord).filter(EducationRecord.application_id == app.id).all()
    experience = db.query(WorkExperienceRecord).filter(WorkExperienceRecord.application_id == app.id).all()

    return {
        "id": app.id,
        "application_code": app.application_code,
        "status": app.status,
        "submitted_at": app.submitted_at.strftime("%d %b %Y, %I:%M %p"),
        "cover_note": app.cover_note,
        "resume_file_name": app.resume_file_name,
        "requisition": {
            "id": req.id if req else None,
            "requisition_id": req.requisition_id if req else "N/A",
            "job_title": req.job_title if req else "N/A",
            "department": req.department if req else "N/A",
            "location": req.location if req else "N/A"
        },
        "candidate": {
            "first_name": candidate.first_name if candidate else "",
            "last_name": candidate.last_name if candidate else "",
            "email": candidate.email if candidate else "",
            "mobile": profile.mobile if profile else "N/A",
            "gender": profile.gender if profile else "N/A",
            "dob": profile.dob if profile else "N/A",
            "current_location": profile.current_location if profile else "N/A",
            "current_company": profile.current_company if profile else "N/A",
            "notice_period": profile.notice_period if profile else "N/A",
            "current_address": profile.current_address if profile else "N/A"
        },
        "education": [
            {
                "degree": e.degree,
                "specialization": e.specialization,
                "institution": e.institution,
                "year_of_passing": e.year_of_passing,
                "grade": e.grade,
                "education_level": e.education_level
            } for e in education
        ],
        "work_experience": [
            {
                "is_fresher": w.is_fresher,
                "employer": w.employer,
                "job_title": w.job_title,
                "start_date": w.start_date,
                "end_date": w.end_date,
                "currently_working": w.currently_working,
                "key_responsibilities": w.key_responsibilities,
                "years_calculated": w.years_calculated
            } for w in experience
        ]
    }

@router.put("/admin/{app_id}/status")
@router.patch("/admin/{app_id}/status")
def update_application_status(
    app_id: int,
    status_update: ApplicationStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    FR-ADM-04 Update a candidate's application status (New, Reviewed, Shortlisted, Rejected).
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    valid_statuses = ["New", "Reviewed", "Shortlisted", "Rejected"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")

    app.status = status_update.status
    db.commit()

    # Create notification for candidate
    req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()
    candidate = db.query(User).filter(User.id == app.candidate_id).first()
    job_title = req.job_title if req else "your position"
    req_id_str = req.requisition_id if req else "REQ-00000"
    candidate_name = f"{candidate.first_name} {candidate.last_name}".strip() if candidate else "Candidate"
    
    cand_notif = Notification(
        user_id=app.candidate_id,
        title="Application Status Updated",
        message=f"Your application for '{job_title}' status has been updated to '{status_update.status}'.",
        requisition_id=app.requisition_id,
        application_id=app.id
    )
    db.add(cand_notif)
    db.commit()

    if candidate and candidate.email:
        try:
            send_status_update_email(
                to_email=candidate.email,
                candidate_name=candidate_name,
                application_code=app.application_code,
                job_title=job_title,
                requisition_id=req_id_str,
                new_status=status_update.status
            )
        except Exception as e:
            print(f"[STATUS EMAIL NOTICE] Could not send status update email: {e}")

    return {"message": "Status updated successfully", "id": app_id, "status": app.status}

@router.get("/resume/{app_id}")
@router.get("/admin/resume/{app_id}")
def download_resume(
    app_id: int,
    db: Session = Depends(get_db)
):
    """
    FR-ADM-02 Direct resume download / preview link.
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app or not app.resume_file_path:
        raise HTTPException(status_code=404, detail="Resume file not found")

    file_path = os.path.join(settings.UPLOAD_DIR, app.resume_file_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Resume file does not exist on server storage")

    return FileResponse(path=file_path, filename=app.resume_file_name, media_type="application/octet-stream")

@router.put("/resume/{app_id}")
async def update_resume(
    app_id: int,
    resume_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Allows a candidate to replace their submitted CV for a specific application at any time.
    Validates file type (PDF/DOC/DOCX) and size (max 5MB) before replacing.
    """
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.candidate_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found or you do not have permission.")

    filename = resume_file.filename or "resume.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".doc", ".docx"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOC, and DOCX files are accepted.")

    file_bytes = await resume_file.read()
    if len(file_bytes) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File size exceeds the {settings.MAX_FILE_SIZE_MB} MB limit.")

    # Delete old file
    old_path = os.path.join(settings.UPLOAD_DIR, app.resume_file_path)
    if os.path.exists(old_path):
        try:
            os.remove(old_path)
        except Exception:
            pass

    # Save new file
    saved_filename = f"{app.application_code}_{current_user.id}_{filename.replace(' ', '_')}"
    new_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    with open(new_path, "wb") as f:
        f.write(file_bytes)

    app.resume_file_path = saved_filename
    app.resume_file_name = filename
    db.commit()
    db.refresh(app)

    return {
        "success": True,
        "message": "CV updated successfully!",
        "application_code": app.application_code,
        "resume_file_name": app.resume_file_name
    }

@router.get("/export-csv")
@router.get("/admin/export-csv")
def export_applications_csv(
    requisition_id: Optional[str] = Query(None),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    FR-ADM-05 Admin can export the applications grid for a requisition to CSV.
    """
    try:
        req_id_int = None
        if requisition_id and str(requisition_id).strip() and str(requisition_id).strip().lower() not in ["null", "undefined", "none", ""]:
            try:
                req_id_int = int(requisition_id)
            except ValueError:
                pass

        query = db.query(Application)
        if req_id_int:
            query = query.filter(Application.requisition_id == req_id_int)

        apps = query.order_by(Application.submitted_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Application ID", "Requisition Code", "Job Title", "Candidate Name",
            "Email", "Mobile", "Location", "Experience", "Status", "Submitted Date", "Resume Filename"
        ])

        for app in apps:
            candidate = db.query(User).filter(User.id == app.candidate_id).first()
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_id).first() if candidate else None
            req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()
            work_exps = db.query(WorkExperienceRecord).filter(WorkExperienceRecord.application_id == app.id).all()
            total_years = sum(w.years_calculated for w in work_exps) if work_exps else 0.0

            submitted_str = "N/A"
            if app.submitted_at:
                if hasattr(app.submitted_at, 'strftime'):
                    submitted_str = app.submitted_at.strftime("%Y-%m-%d %H:%M:%S")
                else:
                    submitted_str = str(app.submitted_at)

            writer.writerow([
                app.application_code or "N/A",
                req.requisition_id if req else "N/A",
                req.job_title if req else "N/A",
                f"{candidate.first_name} {candidate.last_name}".strip() if candidate else "N/A",
                candidate.email if candidate else "N/A",
                profile.mobile if (profile and profile.mobile) else "N/A",
                profile.current_location if (profile and profile.current_location) else "N/A",
                f"{round(total_years, 1)} yrs" if total_years > 0 else "Fresher",
                app.status or "New",
                submitted_str,
                app.resume_file_name or "N/A"
            ])

        output.seek(0)
        filename = f"applications_export_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"[EXPORT CSV ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate CSV export: {str(e)}")
