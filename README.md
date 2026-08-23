# TalentBridge — Candidate Sourcing & Applicant Tracking System (ATS)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Render Deployment](https://img.shields.io/badge/Render-Live%20Demo-brightgreen.svg?style=flat&logo=render)](https://talentbridge-44q1.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack, enterprise-grade **Candidate Sourcing System & ATS** designed to streamline job requisition management, candidate job discovery, candidate registration & authentication, multi-step job applications with mandatory resume parsing & attachments, real-time recruiter notifications, and candidate pipeline tracking.

---

## 🔗 Live Demo & Deployment
- **Live Web Application**: [https://talentbridge-44q1.onrender.com](https://talentbridge-44q1.onrender.com)
- **Interactive OpenAPI (Swagger) Specs**: [https://talentbridge-44q1.onrender.com/docs](https://talentbridge-44q1.onrender.com/docs)
- **ReDoc API Documentation**: [https://talentbridge-44q1.onrender.com/redoc](https://talentbridge-44q1.onrender.com/redoc)

---

## 📋 Table of Contents
- [1. Project Overview](#-1-project-overview)
- [2. Problem Understanding](#-2-problem-understanding)
- [3. Features Implemented](#-3-features-implemented)
- [4. Technology Stack](#-4-technology-stack)
- [5. System Architecture & Approach](#-5-system-architecture--approach)
- [6. Database Design](#-6-database-design)
- [7. API Overview & Documentation](#-7-api-overview--documentation)
- [8. Setup & Installation Instructions](#-8-setup--installation-instructions)
- [9. Environment Variables & Configuration](#-9-environment-variables--configuration)
- [10. How to Run the Project Locally](#-10-how-to-run-the-project-locally)
- [11. Test Credentials](#-11-test-credentials)
- [12. Testing Approach](#-12-testing-approach)
- [13. Known Limitations](#-13-known-limitations)
- [14. Future Improvements](#-14-future-improvements)

---

## 🎯 1. Project Overview

Organizations often struggle with fragmented candidate sourcing channels (email attachments, unorganized resume repositories, spreadsheets, static job boards), leading to delayed hiring timelines, missing application records, and poor candidate experience.

**TalentBridge** resolves this by providing a single, unified enterprise talent platform where:
1. **Recruiters & HR Admins** can post, manage, clone, publish, and close job requisitions self-service without needing web developer intervention.
2. **Candidates** can browse open opportunities without forced registration, search by department/location/experience, register with their email address, edit their profile, and submit structured applications with attached resumes.
3. **Hiring Managers & Admins** gain full visibility through an interactive candidate pipeline grid, inline status updates (`New`, `Under Review`, `Shortlisted`, `Rejected`), resume downloads, CSV data export, and real-time push notifications.

---

## 💡 2. Problem Understanding

Based on candidate sourcing workflows and recruiter operations:
- **Public Discovery**: Anonymous job search must be frictionless. Candidates should be able to view details and share job openings before signing up.
- **Structured Registration & Authentication**: Candidates register with mandatory profile information (First Name, Last Name, Email, Mobile, Password) where the username is their email address. If a registered candidate tries to register again, the system recognizes them as an existing user and prompts them to sign in.
- **Enforced Application Validation**: Job postings require mandatory details (Company Name, Role, Department, Location, Employment Type, Experience Range, Salary in ₹ Rupees, Description) and cannot be posted incomplete. Candidate applications strictly enforce all personal and education fields.
- **Admin Vs Candidate Views**: Admins browse job requisitions without seeing candidate application buttons. Applied jobs automatically reflect in both the candidate's "My Applications" dashboard and the Admin Candidates Applied grid.
- **Persistence Across Server Restarts**: Requisition data and candidate applications are persisted reliably in the database and preserved across system restarts.

---

## ✨ 3. Features Implemented

### 🌐 Candidate Portal & Public Job Discovery
- **Unauthenticated Job Browsing**: Interactive cards showing verified openings with department chips, location tags, employment type, and posting recency.
- **Search & Chip Filters**: Real-time filtering by job title/keyword, department radio chips, location radio chips, and experience range radio chips.
- **Job Details View**: Full overview including company name, role description, openings, and salary budget formatted in ₹ Rupees.
- **Social Sharing**: Copy shareable job link or share directly via LinkedIn, WhatsApp, X (Twitter), or Email.
- **Candidate Account Registration & Login**: Simple email + password login (Email = Username) with auto-switch to sign-in for existing users.
- **Candidate Profile & Edit Basic Details**: View personal information, update basic profile details (First Name, Last Name, Mobile, Gender, DOB, Current Location, Current Company, Notice Period), and download or update attached CVs.
- **My Applications Dashboard**: Real-time tracking of submitted applications with status badges (`New`, `Under Review`, `Shortlisted`, `Rejected`).

### 🛠️ Guided Multi-Step Job Application
- **Step 1: Bio-Data**: Enforces mandatory candidate personal information, contact numbers, current location, notice period, and current address.
- **Step 2: Education Details**: Repeatable education entries capturing Degree, Specialization (mandatory), Institution, Completion Year, and Grade/CGPA (mandatory).
- **Step 3: Work Experience**: Repeatable experience records or single-click "Fresher / No Experience" option.
- **Step 4: Mandatory Resume Upload & Consent**: Validated PDF/DOC/DOCX resume file upload (up to 5MB) with mandatory data privacy consent checkboxes.
- **Instant Application Tracking Code**: Generates a unique tracking code (e.g., `APP-2026-00042`) upon submission.

### 👑 Admin Management Console
- **Requisition Workbench**: Create, edit, save draft, publish, or close job requisitions with editable Company Name, Department radio chips, Location radio chips, Employment Type chips, Experience chips, and Salary Budget in ₹ Rupees.
- **Application Candidates Grid**: View all applicants per requisition or consolidated across all requisitions.
- **One-Click Resume Preview/Download**: View or download applicant resumes directly from the grid.
- **Inline Candidate Status Updating**: Seamlessly switch applicant status (`New` ➔ `Reviewed` ➔ `Shortlisted` ➔ `Rejected`).
- **CSV Data Export**: Export candidate pipeline grid to CSV/Excel format.
- **Real-Time Notification Bell**: Unread badge counter with real-time WebSocket push notifications when candidate applications are submitted.

---

## 🛠️ 4. Technology Stack

| Layer | Technology | Purpose & Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 (Vite) | High-performance Single Page Application with dynamic component architecture. |
| **Styling & Design** | Vanilla CSS + Tailwind CSS | Custom design tokens, glassmorphism, responsive grid layouts, and micro-animations. |
| **Icons** | Lucide-React | Crisp, modern vector icon set. |
| **Backend API** | Python 3.10+, FastAPI | Async-first REST API framework with native OpenAPI doc generation and Pydantic validation. |
| **Database & ORM** | SQLite / PostgreSQL with SQLAlchemy | Relational integrity, domain model mapping, and seamless local or cloud deployment. |
| **Authentication** | JWT (`python-jose`), Passlib (`bcrypt`) | Encrypted bearer token authentication with role-based access control (`admin`, `candidate`). |
| **Real-Time Messaging**| WebSockets (`fastapi.WebSocket`) | Real-time push notifications for recruiters when candidates apply. |
| **Production Server** | Uvicorn + Gunicorn | High-concurrency ASGI server suited for cloud hosting on Render. |

---

## 🏗️ 5. System Architecture & Approach

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|   +-----------------------+   +------------------------+   +------------------+   |
|   | Candidate Portal UI   |   |  Admin Requisitions UI |   | Applications Grid|   |
|   | (React + Tailwind CSS)|   | (React + Radio Chips)  |   | (React + Tables) |   |
|   +-----------+-----------+   +-----------+------------+   +--------+---------+   |
+---------------+---------------------------+-------------------------+-------------+
                |                           |                         |
                | HTTP REST / JSON API      | Multipart Form Data     | WebSockets
                v                           v                         v
+-----------------------------------------------------------------------------------+
|                                 BACKEND LAYER                                     |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                              FastAPI Core Router                          |   |
|   |   - /api/auth          : Registration, Login, Profile Updates             |   |
|   |   - /api/requisitions  : Job Requisition Management & Filtering           |   |
|   |   - /api/applications : Multi-step Application & Resume Upload          |   |
|   |   - /api/notifications: Real-Time WebSocket Push Notifications           |   |
|   +-------------------------------------+-------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                                PERSISTENCE LAYER                                  |
|                                                                                   |
|   +--------------------------+                     +--------------------------+   |
|   | SQLite / PostgreSQL Database|                     | Local / Cloud Resume Store|   |
|   | (SQLAlchemy Domain Models) |                     | (PDF, DOC, DOCX Uploads) |   |
|   +--------------------------+                     +--------------------------+   |
+-----------------------------------------------------------------------------------+
```

### Key Architectural Decisions:
1. **Single-Artifact Bundle Deployment**: The React frontend is compiled into `app/dist` and served directly by FastAPI static files mounting, allowing single-container deployment on Render.
2. **Decoupled API Routing**: Clean separation between `/api/auth`, `/api/requisitions`, `/api/applications`, and `/api/notifications`.
3. **Database Schema Integrity**: Explicit foreign key relationships between `User`, `CandidateProfile`, `JobRequisition`, `Application`, `EducationRecord`, and `WorkExperienceRecord`.

---

## 🗄️ 6. Database Design

The relational database schema is structured as follows:

```
 [User] (1) <---> (1) [CandidateProfile]
   |                      |
   | (1)                  | (1)
   v                      v
 [Application] (N) <-----> (1) [JobRequisition]
   |
   +---> (N) [EducationRecord]
   +---> (N) [WorkExperienceRecord]
```

### Table Definitions:

* **`users`**: Stores user authentication records (`id`, `email`, `password_hash`, `first_name`, `last_name`, `role` = `admin` / `candidate`, `created_at`).
* **`candidate_profiles`**: Stores detailed candidate bio-data (`id`, `user_id`, `mobile`, `gender`, `dob`, `current_location`, `current_company`, `notice_period`, `current_address`, `resume_file_url`).
* **`job_requisitions`**: Stores posted positions (`id`, `requisition_id`, `company_name`, `job_title`, `department`, `location`, `employment_type`, `experience_range`, `max_salary_budget`, `job_description`, `status` = `Draft`/`Published`/`Closed`, `openings`, `posted_at`).
* **`applications`**: Tracks job submissions (`id`, `application_code`, `requisition_id`, `user_id`, `status` = `New`/`Reviewed`/`Shortlisted`/`Rejected`, `cover_note`, `resume_file_path`, `submitted_at`).
* **`education_records`**: Stores degree details (`id`, `application_id`, `degree`, `institution`, `field_of_study`, `passing_year`, `grade_cgpa`).
* **`work_experience_records`**: Stores work history (`id`, `application_id`, `company_name`, `designation`, `start_date`, `end_date`, `is_current_job`).
* **`notifications`**: Stores recruiter alerts (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`).

---

## 🔌 7. API Overview & Documentation

The interactive OpenAPI (Swagger) specification is accessible live at [`/docs`](https://talentbridge-44q1.onrender.com/docs).

### Key Endpoints:

#### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new candidate account. |
| `POST` | `/api/auth/login` | Candidate login with email & password. |
| `POST` | `/api/auth/admin-login` | Admin login with admin email & password. |
| `GET` | `/api/auth/me` | Fetch authenticated user profile details. |
| `PUT` | `/api/auth/me` | Update candidate basic profile details. |

#### 📋 Requisitions (`/api/requisitions`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/requisitions/public` | List all published open positions with search & filters. |
| `GET` | `/api/requisitions/public/filters` | Get unique filter options for department, location, experience. |
| `GET` | `/api/requisitions/admin/all` | Get all job requisitions (Drafts, Published, Closed) for Admin. |
| `POST` | `/api/requisitions/admin` | Create a new job requisition. |
| `PUT` | `/api/requisitions/admin/{id}` | Update an existing job requisition. |
| `POST` | `/api/requisitions/admin/{id}/clone` | Clone a requisition as a new draft. |

#### 📄 Applications (`/api/applications`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/applications/apply` | Submit multi-step job application with resume file upload. |
| `GET` | `/api/applications/my-applications` | Get all applications submitted by the logged-in candidate. |
| `GET` | `/api/applications/admin/all` | Fetch all candidate applications across job requisitions for Admin grid. |
| `PUT` | `/api/applications/admin/{id}/status` | Update candidate application status (`New`/`Reviewed`/`Shortlisted`/`Rejected`). |
| `GET` | `/api/applications/admin/resume/{id}` | Preview / download candidate uploaded resume file. |

---

## ⚙️ 8. Setup & Installation Instructions

### Prerequisites
- **Python**: Version `3.10` or higher
- **Node.js**: Version `18.x` or higher & `npm`
- **Git**: Installed on system

### Clone Repository
```bash
git clone https://github.com/Shiva-0803/TalentBridge.git
cd TalentBridge
```

---

## 🔑 9. Environment Variables & Configuration

Create a `.env` file in the project root (or set environment variables in your deployment dashboard):

```env
SECRET_KEY=talentbridge_jwt_secret_key_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMTP Email Configuration (Optional for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=banglore2122@gmail.com
SMTP_PASSWORD=ihetqztrispkxwip
```

---

## 💻 10. How to Run the Project Locally

### Option A: Running Backend & Frontend Together (Single Command)

1. **Install Backend Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Build Frontend Bundle**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Copy Built Dist Assets to Backend**:
   ```bash
   xcopy /E /Y /I frontend\dist app\dist
   ```

4. **Launch Application Server**:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```
   *Access the web app at:* `http://localhost:8000`

---

### Option B: Running Frontend & Backend in Separate Terminal Windows

**Terminal 1 — Backend (FastAPI)**:
```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
*Backend runs at:* `http://localhost:8000`

**Terminal 2 — Frontend (React Dev Server)**:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🔑 11. Test Credentials

You can use the following default pre-seeded credentials to test both candidate and admin features:

| User Role | Username / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Recruiter / Admin** | `admin@talentbridge.com` | `admin123` | Full access to Requisition Workbench, Candidate Grid, Status Updates, CSV Export, Notification Bell. |
| **Candidate** | `candidate@talentbridge.com` | `candidate123` | Browse jobs, submit applications, edit profile, view applied jobs. |

*Or click **Create Account** on the login modal to register a new candidate account.*

---

## 🧪 12. Testing Approach

1. **Automated Backend Testing**:
   - Built using `pytest` and FastAPI `TestClient`.
   - Tests cover user registration, candidate authentication, requisition creation, application submission, and status updates.
   - Run tests locally with:
     ```bash
     pytest tests/
     ```

2. **Manual End-to-End Testing**:
   - **Public Flow**: Verified unauthenticated browsing, filter resets, keyword search, job sharing.
   - **Candidate Flow**: Enforced registration fields, application bio-data validation, resume upload checks, candidate profile editing.
   - **Admin Flow**: Verified requisition form radio chip selection, rupee salary format, admin applicant grid, status transition updates, and CSV export.

---

## ⚠️ 13. Known Limitations

- **Email Deliverability**: Real-time email notifications rely on SMTP credentials; fallback notifications are stored in-app via SQLite database notifications.
- **File Storage**: Resumes are stored in local disk uploads folder; for multi-node deployments, S3 or Cloudinary integration can be configured.

---

## 🚀 14. Future Improvements

- **AI Resume Parsing**: Automatic skill extraction and match scoring against job description criteria.
- **Interview Scheduling**: Integrated calendar scheduling for shortlisted candidates.
- **Advanced Recruiter Analytics**: Metric dashboards tracking Time-to-Hire and Candidate Funnel Conversions.

---

## 📜 License
This project is licensed under the **MIT License**.
