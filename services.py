import os
import random
import datetime
import pandas as pd
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from models import (
    User, CandidateProfile, JobRequisition, Application,
    EducationRecord, WorkExperienceRecord, Notification
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def generate_req_id(db: Session) -> str:
    year = datetime.datetime.now().year
    count = db.query(JobRequisition).count() + 1
    return f"REQ-{year}-{count:05d}"

def generate_app_code() -> str:
    code_num = random.randint(10000, 99999)
    return f"APP-{code_num}"

# Requisitions Services

def get_public_requisitions(db: Session, search: str = "", department: str = "All", location: str = "All", experience: str = "All"):
    query = db.query(JobRequisition).filter(JobRequisition.status == "Published")

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                JobRequisition.job_title.ilike(search_fmt),
                JobRequisition.job_description.ilike(search_fmt),
                JobRequisition.department.ilike(search_fmt),
                JobRequisition.location.ilike(search_fmt)
            )
        )

    if department and department != "All":
        query = query.filter(JobRequisition.department == department)

    if location and location != "All":
        query = query.filter(JobRequisition.location.ilike(f"%{location}%"))

    if experience and experience != "All":
        query = query.filter(JobRequisition.experience_range.ilike(f"%{experience}%"))

    reqs = query.order_by(JobRequisition.posted_at.desc(), JobRequisition.id.desc()).all()
    
    result = []
    for r in reqs:
        app_count = db.query(Application).filter(Application.requisition_id == r.id).count()
        result.append({
            "id": r.id,
            "requisition_id": r.requisition_id,
            "job_title": r.job_title,
            "department": r.department,
            "location": r.location,
            "employment_type": r.employment_type,
            "experience_range": r.experience_range,
            "openings": r.openings,
            "hiring_manager": r.hiring_manager,
            "max_salary_budget": r.max_salary_budget,
            "hiring_target_date": r.hiring_target_date,
            "job_description": r.job_description,
            "status": r.status,
            "posted_at": r.posted_at.strftime("%d %b %Y") if r.posted_at else "Recently",
            "application_count": app_count
        })
    return result

def get_filter_options(db: Session):
    published = db.query(JobRequisition).filter(JobRequisition.status == "Published").all()
    departments = sorted(list(set(req.department for req in published if req.department)))
    locations = sorted(list(set(req.location for req in published if req.location)))
    experiences = sorted(list(set(req.experience_range for req in published if req.experience_range)))
    return {
        "departments": ["All"] + departments,
        "locations": ["All"] + locations,
        "experiences": ["All"] + experiences
    }

def get_admin_requisitions(db: Session):
    reqs = db.query(JobRequisition).order_by(JobRequisition.id.desc()).all()
    result = []
    for r in reqs:
        app_count = db.query(Application).filter(Application.requisition_id == r.id).count()
        result.append({
            "id": r.id,
            "requisition_id": r.requisition_id,
            "job_title": r.job_title,
            "department": r.department,
            "location": r.location,
            "employment_type": r.employment_type,
            "experience_range": r.experience_range,
            "openings": r.openings,
            "hiring_manager": r.hiring_manager,
            "max_salary_budget": r.max_salary_budget,
            "hiring_target_date": r.hiring_target_date,
            "job_description": r.job_description,
            "status": r.status,
            "created_at": r.created_at.strftime("%d %b %Y") if r.created_at else "",
            "application_count": app_count
        })
    return result

def create_requisition(db: Session, data: dict):
    req_code = generate_req_id(db)
    now = datetime.datetime.utcnow()
    posted_at = now if data.get("status") == "Published" else None

    req = JobRequisition(
        requisition_id=req_code,
        job_title=data["job_title"],
        department=data["department"],
        location=data["location"],
        employment_type=data["employment_type"],
        experience_range=data["experience_range"],
        openings=int(data.get("openings", 1)),
        hiring_manager=data["hiring_manager"],
        max_salary_budget=data.get("max_salary_budget"),
        hiring_target_date=data.get("hiring_target_date"),
        job_description=data["job_description"],
        status=data.get("status", "Draft"),
        created_at=now,
        posted_at=posted_at
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

def duplicate_requisition(db: Session, req_id: int):
    original = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if not original:
        return None
    
    req_code = generate_req_id(db)
    cloned = JobRequisition(
        requisition_id=req_code,
        job_title=f"{original.job_title} (Copy)",
        department=original.department,
        location=original.location,
        employment_type=original.employment_type,
        experience_range=original.experience_range,
        openings=original.openings,
        hiring_manager=original.hiring_manager,
        max_salary_budget=original.max_salary_budget,
        hiring_target_date=original.hiring_target_date,
        job_description=original.job_description,
        status="Draft",
        created_at=datetime.datetime.utcnow()
    )
    db.add(cloned)
    db.commit()
    db.refresh(cloned)
    return cloned

def update_requisition_status(db: Session, req_id: int, new_status: str):
    req = db.query(JobRequisition).filter(JobRequisition.id == req_id).first()
    if req:
        old_status = req.status
        req.status = new_status
        if old_status != "Published" and new_status == "Published":
            req.posted_at = datetime.datetime.utcnow()
        db.commit()

# Candidate Application Services

def submit_candidate_application(
    db: Session,
    candidate_user: User,
    requisition_id: int,
    bio_data: dict,
    education_records: list,
    experience_records: list,
    cover_note: str,
    resume_file_obj,
    resume_filename: str
):
    # 1. Duplicate check
    existing = db.query(Application).filter(
        Application.requisition_id == requisition_id,
        Application.candidate_id == candidate_user.id
    ).first()
    if existing:
        return None, "You have already applied for this position. Duplicate applications are not allowed."

    # 2. Save resume file to disk
    app_code = generate_app_code()
    saved_filename = f"{app_code}_{candidate_user.id}_{resume_filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(file_path, "wb") as f:
        f.write(resume_file_obj.read())

    # 3. Update candidate profile
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=candidate_user.id)
        db.add(profile)

    profile.mobile = bio_data.get("mobile", profile.mobile)
    profile.gender = bio_data.get("gender", profile.gender)
    profile.dob = bio_data.get("dob", profile.dob)
    profile.current_location = bio_data.get("current_location", profile.current_location)
    profile.current_company = bio_data.get("current_company", profile.current_company)
    profile.notice_period = bio_data.get("notice_period", profile.notice_period)
    profile.current_address = bio_data.get("current_address", profile.current_address)

    candidate_user.first_name = bio_data.get("first_name", candidate_user.first_name)
    candidate_user.last_name = bio_data.get("last_name", candidate_user.last_name)

    # 4. Create Application record
    new_app = Application(
        application_code=app_code,
        requisition_id=requisition_id,
        candidate_id=candidate_user.id,
        cover_note=cover_note,
        resume_file_path=saved_filename,
        resume_file_name=resume_filename,
        data_accuracy_consent=True,
        privacy_policy_consent=True,
        status="New",
        submitted_at=datetime.datetime.utcnow()
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # 5. Education records
    for edu in education_records:
        e_rec = EducationRecord(
            application_id=new_app.id,
            candidate_id=candidate_user.id,
            degree=edu.get("degree", ""),
            specialization=edu.get("specialization", ""),
            institution=edu.get("institution", ""),
            year_of_passing=str(edu.get("year_of_passing", "")),
            grade=edu.get("grade", ""),
            education_level=edu.get("education_level", "Bachelor's")
        )
        db.add(e_rec)

    # 6. Work experience records
    for exp in experience_records:
        w_rec = WorkExperienceRecord(
            application_id=new_app.id,
            candidate_id=candidate_user.id,
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

    # 7. Notifications
    req = db.query(JobRequisition).filter(JobRequisition.id == requisition_id).first()
    admins = db.query(User).filter(User.role == "admin").all()
    cand_name = f"{candidate_user.first_name} {candidate_user.last_name}"

    for admin in admins:
        n = Notification(
            user_id=admin.id,
            title="New Application Submitted",
            message=f"New application received from {cand_name} for '{req.job_title}' ({req.requisition_id}).",
            requisition_id=req.id,
            application_id=new_app.id
        )
        db.add(n)

    cand_n = Notification(
        user_id=candidate_user.id,
        title="Application Received",
        message=f"Your application for '{req.job_title}' has been submitted with ID {app_code}.",
        requisition_id=req.id,
        application_id=new_app.id
    )
    db.add(cand_n)
    db.commit()

    return new_app, None

def get_my_applications(db: Session, candidate_id: int):
    apps = db.query(Application).filter(Application.candidate_id == candidate_id).order_by(Application.submitted_at.desc()).all()
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

# Admin Review Grid Services

def get_admin_applications_grid(db: Session, requisition_id: Optional[int] = None, search: str = "", status_filter: str = "All"):
    query = db.query(Application)

    if requisition_id:
        query = query.filter(Application.requisition_id == requisition_id)

    if status_filter and status_filter != "All":
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.submitted_at.desc()).all()

    grid_items = []
    for app in apps:
        candidate = db.query(User).filter(User.id == app.candidate_id).first()
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_id).first()
        req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()

        cand_name = f"{candidate.first_name} {candidate.last_name}" if candidate else "Unknown Candidate"
        cand_email = candidate.email if candidate else ""

        if search:
            s_fmt = search.lower().strip()
            if s_fmt not in cand_name.lower() and s_fmt not in cand_email.lower() and s_fmt not in app.application_code.lower():
                continue

        work_exps = db.query(WorkExperienceRecord).filter(WorkExperienceRecord.application_id == app.id).all()
        total_years = sum(w.years_calculated for w in work_exps) if work_exps else 0.0
        exp_str = "Fresher" if not work_exps or all(w.is_fresher for w in work_exps) else f"{round(total_years, 1)} yrs"

        grid_items.append({
            "id": app.id,
            "application_code": app.application_code,
            "candidate_name": cand_name,
            "candidate_email": cand_email,
            "mobile": profile.mobile if profile else "N/A",
            "requisition_id": req.requisition_id if req else "N/A",
            "job_title": req.job_title if req else "N/A",
            "location": profile.current_location if profile and profile.current_location else "N/A",
            "experience": exp_str,
            "resume_file_name": app.resume_file_name,
            "resume_file_path": app.resume_file_path,
            "status": app.status,
            "submitted_at": app.submitted_at.strftime("%d %b %Y")
        })

    return grid_items

def update_application_status(db: Session, app_id: int, new_status: str):
    app = db.query(Application).filter(Application.id == app_id).first()
    if app:
        app.status = new_status
        db.commit()

        req = db.query(JobRequisition).filter(JobRequisition.id == app.requisition_id).first()
        job_title = req.job_title if req else "your position"
        cand_n = Notification(
            user_id=app.candidate_id,
            title="Application Status Updated",
            message=f"Your application for '{job_title}' status has been updated to '{new_status}'.",
            requisition_id=app.requisition_id,
            application_id=app.id
        )
        db.add(cand_n)
        db.commit()

def generate_applications_df(db: Session, requisition_id: Optional[int] = None):
    grid = get_admin_applications_grid(db, requisition_id=requisition_id)
    if not grid:
        return pd.DataFrame()
    
    df = pd.DataFrame(grid)
    df = df.rename(columns={
        "application_code": "Application ID",
        "requisition_id": "Requisition Code",
        "job_title": "Job Title",
        "candidate_name": "Candidate Name",
        "candidate_email": "Candidate Email",
        "mobile": "Mobile",
        "location": "Location",
        "experience": "Experience",
        "status": "Status",
        "submitted_at": "Submitted Date",
        "resume_file_name": "Resume Filename"
    })
    cols = ["Application ID", "Requisition Code", "Job Title", "Candidate Name", "Candidate Email", "Mobile", "Location", "Experience", "Status", "Submitted Date", "Resume Filename"]
    return df[cols]
