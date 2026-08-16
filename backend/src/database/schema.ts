import { dbExec } from './db';
import dotenv from 'dotenv';

dotenv.config();

export async function initDatabaseSchema() {
  const isPg = Boolean(process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://')));

  const pgSchemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      user_id_code TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT,
      year_class TEXT,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'admin', 'maintenance')) NOT NULL DEFAULT 'student',
      reset_pin TEXT,
      reset_pin_expires TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      total_floors INTEGER DEFAULT 4,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaint_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT DEFAULT 'Wrench',
      default_priority TEXT CHECK(default_priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES complaint_categories(id),
      issue_type TEXT,
      building_id INTEGER NOT NULL REFERENCES buildings(id),
      floor TEXT,
      room_area TEXT NOT NULL,
      date_noticed TEXT,
      contact_phone TEXT,
      priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) NOT NULL DEFAULT 'medium',
      urgency_score INTEGER NOT NULL DEFAULT 50,
      priority_reason TEXT,
      status TEXT CHECK(status IN ('submitted', 'under_review', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed', 'rejected')) NOT NULL DEFAULT 'submitted',
      submitted_by INTEGER NOT NULL REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      is_duplicate_of TEXT REFERENCES complaints(id),
      resolution_summary TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      upvote_count INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaint_images (
      id SERIAL PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      image_type TEXT CHECK(image_type IN ('before', 'after')) NOT NULL DEFAULT 'before',
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id SERIAL PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL REFERENCES users(id),
      comment TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaint_comments (
      id SERIAL PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      comment_text TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS duplicate_matches (
      id SERIAL PRIMARY KEY,
      source_complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      target_complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      similarity_score DOUBLE PRECISION NOT NULL,
      status TEXT CHECK(status IN ('pending', 'merged', 'separated', 'ignored')) DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaint_supports (
      id SERIAL PRIMARY KEY,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(complaint_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_submitted_by ON complaints(submitted_by);
    CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_complaints_building ON complaints(building_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `;

  const sqliteSchemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      user_id_code TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT,
      year_class TEXT,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'admin', 'maintenance')) NOT NULL DEFAULT 'student',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      total_floors INTEGER DEFAULT 4,
      latitude REAL,
      longitude REAL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaint_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT DEFAULT 'Wrench',
      default_priority TEXT CHECK(default_priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      issue_type TEXT,
      building_id INTEGER NOT NULL,
      floor TEXT,
      room_area TEXT NOT NULL,
      date_noticed TEXT,
      contact_phone TEXT,
      priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low')) NOT NULL DEFAULT 'medium',
      urgency_score INTEGER NOT NULL DEFAULT 50,
      priority_reason TEXT,
      status TEXT CHECK(status IN ('submitted', 'under_review', 'assigned', 'in_progress', 'waiting_parts', 'resolved', 'closed', 'rejected')) NOT NULL DEFAULT 'submitted',
      submitted_by INTEGER NOT NULL,
      assigned_to INTEGER,
      is_duplicate_of TEXT,
      resolution_summary TEXT,
      resolved_at TEXT,
      closed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES complaint_categories(id),
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (submitted_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (is_duplicate_of) REFERENCES complaints(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      image_url TEXT NOT NULL,
      image_type TEXT CHECK(image_type IN ('before', 'after')) NOT NULL DEFAULT 'before',
      uploaded_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      comment_text TEXT NOT NULL,
      is_internal INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS duplicate_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_complaint_id TEXT NOT NULL,
      target_complaint_id TEXT NOT NULL,
      similarity_score REAL NOT NULL,
      status TEXT CHECK(status IN ('pending', 'merged', 'separated', 'ignored')) DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (source_complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (target_complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS complaint_supports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(complaint_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_submitted_by ON complaints(submitted_by);
    CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON complaints(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_complaints_building ON complaints(building_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `;

  await dbExec(isPg ? pgSchemaSql : sqliteSchemaSql);

  // Safely add new columns if they do not exist
  try {
    await dbExec(isPg ? `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin TEXT;` : `ALTER TABLE users ADD COLUMN reset_pin TEXT;`);
  } catch (e) {}
  try {
    await dbExec(isPg ? `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_pin_expires TEXT;` : `ALTER TABLE users ADD COLUMN reset_pin_expires TEXT;`);
  } catch (e) {}
  try {
    await dbExec(isPg ? `ALTER TABLE complaints ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 1;` : `ALTER TABLE complaints ADD COLUMN upvote_count INTEGER DEFAULT 1;`);
  } catch (e) {}

  console.log(`Database schema initialized successfully (${isPg ? 'PostgreSQL' : 'SQLite'}).`);
}
