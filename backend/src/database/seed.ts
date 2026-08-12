import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { dbExec, dbRun, dbGet } from './db';
import { initDatabaseSchema } from './schema';
import { predictCategory, calculatePriorityAndUrgency, suggestResolution } from '../services/aiService';

// SVG Sample Image Creator for realistic image previews
function createSampleSVG(text: string, bgColor: string, textColor: string = '#FFFFFF'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${bgColor}"/>
    <circle cx="300" cy="180" r="60" fill="rgba(255,255,255,0.2)"/>
    <path d="M 270 180 L 330 180 M 300 150 L 300 210" stroke="white" stroke-width="8" stroke-linecap="round"/>
    <text x="50%" y="280" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="${textColor}">${text}</text>
    <text x="50%" y="320" dominant-baseline="middle" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="${textColor}" opacity="0.8">Campus Facility Management Record</text>
  </svg>`;
}

export async function seedDatabase() {
  console.log('🌱 Starting Database Seeding Process...');

  await initDatabaseSchema();

  // Clear existing records
  await dbExec(`
    DELETE FROM audit_logs;
    DELETE FROM duplicate_matches;
    DELETE FROM notifications;
    DELETE FROM complaint_comments;
    DELETE FROM complaint_status_history;
    DELETE FROM complaint_images;
    DELETE FROM complaints;
    DELETE FROM complaint_categories;
    DELETE FROM buildings;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);
  const now = new Date();

  // 1. Seed Buildings
  const buildingsData = [
    { name: 'Science Block A', code: 'SBA', description: 'Faculty of Natural Sciences & Research Labs', floors: 5 },
    { name: 'Engineering Hub B', code: 'EHB', description: 'Department of Electrical & Computer Engineering', floors: 6 },
    { name: 'Library Complex', code: 'LIB', description: 'Central Academic Library & Study Centers', floors: 4 },
    { name: 'Student Hostel Block 1', code: 'SH1', description: 'Undergraduate Men Hostel', floors: 4 },
    { name: 'Student Hostel Block 2', code: 'SH2', description: 'Undergraduate Women Hostel', floors: 4 },
    { name: 'Central Dining Hall', code: 'CDH', description: 'Campus Cafeteria & Food Court', floors: 2 },
    { name: 'Administrative Tower', code: 'ADM', description: 'University Administration & Registrar', floors: 8 },
    { name: 'Sports Complex', code: 'SPC', description: 'Gymnasium, Indoor Courts & Stadium', floors: 3 }
  ];

  const buildingIds: Record<string, number> = {};
  for (const b of buildingsData) {
    const res = await dbRun(
      'INSERT INTO buildings (name, code, description, total_floors) VALUES (?, ?, ?, ?)',
      [b.name, b.code, b.description, b.floors]
    );
    buildingIds[b.code] = res.lastID;
  }

  // 2. Seed Categories
  const categoriesData = [
    { name: 'Electrical', description: 'Power failures, wiring, lighting, fans, AC switches', icon: 'Zap', defaultPrio: 'high' },
    { name: 'Plumbing', description: 'Pipe leaks, taps, toilets, drainage, water supply', icon: 'Droplets', defaultPrio: 'high' },
    { name: 'Internet / Network', description: 'Wi-Fi access points, Ethernet ports, router issues', icon: 'Wifi', defaultPrio: 'medium' },
    { name: 'Classroom', description: 'Projectors, smartboards, podiums, whiteboards', icon: 'Tv', defaultPrio: 'medium' },
    { name: 'Laboratory', description: 'Lab equipment, chemical hoods, sensors, fume extractors', icon: 'FlaskConical', defaultPrio: 'high' },
    { name: 'Hostel', description: 'Dorm room furniture, geysers, locks, windows', icon: 'Home', defaultPrio: 'medium' },
    { name: 'Washroom', description: 'Restroom cleanliness, mirrors, flush valves, soap dispensers', icon: 'Bath', defaultPrio: 'medium' },
    { name: 'Furniture', description: 'Desks, chairs, podiums, benches', icon: 'Armchair', defaultPrio: 'low' },
    { name: 'Security', description: 'CCTV cameras, door locks, access gates, security lighting', icon: 'ShieldAlert', defaultPrio: 'critical' },
    { name: 'Cleaning / Sanitation', description: 'Garbage bins, floor cleaning, cobwebs, waste management', icon: 'Trash2', defaultPrio: 'low' },
    { name: 'Roads / Parking', description: 'Potholes, speed bumps, parking slots, streetlights', icon: 'Car', defaultPrio: 'low' },
    { name: 'Library', description: 'Reading cubicles, book racks, scanners', icon: 'BookOpen', defaultPrio: 'low' },
    { name: 'Sports Facilities', description: 'Gym equipment, court netting, turf lighting', icon: 'Dumbbell', defaultPrio: 'low' },
    { name: 'Water Supply', description: 'Water coolers, RO purifiers, main line supply', icon: 'GlassWater', defaultPrio: 'critical' },
    { name: 'Air Conditioning', description: 'Central HVAC, split AC, chiller units', icon: 'Wind', defaultPrio: 'high' },
    { name: 'Other', description: 'General unclassified facility issues', icon: 'HelpCircle', defaultPrio: 'medium' }
  ];

  const categoryIds: Record<string, number> = {};
  for (const c of categoriesData) {
    const res = await dbRun(
      'INSERT INTO complaint_categories (name, description, icon, default_priority) VALUES (?, ?, ?, ?)',
      [c.name, c.description, c.icon, c.defaultPrio]
    );
    categoryIds[c.name] = res.lastID;
  }

  // 3. Seed Users (3 Admins, 5 Maintenance Staff, 20 Students)
  console.log('👤 Creating Users (3 Admins, 5 Maintenance, 20 Students)...');

  // Admins
  const admins = [
    { name: 'Dr. Arthur Pendelton', idCode: 'ADM-001', email: 'admin@campus.edu', dept: 'Facilities Management' },
    { name: 'Sarah Jenkins', idCode: 'ADM-002', email: 'sarah.admin@campus.edu', dept: 'Campus Operations' },
    { name: 'Marcus Vance', idCode: 'ADM-003', email: 'marcus.admin@campus.edu', dept: 'Estate Administration' }
  ];
  const adminIds: number[] = [];
  for (const a of admins) {
    const res = await dbRun(
      `INSERT INTO users (full_name, user_id_code, email, phone, department, password_hash, role)
       VALUES (?, ?, ?, '555-0199', ?, ?, 'admin')`,
      [a.name, a.idCode, a.email, a.dept, passwordHash]
    );
    adminIds.push(res.lastID);
  }

  // Maintenance Staff
  const maintenanceStaff = [
    { name: 'Robert Miller', idCode: 'STF-101', email: 'staff1@campus.edu', dept: 'Electrical Maintenance', phone: '555-0201' },
    { name: 'David Kowalski', idCode: 'STF-102', email: 'staff2@campus.edu', dept: 'Plumbing & Water Services', phone: '555-0202' },
    { name: 'Elena Rostova', idCode: 'STF-103', email: 'staff3@campus.edu', dept: 'IT & Network Infrastructure', phone: '555-0203' },
    { name: 'James Carter', idCode: 'STF-104', email: 'staff4@campus.edu', dept: 'General Civil & Carpentry', phone: '555-0204' },
    { name: 'Hassan Ali', idCode: 'STF-105', email: 'staff5@campus.edu', dept: 'HVAC & Refrigeration', phone: '555-0205' }
  ];
  const staffIds: number[] = [];
  for (const m of maintenanceStaff) {
    const res = await dbRun(
      `INSERT INTO users (full_name, user_id_code, email, phone, department, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?, 'maintenance')`,
      [m.name, m.idCode, m.email, m.phone, m.dept, passwordHash]
    );
    staffIds.push(res.lastID);
  }

  // 20 Students
  const students = [
    { name: 'Alex Johnson', idCode: 'STU-2024-001', email: 'student1@campus.edu', dept: 'Computer Science', year: '3rd Year' },
    { name: 'Emily Zhang', idCode: 'STU-2024-002', email: 'emily.z@campus.edu', dept: 'Electrical Engineering', year: '4th Year' },
    { name: 'Michael Brown', idCode: 'STU-2024-003', email: 'michael.b@campus.edu', dept: 'Mechanical Engineering', year: '2nd Year' },
    { name: 'Sophia Martinez', idCode: 'STU-2024-004', email: 'sophia.m@campus.edu', dept: 'Civil Engineering', year: '3rd Year' },
    { name: 'Daniel Kim', idCode: 'STU-2024-005', email: 'daniel.k@campus.edu', dept: 'Biotechnology', year: '1st Year' },
    { name: 'Jessica Taylor', idCode: 'STU-2024-006', email: 'jessica.t@campus.edu', dept: 'Architecture', year: '4th Year' },
    { name: 'Liam Wilson', idCode: 'STU-2024-007', email: 'liam.w@campus.edu', dept: 'Physics', year: '2nd Year' },
    { name: 'Olivia Davis', idCode: 'STU-2024-008', email: 'olivia.d@campus.edu', dept: 'Chemistry', year: '3rd Year' },
    { name: 'Noah Thomas', idCode: 'STU-2024-009', email: 'noah.t@campus.edu', dept: 'Business Administration', year: '1st Year' },
    { name: 'Emma White', idCode: 'STU-2024-010', email: 'emma.w@campus.edu', dept: 'Mathematics', year: '3rd Year' },
    { name: 'Ethan Harris', idCode: 'STU-2024-011', email: 'ethan.h@campus.edu', dept: 'Computer Science', year: '2nd Year' },
    { name: 'Ava Martin', idCode: 'STU-2024-012', email: 'ava.m@campus.edu', dept: 'Economics', year: '4th Year' },
    { name: 'Lucas Clark', idCode: 'STU-2024-013', email: 'lucas.c@campus.edu', dept: 'Chemical Engineering', year: '1st Year' },
    { name: 'Mia Rodriguez', idCode: 'STU-2024-014', email: 'mia.r@campus.edu', dept: 'Psychology', year: '3rd Year' },
    { name: 'Benjamin Lewis', idCode: 'STU-2024-015', email: 'benjamin.l@campus.edu', dept: 'Environmental Science', year: '2nd Year' },
    { name: 'Charlotte Lee', idCode: 'STU-2024-016', email: 'charlotte.l@campus.edu', dept: 'Computer Science', year: '4th Year' },
    { name: 'Henry Walker', idCode: 'STU-2024-017', email: 'henry.w@campus.edu', dept: 'Electrical Engineering', year: '3rd Year' },
    { name: 'Amelia Hall', idCode: 'STU-2024-018', email: 'amelia.h@campus.edu', dept: 'Design & Media', year: '2nd Year' },
    { name: 'Alexander Young', idCode: 'STU-2024-019', email: 'alex.y@campus.edu', dept: 'Civil Engineering', year: '1st Year' },
    { name: 'Harper Allen', idCode: 'STU-2024-020', email: 'harper.a@campus.edu', dept: 'Biomedical Engineering', year: '4th Year' }
  ];
  const studentIds: number[] = [];
  for (const s of students) {
    const res = await dbRun(
      `INSERT INTO users (full_name, user_id_code, email, phone, department, year_class, password_hash, role)
       VALUES (?, ?, ?, '555-0100', ?, ?, ?, 'student')`,
      [s.name, s.idCode, s.email, s.dept, s.year, passwordHash]
    );
    studentIds.push(res.lastID);
  }

  // Generate Sample Images in uploads folder
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const complaintsDir = path.join(uploadsDir, 'complaints');
  const repairsDir = path.join(uploadsDir, 'repairs');

  if (!fs.existsSync(complaintsDir)) fs.mkdirSync(complaintsDir, { recursive: true });
  if (!fs.existsSync(repairsDir)) fs.mkdirSync(repairsDir, { recursive: true });

  const sampleBeforeSvg = createSampleSVG('BEFORE REPAIR: Damaged Facility', '#DC2626');
  const sampleAfterSvg = createSampleSVG('AFTER REPAIR: Fully Restored & Functional', '#16A34A');

  fs.writeFileSync(path.join(complaintsDir, 'sample-before-1.svg'), sampleBeforeSvg);
  fs.writeFileSync(path.join(complaintsDir, 'sample-before-2.svg'), sampleBeforeSvg);
  fs.writeFileSync(path.join(repairsDir, 'sample-after-1.svg'), sampleAfterSvg);
  fs.writeFileSync(path.join(repairsDir, 'sample-after-2.svg'), sampleAfterSvg);

  // 4. Seed 50 Complaints
  console.log('📋 Creating 50 Sample Complaints with Realistic Life-cycles...');

  const complaintTemplates = [
    { title: 'Ceiling fan making loud noise and wobbling', cat: 'Electrical', bCode: 'EHB', room: 'Room 204', status: 'resolved', prio: 'medium', urgency: 55 },
    { title: 'Ceiling fan in room 204 is broken and vibrating', cat: 'Electrical', bCode: 'EHB', room: 'Room 204', status: 'closed', prio: 'medium', urgency: 50, isDup: true },
    { title: 'Severe water leakage from tap in washroom', cat: 'Plumbing', bCode: 'SH1', room: '2nd Floor Washroom B', status: 'resolved', prio: 'high', urgency: 82 },
    { title: 'Sparking wire near main distribution board', cat: 'Electrical', bCode: 'SBA', room: 'Ground Floor Corridor', status: 'in_progress', prio: 'critical', urgency: 96 },
    { title: 'Wi-Fi connection failing continuously in library', cat: 'Internet / Network', bCode: 'LIB', room: '3rd Floor Reading Hall', status: 'assigned', prio: 'medium', urgency: 60 },
    { title: 'Projector HDMI port broken in lecture hall', cat: 'Classroom', bCode: 'EHB', room: 'Auditorium 101', status: 'resolved', prio: 'high', urgency: 78 },
    { title: 'Fume hood ventilation fan stopped working', cat: 'Laboratory', bCode: 'SBA', room: 'Organic Chem Lab 302', status: 'in_progress', prio: 'high', urgency: 88 },
    { title: 'Geyser not heating water in hostel block', cat: 'Hostel', bCode: 'SH2', room: 'Room 412', status: 'submitted', prio: 'medium', urgency: 50 },
    { title: 'Flush valve leaking onto washroom floor', cat: 'Washroom', bCode: 'ADM', room: '4th Floor Restroom', status: 'resolved', prio: 'medium', urgency: 65 },
    { title: 'Broken wooden desk armrest in classroom', cat: 'Furniture', bCode: 'EHB', room: 'Room 305', status: 'resolved', prio: 'low', urgency: 25 },
    { title: 'CCTV Camera offline near east entrance gate', cat: 'Security', bCode: 'ADM', room: 'Main Entrance Gate 2', status: 'under_review', prio: 'critical', urgency: 92 },
    { title: 'Garbage bin overflowing and emitting bad odor', cat: 'Cleaning / Sanitation', bCode: 'CDH', room: 'Cafeteria Courtyard', status: 'resolved', prio: 'low', urgency: 35 },
    { title: 'Large pothole on pathway leading to gym', cat: 'Roads / Parking', bCode: 'SPC', room: 'Outer Pathway', status: 'waiting_parts', prio: 'medium', urgency: 45 },
    { title: 'Book scanner screen flickering in library', cat: 'Library', bCode: 'LIB', room: '1st Floor Circulation Desk', status: 'assigned', prio: 'low', urgency: 30 },
    { title: 'Treadmill emergency stop button jammed', cat: 'Sports Facilities', bCode: 'SPC', room: 'Fitness Center Room 2', status: 'in_progress', prio: 'medium', urgency: 58 },
    { title: 'Water purifier tastes strange and yellow tint', cat: 'Water Supply', bCode: 'SBA', room: '2nd Floor Water Station', status: 'in_progress', prio: 'critical', urgency: 94 },
    { title: 'AC split unit blowing warm air', cat: 'Air Conditioning', bCode: 'ADM', room: 'Conference Room B', status: 'resolved', prio: 'high', urgency: 75 },
    { title: 'Light bulb fused in stairwell', cat: 'Electrical', bCode: 'SH1', room: 'West Stairwell 3rd Floor', status: 'resolved', prio: 'low', urgency: 32 },
    { title: 'Main door lock stuck and key won\'t turn', cat: 'Hostel', bCode: 'SH1', room: 'Room 108', status: 'resolved', prio: 'high', urgency: 72 },
    { title: 'Overhead projector image displaced and blurry', cat: 'Classroom', bCode: 'SBA', room: 'Lecture Hall A2', status: 'assigned', prio: 'medium', urgency: 48 },
    { title: 'Exposed copper wire hanging near water cooler', cat: 'Electrical', bCode: 'CDH', room: 'Dining Hall Entrance', status: 'in_progress', prio: 'critical', urgency: 98 },
    { title: 'Drain clogged causing standing water in sink', cat: 'Plumbing', bCode: 'SH2', room: 'Ground Floor Washroom', status: 'resolved', prio: 'medium', urgency: 62 },
    { title: 'Ethernet port wall jack loose and disconnected', cat: 'Internet / Network', bCode: 'EHB', room: 'Computer Lab 4', status: 'resolved', prio: 'low', urgency: 38 },
    { title: 'Whiteboard duster rack fallen off wall', cat: 'Classroom', bCode: 'EHB', room: 'Room 110', status: 'closed', prio: 'low', urgency: 20 },
    { title: 'Oscilloscope power cable frayed', cat: 'Laboratory', bCode: 'EHB', room: 'Circuits Lab 201', status: 'in_progress', prio: 'medium', urgency: 68 },
    { title: 'Window latch broken allowing rain inside', cat: 'Hostel', bCode: 'SH2', room: 'Room 304', status: 'resolved', prio: 'medium', urgency: 54 },
    { title: 'Restroom mirror loose on wall mounts', cat: 'Washroom', bCode: 'LIB', room: 'Ground Floor Restroom', status: 'assigned', prio: 'medium', urgency: 44 },
    { title: 'Library chair wheels broken', cat: 'Furniture', bCode: 'LIB', room: 'Quiet Study Area 2', status: 'resolved', prio: 'low', urgency: 28 },
    { title: 'Biometric access scanner failing employee scans', cat: 'Security', bCode: 'ADM', room: 'Admin Main Lobby', status: 'resolved', prio: 'high', urgency: 80 },
    { title: 'Cobwebs and heavy dust accumulated on vents', cat: 'Cleaning / Sanitation', bCode: 'SBA', room: '3rd Floor Hallway', status: 'resolved', prio: 'low', urgency: 22 },
    { title: 'Streetlight pole 4 dark near parking lot', cat: 'Roads / Parking', bCode: 'SPC', room: 'West Car Park', status: 'assigned', prio: 'medium', urgency: 52 },
    { title: 'Basketball net torn on main outdoor court', cat: 'Sports Facilities', bCode: 'SPC', room: 'Outdoor Basketball Court 1', status: 'resolved', prio: 'low', urgency: 18 },
    { title: 'Water cooler leaking water onto wooden floor', cat: 'Water Supply', bCode: 'EHB', room: '1st Floor Lobby', status: 'in_progress', prio: 'high', urgency: 84 },
    { title: 'Chiller unit making grinding metal sound', cat: 'Air Conditioning', bCode: 'SBA', room: 'Central Plant Room', status: 'waiting_parts', prio: 'high', urgency: 86 },
    { title: 'Corridor lights flickering randomly', cat: 'Electrical', bCode: 'SH2', room: '2nd Floor Corridor', status: 'submitted', prio: 'medium', urgency: 42 },
    { title: 'Tap handle snapped off in hand', cat: 'Plumbing', bCode: 'CDH', room: 'Kitchen Wash Basin', status: 'resolved', prio: 'high', urgency: 76 },
    { title: 'Wi-Fi router dead in student hostel lobby', cat: 'Internet / Network', bCode: 'SH1', room: 'Lobby Area', status: 'in_progress', prio: 'medium', urgency: 65 },
    { title: 'Podium microphone cable noisy and cutting out', cat: 'Classroom', bCode: 'SBA', room: 'Main Auditorium', status: 'assigned', prio: 'medium', urgency: 50 },
    { title: 'Chemical storage cabinet key stuck in lock', cat: 'Laboratory', bCode: 'SBA', room: 'Store Room 105', status: 'resolved', prio: 'high', urgency: 74 },
    { title: 'Balcony door hinge corroded and squeaking', cat: 'Hostel', bCode: 'SH1', room: 'Room 402', status: 'resolved', prio: 'low', urgency: 24 },
    { title: 'Paper towel dispenser broken', cat: 'Washroom', bCode: 'SBA', room: '1st Floor Washroom', status: 'closed', prio: 'low', urgency: 15 },
    { title: 'Computer lab desk leg unstable', cat: 'Furniture', bCode: 'EHB', room: 'Lab 3', status: 'resolved', prio: 'low', urgency: 30 },
    { title: 'Emergency exit sign light turned off', cat: 'Security', bCode: 'EHB', room: 'South Exit Hallway', status: 'in_progress', prio: 'high', urgency: 78 },
    { title: 'Recycling bin broken cover', cat: 'Cleaning / Sanitation', bCode: 'CDH', room: 'Dining Hall B', status: 'resolved', prio: 'low', urgency: 19 },
    { title: 'Parking lines faded in faculty area', cat: 'Roads / Parking', bCode: 'ADM', room: 'Faculty Parking Zone', status: 'under_review', prio: 'low', urgency: 26 },
    { title: 'Air conditioning thermostat unresponsive', cat: 'Air Conditioning', bCode: 'LIB', room: 'Archive Vault', status: 'in_progress', prio: 'high', urgency: 82 },
    { title: 'Power outlet smoking in electrical engineering lab', cat: 'Electrical', bCode: 'EHB', room: 'Power Systems Lab 102', status: 'in_progress', prio: 'critical', urgency: 99 },
    { title: 'Main water pipeline burst in basement', cat: 'Plumbing', bCode: 'ADM', room: 'Basement Service Room', status: 'in_progress', prio: 'critical', urgency: 97 },
    { title: 'Hostel study room table light broken', cat: 'Electrical', bCode: 'SH2', room: 'Study Hall', status: 'resolved', prio: 'low', urgency: 35 },
    { title: 'Laboratory sink leaking into cabinet', cat: 'Plumbing', bCode: 'SBA', room: 'Bio Lab 202', status: 'resolved', prio: 'high', urgency: 79 }
  ];

  for (let i = 0; i < complaintTemplates.length; i++) {
    const tmpl = complaintTemplates[i];
    const complaintId = `CMP-2026-${String(i + 1).padStart(5, '0')}`;
    const studentId = studentIds[i % studentIds.length];
    const staffId = staffIds[i % staffIds.length];
    const catId = categoryIds[tmpl.cat] || categoryIds['Other'];
    const bId = buildingIds[tmpl.bCode] || buildingIds['SBA'];

    // Generate created timestamp spanning past 30 days
    const daysAgo = Math.floor(Math.random() * 25);
    const createdDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const createdIso = createdDate.toISOString();

    let resolvedIso: string | null = null;
    if (tmpl.status === 'resolved' || tmpl.status === 'closed') {
      const resolvedDate = new Date(createdDate.getTime() + (Math.floor(Math.random() * 48) + 4) * 3600 * 1000);
      resolvedIso = resolvedDate.toISOString();
    }

    const resolutionSummary = tmpl.status === 'resolved' || tmpl.status === 'closed'
      ? suggestResolution(tmpl.title, tmpl.title, tmpl.cat)
      : null;

    const masterDupId = tmpl.isDup ? `CMP-2026-00001` : null;

    await dbRun(
      `INSERT INTO complaints (
        id, title, description, category_id, issue_type, building_id, floor, room_area,
        date_noticed, priority, urgency_score, priority_reason, status,
        submitted_by, assigned_to, is_duplicate_of, resolution_summary, resolved_at, closed_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'Standard Repair', ?, 'Floor 2', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        complaintId,
        tmpl.title,
        `Reported facility defect: ${tmpl.title}. Requires maintenance inspection and appropriate component restoration.`,
        catId,
        bId,
        tmpl.room,
        createdIso.substring(0, 10),
        tmpl.prio,
        tmpl.urgency,
        `AI Automated priority assessment assigned ${tmpl.prio.toUpperCase()} rating.`,
        tmpl.status,
        studentId,
        tmpl.status !== 'submitted' && tmpl.status !== 'under_review' ? staffId : null,
        masterDupId,
        resolutionSummary,
        resolvedIso,
        tmpl.status === 'closed' ? resolvedIso : null,
        createdIso,
        resolvedIso || createdIso
      ]
    );

    // Add before image for all complaints
    await dbRun(
      `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by, created_at)
       VALUES (?, '/uploads/complaints/sample-before-1.svg', 'before', ?, ?)`,
      [complaintId, studentId, createdIso]
    );

    // Add after image for resolved/closed complaints
    if (tmpl.status === 'resolved' || tmpl.status === 'closed') {
      await dbRun(
        `INSERT INTO complaint_images (complaint_id, image_url, image_type, uploaded_by, created_at)
         VALUES (?, '/uploads/repairs/sample-after-1.svg', 'after', ?, ?)`,
        [complaintId, staffId, resolvedIso]
      );
    }

    // Add timeline history
    await dbRun(
      `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
       VALUES (?, NULL, 'submitted', ?, 'Complaint logged in portal', ?)`,
      [complaintId, studentId, createdIso]
    );

    if (tmpl.status !== 'submitted') {
      await dbRun(
        `INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, comment, created_at)
         VALUES (?, 'submitted', ?, ?, 'Status updated during maintenance lifecycle', ?)`,
        [complaintId, tmpl.status, adminIds[0], resolvedIso || createdIso]
      );
    }

    // Add duplicate match record if duplicate template
    if (tmpl.isDup) {
      await dbRun(
        `INSERT INTO duplicate_matches (source_complaint_id, target_complaint_id, similarity_score, status, created_at)
         VALUES (?, 'CMP-2026-00001', 88.5, 'merged', ?)`,
        [complaintId, createdIso]
      );
    }
  }

  // 5. Seed Notifications
  console.log('🔔 Seeding Sample Notifications...');
  for (const sId of studentIds) {
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, 'Welcome to Smart Complaint Management', 'Submit and track campus facility issues easily from your dashboard.', 'info', 1, ?)`,
      [sId, now.toISOString()]
    );
  }
  for (const stfId of staffIds) {
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, '🛠️ Maintenance Queue Ready', 'Review your assigned work orders and upload completion photos when resolved.', 'warning', 0, ?)`,
      [stfId, now.toISOString()]
    );
  }
  for (const admId of adminIds) {
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, '🚨 Critical Complaint Alert', 'Power outlet smoking reported in Engineering Hub B (Room 102). Immediate action recommended.', 'critical', 0, ?)`,
      [admId, now.toISOString()]
    );
  }

  console.log('✅ Database Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 DEMO ACCOUNTS READY TO LOGIN:');
  console.log('   👨‍🎓 Student:     student1@campus.edu   / password123');
  console.log('   🛠️ Maintenance: staff1@campus.edu     / password123');
  console.log('   👨‍💼 Admin:       admin@campus.edu      / password123');
  console.log('----------------------------------------------------');
}

// Execute seed directly if called via npm run seed
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
