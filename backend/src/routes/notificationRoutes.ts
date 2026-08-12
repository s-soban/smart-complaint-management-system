import { Router, Response } from 'express';
import { dbAll, dbRun } from '../database/db';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// Get user notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await dbAll<any>(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC LIMIT 50
    `, [req.user!.id]);

    const unreadCount = notifications.filter(n => n.is_read === 0).length;

    return res.json({ success: true, notifications, unreadCount });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await dbRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user!.id]);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
