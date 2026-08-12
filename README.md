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
  - Upload **After-Repair Completion Photos** and technical resolution logs.
  - View personal repair completion history.

---

### 2. 🧠 Built-In AI & Intelligent Features
1. **Live Auto-Categorization**: Natural Language Processing (NLP) text classifier matches complaint title and description keywords against facility category dictionaries.
2. **Priority & Urgency Scoring Engine (0–100)**: Evaluates hazard keywords (`spark`, `smoke`, `leak`, `exposed wire`, `security breach`), room criticality (Exam Hall, Server Room, Science Lab), and category baseline weights.
3. **Duplicate & Semantic Similarity Detector**: Calculates composite similarity score using TF-IDF word vector similarity + geographical proximity (Building & Room match) to prevent duplicate work orders.
4. **Campus Infrastructure Insights Engine**: Scans active complaints across campus to identify recurring defect clusters (e.g. `Science Block A registered 5 electrical issues -> Recommend comprehensive audit`).

---

## 🔑 Demo Login Accounts

Pre-populated seed database contains 20 sample students, 3 admins, 5 maintenance staff, and 50 realistic complaints:

| Role | Email / Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| 👨‍🎓 **Student** | `student1@campus.edu` | `password123` | Student Dashboard & Complaint Filing |
| 🛠️ **Maintenance Staff** | `staff1@campus.edu` | `password123` | Assigned Work Orders & Completion Photos |
| 👨‍💼 **Administrator** | `admin@campus.edu` | `password123` | Master Control, Insights, Analytics & Reports |

---

## 🛠️ Technology Stack & Project Structure

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React Icons, Vite.
- **Backend**: Node.js, Express, TypeScript, Multer File Uploads, JWT Auth, bcryptjs.
- **Database**: SQLite3 with relational foreign keys, indices, and transactions.
- **Architecture**:
  ```text
  /backend
    /src
      /database      # DB connection (db.ts), Schema (schema.ts), Seed (seed.ts)
      /middleware    # JWT Auth & Role-Based Access Control (authMiddleware.ts)
      /routes        # Auth, Complaints, Campus Insights, Notifications
      /services      # AI Intelligence Engine (aiService.ts)
      index.ts       # Express server initialization
    /uploads         # Stored uploaded photos (/complaints and /repairs)
  /frontend
    /src
      /components
        /admin       # Admin Dashboard, Complaints Table, Duplicates, Campus Insights, Reports, Users
        /auth        # Login, Register, Forgot Password
        /common      # Navbar, Sidebar, Badges, Timeline, Detail Modal, Notifications
        /maintenance # Maintenance Workstation & Work Order Modal
        /student     # Student Dashboard & File Complaint Form
      /context       # AuthContext & NotificationContext
      /services      # API Client (api.ts)
      /types         # TypeScript Interfaces
  ```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)

### Installation & Launching

1. Run setup to configure standalone Node.js (if not already installed system-wide):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\setup-node.ps1
   ```

2. Execute full application launcher (installs dependencies, seeds database, and boots backend & frontend):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\run-app.ps1
   ```

3. Access the application in your browser:
   - **Frontend Application**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000/api`

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Current user profile
- `GET /api/auth/users` - Admin user list & role updates

### Complaints (`/api/complaints`)
- `POST /api/complaints` - File complaint (with Multer image uploads)
- `POST /api/complaints/ai-analyze` - Live AI auto-suggest & duplicate check
- `GET /api/complaints` - List complaints (filtered by role, category, building, priority, status)
- `GET /api/complaints/:id` - Detailed complaint record with photos & timeline
- `PATCH /api/complaints/:id/status` - Update status & upload repair completion photos
- `PATCH /api/complaints/:id/assign` - Admin staff assignment
- `POST /api/complaints/duplicates/merge` - Admin duplicate merge workspace

### Campus Insights & Analytics (`/api/campus`)
- `GET /api/campus/buildings` - List campus buildings & rooms
- `GET /api/campus/categories` - List categories & default priorities
- `GET /api/campus/insights` - Problem Sites, Repaired Sites, and AI Recommendations
- `GET /api/campus/analytics` - Executive KPI summary & chart metrics
- `GET /api/campus/reports` - Export complaints dataset for CSV/PDF audit reports

---

## 🔒 Security Specifications
- **Authentication**: JWT token verification with expiration.
- **Authorization**: Role-Based Access Control (RBAC) enforced on backend API endpoints. Students can only view their own complaints; Maintenance staff can access assigned work orders; Admins have full access.
- **Input Validation**: Sanitized SQL queries via parameters and file upload mimetype/size validation.
