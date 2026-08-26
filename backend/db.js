const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sanchalan.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Note: Tables already exist (users, workers, projects, tasks, task_updates).
// We do not drop or recreate them to preserve data.

db.prepare(`
  CREATE TABLE IF NOT EXISTS worker_locations (
    workerId TEXT PRIMARY KEY,
    workerName TEXT,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    timestamp TEXT,
    status TEXT,
    FOREIGN KEY(workerId) REFERENCES workers(workerId)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS worker_location_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workerId TEXT,
    latitude REAL,
    longitude REAL,
    accuracy REAL,
    timestamp TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(workerId) REFERENCES workers(workerId)
  )
`).run();

db.prepare(`CREATE INDEX IF NOT EXISTS idx_worker_history ON worker_location_history(workerId, timestamp)`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ai_planning_sessions (
    sessionId TEXT PRIMARY KEY,
    adminId TEXT,
    contextData TEXT,
    status TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ai_audit_events (
    eventId TEXT PRIMARY KEY,
    sessionId TEXT,
    eventType TEXT,
    details TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
