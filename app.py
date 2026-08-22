import os
import streamlit as st
import datetime
import pandas as pd
from database import SessionLocal
from auth import authenticate_user, register_user
from models import User, CandidateProfile, JobRequisition, Application, EducationRecord, WorkExperienceRecord, Notification
import services

# Page Configuration
st.set_page_config(
    page_title="TalentBridge - Candidate Sourcing System",
    page_icon="💼",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Inject Custom CSS for Modern UI Styling matching BRD Wireframes
st.markdown("""
<style>
    /* Custom Styling */
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #64748b;
        margin-bottom: 1.5rem;
    }
    .job-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    }
    .badge-dept {
        background-color: #eff6ff;
        color: #1d4ed8;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        text-transform: uppercase;
    }
    .badge-status-new { background-color: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
    .badge-status-reviewed { background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
    .badge-status-shortlisted { background-color: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
    .badge-status-rejected { background-color: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.8rem; }
</style>
""", unsafe_allow_html=True)

# Session State Initialization
if "user" not in st.session_state:
    st.session_state.user = None
if "current_page" not in st.session_state:
    st.session_state.current_page = "Public Jobs"
if "apply_target_req" not in st.session_state:
    st.session_state.apply_target_req = None
if "app_confirmation" not in st.session_state:
    st.session_state.app_confirmation = None

# Database Session Helper
db = SessionLocal()

# Unread Notifications Count
def get_unread_count():
    if not st.session_state.user:
        return 0
    return db.query(Notification).filter(
        Notification.user_id == st.session_state.user["id"],
        Notification.is_read == False
    ).count()

# Sidebar Navigation & Authentication
with st.sidebar:
    st.image("https://img.icons8.com/color/96/briefcase.png", width=64)
    st.title("TalentBridge")
    st.caption("Candidate Sourcing System v1.0")
    st.divider()

    # User Profile / Login Box
    if st.session_state.user:
        st.markdown(f"👤 **Logged in as:** {st.session_state.user['first_name']} {st.session_state.user['last_name']}")
        st.caption(f"Role: **{st.session_state.user['role'].upper()}** ({st.session_state.user['email']})")
        
        # Notifications Counter Bell
        unread = get_unread_count()
        if unread > 0:
            st.warning(f"🔔 You have {unread} unread notification(s)")
        
        if st.button("🚪 Sign Out", use_container_width=True):
            st.session_state.user = None
            st.session_state.current_page = "Public Jobs"
            st.session_state.apply_target_req = None
            st.rerun()
    else:
        st.markdown("🔒 **Not Logged In**")
        st.caption("Login or register to submit applications or access admin features.")
        
        with st.popover("🔑 Login / Register", use_container_width=True):
            tab_login, tab_reg = st.tabs(["Log In", "Create Account"])
            
            with tab_login:
                login_email = st.text_input("Email", value="priya.sharma@example.com", key="login_e")
                login_pass = st.text_input("Password", value="Candidate@123", type="password", key="login_p")
                
                col_c, col_a = st.columns(2)
                with col_c:
                    if st.button("Demo Candidate", use_container_width=True):
                        login_email, login_pass = "priya.sharma@example.com", "Candidate@123"
                with col_a:
                    if st.button("Demo Admin", use_container_width=True):
                        login_email, login_pass = "admin@talentbridge.com", "Admin@123"

                if st.button("Submit Login", type="primary", use_container_width=True):
                    user_obj, err = authenticate_user(db, login_email, login_pass)
                    if err:
                        st.error(err)
                    else:
                        st.session_state.user = {
                            "id": user_obj.id,
                            "email": user_obj.email,
                            "first_name": user_obj.first_name,
                            "last_name": user_obj.last_name,
                            "role": user_obj.role
                        }
                        st.success(f"Welcome, {user_obj.first_name}!")
                        if st.session_state.apply_target_req:
                            st.session_state.current_page = "Apply Now"
                        st.rerun()

            with tab_reg:
                rfname = st.text_input("First Name", key="r_fn")
                rlname = st.text_input("Last Name", key="r_ln")
                remail = st.text_input("Email", key="r_em")
                rmobile = st.text_input("Mobile", key="r_mb")
                rpass = st.text_input("Password", type="password", key="r_pw")

                if st.button("Register Candidate Account", type="primary", use_container_width=True):
                    user_obj, err = register_user(db, rfname, rlname, remail, rpass, rmobile, role="candidate")
                    if err:
                        st.error(err)
                    else:
                        st.session_state.user = {
                            "id": user_obj.id,
                            "email": user_obj.email,
                            "first_name": user_obj.first_name,
                            "last_name": user_obj.last_name,
                            "role": user_obj.role
                        }
                        st.success("Account created successfully!")
                        st.rerun()

    st.divider()

    # Navigation Menu Items
    nav_options = ["📢 Public Jobs"]
    if st.session_state.user and st.session_state.user["role"] == "candidate":
        nav_options.append("📄 My Applications")

    if st.session_state.user and st.session_state.user["role"] == "admin":
        nav_options.append("🛠️ Manage Requisitions")
        nav_options.append("📊 Applications Review Grid")

    choice = st.radio("Navigation Menu", nav_options, index=0)
    if choice == "📢 Public Jobs":
        st.session_state.current_page = "Public Jobs"
    elif choice == "📄 My Applications":
        st.session_state.current_page = "My Applications"
    elif choice == "🛠️ Manage Requisitions":
        st.session_state.current_page = "Manage Requisitions"
    elif choice == "📊 Applications Review Grid":
        st.session_state.current_page = "Applications Grid"


# ==========================================
# PAGE 1: PUBLIC CAREERS PORTAL (No Login Required)
# ==========================================
if st.session_state.current_page == "Public Jobs":
    st.markdown('<div class="main-header">Find your next opportunity</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Browse open positions at TalentBridge. Search and filter without login.</div>', unsafe_allow_html=True)

    filter_opts = services.get_filter_options(db)

    # Search & Filter Bar matching Wireframe 8.1
    c_search, c_dept, c_loc, c_exp = st.columns([4, 2, 2, 2])
    with c_search:
        search_query = st.text_input("🔍 Search Keyword", placeholder="Job title, keyword, skills...")
    with c_dept:
        sel_dept = st.selectbox("Department", filter_opts["departments"])
    with c_loc:
        sel_loc = st.selectbox("Location", filter_opts["locations"])
    with c_exp:
        sel_exp = st.selectbox("Experience", filter_opts["experiences"])

    jobs = services.get_public_requisitions(db, search=search_query, department=sel_dept, location=sel_loc, experience=sel_exp)

    st.subheader(f"Open Requisitions ({len(jobs)})")
    
    if not jobs:
        st.info("No open positions match your search criteria.")
    else:
        for job in jobs:
            with st.container():
                st.markdown(f"""
                <div class="job-card">
                    <span class="badge-dept">{job['department']}</span>
                    <h3 style="margin-top:8px; margin-bottom:4px; font-weight:800; color:#0f172a;">{job['job_title']}</h3>
                    <p style="color:#64748b; font-size:0.85rem; margin-bottom:8px;">
                        📍 {job['location']} &nbsp;•&nbsp; 💼 {job['employment_type']} &nbsp;•&nbsp; ⏳ Exp: {job['experience_range']} &nbsp;•&nbsp; 📅 {job['posted_at']}
                    </p>
                    <p style="font-size:0.9rem; color:#334155; margin-bottom:12px;">{job['job_description'][:220]}...</p>
                </div>
                """, unsafe_allow_html=True)

                c_apply, c_share, c_view = st.columns([2, 2, 6])
                
                with c_apply:
                    if st.button("Apply Now 🚀", key=f"app_{job['id']}", type="primary", use_container_width=True):
                        st.session_state.apply_target_req = job
                        if not st.session_state.user:
                            st.warning("🔒 Login or Create Account in sidebar to proceed with your application.")
                        else:
                            st.session_state.current_page = "Apply Now"
                            st.rerun()

                with c_share:
                    with st.popover("🔗 Share Job"):
                        share_url = f"http://127.0.0.1:8501/?req={job['requisition_id']}"
                        st.code(share_url, language="text")
                        st.caption("Copy share link or share with candidates.")

                with c_view:
                    with st.popover("📄 View Details"):
                        st.markdown(f"### {job['job_title']}")
                        st.caption(f"Requisition ID: {job['requisition_id']} • Hiring Manager: {job['hiring_manager']}")
                        st.markdown(f"**Department:** {job['department']} | **Location:** {job['location']} | **Openings:** {job['openings']}")
                        if job['max_salary_budget']:
                            st.markdown(f"**Budget:** {job['max_salary_budget']}")
                        st.divider()
                        st.markdown("**Job Description:**")
                        st.write(job['job_description'])


# ==========================================
# PAGE 2: CANDIDATE 4-STEP APPLICATION WIZARD
# ==========================================
elif st.session_state.current_page == "Apply Now":
    job = st.session_state.apply_target_req
    if not job:
        st.session_state.current_page = "Public Jobs"
        st.rerun()

    st.markdown(f'<div class="main-header">Apply for: {job["job_title"]}</div>', unsafe_allow_html=True)
    st.caption(f"Requisition ID: {job['requisition_id']} • Department: {job['department']} • Location: {job['location']}")
    
    st.info("💡 Guided Multi-Step Application Form. Complete all mandatory fields marked with (*).")

    # Step Progress bar matching Wireframe 8.4
    if "step" not in st.session_state:
        st.session_state.step = 1

    st.progress(st.session_state.step / 4.0, text=f"Step {st.session_state.step} of 4: {['Bio-Data', 'Education', 'Work Experience', 'Resume Upload & Submit'][st.session_state.step-1]}")

    # STEP 1: BIO-DATA (FR-APP-01)
    if st.session_state.step == 1:
        st.subheader("Step 1: Bio-Data & Personal Details")
        
        c1, c2 = st.columns(2)
        with c1:
            bio_fn = st.text_input("First Name *", value=st.session_state.user.get("first_name", ""))
            bio_em = st.text_input("Email Address *", value=st.session_state.user.get("email", ""), disabled=True)
            bio_gen = st.selectbox("Gender", ["Male", "Female", "Other", "Prefer not to say"])
            bio_loc = st.text_input("Current Location *", placeholder="City, State/Country")
            bio_comp = st.text_input("Current Company", placeholder="Optional if fresher")
        with c2:
            bio_ln = st.text_input("Last Name *", value=st.session_state.user.get("last_name", ""))
            bio_mob = st.text_input("Mobile Number *", placeholder="+91 98765 43210")
            bio_dob = st.date_input("Date of Birth", value=datetime.date(1998, 1, 1))
            bio_np = st.selectbox("Notice Period", ["Immediate", "15 days", "30 days", "60 days", "90+ days"])
            bio_addr = st.text_area("Current Address", placeholder="Street, City, PIN/ZIP", height=70)

        if st.button("Save & Continue to Education →", type="primary"):
            if not bio_fn or not bio_ln or not bio_mob or not bio_loc:
                st.error("Please fill in all mandatory fields marked with (*).")
            else:
                st.session_state.bio_data = {
                    "first_name": bio_fn,
                    "last_name": bio_ln,
                    "email": bio_em,
                    "mobile": bio_mob,
                    "gender": bio_gen,
                    "dob": str(bio_dob),
                    "current_location": bio_loc,
                    "notice_period": bio_np,
                    "current_company": bio_comp,
                    "current_address": bio_addr
                }
                st.session_state.step = 2
                st.rerun()

    # STEP 2: EDUCATION (FR-APP-02)
    elif st.session_state.step == 2:
        st.subheader("Step 2: Educational Qualifications")
        st.caption("Add one or more educational records starting with your highest degree.")

        if "edu_records" not in st.session_state:
            st.session_state.edu_records = [{
                "degree": "B.Tech Computer Science",
                "specialization": "Software Engineering",
                "institution": "State Technological University",
                "year_of_passing": "2021",
                "grade": "8.4 CGPA",
                "education_level": "Bachelor's"
            }]

        for idx, edu in enumerate(st.session_state.edu_records):
            with st.expander(f"Education Record #{idx+1}: {edu['degree']}", expanded=True):
                ec1, ec2 = st.columns(2)
                with ec1:
                    edu['education_level'] = st.selectbox(f"Education Level * ({idx+1})", ["High School", "Diploma", "Bachelor's", "Master's", "Doctorate"], index=2, key=f"el_{idx}")
                    edu['degree'] = st.text_input(f"Degree / Qualification * ({idx+1})", value=edu['degree'], key=f"deg_{idx}")
                    edu['institution'] = st.text_input(f"Institution / University * ({idx+1})", value=edu['institution'], key=f"inst_{idx}")
                with ec2:
                    edu['specialization'] = st.text_input(f"Specialization ({idx+1})", value=edu['specialization'], key=f"spec_{idx}")
                    edu['year_of_passing'] = st.text_input(f"Year of Passing * ({idx+1})", value=edu['year_of_passing'], key=f"yr_{idx}")
                    edu['grade'] = st.text_input(f"Grade / CGPA / % ({idx+1})", value=edu['grade'], key=f"grd_{idx}")

        c_add, c_back, c_next = st.columns([3, 3, 4])
        with c_add:
            if st.button("➕ Add Another Education"):
                st.session_state.edu_records.append({
                    "degree": "", "specialization": "", "institution": "", "year_of_passing": "", "grade": "", "education_level": "Bachelor's"
                })
                st.rerun()
        with c_back:
            if st.button("← Back to Bio-Data"):
                st.session_state.step = 1
                st.rerun()
        with c_next:
            if st.button("Save & Continue to Work Experience →", type="primary"):
                st.session_state.step = 3
                st.rerun()

    # STEP 3: WORK EXPERIENCE (FR-APP-03)
    elif st.session_state.step == 3:
        st.subheader("Step 3: Work Experience Details")
        
        is_fresher = st.checkbox("Fresher / No Experience", key="chk_fresher")

        if not is_fresher:
            if "exp_records" not in st.session_state:
                st.session_state.exp_records = [{
                    "is_fresher": False,
                    "employer": "TechCorp Solutions",
                    "job_title": "Software Engineer",
                    "start_date": "2021-07",
                    "end_date": "",
                    "currently_working": True,
                    "key_responsibilities": "Developed Python microservices and managed database schemas.",
                    "years_calculated": 3.0
                }]

            for idx, exp in enumerate(st.session_state.exp_records):
                with st.expander(f"Experience #{idx+1}: {exp['job_title']} at {exp['employer']}", expanded=True):
                    xc1, xc2 = st.columns(2)
                    with xc1:
                        exp['employer'] = st.text_input(f"Employer / Company * ({idx+1})", value=exp['employer'], key=f"emp_{idx}")
                        exp['job_title'] = st.text_input(f"Job Title / Designation * ({idx+1})", value=exp['job_title'], key=f"jt_{idx}")
                        exp['years_calculated'] = st.number_input(f"Years of Experience ({idx+1})", value=float(exp['years_calculated']), min_value=0.0, max_value=40.0, step=0.5, key=f"y_{idx}")
                    with xc2:
                        exp['start_date'] = st.text_input(f"Start Date (YYYY-MM) ({idx+1})", value=exp['start_date'], key=f"sd_{idx}")
                        exp['currently_working'] = st.checkbox(f"Currently Working Here ({idx+1})", value=exp['currently_working'], key=f"cw_{idx}")
                        if not exp['currently_working']:
                            exp['end_date'] = st.text_input(f"End Date (YYYY-MM) ({idx+1})", value=exp['end_date'], key=f"ed_{idx}")

                    exp['key_responsibilities'] = st.text_area(f"Key Responsibilities ({idx+1})", value=exp['key_responsibilities'], key=f"resp_{idx}", height=60)
        else:
            st.info("You have marked yourself as a Fresher. Work experience entries are skipped.")
            st.session_state.exp_records = [{"is_fresher": True, "years_calculated": 0.0}]

        c_back3, c_next3 = st.columns([4, 6])
        with c_back3:
            if st.button("← Back to Education"):
                st.session_state.step = 2
                st.rerun()
        with c_next3:
            if st.button("Save & Continue to Resume Upload →", type="primary"):
                st.session_state.step = 4
                st.rerun()

    # STEP 4: MANDATORY RESUME UPLOAD & CONSENTS (FR-APP-04, FR-APP-07)
    elif st.session_state.step == 4:
        st.subheader("Step 4: Mandatory Resume Upload & Declaration")
        
        st.markdown("##### Upload Resume File * (PDF, DOC, DOCX up to 5MB)")
        uploaded_resume = st.file_uploader("Attach Resume Document *", type=["pdf", "doc", "docx"])

        cover_note = st.text_area("Cover Note / Message for Recruiter (Optional)", placeholder="Add a short note for the hiring manager...", height=80)

        st.divider()
        c_acc = st.checkbox("I confirm that the details provided in this application are accurate to the best of my knowledge. *")
        c_priv = st.checkbox("I agree to the Privacy Policy and Terms of Use for candidate data processing. *")

        c_back4, c_sub = st.columns([4, 6])
        with c_back4:
            if st.button("← Back to Experience"):
                st.session_state.step = 3
                st.rerun()
        with c_sub:
            sub_disabled = not uploaded_resume or not c_acc or not c_priv
            if st.button("Submit Application 🚀", type="primary", disabled=sub_disabled, use_container_width=True):
                cand_user = db.query(User).filter(User.id == st.session_state.user["id"]).first()
                
                app_obj, err = services.submit_candidate_application(
                    db=db,
                    candidate_user=cand_user,
                    requisition_id=job["id"],
                    bio_data=st.session_state.bio_data,
                    education_records=st.session_state.edu_records,
                    experience_records=st.session_state.exp_records,
                    cover_note=cover_note,
                    resume_file_obj=uploaded_resume,
                    resume_filename=uploaded_resume.name
                )

                if err:
                    st.error(err)
                else:
                    st.session_state.app_confirmation = {
                        "application_code": app_obj.application_code,
                        "job_title": job["job_title"],
                        "requisition_id": job["requisition_id"],
                        "submitted_at": app_obj.submitted_at.strftime("%d %b %Y, %I:%M %p"),
                        "status": app_obj.status
                    }
                    st.session_state.current_page = "Confirmation"
                    st.rerun()


# ==========================================
# PAGE 3: APPLICATION CONFIRMATION (FR-APP-09)
# ==========================================
elif st.session_state.current_page == "Confirmation":
    conf = st.session_state.app_confirmation
    if not conf:
        st.session_state.current_page = "Public Jobs"
        st.rerun()

    st.balloons()
    st.success("🎉 Application Submitted Successfully!")

    st.markdown(f"""
    ### Application Reference Details
    - **Application ID:** `{conf['application_code']}`
    - **Job Title:** {conf['job_title']} ({conf['requisition_id']})
    - **Submitted On:** {conf['submitted_at']}
    - **Status:** **{conf['status']} — Under Review**
    """)

    c_my, c_pub = st.columns(2)
    with c_my:
        if st.button("View My Applications", type="primary", use_container_width=True):
            st.session_state.current_page = "My Applications"
            st.rerun()
    with c_pub:
        if st.button("Browse More Jobs", use_container_width=True):
            st.session_state.current_page = "Public Jobs"
            st.rerun()


# ==========================================
# PAGE 4: CANDIDATE PORTAL - MY APPLICATIONS (FR-APP-11)
# ==========================================
elif st.session_state.current_page == "My Applications":
    st.markdown('<div class="main-header">My Submitted Applications</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Track real-time status updates for positions you applied to.</div>', unsafe_allow_html=True)

    apps = services.get_my_applications(db, candidate_id=st.session_state.user["id"])

    if not apps:
        st.info("You haven't submitted any job applications yet.")
    else:
        for app in apps:
            with st.container():
                st.markdown(f"""
                <div class="job-card">
                    <span class="badge-dept">{app['application_code']}</span>
                    <h3 style="margin-top:6px; margin-bottom:4px; font-weight:800;">{app['job_title']}</h3>
                    <p style="font-size:0.85rem; color:#64748b;">
                        Req: {app['requisition_id']} &nbsp;•&nbsp; Dept: {app['department']} &nbsp;•&nbsp; 📍 {app['location']} &nbsp;•&nbsp; Applied: {app['submitted_at']}
                    </p>
                    <p style="margin-top:8px;">
                        Status: <span class="badge-status-new">{app['status']}</span>
                    </p>
                </div>
                """, unsafe_allow_html=True)


# ==========================================
# PAGE 5: ADMIN REQUISITIONS MANAGEMENT (FR-JR-01 to FR-JR-07)
# ==========================================
elif st.session_state.current_page == "Manage Requisitions":
    st.markdown('<div class="main-header">Job Requisitions Management</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Internal Admin Console to create, edit, draft, publish, or clone job requisitions.</div>', unsafe_allow_html=True)

    with st.expander("➕ Create New Job Requisition", expanded=False):
        with st.form("create_req_form"):
            rc1, rc2 = st.columns(2)
            with rc1:
                rtitle = st.text_input("Job Title *", placeholder="e.g. Senior Backend Engineer")
                rdept = st.text_input("Department *", placeholder="Engineering")
                rloc = st.text_input("Location *", placeholder="Hyderabad, IN (Hybrid) or Remote")
                remp = st.selectbox("Employment Type *", ["Full-time", "Part-time", "Contract", "Internship"])
                rexp = st.text_input("Experience Range *", placeholder="e.g. 5-8 years")
            with rc2:
                ropen = st.number_input("Number of Openings *", min_value=1, value=1)
                rhm = st.text_input("Hiring Manager *", value=f"{st.session_state.user['first_name']} (Admin)")
                rsal = st.text_input("Max Salary Budget", placeholder="e.g. $120,000 - $150,000 PA")
                rtarget = st.date_input("Hiring Target Date", value=datetime.date(2026, 9, 30))
                rstat = st.selectbox("Initial Status", ["Published", "Draft"])

            rdesc = st.text_area("Job Description & Requirements *", placeholder="Enter job responsibilities...", height=120)

            if st.form_submit_button("Save Requisition", type="primary"):
                if not rtitle or not rdept or not rloc or not rdesc:
                    st.error("Please fill in all mandatory fields.")
                else:
                    new_r = services.create_requisition(db, {
                        "job_title": rtitle,
                        "department": rdept,
                        "location": rloc,
                        "employment_type": remp,
                        "experience_range": rexp,
                        "openings": ropen,
                        "hiring_manager": rhm,
                        "max_salary_budget": rsal,
                        "hiring_target_date": str(rtarget),
                        "job_description": rdesc,
                        "status": rstat
                    })
                    st.success(f"Requisition {new_r.requisition_id} saved as {rstat}!")
                    st.rerun()

    st.divider()

    # Requisition List Table
    admin_reqs = services.get_admin_requisitions(db)
    st.subheader(f"All Job Requisitions ({len(admin_reqs)})")

    for req in admin_reqs:
        with st.container():
            c1, c2, c3, c4 = st.columns([3, 4, 3, 2])
            with c1:
                st.markdown(f"**{req['requisition_id']}**")
                st.caption(f"Status: **{req['status']}**")
            with c2:
                st.markdown(f"**{req['job_title']}**")
                st.caption(f"{req['department']} • {req['location']} • {req['experience_range']}")
            with c3:
                st.markdown(f"📩 **{req['application_count']} Application(s)**")
            with c4:
                if st.button("Clone 📋", key=f"dup_{req['id']}"):
                    cloned = services.duplicate_requisition(db, req['id'])
                    st.success(f"Cloned as {cloned.requisition_id}")
                    st.rerun()

                if req['status'] == "Published":
                    if st.button("Close ❌", key=f"cls_{req['id']}"):
                        services.update_requisition_status(db, req['id'], "Closed")
                        st.rerun()
                else:
                    if st.button("Publish 🚀", key=f"pub_{req['id']}"):
                        services.update_requisition_status(db, req['id'], "Published")
                        st.rerun()


# ==========================================
# PAGE 6: ADMIN APPLICATIONS REVIEW GRID (FR-ADM-01 to FR-ADM-07)
# ==========================================
elif st.session_state.current_page == "Applications Grid":
    st.markdown('<div class="main-header">Applications Review Grid</div>', unsafe_allow_html=True)
    st.markdown('<div class="sub-header">Consolidated review grid of all candidates applied per requisition. View resumes and update status inline.</div>', unsafe_allow_html=True)

    all_admin_reqs = services.get_admin_requisitions(db)
    req_options = {"All Requisitions (Consolidated View)": None}
    for r in all_admin_reqs:
        req_options[f"{r['job_title']} ({r['requisition_id']})"] = r['id']

    gc1, gc2, gc3 = st.columns([5, 4, 3])
    with gc1:
        sel_req_label = st.selectbox("Filter by Job Requisition", list(req_options.keys()))
        selected_req_id = req_options[sel_req_label]
    with gc2:
        search_cand = st.text_input("Search Candidate Name / Email", placeholder="Candidate name or email...")
    with gc3:
        status_filter = st.selectbox("Status Filter", ["All", "New", "Reviewed", "Shortlisted", "Rejected"])

    # Export to CSV button
    df_export = services.generate_applications_df(db, requisition_id=selected_req_id)
    if not df_export.empty:
        st.download_button(
            label="📥 Export Grid to CSV",
            data=df_export.to_csv(index=False).encode('utf-8'),
            file_name=f"applications_export_{datetime.datetime.now().strftime('%Y%m%d')}.csv",
            mime="text/csv"
        )

    grid_data = services.get_admin_applications_grid(db, requisition_id=selected_req_id, search=search_cand, status_filter=status_filter)

    st.subheader(f"Candidates Received ({len(grid_data)})")

    if not grid_data:
        st.info("No applications match the selected criteria.")
    else:
        for app in grid_data:
            with st.container():
                st.markdown(f"""
                <div class="job-card">
                    <div style="display:flex; justify-content:space-between;">
                        <div>
                            <h4 style="margin:0; font-weight:800;">{app['candidate_name']} <span style="font-weight:400; color:#64748b; font-size:0.85rem;">({app['candidate_email']})</span></h4>
                            <p style="font-size:0.85rem; color:#475569; margin-top:4px;">
                                Applied for <b>{app['job_title']}</b> ({app['requisition_id']}) &nbsp;•&nbsp; 📍 {app['location']} &nbsp;•&nbsp; ⏳ {app['experience']} &nbsp;•&nbsp; 📅 {app['submitted_at']}
                            </p>
                        </div>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                col_stat, col_res, col_det = st.columns([3, 4, 3])
                
                with col_stat:
                    new_status = st.selectbox(
                        "Update Status",
                        ["New", "Reviewed", "Shortlisted", "Rejected"],
                        index=["New", "Reviewed", "Shortlisted", "Rejected"].index(app['status']),
                        key=f"st_{app['id']}"
                    )
                    if new_status != app['status']:
                        services.update_application_status(db, app['id'], new_status)
                        st.success("Status updated!")
                        st.rerun()

                with col_res:
                    resume_path = os.path.join(services.UPLOAD_DIR, app['resume_file_path'])
                    if os.path.exists(resume_path):
                        with open(resume_path, "rb") as f:
                            st.download_button(
                                label=f"📄 Download Resume ({app['resume_file_name']})",
                                data=f.read(),
                                file_name=app['resume_file_name'],
                                key=f"dl_{app['id']}"
                            )
                    else:
                        st.caption("Resume file not found")

                with col_det:
                    with st.popover("👁️ Full Application Detail"):
                        app_full = db.query(Application).filter(Application.id == app['id']).first()
                        cand_u = db.query(User).filter(User.id == app_full.candidate_id).first()
                        cand_p = db.query(CandidateProfile).filter(CandidateProfile.user_id == app_full.candidate_id).first()
                        edus = db.query(EducationRecord).filter(EducationRecord.application_id == app_full.id).all()
                        exps = db.query(WorkExperienceRecord).filter(WorkExperienceRecord.application_id == app_full.id).all()

                        st.markdown(f"### {cand_u.first_name} {cand_u.last_name}")
                        st.caption(f"Application Code: {app_full.application_code}")
                        st.markdown(f"**Email:** {cand_u.email} | **Mobile:** {cand_p.mobile if cand_p else 'N/A'}")
                        st.markdown(f"**Location:** {cand_p.current_location if cand_p else 'N/A'} | **Notice Period:** {cand_p.notice_period if cand_p else 'N/A'}")
                        st.divider()

                        st.markdown("#### Educational Qualifications")
                        for e in edus:
                            st.write(f"• **{e.degree}** ({e.education_level}) - {e.institution} ({e.year_of_passing}) - {e.grade}")

                        st.markdown("#### Work Experience")
                        for w in exps:
                            if w.is_fresher:
                                st.write("• **Fresher (No prior experience)**")
                            else:
                                st.write(f"• **{w.job_title}** at {w.employer} ({w.start_date} to {w.end_date or 'Present'}) - ~{w.years_calculated} yrs")
                                if w.key_responsibilities:
                                    st.caption(w.key_responsibilities)

                        if app_full.cover_note:
                            st.divider()
                            st.markdown(f"**Cover Note:** *\"{app_full.cover_note}\"*")
