import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun, dbAll } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_smart_complaint_jwt_key_2026';

// Register User (Student default, or staff/admin if requested)
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, user_id_code, email, phone, department, year_class, password, role } = req.body;

    if (!full_name || !user_id_code || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full name, ID Code, Email, and Password are required.' });
    }

    // Check existing email or ID
    const existingUser = await dbGet('SELECT id FROM users WHERE email = ? OR user_id_code = ?', [email, user_id_code]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'A user with this Email or Student/Employee ID already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const assignedRole = role && ['student', 'admin', 'maintenance'].includes(role) ? role : 'student';

    const result = await dbRun(
      `INSERT INTO users (full_name, user_id_code, email, phone, department, year_class, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, user_id_code, email, phone || '', department || '', year_class || '', password_hash, assignedRole]
    );

    const token = jwt.sign(
      { id: result.lastID, email, role: assignedRole, user_id_code, full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: result.lastID,
        full_name,
        user_id_code,
        email,
        phone,
        department,
        year_class,
        role: assignedRole
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or user_id_code

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email/ID and password are required.' });
    }

    const user = await dbGet<any>(
      'SELECT * FROM users WHERE email = ? OR user_id_code = ?',
      [identifier, identifier]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, user_id_code: user.user_id_code, full_name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        user_id_code: user.user_id_code,
        email: user.email,
        phone: user.phone,
        department: user.department,
        year_class: user.year_class,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await dbGet<any>(
      'SELECT id, full_name, user_id_code, email, phone, department, year_class, role, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    return res.json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password Mock Handler
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  const { email } = req.body;
  const user = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
  if (!user) {
    return res.status(404).json({ success: false, message: 'No account found with this email address.' });
  }
  return res.json({
    success: true,
    message: 'Password reset instructions sent to your email. (Demo simulation: Use reset code 123456)'
  });
});

// Reset Password Mock Handler
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  const { email, resetCode, newPassword } = req.body;
  if (resetCode !== '123456') {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
  }
  const password_hash = await bcrypt.hash(newPassword, 10);
  await dbRun('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, email]);

  return res.json({ success: true, message: 'Password has been reset successfully. Please log in with your new password.' });
});

// Admin: Get all users or filter by role
router.get('/users', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const roleFilter = req.query.role as string;
    let sql = 'SELECT id, full_name, user_id_code, email, phone, department, year_class, role, created_at FROM users';
    const params: any[] = [];
    if (roleFilter) {
      sql += ' WHERE role = ?';
      params.push(roleFilter);
    }
    sql += ' ORDER BY id DESC';

    const users = await dbAll(sql, params);
    return res.json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add or update user role
router.patch('/users/:id/role', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin', 'maintenance'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role specified.' });
    }
    await dbRun('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    return res.json({ success: true, message: `User role updated to ${role}` });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
