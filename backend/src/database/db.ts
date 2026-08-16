import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

// PostgreSQL Connection Pool using Supabase connection string
let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
  try {
    pgPool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false // Required for Supabase cloud connection / pooler
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    console.log('🐘 Connected to Supabase PostgreSQL Database Pool.');
  } catch (err: any) {
    console.error('❌ Failed to initialize PostgreSQL pool:', err.message);
  }
} else {
  // SQLite Fallback for offline local development without env setup
  const dbPath = process.env.DATABASE_PATH || './data/complaints.db';
  const absoluteDbPath = path.resolve(process.cwd(), dbPath);
  const dbDir = path.dirname(absoluteDbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sqliteDb = new (sqlite3.verbose().Database)(absoluteDbPath, (err) => {
    if (err) {
      console.error('Error opening local SQLite fallback database:', err.message);
    } else {
      console.log(`ℹ️ DATABASE_URL not set. Operating on local SQLite database at: ${absoluteDbPath}`);
      sqliteDb?.run('PRAGMA foreign_keys = ON;');
    }
  });
}

/**
 * Utility to convert SQLite parameter placeholders (?) to PostgreSQL ($1, $2, $3...)
 */
function convertPlaceholders(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Execute INSERT, UPDATE, or DELETE statements
 */
export const dbRun = async (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
  if (pgPool) {
    let formattedSql = convertPlaceholders(sql.trim());
    
    // Automatically add RETURNING id for INSERT queries if not already present
    const isInsert = /^insert\s+into/i.test(formattedSql);
    const hasReturning = /returning\s+/i.test(formattedSql);

    if (isInsert && !hasReturning) {
      formattedSql += ' RETURNING id';
    }

    try {
      const res = await pgPool.query(formattedSql, params);
      let lastID = 0;
      if (res.rows && res.rows.length > 0 && res.rows[0].id) {
        lastID = Number(res.rows[0].id);
      }
      return { lastID, changes: res.rowCount || 0 };
    } catch (err: any) {
      console.error('PostgreSQL dbRun Error:', err.message, 'SQL:', formattedSql);
      throw err;
    }
  }

  // SQLite fallback
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('No database connection available.'));
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

/**
 * Query a single row
 */
export const dbGet = async <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  if (pgPool) {
    const formattedSql = convertPlaceholders(sql.trim());
    try {
      const res = await pgPool.query(formattedSql, params);
      const row = res.rows[0];
      if (row && 'count' in row && typeof row.count === 'string') {
        (row as any).count = Number(row.count);
      }
      return row as T;
    } catch (err: any) {
      console.error('PostgreSQL dbGet Error:', err.message, 'SQL:', formattedSql);
      throw err;
    }
  }

  // SQLite fallback
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('No database connection available.'));
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

/**
 * Query multiple rows
 */
export const dbAll = async <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  if (pgPool) {
    const formattedSql = convertPlaceholders(sql.trim());
    try {
      const res = await pgPool.query(formattedSql, params);
      const rows = res.rows.map(row => {
        if (row && 'count' in row && typeof row.count === 'string') {
          (row as any).count = Number(row.count);
        }
        return row;
      });
      return rows as T[];
    } catch (err: any) {
      console.error('PostgreSQL dbAll Error:', err.message, 'SQL:', formattedSql);
      throw err;
    }
  }

  // SQLite fallback
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('No database connection available.'));
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};

/**
 * Execute raw DDL or multi-statement SQL scripts
 */
export const dbExec = async (sql: string): Promise<void> => {
  if (pgPool) {
    try {
      await pgPool.query(sql);
      return;
    } catch (err: any) {
      console.error('PostgreSQL dbExec Error:', err.message);
      throw err;
    }
  }

  // SQLite fallback
  return new Promise((resolve, reject) => {
    if (!sqliteDb) return reject(new Error('No database connection available.'));
    sqliteDb.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};
