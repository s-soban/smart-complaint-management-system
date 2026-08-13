# Smart Complaint Management System - Deployment Guide

This guide provides step-by-step instructions for deploying the application using GitHub and live cloud platforms (Render, Vercel, Railway, or VPS).

---

## 🔗 Repository Details

- **GitHub Repository URL**: [https://github.com/s-soban/smart-complaint-management-system](https://github.com/s-soban/smart-complaint-management-system)
- **Default Branch**: `main`

---

## 🛠️ Automated Deployment via Render (Recommended Full Stack)

Render supports hosting both the Node backend and static React frontend in one unified web service.

### Step 1: Connect Repository to Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select repository: `s-soban/smart-complaint-management-system`.

### Step 2: Configure Build & Runtime Settings
- **Name**: `smart-complaint-management-system`
- **Environment**: `Node`
- **Region**: Select your preferred region (e.g. Frankfurt, Oregon, Singapore).
- **Branch**: `main`
- **Build Command**:
  ```bash
  npm run install:all && npm run build
  ```
- **Start Command**:
  ```bash
  npm run start
  ```

### Step 3: Environment Variables
Add the following key-value pairs in the Render Environment Variables tab:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `10000` | Port assigned by Render |
| `JWT_SECRET` | `<your-secure-jwt-secret>` | Secret key for JSON Web Tokens |
| `DATABASE_PATH` | `./data/complaints.db` | SQLite database file location |

Click **Create Web Service**. Render will automatically build and deploy the application.

---

## ⚡ Deployment via Vercel (Frontend) + Render (Backend)

If you prefer hosting the frontend on Vercel:

### Step 1: Deploy Backend on Render
- Follow the Render instructions above and copy your deployed backend API URL (e.g., `https://smart-complaint-backend.onrender.com`).

### Step 2: Deploy Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Import `s-soban/smart-complaint-management-system`.
3. Set Root Directory to `frontend`.
4. Add Environment Variable:
   - `VITE_API_URL` = `https://smart-complaint-backend.onrender.com/api`
   - `VITE_UPLOADS_URL` = `https://smart-complaint-backend.onrender.com/uploads`
5. Click **Deploy**.

---

## 🚀 Pushing Updates via GitHub

To push future fixes or changes to GitHub:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Any push to `main` will automatically trigger:
1. **GitHub Actions CI**: Automated build & TypeScript verification.
2. **Auto-Deployment**: Render/Vercel will rebuild and publish the update live.

---

## 🔑 Default Login Credentials (Auto-Seeded)

| Role | Email / ID | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@campus.edu` / `ADM001` | `password123` | Full control, assignment, AI analytics, user management |
| **Student** | `alex@student.edu` / `STD101` | `password123` | File complaint, upload evidence, track lifecycle |
| **Maintenance Staff** | `tech1@campus.edu` / `MNT001` | `password123` | Workstation queue, repair logs, after-photo upload |
