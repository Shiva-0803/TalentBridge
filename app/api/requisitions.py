import datetime
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_db
from app.models.domain import JobRequisition, Application, User
from app.schemas.pydantic_schemas import RequisitionCreate, RequisitionUpdate, RequisitionResponse
from app.api.auth import get_current_admin, get_current_user

router = APIRouter(prefix="/requisitions", tags=["Job Requisitions"])

def generate_req_id(db: Session) -> str:
    year = datetime.datetime.now().year
    count = db.query(JobRequisition).count() + 1
    return f"REQ-{year}-{count:05d}"

# Public Endpoints (No authentication required)

@router.get("/public")
def list_public_requisitions(
    search: Optional[str] = Query(None, description="Search keyword in title or description"),
    department: Optional[str] = Query(None, description="Filter by department"),
    location: Optional[str] = Query(None, description="Filter by location"),
    experience: Optional[str] = Query(None, description="Filter by experience range"),
    db: Session = Depends(get_db)
):
    """
    Public listing of all 'Published' job requisitions. Browsable without login.
    """
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

    requisitions = query.order_by(JobRequisition.posted_at.desc(), JobRequisition.id.desc()).all()
    
    # Batch query application counts to eliminate N+1 latency
    counts_raw = db.query(Application.requisition_id, func.count(Application.id)).group_by(Application.requisition_id).all()
    app_counts = {r_id: count for r_id, count in counts_raw}

    # Return formatted list
    result = []
    for req in requisitions:
        app_count = app_counts.get(req.id, 0)
        result.append({
            "id": req.id,
            "requisition_id": req.requisition_id,
            "job_title": req.job_title,
            "department": req.department,
            "location": req.location,
            "employment_type": req.employment_type,
            "experience_range": req.experience_range,
            "openings": req.openings,
            "hiring_manager": req.hiring_manager,
            "max_salary_budget": req.max_salary_budget,
            "hiring_target_date": req.hiring_target_date,
            "job_description": req.job_description,
            "status": req.status,
            "created_at": req.created_at,
            "posted_at": req.posted_at,
            "application_count": app_count
        })
    return result

@router.get("/public/filters")
def get_public_filters(db: Session = Depends(get_db)):
    """
    Returns unique active departments, locations, and experience ranges for public filtering.
    """
    active_reqs = db.query(JobRequisition).filter(JobRequisition.status == "Published").all()
    departments = sorted(list(set(r.department for r in active_reqs if r.department)))
    locations = sorted(list(set(r.location for r in active_reqs if r.location)))
    experiences = sorted(list(set(r.experience_range for r in active_reqs if r.experience_range)))
    
    return {
        "departments": departments,
        "locations": locations,
        "experiences": experiences
    }

@router.get("/public/{id}")
def get_public_requisition_detail(id: str, db: Session = Depends(get_db)):
    """
    Public detailed view of a single published job requisition.
    Supports lookup by database int ID or string requisition_id (e.g. REQ-2026-00001).
    """
    req = None
    if id.isdigit():
        req = db.query(JobRequisition).filter(JobRequisition.id == int(id)).first()

    if not req:
        clean_req_id = id.strip().replace(" ", "-")
        req = db.query(JobRequisition).filter(
            or_(
                JobRequisition.requisition_id == id.strip(),
                JobRequisition.requisition_id == clean_req_id,
                JobRequisition.requisition_id.ilike(f"%{clean_req_id}%")
            )
        ).first()

    if not req or req.status != "Published":
        raise HTTPException(status_code=404, detail="Job opening not found or is no longer accepting applications.")
    
    app_count = db.query(Application).filter(Application.requisition_id == req.id).count()
    
    return {
        "id": req.id,
        "requisition_id": req.requisition_id,
        "job_title": req.job_title,
        "department": req.department,
        "location": req.location,
        "employment_type": req.employment_type,
        "experience_range": req.experience_range,
        "openings": req.openings,
        "hiring_manager": req.hiring_manager,
        "max_salary_budget": req.max_salary_budget,
        "hiring_target_date": req.hiring_target_date,
        "job_description": req.job_description,
        "status": req.status,
        "created_at": req.created_at,
        "posted_at": req.posted_at,
        "application_count": app_count
    }

# Admin Endpoints (Restricted to System Admin)

@router.get("/admin")
def list_admin_requisitions(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    List all requisitions across all statuses (Draft, Published, Closed) with application counts for Admin console.
    """
    requisitions = db.query(JobRequisition).order_by(JobRequisition.id.desc()).all()
    
    # Batch query application counts to eliminate N+1 latency
    counts_raw = db.query(Application.requisition_id, func.count(Application.id)).group_by(Application.requisition_id).all()
    app_counts = {r_id: count for r_id, count in counts_raw}

    result = []
    for req in requisitions:
        app_count = app_counts.get(req.id, 0)
        result.append({
            "id": req.id,
            "requisition_id": req.requisition_id,
            "job_title": req.job_title,
            "department": req.department,
            "location": req.location,
            "employment_type": req.employment_type,
            "experience_range": req.experience_range,
            "openings": req.openings,
            "hiring_manager": req.hiring_manager,
            "max_salary_budget": req.max_salary_budget,
            "hiring_target_date": req.hiring_target_date,
            "job_description": req.job_description,
            "status": req.status,
            "created_at": req.created_at,
            "posted_at": req.posted_at,
            "application_count": app_count
        })
    return result

@router.post("/admin", response_model=RequisitionResponse)
def create_requisition(
    req_data: RequisitionCreate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    req_code = generate_req_id(db)
    now = datetime.datetime.utcnow()
    posted_at = now if req_data.status == "Published" else None

    requisition = JobRequisition(
        requisition_id=req_code,
        company_name=req_data.company_name or "TalentBridge",
        job_title=req_data.job_title,
        department=req_data.department,
        location=req_data.location,
        employment_type=req_data.employment_type,
        experience_range=req_data.experience_range,
        openings=req_data.openings,
        hiring_manager=req_data.hiring_manager or "HR Recruiting Team",
        max_salary_budget=req_data.max_salary_budget,
        hiring_target_date=req_data.hiring_target_date,
        job_description=req_data.job_description,
        status=req_data.status,
        created_at=now,
        posted_at=posted_at
    )
    db.add(requisition)
    db.commit()
    db.refresh(requisition)
    requisition.application_count = 0
    return requisition

@router.put("/admin/{id}", response_model=RequisitionResponse)
def update_requisition(
    id: int,
    req_data: RequisitionUpdate,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    req = db.query(JobRequisition).filter(JobRequisition.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    old_status = req.status
    req.company_name = req_data.company_name or "TalentBridge"
    req.job_title = req_data.job_title
    req.department = req_data.department
    req.location = req_data.location
    req.employment_type = req_data.employment_type
    req.experience_range = req_data.experience_range
    req.openings = req_data.openings
    req.hiring_manager = req_data.hiring_manager or "HR Recruiting Team"
    req.max_salary_budget = req_data.max_salary_budget
    req.hiring_target_date = req_data.hiring_target_date
    req.job_description = req_data.job_description
    req.status = req_data.status

    if old_status != "Published" and req_data.status == "Published":
        req.posted_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(req)
    req.application_count = db.query(Application).filter(Application.requisition_id == req.id).count()
    return req

@router.post("/admin/{id}/duplicate")
def duplicate_requisition(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    FR-JR-07 Clone an existing requisition as a starting draft.
    """
    original = db.query(JobRequisition).filter(JobRequisition.id == id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Original requisition not found")

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
    return {
        "message": "Requisition cloned successfully",
        "id": cloned.id,
        "requisition_id": cloned.requisition_id
    }

@router.patch("/admin/{id}/status")
def change_requisition_status(
    id: int,
    status_val: str = Query(..., description="Draft, Published, or Closed"),
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    req = db.query(JobRequisition).filter(JobRequisition.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    if status_val not in ["Draft", "Published", "Closed"]:
        raise HTTPException(status_code=400, detail="Invalid status value")

    old_status = req.status
    req.status = status_val
    if old_status != "Published" and status_val == "Published":
        req.posted_at = datetime.datetime.utcnow()

    db.commit()
    return {"message": f"Status updated to {status_val}", "id": id, "status": status_val}

@router.delete("/admin/{id}")
def delete_requisition(
    id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes a job requisition and its associated applications.
    """
    req = db.query(JobRequisition).filter(JobRequisition.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    # Delete associated applications
    db.query(Application).filter(Application.requisition_id == req.id).delete()

    # Delete requisition
    db.delete(req)
    db.commit()

    return {"message": "Requisition deleted successfully", "id": id}

