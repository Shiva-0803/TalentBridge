from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# OTP Schemas
class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    mobile: Optional[str] = None

# Admin Static Credential Login Schema
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

# Legacy Auth Schemas
class UserRegister(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    mobile: Optional[str] = None
    role: Optional[str] = "candidate"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Bio-Data Schema
class BioDataSchema(BaseModel):
    first_name: str
    last_name: str
    gender: Optional[str] = None
    email: EmailStr
    mobile: str
    dob: Optional[str] = None
    current_location: str
    current_company: Optional[str] = None
    notice_period: Optional[str] = None
    current_address: Optional[str] = None

# Education Schema
class EducationRecordSchema(BaseModel):
    degree: str
    specialization: Optional[str] = None
    institution: str
    year_of_passing: str
    grade: Optional[str] = None
    education_level: str

# Work Experience Schema
class WorkExperienceRecordSchema(BaseModel):
    is_fresher: bool = False
    employer: Optional[str] = None
    job_title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    currently_working: bool = False
    key_responsibilities: Optional[str] = None

# Requisition Schemas
class RequisitionBase(BaseModel):
    company_name: Optional[str] = "TalentBridge"
    job_title: str = Field(..., max_length=100)
    department: str
    location: str
    employment_type: str
    experience_range: str
    openings: int = 1
    hiring_manager: Optional[str] = "Recruitment Team"
    max_salary_budget: Optional[str] = None
    hiring_target_date: Optional[str] = None
    job_description: str
    status: str = "Draft"

class RequisitionCreate(RequisitionBase):
    pass

class RequisitionUpdate(RequisitionBase):
    pass

class RequisitionResponse(RequisitionBase):
    id: int
    requisition_id: str
    created_at: datetime
    posted_at: Optional[datetime] = None
    application_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Application Status Update
class ApplicationStatusUpdate(BaseModel):
    status: str

# Notification Schema
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    requisition_id: Optional[int] = None
    application_id: Optional[int] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
