import os
import random
import datetime
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.core.config import settings
from app.models.domain import User, CandidateProfile, JobRequisition, Application, EducationRecord, WorkExperienceRecord, Notification

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create Admin user if not exists
    admin = db.query(User).filter(User.email == "admin@talentbridge.com").first()
    if not admin:
        admin = User(
            email="admin@talentbridge.com",
            password_hash=get_password_hash("Admin@123"),
            first_name="Amit",
            last_name="Verma",
            role="admin"
        )
        db.add(admin)
        print("Created Admin: admin@talentbridge.com / Admin@123")

    # Create Sample Candidate
    candidate = db.query(User).filter(User.email == "priya.sharma@example.com").first()
    if not candidate:
        candidate = User(
            email="priya.sharma@example.com",
            password_hash=get_password_hash("Candidate@123"),
            first_name="Priya",
            last_name="Sharma",
            role="candidate"
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        profile = CandidateProfile(
            user_id=candidate.id,
            mobile="+91 98765 43210",
            gender="Female",
            dob="1995-08-15",
            current_location="Hyderabad, India",
            current_company="TechCorp Solutions",
            notice_period="30 days",
            current_address="123 Hitech City, Hyderabad, Telangana 500081"
        )
        db.add(profile)
        print("Created Candidate: priya.sharma@example.com / Candidate@123")

    db.commit()

    # Create Sample Requisitions if none exist
    if db.query(JobRequisition).count() == 0:
        reqs = [
            JobRequisition(
                requisition_id="REQ-2026-00417",
                job_title="Senior Backend Engineer",
                department="Engineering",
                location="Hyderabad, IN (Hybrid)",
                employment_type="Full-time",
                experience_range="5-8 years",
                openings=2,
                hiring_manager="Amit Verma (Admin)",
                max_salary_budget="$120,000 - $150,000 PA",
                hiring_target_date="2026-09-30",
                job_description="""We are looking for a Senior Backend Engineer to design and build scalable services powering our candidate sourcing platform. You will work closely with product and design to ship reliable, high-quality APIs.

Key Responsibilities:
• Design and develop REST APIs for job posting and application workflows
• Own database schema for requisitions, applications and candidate profiles
• Collaborate with QA and DevOps for CI/CD and production reliability

Requirements:
• 5+ years building backend services in Python / Java / Node.js
• Strong grasp of relational databases and REST API design
• Bachelor's degree in Computer Science or related field""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=10),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=8)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00418",
                job_title="Product Marketing Manager",
                department="Marketing",
                location="Remote",
                employment_type="Full-time",
                experience_range="3-6 years",
                openings=1,
                hiring_manager="Sarah Jenkins",
                max_salary_budget="$90,000 - $110,000 PA",
                hiring_target_date="2026-10-15",
                job_description="""Lead product positioning, go-to-market strategies, and content campaigns for our HR SaaS offerings.

Key Responsibilities:
• Develop product messaging that resonates with enterprise HR leaders
• Execute multi-channel marketing campaigns
• Work with sales enablement to drive conversion

Requirements:
• 3+ years experience in B2B SaaS marketing
• Exceptional copywriting and analytical skills""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=6),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00419",
                job_title="UX Designer",
                department="Design",
                location="Bengaluru, IN",
                employment_type="Full-time",
                experience_range="2-5 years",
                openings=2,
                hiring_manager="Rohan Mehta",
                max_salary_budget="₹18,00,000 - ₹24,00,000 PA",
                hiring_target_date="2026-09-15",
                job_description="""Craft clean, accessible, and intuitive visual interfaces for our web and mobile recruitment platform.

Key Responsibilities:
• Create wireframes, interactive prototypes, and high-fidelity mockups
• Conduct usability testing with internal HR users
• Maintain design design tokens and component libraries

Requirements:
• Portfolio demonstrating end-to-end design process
• Proficiency in Figma, Tailwind CSS design principles""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=14),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=12)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00420",
                job_title="Data Analyst",
                department="Analytics",
                location="Hyderabad, IN",
                employment_type="Contract",
                experience_range="1-3 years",
                openings=1,
                hiring_manager="Vikram Rao",
                max_salary_budget="₹10,00,000 - ₹14,00,000 PA",
                hiring_target_date="2026-09-01",
                job_description="""Transform raw sourcing metrics into actionable insights for recruiters and Talent Acquisition leadership.

Key Responsibilities:
• Build SQL dashboards tracking application conversion rates
• Generate monthly hiring pipeline reports""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=8),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=7)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00421",
                job_title="HR Business Partner",
                department="People Ops",
                location="Pune, IN",
                employment_type="Full-time",
                experience_range="6-9 years",
                openings=1,
                hiring_manager="Sneha Iyer",
                max_salary_budget="₹22,00,000 PA",
                hiring_target_date="2026-10-01",
                job_description="""Partner with business unit heads to drive talent strategy, performance management, and organizational development.""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=15),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=14)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00422",
                job_title="QA Automation Engineer",
                department="Engineering",
                location="Remote",
                employment_type="Full-time",
                experience_range="3-5 years",
                openings=3,
                hiring_manager="Amit Verma",
                max_salary_budget="$85,00,000 PA",
                hiring_target_date="2026-09-20",
                job_description="""Build end-to-end automated test suites for frontend UI and REST API backend.""",
                status="Published",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=18),
                posted_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
            ),
            JobRequisition(
                requisition_id="REQ-2026-00423",
                job_title="AI Research Engineer (Draft)",
                department="Engineering",
                location="Remote",
                employment_type="Full-time",
                experience_range="4-7 years",
                openings=1,
                hiring_manager="Amit Verma",
                max_salary_budget="$160,000 PA",
                hiring_target_date="2026-11-01",
                job_description="""Draft requisition for upcoming Phase 2 candidate matching feature.""",
                status="Draft",
                created_at=datetime.datetime.utcnow()
            )
        ]
        db.add_all(reqs)
        db.commit()
        print(f"Seeded {len(reqs)} job requisitions!")

    # Create sample dummy resume file in uploads
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    sample_resume_path = os.path.join(settings.UPLOAD_DIR, "Priya_Sharma_Resume.pdf")
    if not os.path.exists(sample_resume_path):
        with open(sample_resume_path, "wb") as f:
            f.write(b"%PDF-1.4 Sample Resume File for Priya Sharma - Senior Backend Engineer Candidate")

    # Seed initial applications matching wireframe 8.8 (Admin Grid)
    backend_req = db.query(JobRequisition).filter(JobRequisition.requisition_id == "REQ-2026-00417").first()
    cand_user = db.query(User).filter(User.email == "priya.sharma@example.com").first()

    if backend_req and cand_user and db.query(Application).count() == 0:
        sample_candidates_data = [
            ("Priya Sharma", "priya.sharma@example.com", "Hyderabad", 6.0, "New", "Priya_Sharma_Resume.pdf"),
            ("Rahul Nair", "rahul.nair@example.com", "Bengaluru", 7.0, "Reviewed", "Rahul_Nair_Resume.pdf"),
            ("Ananya Gupta", "ananya.gupta@example.com", "Pune", 5.0, "Shortlisted", "Ananya_Gupta_Resume.pdf"),
            ("Vikram Rao", "vikram.rao@example.com", "Remote", 8.0, "New", "Vikram_Rao_Resume.pdf"),
            ("Sneha Iyer", "sneha.iyer@example.com", "Hyderabad", 4.0, "Rejected", "Sneha_Iyer_Resume.pdf"),
            ("Karan Mehta", "karan.mehta@example.com", "Chennai", 6.0, "Reviewed", "Karan_Mehta_Resume.pdf"),
            ("Divya Menon", "divya.menon@example.com", "Hyderabad", 5.0, "New", "Divya_Menon_Resume.pdf"),
            ("Arjun Das", "arjun.das@example.com", "Remote", 9.0, "Shortlisted", "Arjun_Das_Resume.pdf"),
        ]

        days_offset = 5
        for name, email, loc, exp_yrs, status_val, r_name in sample_candidates_data:
            # Create user if needed
            fname, lname = name.split(" ", 1)
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    password_hash=get_password_hash("Candidate@123"),
                    first_name=fname,
                    last_name=lname,
                    role="candidate"
                )
                db.add(u)
                db.commit()
                db.refresh(u)

                cp = CandidateProfile(
                    user_id=u.id,
                    mobile="+91 98765 12345",
                    current_location=loc,
                    current_company="Tech Solutions",
                    notice_period="30 days"
                )
                db.add(cp)

            app_code = f"APP-{random.randint(10000, 99999)}"
            r_path = os.path.join(settings.UPLOAD_DIR, r_name)
            if not os.path.exists(r_path):
                with open(r_path, "wb") as f:
                    f.write(f"%PDF-1.4 Resume for {name}".encode())

            app_rec = Application(
                application_code=app_code,
                requisition_id=backend_req.id,
                candidate_id=u.id,
                cover_note=f"Experienced backend engineer excited about joining the engineering team at TalentBridge.",
                resume_file_path=r_name,
                resume_file_name=r_name,
                data_accuracy_consent=True,
                privacy_policy_consent=True,
                status=status_val,
                submitted_at=datetime.datetime.utcnow() - datetime.timedelta(days=days_offset)
            )
            db.add(app_rec)
            db.commit()

            # Education
            edu = EducationRecord(
                application_id=app_rec.id,
                candidate_id=u.id,
                degree="B.Tech Computer Science",
                specialization="Computer Science",
                institution="National Institute of Technology",
                year_of_passing="2018",
                grade="8.5 CGPA",
                education_level="Bachelor's"
            )
            db.add(edu)

            # Work Exp
            exp = WorkExperienceRecord(
                application_id=app_rec.id,
                candidate_id=u.id,
                is_fresher=False,
                employer="Enterprise Cloud Systems",
                job_title="Software Development Engineer II",
                start_date="2018-06",
                end_date="2024-08",
                currently_working=True,
                key_responsibilities="Designed microservices and optimized PostgreSQL queries.",
                years_calculated=exp_yrs
            )
            db.add(exp)
            days_offset += 1

        db.commit()
        print("Seeded sample candidate applications for Admin Grid demonstration!")

    db.close()

if __name__ == "__main__":
    seed()
