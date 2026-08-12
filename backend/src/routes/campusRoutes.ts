import { Router, Response } from 'express';
import { dbGet, dbRun, dbAll } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/authMiddleware';
import { generateCampusInsights } from '../services/aiService';

const router = Router();

// Get list of buildings & campus locations
router.get('/buildings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const buildings = await dbAll('SELECT * FROM buildings ORDER BY name ASC');
    return res.json({ success: true, buildings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Create new building
router.post('/buildings', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description, total_floors, latitude, longitude } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Building name and code are required.' });
    }
    const result = await dbRun(
      `INSERT INTO buildings (name, code, description, total_floors, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, code, description || '', total_floors || 4, latitude || 0, longitude || 0]
    );
    return res.status(201).json({ success: true, message: 'Building added.', id: result.lastID });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get complaint categories
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await dbAll('SELECT * FROM complaint_categories ORDER BY name ASC');
    return res.json({ success: true, categories });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Add or edit complaint category
router.post('/categories', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id, name, description, icon, default_priority } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    if (id) {
      await dbRun(
        `UPDATE complaint_categories 
         SET name = ?, description = ?, icon = ?, default_priority = ? 
         WHERE id = ?`,
        [name, description || '', icon || 'Wrench', default_priority || 'medium', id]
      );
      return res.json({ success: true, message: 'Category updated.' });
    } else {
      const result = await dbRun(
        `INSERT INTO complaint_categories (name, description, icon, default_priority)
         VALUES (?, ?, ?, ?)`,
        [name, description || '', icon || 'Wrench', default_priority || 'medium']
      );
      return res.status(201).json({ success: true, message: 'Category added.', id: result.lastID });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Campus Insights: Problem Sites vs Repaired Sites & AI Institutional Insights
router.get('/insights', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Problem Sites: Active unresolved issues grouped by Building & Room Area
    const problemSites = await dbAll<any>(`
      SELECT 
        b.id as building_id,
        b.name as building_name,
        b.code as building_code,
        c.room_area,
        COUNT(c.id) as total_complaints,
        SUM(CASE WHEN c.status NOT IN ('resolved', 'closed', 'rejected') THEN 1 ELSE 0 END) as unresolved_count,
        SUM(CASE WHEN c.priority = 'critical' AND c.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as critical_count,
        MAX(c.created_at) as last_reported,
        cat.name as primary_category,
        c.priority as highest_priority
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE c.status NOT IN ('closed', 'rejected')
      GROUP BY b.id, c.room_area
      HAVING unresolved_count > 0
      ORDER BY unresolved_count DESC, critical_count DESC
    `);

    // Repaired Sites: Resolved complaints grouped by location with Before/After images
    const repairedSites = await dbAll<any>(`
      SELECT 
        c.id as complaint_id,
        c.title,
        c.description,
        c.resolution_summary,
        c.resolved_at,
        c.room_area,
        b.name as building_name,
        cat.name as category_name,
        u_staff.full_name as resolved_by_staff,
        (
          SELECT image_url FROM complaint_images 
          WHERE complaint_id = c.id AND image_type = 'before' LIMIT 1
        ) as before_image,
        (
          SELECT image_url FROM complaint_images 
          WHERE complaint_id = c.id AND image_type = 'after' LIMIT 1
        ) as after_image
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      LEFT JOIN users u_staff ON c.assigned_to = u_staff.id
      WHERE c.status IN ('resolved', 'closed')
      ORDER BY c.resolved_at DESC LIMIT 20
    `);

    // Fetch all complaints for AI Insights calculation
    const allComplaints = await dbAll<any>(`
      SELECT c.*, b.name as building_name, cat.name as category_name
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
    `);

    const aiInsights = generateCampusInsights(allComplaints);

    return res.json({
      success: true,
      problemSites,
      repairedSites,
      aiInsights
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Analytics Endpoint: Detailed Charts & KPI Metrics
router.get('/analytics', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Overall Counts
    const totals = await dbGet<any>(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'waiting_parts' THEN 1 ELSE 0 END) as waiting_parts,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN priority = 'critical' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as critical_active,
        SUM(CASE WHEN priority = 'high' AND status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as high_active
      FROM complaints
    `);

    // Overdue Complaints (Pending > 7 days)
    const overdueCount = await dbGet<any>(`
      SELECT COUNT(*) as count 
      FROM complaints 
      WHERE status NOT IN ('resolved', 'closed', 'rejected')
      AND datetime(created_at) < datetime('now', '-7 days')
    `);

    // Resolution Rate %
    const totalComplaints = totals.total || 1;
    const totalResolved = (totals.resolved || 0) + (totals.closed || 0);
    const resolutionRate = Math.round((totalResolved / totalComplaints) * 100);

    // Complaints by Category
    const byCategory = await dbAll<any>(`
      SELECT cat.name, COUNT(c.id) as count
      FROM complaint_categories cat
      LEFT JOIN complaints c ON c.category_id = cat.id
      GROUP BY cat.id, cat.name
      ORDER BY count DESC
    `);

    // Complaints by Priority
    const byPriority = await dbAll<any>(`
      SELECT priority, COUNT(*) as count
      FROM complaints
      GROUP BY priority
    `);

    // Complaints by Status
    const byStatus = await dbAll<any>(`
      SELECT status, COUNT(*) as count
      FROM complaints
      GROUP BY status
    `);

    // Department Analysis
    const byDepartment = await dbAll<any>(`
      SELECT u.department, COUNT(c.id) as count
      FROM complaints c
      JOIN users u ON c.submitted_by = u.id
      WHERE u.department IS NOT NULL AND u.department != ''
      GROUP BY u.department
      ORDER BY count DESC
    `);

    // Building Hotspots
    const byBuilding = await dbAll<any>(`
      SELECT b.name as building_name, COUNT(c.id) as count,
        SUM(CASE WHEN c.priority = 'critical' THEN 1 ELSE 0 END) as critical_count
      FROM buildings b
      LEFT JOIN complaints c ON c.building_id = b.id
      GROUP BY b.id, b.name
      ORDER BY count DESC
    `);

    // Staff Workload
    const staffWorkload = await dbAll<any>(`
      SELECT u.full_name as staff_name, 
        COUNT(c.id) as assigned_total,
        SUM(CASE WHEN c.status IN ('assigned', 'in_progress', 'waiting_parts') THEN 1 ELSE 0 END) as active_workload,
        SUM(CASE WHEN c.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_count
      FROM users u
      LEFT JOIN complaints c ON c.assigned_to = u.id
      WHERE u.role = 'maintenance'
      GROUP BY u.id, u.full_name
    `);

    return res.json({
      success: true,
      kpis: {
        total: totals.total || 0,
        newSubmitted: totals.submitted || 0,
        pendingTotal: (totals.submitted || 0) + (totals.under_review || 0) + (totals.assigned || 0) + (totals.waiting_parts || 0),
        inProgress: totals.in_progress || 0,
        criticalActive: totals.critical_active || 0,
        resolvedTotal: totalResolved,
        overdueCount: overdueCount?.count || 0,
        resolutionRate,
        avgResolutionHours: 18.5 // Benchmark average
      },
      charts: {
        byCategory,
        byPriority,
        byStatus,
        byDepartment,
        byBuilding,
        staffWorkload
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin Export Data for Reports
router.get('/reports', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const complaints = await dbAll<any>(`
      SELECT 
        c.id, c.title, c.description, cat.name as category, b.name as building, c.room_area,
        c.priority, c.urgency_score, c.status, u_sub.full_name as student_name, u_sub.department,
        u_ass.full_name as maintenance_staff, c.created_at, c.resolved_at, c.resolution_summary
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u_sub ON c.submitted_by = u_sub.id
      LEFT JOIN users u_ass ON c.assigned_to = u_ass.id
      ORDER BY c.created_at DESC
    `);

    return res.json({ success: true, reports: complaints });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
