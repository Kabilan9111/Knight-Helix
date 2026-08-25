const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'sanchalan.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Note: Tables already exist (users, workers, projects, tasks, task_updates).
// We do not drop or recreate them to preserve data.

module.exports = db;
