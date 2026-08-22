import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    role = Column(String, default="candidate") # admin or candidate
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate")
    notifications = relationship("Notification", back_populates="user")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    mobile = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    current_location = Column(String, nullable=True)
    current_company = Column(String, nullable=True)
    notice_period = Column(String, nullable=True)
    current_address = Column(Text, nullable=True)
    profile_photo_url = Column(String, nullable=True)

    user = relationship("User", back_populates="profile")

class JobRequisition(Base):
    __tablename__ = "job_requisitions"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(String, unique=True, index=True, nullable=False) # e.g. REQ-2026-00417
    job_title = Column(String(100), nullable=False)
    department = Column(String, nullable=False)
    location = Column(String, nullable=False)
    employment_type = Column(String, nullable=False) # Full-time, Part-time, Contract, Internship
    experience_range = Column(String, nullable=False) # e.g. 5-8 years
    openings = Column(Integer, default=1, nullable=False)
    hiring_manager = Column(String, nullable=False)
    max_salary_budget = Column(String, nullable=True)
    hiring_target_date = Column(String, nullable=True)
    job_description = Column(Text, nullable=False)
    status = Column(String, default="Draft", nullable=False) # Draft, Published, Closed
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    posted_at = Column(DateTime, nullable=True)

    applications = relationship("Application", back_populates="requisition", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    application_code = Column(String, unique=True, index=True, nullable=False) # e.g. APP-88213
    requisition_id = Column(Integer, ForeignKey("job_requisitions.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    cover_note = Column(Text, nullable=True)
    resume_file_path = Column(String, nullable=False)
    resume_file_name = Column(String, nullable=False)
    data_accuracy_consent = Column(Boolean, default=True, nullable=False)
    privacy_policy_consent = Column(Boolean, default=True, nullable=False)
    status = Column(String, default="New", nullable=False) # New, Reviewed, Shortlisted, Rejected
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    requisition = relationship("JobRequisition", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    education_records = relationship("EducationRecord", back_populates="application", cascade="all, delete-orphan")
    work_experiences = relationship("WorkExperienceRecord", back_populates="application", cascade="all, delete-orphan")

class EducationRecord(Base):
    __tablename__ = "education_records"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    degree = Column(String, nullable=False)
    specialization = Column(String, nullable=True)
    institution = Column(String, nullable=False)
    year_of_passing = Column(String, nullable=False)
    grade = Column(String, nullable=True)
    education_level = Column(String, nullable=False) # High School, Diploma, Bachelor's, Master's, Doctorate

    application = relationship("Application", back_populates="education_records")

class WorkExperienceRecord(Base):
    __tablename__ = "work_experience_records"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_fresher = Column(Boolean, default=False)
    employer = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    currently_working = Column(Boolean, default=False)
    key_responsibilities = Column(Text, nullable=True)
    years_calculated = Column(Float, default=0.0)

    application = relationship("Application", back_populates="work_experiences")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    requisition_id = Column(Integer, nullable=True)
    application_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")
