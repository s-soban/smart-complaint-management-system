# 🏛️ Smart Complaint Management System (EduFix AI) — Render & Supabase Production Deployment Guide

This guide provides step-by-step instructions to deploy the **Smart Complaint Management System (EduFix AI)** to **Render** with **Supabase PostgreSQL** as the persistent database, **Supabase Storage** for uploaded images, and **Resend HTTP API** for password-reset emails.

---

## 📋 Overview of Production Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (Hosted on Render Web Service / Vercel)
- **Backend**: Express + TypeScript + Node.js (Hosted on Render Web Service)
- **Persistent Database**: Supabase PostgreSQL
- **Persistent File Storage**: Supabase Storage (`complaint-images` bucket)
- **Email Service**: Resend HTTP REST API (HTTPS port 443 — solves Render SMTP port 465 timeouts)

---

## Step 1: Supabase PostgreSQL & Storage Setup

### A. Create Supabase Project
1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project** and select your organization.
3. Enter Project Name (e.g., `edufix-campus-system`) and set a strong Database Password.
4. Select your preferred region (e.g. Frankfurt, East US) and click **Create New Project**.

### B. Retrieve Database Connection String
1. In Supabase Dashboard, go to **Project Settings** → **Database**.
2. Under **Connection String**, select **URI** (or **Session / Transaction Pooler**).
3. Copy the URI string:
   ```text
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   *(Replace `[YOUR-PASSWORD]` with your actual Supabase database password)*.

### C. Retrieve Supabase API Credentials
1. Go to **Project Settings** → **API**.
2. Copy **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
3. Copy **service_role key** (secret key for server-side file uploads).

### D. Create Storage Bucket
1. Go to **Storage** in the Supabase left sidebar.
2. Click **New Bucket**.
3. Set Bucket Name: `complaint-images`.
4. Toggle **Public Bucket** to **ON** (allows browser display of uploaded photos).
5. Click **Save**.

---

## Step 2: Free Email API Setup (Resend)

To prevent SMTP port 465 timeout errors on Render (`ETIMEDOUT / ESOCKET`), the application uses the **Resend HTTP REST API**.

1. Sign up for a free account at [Resend](https://resend.com).
2. Go to **API Keys** → Click **Create API Key**.
3. Name it `EduFix Render Key` and grant **Full Access**.
4. Copy your API Key (e.g., `re_123456789...`).
5. (Optional) Verified domain can be configured, or use the default sender: `EduFix AI <onboarding@resend.dev>`.

---

## Step 3: Deploy Backend Service on Render

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `s-soban/smart-complaint-management-system`.
4. Configure service parameters:

| Setting | Value |
| :--- | :--- |
| **Name** | `smart-complaint-backend` |
| **Environment** | `Node` |
| **Region** | Select closest to your Supabase region |
| **Branch** | `main` |
| **Root Directory** | *(leave blank for repository root)* |
| **Build Command** | `npm run install:all && npm run build` |
| **Start Command** | `npm run start` |

### Backend Environment Variables (Add in Render Dashboard):

| Key | Example / Value | Required | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `production` | Yes | Enables production mode |
| `PORT` | `10000` | Yes | Port provided by Render |
| `DATABASE_URL` | `postgresql://postgres.xxx:pass@db.xxx.supabase.co:5432/postgres` | Yes | Supabase PostgreSQL Connection URI |
| `SUPABASE_URL` | `https://your-project-ref.supabase.co` | Yes | Supabase API Base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Yes | Server-side Supabase Service Role Key |
| `SUPABASE_STORAGE_BUCKET` | `complaint-images` | Yes | Supabase Storage Bucket Name |
| `JWT_SECRET` | `your-secure-random-jwt-secret-string` | Yes | Secret used to sign authentication tokens |
| `EMAIL_API_KEY` | `re_123456789...` | Yes | Resend HTTP API Key |
| `EMAIL_FROM` | `EduFix AI <onboarding@resend.dev>` | Yes | Sender email address |
| `FRONTEND_URL` | `https://smart-complaint-frontend.onrender.com` | Yes | URL of deployed frontend (CORS protection) |

5. Click **Create Web Service**. Render will automatically build the backend, initialize the Supabase schema, and seed default accounts.

---

## Step 4: Deploy Frontend Service on Render

1. In Render Dashboard, click **New +** → **Static Site** (or Web Service).
2. Select repository: `s-soban/smart-complaint-management-system`.
3. Configure settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `smart-complaint-frontend` |
| **Branch** | `main` |
| **Build Command** | `npm run build:frontend` |
| **Publish Directory** | `frontend/dist` |

### Frontend Environment Variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://smart-complaint-backend.onrender.com/api` | Public backend API endpoint |

> [!CAUTION]
> **Never add `SUPABASE_SERVICE_ROLE_KEY` or `EMAIL_API_KEY` to VITE frontend variables.** Keep secrets strictly in the backend service.

---

## Step 5: How to Test Data Persistence & Functionality

1. **User Registration & Login**:
   - Register a new student account at `https://your-frontend.onrender.com`.
   - Log out and log back in to verify credentials.
2. **Complaint Submission & Photo Upload**:
   - Submit a complaint with photo evidence.
   - Verify that the photo URL points to `https://[SUPABASE-REF].supabase.co/storage/v1/object/public/complaint-images/...`.
3. **Password Reset Email**:
   - Click **Forgot Password?** on the login page.
   - Enter your email address. Check your inbox for the 6-digit PIN sent via Resend API.
4. **Maintenance & Admin Workflows**:
   - Log in as Admin (`admin@campus.edu` / `password123`) or Maintenance (`staff1@campus.edu` / `password123`).
   - Assign maintenance staff and upload an after-repair completion photo.
5. **Persistence Test Across Redeployments**:
   - Trigger a Manual Deploy or restart your backend service on Render.
   - Refresh your browser. All users, complaints, status histories, notifications, and uploaded images remain intact!

---

## 🔑 Pre-Seeded Demo Credentials

The database auto-seeds if empty with the following accounts:

| Role | Username / Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@campus.edu` | `password123` | Master control, staff assignment, analytics, AI insights |
| **Maintenance Staff** | `staff1@campus.edu` | `password123` | Workstation queue, repair status updates, after photos |
| **Student** | `student1@campus.edu` | `password123` | File complaints, track timeline, upvote issues |

---

## 🔒 Security Best Practices

1. **Environment Protection**: Real secret credentials (`DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EMAIL_API_KEY`) are stored safely in Render environment variables and ignored from git (`.gitignore`).
2. **Role-Based Access Control (RBAC)**: All API endpoints strictly verify JWT token roles before granting administrative or maintenance actions.
3. **Prepared Parameterized SQL Queries**: Prevents SQL injection across PostgreSQL database operations.
