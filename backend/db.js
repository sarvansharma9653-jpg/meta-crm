import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure database directory exists
const dbPath = path.join(__dirname, 'crm.db');
const db = new DatabaseSync(dbPath);

// Initialize DB schema
export function initDB() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Settings Table (Key-Value)
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Leads Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      status TEXT DEFAULT 'NEW',
      source TEXT DEFAULT 'Meta Ads',
      meta_lead_id TEXT UNIQUE,
      campaign_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Calls Table
  db.exec(`
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

  // Followups Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      note TEXT,
      followup_date TEXT NOT NULL, -- ISO date string (YYYY-MM-DD or YYYY-MM-DD HH:MM)
      status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, MISSED
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  // Payments Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      method TEXT, -- UPI, Cash, Card, Bank Transfer
      transaction_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(lead_id) REFERENCES leads(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully at:', dbPath);
}

// Helper methods to execute database queries easily
export const dbClient = {
  exec(sql) {
    return db.exec(sql);
  },
  
  prepare(sql) {
    return db.prepare(sql);
  },

  query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  queryOne(sql, params = []) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows.length > 0 ? rows[0] : null;
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  }
};
