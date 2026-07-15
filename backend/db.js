import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPostgres = !!process.env.DATABASE_URL;
let sqliteDb = null;
let pgPool = null;

// Initialize DB Client
export async function initDB() {
  if (isPostgres) {
    console.log('Connecting to Supabase PostgreSQL database...');
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Supabase/Render hosting
      }
    });

    // Test connection
    const client = await pgPool.connect();
    console.log('Connected to PostgreSQL successfully.');
    client.release();

    // Create Tables for Postgres
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        "key" VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'NEW',
        source VARCHAR(50) DEFAULT 'Meta Ads',
        meta_lead_id VARCHAR(255) UNIQUE,
        campaign_name VARCHAR(255),
        note TEXT,
        purpose VARCHAR(50),
        address TEXT,
        profession VARCHAR(255),
        budget VARCHAR(100),
        site_project VARCHAR(255),
        visit_date VARCHAR(100),
        followup_date VARCHAR(100),
        custom_fields TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration to add note/real estate columns to existing leads table if they don't exist
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS note TEXT`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS purpose VARCHAR(50)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS profession VARCHAR(255)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget VARCHAR(100)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS site_project VARCHAR(255)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS visit_date VARCHAR(100)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS followup_date VARCHAR(100)`);
    await pgPool.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields TEXT`);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS remarks (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        note TEXT,
        call_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS followups (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        note TEXT,
        followup_date VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        method VARCHAR(100),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    console.log('PostgreSQL database tables initialized successfully.');
  } else {
    console.log('Connecting to local SQLite database...');
    const dbPath = path.join(__dirname, 'crm.db');
    sqliteDb = new DatabaseSync(dbPath);

    // Initialize DB schema for SQLite
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        "key" TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        status TEXT DEFAULT 'NEW',
        source TEXT DEFAULT 'Meta Ads',
        meta_lead_id TEXT UNIQUE,
        campaign_name TEXT,
        note TEXT,
        purpose TEXT,
        address TEXT,
        profession TEXT,
        budget TEXT,
        site_project TEXT,
        visit_date TEXT,
        followup_date TEXT,
        custom_fields TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration to add note/real estate columns to existing leads table in SQLite
    const sqliteColumns = ['note', 'purpose', 'address', 'profession', 'budget', 'site_project', 'visit_date', 'followup_date', 'custom_fields'];
    sqliteColumns.forEach(col => {
      try {
        sqliteDb.exec(`ALTER TABLE leads ADD COLUMN ${col} TEXT`);
      } catch (e) {
        // Column already exists, safe to ignore
      }
    });

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS remarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        note TEXT,
        call_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS followups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        note TEXT,
        followup_date TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        method TEXT,
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
      )
    `);

    console.log('SQLite database tables initialized successfully at:', dbPath);
  }
}

// Convert SQLite '?' parameters to PostgreSQL '$1, $2' parameters
function translateSql(sql) {
  if (!isPostgres) return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

// Helper methods to execute database queries asynchronously for both SQLite & PostgreSQL
export const dbClient = {
  async query(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(translateSql(sql), params);
      return res.rows;
    } else {
      const stmt = sqliteDb.prepare(sql);
      return stmt.all(...params);
    }
  },

  async queryOne(sql, params = []) {
    if (isPostgres) {
      const res = await pgPool.query(translateSql(sql), params);
      return res.rows.length > 0 ? res.rows[0] : null;
    } else {
      const stmt = sqliteDb.prepare(sql);
      const rows = stmt.all(...params);
      return rows.length > 0 ? rows[0] : null;
    }
  },

  async run(sql, params = []) {
    if (isPostgres) {
      let finalSql = translateSql(sql);
      let returningId = null;

      // If it is an INSERT statement, append RETURNING id to capture lastInsertRowid (except settings table)
      if (sql.trim().toUpperCase().startsWith('INSERT') && !sql.toLowerCase().includes('into settings')) {
        finalSql += ' RETURNING id';
        const res = await pgPool.query(finalSql, params);
        returningId = res.rows[0]?.id;
      } else {
        await pgPool.query(finalSql, params);
      }

      return { lastInsertRowid: returningId };
    } else {
      const stmt = sqliteDb.prepare(sql);
      const res = stmt.run(...params);
      return { lastInsertRowid: res.lastInsertRowid };
    }
  }
};
