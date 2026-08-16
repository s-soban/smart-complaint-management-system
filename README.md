# 🏛️ Smart Complaint Management System (EduFix AI)

A complete, modern, responsive full-stack **Smart Complaint Management System** designed specifically for educational institutions (universities, colleges, and schools).

The system empowers **Students/Users** to submit facility complaints with live AI auto-categorization and duplicate detection alerts, while enabling **Administrators** and **Maintenance Staff** to categorize, prioritize, assign, resolve, and analyze campus facility issues.

---

## 🌟 Key Features & Capabilities

### 1. 👥 Multi-Role User Workspaces
- **Student Portal**:
  - Secure registration & login (Email or Student ID).
  - Submit complaints with live AI category & priority suggestions while typing.
  - Multi-image file drag-and-drop uploader with real-time previews.
  - Pre-submission AI duplicate detection alert.
  - Real-time visual status tracking timeline (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` → `Closed`).
  - In-app notification center bell feed.
  - Password Reset PIN verification via Resend HTTP REST API.
- **Administrator Dashboard**:
  - Executive KPI summary cards (Total, Critical Active, Resolution Rate, Overdue Count, Avg Resolution Time).
  - Interactive SVG analytics charts (Category breakdown, Building hotspots, Department load, Staff work distribution).
  - Advanced complaint directory with multi-filter bar (Category, Building, Priority, Status, Staff, Search).
  - **AI Duplicate & Similar Complaint Classifier Workstation** (Side-by-side comparison, 1-click merge or separate).
  - Maintenance staff work assignment modal.
  - **Campus Insights & Infrastructure Analytics**: Problem Sites (recurring defect locations) vs. Repaired Sites (with before/after repair photos).
  - AI Automated Institutional Recommendations & Actionable Insights.
  - Master User Role Manager and Category/Location Settings.
  - Executive Summary Reports Generator with CSV Export and Printable PDF view.
- **Maintenance Staff Workstation**:
  - Assigned work orders list sorted by priority & urgency score (0-100).
  - Update work status (`In Progress`, `Waiting for Parts`, `Resolved & Completed`).
  - Upload **After-Repair Completion Photos** directly to persistent Supabase Storage.
  - View personal repair completion history.

---

## 🛠️ Production Stack Architecture

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Vite.
- **Backend**: Node.js, Express, TypeScript, Multer, JWT Auth, bcryptjs.
- **Database**: Supabase PostgreSQL (with fallback for local development).
- **File Storage**: Supabase Storage (`complaint-images` bucket).
- **Email Service**: Resend HTTP REST API (HTTPS port 443 — prevents Render SMTP timeouts).
- **Deployment Platform**: Render (Web Service & Static Site).

---

## 🔑 Demo Login Accounts

Pre-populated seed database contains sample students, admins, maintenance staff, and 50 realistic complaints:

| Role | Email / Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| 👨‍🎓 **Student** | `student1@campus.edu` / `soban1` | `password123` / `soban@01011985` | Student Dashboard & Complaint Filing |
| 🛠️ **Maintenance Staff** | `staff1@campus.edu` / `soban2` | `password123` / `soban@01011985` | Assigned Work Orders & Completion Photos |
| 👨‍💼 **Administrator** | `admin@campus.edu` / `soban3` | `password123` / `soban@01011985` | Master Control, Insights, Analytics & Reports |

---

## 🚀 Quick Start & Deployment Guide

For full production deployment instructions on Render with Supabase PostgreSQL, Supabase Storage, and Resend Email API, see [DEPLOYMENT.md](file:///c:/Users/Lenovo/Desktop/smart%20complaint%20management%20system/DEPLOYMENT.md).

### Local Development

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Configure environment variables in `.env`:
   ```bash
   cp .env.example .env
   ```

3. Build and run development server:
   ```bash
   npm run dev
   ```

4. Access application in browser:
   - **Frontend Application**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000/api`
