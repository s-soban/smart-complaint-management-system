import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dbGet, dbRun, dbAll } from '../database/db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/authMiddleware';
import {
  predictCategory,
  calculatePriorityAndUrgency,
  detectDuplicatesAndSimilar,
  suggestResolution
} from '../services/aiService';

const router = Router();

// Ensure upload folders exist
const uploadsDir = path.resolve(process.cwd(), 'uploads');
const complaintsDir = path.join(uploadsDir, 'complaints');
const repairsDir = path.join(uploadsDir, 'repairs');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(complaintsDir)) fs.mkdirSync(complaintsDir, { recursive: true });
if (!fs.existsSync(repairsDir)) fs.mkdirSync(repairsDir, { recursive: true });

// Storage config for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isRepair = req.path.includes('repair') || req.body.image_type === 'after';
    cb(null, isRepair ? repairsDir : complaintsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeMatch = allowedTypes.test(file.mimetype);
    if (extMatch && mimeMatch) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF) are allowed.'));
  }
});

// Helper to format unique Complaint ID: CMP-2026-XXXXX
async function generateComplaintId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const row = await dbGet<{ count: number }>('SELECT COUNT(*) as count FROM complaints');
  const nextNum = (row?.count || 0) + 1;
  const formattedNum = String(nextNum).padStart(5, '0');
  return `CMP-${currentYear}-${formattedNum}`;
}

// Live AI Auto-Analyze Endpoint for student complaint form
router.post('/ai-analyze', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title = '', description = '', building_id, room_area = '' } = req.body;

    const catPrediction = predictCategory(title, description);
    
    // Fetch building name if available
    let bName = '';
    if (building_id) {
      const bld = await dbGet<any>('SELECT name FROM buildings WHERE id = ?', [building_id]);
      if (bld) bName = bld.name;
    }

    const prioResult = calculatePriorityAndUrgency(title, description, catPrediction.categoryId, bName, room_area);

    // Duplicate detection against recent active complaints
    const existing = await dbAll<any>(`
      SELECT c.*, b.name as building_name, cat.name as category_name
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE c.status NOT IN ('closed', 'rejected')
      ORDER BY c.created_at DESC LIMIT 100
    `);

    const duplicateMatches = detectDuplicatesAndSimilar(title, description, Number(building_id) || 0, room_area, existing);

    return res.json({
      success: true,
      categoryPrediction: catPrediction,
      priorityUrgency: prioResult,
      duplicateMatches
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// File a New Complaint (Student / Admin)
router.post('/', authenticateToken, upload.array('images', 5), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category_id,
      issue_type,
      building_id,
      floor,
      room_area,
      date_noticed,
      contact_phone,
      manual_priority,
      manual_urgency
    } = req.body;

    if (!title || !description || !building_id || !room_area) {
      return res.status(400).json({ success: false, message: 'Title, description, building, and room/area are required.' });
    }

    // Determine category if not explicitly chosen
    let finalCategoryId = Number(category_id);
    let catPrediction: any;
    if (!finalCategoryId || isNaN(finalCategoryId)) {
      catPrediction = predictCategory(title, description);
      finalCategoryId = catPrediction.categoryId;
    }

    // Fetch building details
    const building = await dbGet<any>('SELECT name FROM buildings WHERE id = ?', [building_id]);
    const buildingName = building ? building.name : '';

    // Calculate priority & urgency score
    const prioResult = calculatePriorityAndUrgency(title, description, finalCategoryId, buildingName, room_area);
    const finalPriority = manual_priority || prioResult.priority;
    const finalUrgency = manual_urgency ? Number(manual_urgency) : prioResult.urgencyScore;

    const complaintId = await generateComplaintId();
    const now = new Date().toISOString();

    // Insert complaint
    await dbRun(
      `INSERT INTO complaints (
        id, title, description, category_id, issue_type, building_id, floor, room_area,
        date_noticed, contact_phone, priority, urgency_score, priority_reason, status,
        submitted_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?)`,
      [
        complaintId,
        title,
        description,
        finalCategoryId,
        issue_type || 'General Equipment',
        building_id,
        floor || 'Ground Floor',
        room_area,
        date_noticed || now.substring(0, 10),
        contact_phone || req.user!.email,
        finalPriority,
        finalUrgency,
        prioResult.reason,
        req.user!.id,
        now,
        now
      ]
    );

    // Process uploaded images
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      for (const file of files) {
        let imageUrl = `/uploads/complaints/${file.filename}`;
        try {
          if (file.path && fs.existsSync(file.path)) {
            const buffer = fs.readFileSync(file.path);
            const mimeType = file.mimetype || 'image/jpeg';
            imageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
          }
        } catch (e) {
          console.error('Failed to encode image to Base64 Data URL:', e);
        }

        await dbRun(
          `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by, created_at)
           VALUES (?, ?, 'before', ?, ?)`,
          [complaintId, imageUrl, req.user!.id, now]
        );
      }
    }

    // Log status timeline
    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, NULL, 'submitted', ?, 'Complaint submitted by user', ?)`,
      [complaintId, req.user!.id, now]
    );

    // Duplicate detection check
    const existing = await dbAll<any>(`
      SELECT c.*, b.name as building_name, cat.name as category_name
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      WHERE c.id != ? AND c.status NOT IN ('closed', 'rejected')
    `, [complaintId]);

    const duplicates = detectDuplicatesAndSimilar(title, description, Number(building_id), room_area, existing);

    for (const dup of duplicates) {
      if (dup.similarityScore >= 50) {
        await dbRun(
          `INSERT INTO duplicate_matches (source_complaint_id, target_complaint_id, similarity_score, status, created_at)
           VALUES (?, ?, ?, 'pending', ?)`,
          [complaintId, dup.complaintId, dup.similarityScore, now]
        );
      }
    }

    // Notify admins if critical/high
    const admins = await dbAll<any>("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type, link, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          admin.id,
          finalPriority === 'critical' ? '🚨 CRITICAL Complaint Submitted' : 'New Complaint Submitted',
          `Complaint ${complaintId} ("${title}") submitted at ${buildingName} - ${room_area}. Priority: ${finalPriority.toUpperCase()}.`,
          finalPriority === 'critical' ? 'critical' : 'info',
          `/complaints/${complaintId}`,
          now
        ]
      );
    }

    // Student notification
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, link, created_at)
       VALUES (?, ?, ?, 'info', ?, ?)`,
      [
        req.user!.id,
        'Complaint Submitted Successfully',
        `Your complaint ${complaintId} has been registered and assigned priority ${finalPriority.toUpperCase()}.`,
        `/complaints/${complaintId}`,
        now
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaintId,
      priority: finalPriority,
      urgencyScore: finalUrgency,
      duplicatesFound: duplicates.length > 0 ? duplicates : []
    });
  } catch (error: any) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Complaints List (Filtered by Role & Search Queries)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      status,
      category_id,
      building_id,
      priority,
      search,
      assigned_to,
      sort = 'newest'
    } = req.query;

    let sql = `
      SELECT c.*, 
        b.name as building_name, 
        cat.name as category_name, cat.icon as category_icon,
        u_sub.full_name as submitter_name, u_sub.user_id_code as submitter_code, u_sub.department as submitter_dept,
        u_ass.full_name as assignee_name
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u_sub ON c.submitted_by = u_sub.id
      LEFT JOIN users u_ass ON c.assigned_to = u_ass.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role Scope Filtering
    if (req.user!.role === 'student') {
      sql += ' AND c.submitted_by = ?';
      params.push(req.user!.id);
    } else if (req.user!.role === 'maintenance') {
      // Show assigned to maintenance staff OR unassigned in-progress
      sql += ' AND (c.assigned_to = ? OR (c.assigned_to IS NULL AND c.status = "assigned"))';
      params.push(req.user!.id);
    }

    // Dynamic Filter Clauses
    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }
    if (category_id) {
      sql += ' AND c.category_id = ?';
      params.push(category_id);
    }
    if (building_id) {
      sql += ' AND c.building_id = ?';
      params.push(building_id);
    }
    if (priority) {
      sql += ' AND c.priority = ?';
      params.push(priority);
    }
    if (assigned_to) {
      sql += ' AND c.assigned_to = ?';
      params.push(assigned_to);
    }
    if (search) {
      sql += ' AND (c.id LIKE ? OR c.title LIKE ? OR c.description LIKE ? OR c.room_area LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    // Sorting
    if (sort === 'oldest') {
      sql += ' ORDER BY c.created_at ASC';
    } else if (sort === 'priority_desc') {
      sql += ' ORDER BY c.urgency_score DESC, c.created_at DESC';
    } else if (sort === 'pending_longest') {
      sql += ' ORDER BY CASE WHEN c.status IN ("resolved", "closed", "rejected") THEN 1 ELSE 0 END, c.created_at ASC';
    } else {
      sql += ' ORDER BY c.created_at DESC';
    }

    const complaints = await dbAll<any>(sql, params);
    return res.json({ success: true, complaints });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Single Complaint Details with Images, History, Comments & Duplicate Matches
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;

    const complaint = await dbGet<any>(`
      SELECT c.*, 
        b.name as building_name, b.code as building_code,
        cat.name as category_name, cat.icon as category_icon,
        u_sub.full_name as submitter_name, u_sub.email as submitter_email, u_sub.phone as submitter_phone, u_sub.user_id_code as submitter_code, u_sub.department as submitter_dept,
        u_ass.full_name as assignee_name, u_ass.email as assignee_email, u_ass.phone as assignee_phone
      FROM complaints c
      JOIN buildings b ON c.building_id = b.id
      JOIN complaint_categories cat ON c.category_id = cat.id
      JOIN users u_sub ON c.submitted_by = u_sub.id
      LEFT JOIN users u_ass ON c.assigned_to = u_ass.id
      WHERE c.id = ?
    `, [complaintId]);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Permission check for students
    if (req.user!.role === 'student' && complaint.submitted_by !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Forbidden. You can only view your own complaints.' });
    }

    // Fetch images
    const images = await dbAll<any>(`
      SELECT ci.*, u.full_name as uploader_name 
      FROM complaint_images ci
      JOIN users u ON ci.uploaded_by = u.id
      WHERE ci.complaint_id = ?
      ORDER BY ci.created_at ASC
    `, [complaintId]);

    // Fetch timeline history
    const history = await dbAll<any>(`
      SELECT csh.*, u.full_name as changed_by_name, u.role as changed_by_role
      FROM complaint_status_history csh
      JOIN users u ON csh.changed_by = u.id
      WHERE csh.complaint_id = ?
      ORDER BY csh.created_at ASC
    `, [complaintId]);

    // Fetch comments
    const comments = await dbAll<any>(`
      SELECT cc.*, u.full_name as user_name, u.role as user_role
      FROM complaint_comments cc
      JOIN users u ON cc.user_id = u.id
      WHERE cc.complaint_id = ?
      ${req.user!.role === 'student' ? 'AND cc.is_internal = 0' : ''}
      ORDER BY cc.created_at ASC
    `, [complaintId]);

    // Fetch duplicate matches if admin
    let duplicates: any[] = [];
    if (req.user!.role === 'admin') {
      duplicates = await dbAll<any>(`
        SELECT dm.*, c_target.title as target_title, c_target.status as target_status, c_target.room_area as target_room, b.name as target_building
        FROM duplicate_matches dm
        JOIN complaints c_target ON dm.target_complaint_id = c_target.id
        JOIN buildings b ON c_target.building_id = b.id
        WHERE dm.source_complaint_id = ? OR dm.target_complaint_id = ?
      `, [complaintId, complaintId]);
    }

    // Suggested resolution preview
    const suggestedFix = suggestResolution(complaint.title, complaint.description, complaint.category_name);

    return res.json({
      success: true,
      complaint,
      images,
      history,
      comments,
      duplicates,
      suggestedFix
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Complaint Status & Upload After-Repair Images
router.patch('/:id/status', authenticateToken, upload.array('repair_images', 5), async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;
    const { status, comment, resolution_summary } = req.body;

    const validStatuses = ['submitted', 'under_review', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid complaint status.' });
    }

    const current = await dbGet<any>('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    // Authorization check
    if (req.user!.role === 'student') {
      return res.status(403).json({ success: false, message: 'Students cannot modify administrative status.' });
    }
    if (req.user!.role === 'maintenance' && current.assigned_to !== req.user!.id) {
      return res.status(403).json({ success: false, message: 'Maintenance staff can only update complaints assigned to them.' });
    }

    const now = new Date().toISOString();
    let resolvedAt = current.resolved_at;
    let closedAt = current.closed_at;

    if (status === 'resolved' && !resolvedAt) resolvedAt = now;
    if (status === 'closed' && !closedAt) closedAt = now;

    // Update complaint record
    await dbRun(
      `UPDATE complaints 
       SET status = ?, 
           resolution_summary = COALESCE(?, resolution_summary),
           resolved_at = ?, 
           closed_at = ?, 
           updated_at = ?
       WHERE id = ?`,
      [status, resolution_summary || comment || null, resolvedAt, closedAt, now, complaintId]
    );

    // Process repair images if uploaded
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      for (const file of files) {
        let imageUrl = `/uploads/repairs/${file.filename}`;
        try {
          if (file.path && fs.existsSync(file.path)) {
            const buffer = fs.readFileSync(file.path);
            const mimeType = file.mimetype || 'image/jpeg';
            imageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
          }
        } catch (e) {
          console.error('Failed to encode repair image to Base64 Data URL:', e);
        }

        await dbRun(
          `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by, created_at)
           VALUES (?, ?, 'after', ?, ?)`,
          [complaintId, imageUrl, req.user!.id, now]
        );
      }
    }

    // Insert history log
    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, current.status, status, req.user!.id, comment || `Status changed to ${status}`, now]
    );

    // Notify Student
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, link, created_at)
       VALUES (?, ?, ?, 'info', ?, ?)`,
      [
        current.submitted_by,
        `Status Updated: ${status.replace('_', ' ').toUpperCase()}`,
        `Your complaint ${complaintId} status changed from "${current.status}" to "${status}". ${comment ? `Remark: ${comment}` : ''}`,
        `/complaints/${complaintId}`,
        now
      ]
    );

    return res.json({
      success: true,
      message: `Complaint ${complaintId} status updated to ${status}.`,
      status
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Assign Maintenance Staff to Complaint (Admin Only)
router.patch('/:id/assign', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;
    const { assigned_to } = req.body;

    const current = await dbGet<any>('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!current) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const staff = await dbGet<any>("SELECT full_name FROM users WHERE id = ? AND role = 'maintenance'", [assigned_to]);
    if (!staff) return res.status(400).json({ success: false, message: 'Selected user is not valid maintenance staff.' });

    const now = new Date().toISOString();
    const newStatus = current.status === 'submitted' ? 'assigned' : current.status;

    await dbRun(
      `UPDATE complaints SET assigned_to = ?, status = ?, updated_at = ? WHERE id = ?`,
      [assigned_to, newStatus, now, complaintId]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, current.status, newStatus, req.user!.id, `Assigned maintenance work to ${staff.full_name}`, now]
    );

    // Notify Maintenance Staff
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, link, created_at)
       VALUES (?, ?, ?, 'warning', ?, ?)`,
      [
        assigned_to,
        '🛠️ New Complaint Work Assigned',
        `You have been assigned to complaint ${complaintId} ("${current.title}"). Priority: ${current.priority.toUpperCase()}`,
        `/complaints/${complaintId}`,
        now
      ]
    );

    return res.json({
      success: true,
      message: `Assigned complaint ${complaintId} to ${staff.full_name}.`,
      assigned_to,
      assignee_name: staff.full_name
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Priority / Category Override (Admin Only)
router.patch('/:id/priority', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;
    const { priority, urgency_score, category_id, priority_reason } = req.body;

    const current = await dbGet<any>('SELECT * FROM complaints WHERE id = ?', [complaintId]);
    if (!current) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const now = new Date().toISOString();

    await dbRun(
      `UPDATE complaints 
       SET priority = COALESCE(?, priority),
           urgency_score = COALESCE(?, urgency_score),
           category_id = COALESCE(?, category_id),
           priority_reason = COALESCE(?, priority_reason),
           updated_at = ?
       WHERE id = ?`,
      [priority, urgency_score, category_id, priority_reason || 'Manually updated by Administrator', now, complaintId]
    );

    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [complaintId, current.status, current.status, req.user!.id, `Admin adjusted priority to ${priority || current.priority}`, now]
    );

    return res.json({ success: true, message: 'Complaint priority and category updated.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add Remark / Comment to Complaint
router.post('/:id/comments', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const complaintId = req.params.id;
    const { comment_text, is_internal = 0 } = req.body;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
    }

    const complaint = await dbGet<any>('SELECT submitted_by, assigned_to FROM complaints WHERE id = ?', [complaintId]);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO complaint_comments (complaint_id, user_id, comment_text, is_internal, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [complaintId, req.user!.id, comment_text.trim(), req.user!.role === 'student' ? 0 : is_internal, now]
    );

    // Notify student if admin/staff commented
    if (req.user!.id !== complaint.submitted_by && !is_internal) {
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type, link, created_at)
         VALUES (?, 'New Remark Added', ?, 'info', ?, ?)`,
        [
          complaint.submitted_by,
          `An update was added to your complaint ${complaintId} by ${req.user!.full_name}: "${comment_text.trim().substring(0, 60)}..."`,
          `/complaints/${complaintId}`,
          now
        ]
      );
    }

    return res.json({ success: true, message: 'Comment added successfully.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: Merge Duplicates
router.post('/duplicates/merge', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { master_complaint_id, duplicate_complaint_id, action } = req.body; // action: 'merge' | 'separate' | 'ignore'

    const now = new Date().toISOString();

    if (action === 'merge') {
      // Mark duplicate complaint as duplicate of master and close it
      await dbRun(
        `UPDATE complaints SET status = 'closed', is_duplicate_of = ?, resolution_summary = ?, updated_at = ? WHERE id = ?`,
        [master_complaint_id, `Merged into master complaint ${master_complaint_id}`, now, duplicate_complaint_id]
      );

      await dbRun(
        `UPDATE duplicate_matches SET status = 'merged' WHERE (source_complaint_id = ? AND target_complaint_id = ?) OR (source_complaint_id = ? AND target_complaint_id = ?)`,
        [master_complaint_id, duplicate_complaint_id, duplicate_complaint_id, master_complaint_id]
      );

      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
         VALUES (?, 'submitted', 'closed', ?, ?, ?)`,
        [duplicate_complaint_id, req.user!.id, `Merged into duplicate master complaint ${master_complaint_id}`, now]
      );

      return res.json({ success: true, message: `Complaint ${duplicate_complaint_id} merged into ${master_complaint_id}.` });
    } else {
      await dbRun(
        `UPDATE duplicate_matches SET status = ? WHERE (source_complaint_id = ? AND target_complaint_id = ?) OR (source_complaint_id = ? AND target_complaint_id = ?)`,
        [action === 'separate' ? 'separated' : 'ignored', master_complaint_id, duplicate_complaint_id, duplicate_complaint_id, master_complaint_id]
      );
      return res.json({ success: true, message: `Duplicate match flagged as ${action}.` });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
