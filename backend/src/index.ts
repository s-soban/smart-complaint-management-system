import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabaseSchema } from './database/schema';
import { seedDatabase } from './database/seed';
import { dbGet } from './database/db';
import authRoutes from './routes/authRoutes';
import complaintRoutes from './routes/complaintRoutes';
import campusRoutes from './routes/campusRoutes';
import notificationRoutes from './routes/notificationRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup
const clientOrigin = process.env.FRONTEND_URL || process.env.CLIENT_URL;
const allowedOrigins = clientOrigin ? clientOrigin.split(',').map(s => s.trim()) : '*';
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve uploaded static assets
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads', (req, res) => {
  const fallbackSvg = path.join(uploadsPath, 'complaints/sample-before-1.svg');
  if (fs.existsSync(fallbackSvg)) {
    return res.sendFile(fallbackSvg);
  }
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#0F172A"/>
    <rect x="40" y="40" width="520" height="320" rx="20" fill="#1E293B" stroke="#334155" stroke-width="3"/>
    <circle cx="300" cy="170" r="50" fill="#3B82F6" opacity="0.2"/>
    <path d="M 280 170 L 320 170 M 300 150 L 300 190" stroke="#3B82F6" stroke-width="6" stroke-linecap="round"/>
    <text x="50%" y="250" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#F8FAFC">Photo Evidence Uploaded</text>
    <text x="50%" y="290" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#94A3B8">Smart Complaint Management System</text>
  </svg>`);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Smart Complaint Management API'
  });
});

// Serve compiled frontend in production if dist directory exists
const frontendDistPath = path.resolve(process.cwd(), '../frontend/dist');
const localFrontendDistPath = path.resolve(process.cwd(), 'public');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else if (fs.existsSync(localFrontendDistPath)) {
  app.use(express.static(localFrontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(localFrontendDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize DB, Auto-Seed if empty, and Start Server
async function startServer() {
  try {
    await initDatabaseSchema();
    
    // Auto seed database if users table is empty
    const userCountRow = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (!userCountRow || userCountRow.count === 0) {
      console.log('🌱 Empty database detected. Auto-seeding initial campus data & default demo accounts...');
      await seedDatabase();
    }

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Smart Complaint Management Server running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

startServer();

