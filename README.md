# Candidate Sourcing System (TalentBridge)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg?style=flat&logo=react)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A full-stack, production-grade **Candidate Sourcing System** built according to the **Business Requirements Document (BRD) v1.0**.

TalentBridge centralizes job requisition management, public unauthenticated job discovery, guided multi-step candidate applications with mandatory resume attachments, real-time recruiter WebSocket notifications, and an admin application review grid with CSV export.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Problem Understanding](#-problem-understanding)
- [Features Implemented](#-features-implemented)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Database Design](#-database-design)
- [API Documentation](#-api-documentation)
- [Setup & Installation Instructions](#-setup--installation-instructions)
- [Running the Project Locally](#-running-the-project-locally)
- [Test Credentials](#-test-credentials)
- [Testing Approach](#-testing-approach)

---

## 🎯 Project Overview

Organizations often struggle with fragmented recruitment channels (email attachments, spreadsheets, job boards) leading to delayed response times and lack of candidate visibility.

**TalentBridge** resolves this by providing a unified platform where:
1. **Recruiters/Admins** can create, publish, clone, and manage job requisitions self-service without webmaster dependencies.
2. **External Candidates** can anonymously discover open jobs, view full descriptions, share postings, and submit structured applications with resumes.
3. **Talent Acquisition Leaders** receive real-time in-app notifications and a consolidated grid to review applications, update candidate statuses, download resumes, and export data.

---

## 💡 Problem Understanding

Based on **Point 5 ("User Journey")** and **Section 11 ("Acceptance Criteria")** of BRD v1.0:
- **Public Discovery**: Anyone can browse open positions without creating an account upfront.
- **Enforced Authentication on Apply**: Clicking "Apply Now" triggers a login/registration modal, returning the candidate seamlessly to the application form after authentication.
- **Guided Multi-Step Application**: Captures structured Bio-Data, Education records, Work Experience (or Fresher status), and mandatory resume attachment with consent checks.
- **Real-Time Admin Visibility**: Instant WebSocket notification alerts recruiters on submission and populates the Applications Review Grid.

---

## ✨ Features Implemented

### 1. Public Job Portal (No Login Required)
- **Unauthenticated Job Browsing** (`FR-PUB-01`): Grid listing of all `Published` requisitions.
- **Search & Multi-Filter** (`FR-PUB-02`): Filter jobs by title/keyword, department, location (including Remote), and experience range.
- **Job Detail View** (`FR-PUB-03`): Full responsibilities, requirements, and job overview card.
- **Share Capability** (`FR-PUB-05`): Public shareable link copy and direct social share (LinkedIn, WhatsApp, Twitter/X, Email).

### 2. Candidate Registration & Guided Application
- **Mandatory Login Before Apply** (`FR-AUTH-01`, `FR-AUTH-06`): Direct return to application form after authentication.
- **Step 1: Bio-Data** (`FR-APP-01`): Personal info, mobile, notice period, location, profile details.
- **Step 2: Education Details** (`FR-APP-02`): Dynamic, repeatable education entries (Degree, Institution, Year, CGPA/Grade).
- **Step 3: Work Experience** (`FR-APP-03`): Dynamic, repeatable experience entries with total years calculation OR "Fresher / No Experience" option.
- **Step 4: Mandatory Resume Upload & Declaration** (`FR-APP-04`, `FR-APP-07`): Drag-and-drop attachment validation (PDF, DOC, DOCX up to 5MB), cover note, and mandatory data accuracy & privacy policy consent checkboxes.
- **Application Confirmation** (`FR-APP-09`): Displays Application ID (e.g. `APP-88213`), timestamp, and status.
- **Candidate Portal** (`FR-APP-11`): "My Applications" dashboard tracking status changes in real-time.

### 3. Admin Console & Application Review Grid
- **Requisition Management** (`FR-JR-01` to `FR-JR-06`): Create, edit, save draft, publish, close requisitions, and view candidate counts. Includes budget and target hiring date fields.
- **Requisition Cloning** (`FR-JR-07`): Duplicate existing requisitions as a draft starting point.
- **Applications Review Grid** (`FR-ADM-01`, `FR-ADM-07`): View candidate applications per requisition or consolidated across all requisitions.
- **Resume Access** (`FR-ADM-02`): One-click resume view/download directly from the grid.
- **Inline Status Tracking** (`FR-ADM-04`): Update status (`New` -> `Reviewed` -> `Shortlisted` -> `Rejected`).
- **CSV Export** (`FR-ADM-05`): Export applications grid with candidate details to CSV/Excel.
- **Full Application Drawer** (`FR-ADM-06`): Deep-dive into candidate Bio-Data, Education, Work Experience, Cover Note, and Resume.
- **Real-Time Notification Bell** (`FR-NOTIF-01`, `FR-NOTIF-04`): Unread badge counter with real-time WebSocket push when a candidate submits an application.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React (Vite), JavaScript (ES6+), Tailwind CSS | Fast SPA rendering, component modularity, modern design system matching wireframes |
| **Icons & UI** | Lucide-React | Modern, crisp UI icons |
| **Backend** | Python 3.10+, FastAPI | High performance REST API framework with native async support and auto OpenAPI docs |
| **Database** | SQLite / PostgreSQL (SQLAlchemy ORM) | Relational integrity, structured domain models, easy local setup |
| **Real-time Push**| WebSockets (`fastapi.WebSocket`) | Real-time recruiter notification push upon candidate submission |
| **Authentication**| JWT (`python-jose`), Passlib (Bcrypt/PBKDF2) | Stateless bearer token authentication with role-based access control |
| **File Storage** | Local Multipart Storage | Secure handling of PDF/DOC/DOCX resumes and images |
| **Testing** | Pytest, FastAPI TestClient | Automated API unit and integration testing |

---

## 🏃 Running the Project Locally

### Step 1: Start Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python seed_data.py
python -m uvicorn app.main:app --reload --port 8000
```
*Backend server runs at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`)*

### Step 2: Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend app runs at: `http://localhost:5173`*

---

## 🔐 Authentication & Access Control

- **Candidate Portal**: Passwordless Real-Time Email OTP Verification (No password required).
- **Admin Console**: Authenticated via configured system credentials.

