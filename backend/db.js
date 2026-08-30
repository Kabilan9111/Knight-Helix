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

db.prepare(`
  CREATE TABLE IF NOT EXISTS worker_evidence (
    evidenceId TEXT PRIMARY KEY,
    taskId TEXT,
    workerId TEXT,
    imageBase64 TEXT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS ai_evidence_verifications (
    verificationId TEXT PRIMARY KEY,
    evidenceId TEXT,
    taskId TEXT,
    matchedActivityId TEXT,
    completionPercentage INTEGER,
    confidence INTEGER,
    explanation TEXT,
    completedWork TEXT,
    remainingWork TEXT,
    matchStatus TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Attempt to add matchedActivityId if it doesn't exist (for additive schema updates)
try {
  db.prepare('ALTER TABLE ai_evidence_verifications ADD COLUMN matchedActivityId TEXT').run();
} catch (err) {
  // Ignore if column already exists
}

// Additive schema updates for worker_evidence
const evidenceColumns = [
  'ALTER TABLE worker_evidence ADD COLUMN activityId TEXT',
  'ALTER TABLE worker_evidence ADD COLUMN detectedCaptureDateTime TEXT',
  'ALTER TABLE worker_evidence ADD COLUMN verificationStatus TEXT DEFAULT "PENDING"',
  'ALTER TABLE worker_evidence ADD COLUMN rejectionReason TEXT',
  'ALTER TABLE worker_evidence ADD COLUMN engineerId TEXT'
];

for (const query of evidenceColumns) {
  try {
    db.prepare(query).run();
  } catch (err) {
    // Ignore if column already exists
  }
}

db.prepare(`
  CREATE TABLE IF NOT EXISTS field_verifications (
    verificationId TEXT PRIMARY KEY,
    taskId TEXT,
    activityId TEXT,
    engineerId TEXT,
    startedAt TEXT,
    stoppedAt TEXT,
    coordinates TEXT,
    distance REAL,
    estimatedArea REAL,
    gpsAccuracy REAL,
    status TEXT,
    aiVerificationResult TEXT,
    approvedAt TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS task_activities (
    activityId TEXT PRIMARY KEY,
    taskId TEXT,
    activityNumber INTEGER,
    name TEXT,
    description TEXT,
    startDate TEXT,
    endDate TEXT,
    status TEXT,
    progress INTEGER DEFAULT 0,
    aiConfidence INTEGER,
    FOREIGN KEY(taskId) REFERENCES tasks(taskId)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS activity_dependencies (
    id TEXT PRIMARY KEY,
    projectId TEXT,
    taskId TEXT,
    predecessorActivityId TEXT,
    successorActivityId TEXT,
    dependencyType TEXT DEFAULT 'FS',
    lagDays INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(projectId) REFERENCES projects(projectId),
    FOREIGN KEY(taskId) REFERENCES tasks(taskId),
    FOREIGN KEY(predecessorActivityId) REFERENCES task_activities(activityId),
    FOREIGN KEY(successorActivityId) REFERENCES task_activities(activityId)
  )
`).run();

// Add evidenceReceivedAt and missedAt columns for the execution timer
try {
  db.prepare('ALTER TABLE tasks ADD COLUMN evidenceReceivedAt DATETIME').run();
} catch (err) {}

try {
  db.prepare('ALTER TABLE tasks ADD COLUMN missedAt DATETIME').run();
} catch (err) {}

try {
  db.prepare('ALTER TABLE task_activities ADD COLUMN evidenceReceivedAt DATETIME').run();
} catch (err) {}

try {
  db.prepare('ALTER TABLE task_activities ADD COLUMN missedAt DATETIME').run();
} catch (err) {}

module.exports = db;
