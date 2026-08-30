require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');
const aiPlannerRoutes = require('./routes/aiPlannerRoutes');
const visualizationRoutes = require('./routes/visualizationRoutes');
const { processEvidence, processFieldVerification } = require('./services/evidenceVerificationAgent');

const app = express();

// Configure multer for memory storage (limits: 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
app.use(cors());
app.use(express.json());
app.use('/api/ai', aiPlannerRoutes);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io); // Attach io so routes can access it

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Helper: Normalize string (lowercase, trim)
const normalizeString = (str) => (str ? str.toString().trim().toLowerCase() : '');
// Helper: Normalize mobile (remove spaces/dashes)
const normalizeMobile = (num) => (num ? num.toString().replace(/[\s\-\(\)]/g, '') : '');

// --- MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: `Invalid token. Reason: ${err.message}` });
    req.user = user;
    next();
  });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    if (req.user.role === 'OWNER') {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Owner accounts are read-only.' });
    }
    return res.status(403).json({ error: 'Unauthorized role.' });
  }
  next();
};

app.use('/api/visualization', authenticateToken, requireRole('ADMIN', 'OWNER', 'SITE_ENGINEER'), visualizationRoutes);

// --- AUTH ROUTES ---

// 1. ADMIN LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email_mobile, password } = req.body;
  const adminUser = process.env.MOCK_ADMIN_USER || 'admin';
  const adminPass = process.env.MOCK_ADMIN_PASS || 'admin123';

  const ownerUser = process.env.MOCK_OWNER_USER || 'owner';
  const ownerPass = process.env.MOCK_OWNER_PASS || 'owner123';

  if (email_mobile === adminUser && password === adminPass) {
    const userPayload = { id: 'admin-1', role: 'ADMIN', name: 'Site Engineer User' };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: userPayload });
  }

  if (email_mobile === ownerUser && password === ownerPass) {
    const userPayload = { id: 'owner-1', role: 'OWNER', name: 'Owner Executive' };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: userPayload });
  }

  res.status(401).json({ error: 'Invalid username or password.' });
});

// 2. FIRST-TIME WORKER REGISTRATION
app.post('/api/auth/worker/register', (req, res) => {
  const { fullName, age, gender, mobileNumber } = req.body;
  if (!fullName || !age || !gender || !mobileNumber) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const normalizedMobile = normalizeMobile(mobileNumber);
  const normalizedName = normalizeString(fullName);

  const existing = db.prepare('SELECT workerId FROM workers WHERE mobile = ?').get(normalizedMobile);
  if (existing) {
    return res.status(400).json({ error: 'This mobile number is already registered. Please use Existing Worker.' });
  }

  const userId = `user_${Date.now()}`;
  const workerId = `W-${Date.now().toString().slice(-6)}`;
  const passwordHash = bcrypt.hashSync(normalizedMobile, 10); // Dummy password

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email_mobile, password, role, gender, age)
    VALUES (?, ?, ?, ?, 'WORKER', ?, ?)
  `);

  const insertWorker = db.prepare(`
    INSERT INTO workers (workerId, userId, name, mobile, gender, age)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    db.transaction(() => {
      insertUser.run(userId, fullName, normalizedMobile, passwordHash, gender, age);
      insertWorker.run(workerId, userId, fullName, normalizedMobile, gender, age);
    })();

    const userPayload = { id: userId, workerId, role: 'WORKER', name: fullName };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: userPayload });
  } catch (error) {
    res.status(500).json({ error: 'Database error creating worker record.' });
  }
});

// 3. EXISTING WORKER LOGIN
app.post('/api/auth/worker/login', (req, res) => {
  const { fullName, mobileNumber } = req.body;
  if (!fullName || !mobileNumber) {
    return res.status(400).json({ error: 'Full Name and Mobile Number are required.' });
  }

  const normalizedMobile = normalizeMobile(mobileNumber);
  const normalizedName = normalizeString(fullName);

  const worker = db.prepare('SELECT * FROM workers WHERE mobile = ?').get(normalizedMobile);
  if (!worker || normalizeString(worker.name) !== normalizedName) {
    return res.status(401).json({ error: 'Worker not found. Please check your details or register as a first-time worker.' });
  }

  const userPayload = { id: worker.userId, workerId: worker.workerId, role: 'WORKER', name: worker.name };
  const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: userPayload });
});


// --- DASHBOARD & TASK ROUTES ---

app.get('/api/dashboard/stats', authenticateToken, requireRole('ADMIN', 'OWNER'), (req, res) => {
  const tasks = db.prepare('SELECT status FROM tasks').all();
  const stats = {
    totalProjects: db.prepare('SELECT count(*) as count FROM projects').get().count,
    totalTasks: tasks.length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    atRisk: tasks.filter(t => t.status === 'At Risk').length,
    overdue: tasks.filter(t => t.status === 'Overdue').length,
  };
  res.json(stats);
});

app.get('/api/projects', authenticateToken, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects').all();
  res.json(projects);
});

app.get('/api/workers', authenticateToken, (req, res) => {
  const workers = db.prepare('SELECT * FROM workers').all();
  res.json(workers);
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  const { workerId } = req.query;
  let tasks;

  if (workerId && req.user.role === 'WORKER') {
    // Worker sees only their tasks
    if (req.user.workerId !== workerId) return res.status(403).json({ error: 'Cannot access other worker tasks' });
    tasks = db.prepare(`
      SELECT t.*, p.name as projectName, w.name as workerName 
      FROM tasks t 
      LEFT JOIN projects p ON t.projectId = p.projectId 
      LEFT JOIN workers w ON t.assignedWorkerId = w.workerId
      WHERE t.assignedWorkerId = ?
    `).all(workerId);
  } else if (req.user.role === 'ADMIN' || req.user.role === 'OWNER') {
    // Admin and Owner see all
    tasks = db.prepare(`
      SELECT t.*, p.name as projectName, w.name as workerName 
      FROM tasks t 
      LEFT JOIN projects p ON t.projectId = p.projectId 
      LEFT JOIN workers w ON t.assignedWorkerId = w.workerId
    `).all();
  } else {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  res.json(tasks);
});

app.get('/api/tasks/:id/details', authenticateToken, (req, res) => {
  const { id } = req.params;
  const task = db.prepare(`
    SELECT t.*, p.name as projectName, w.name as workerName 
    FROM tasks t 
    LEFT JOIN projects p ON t.projectId = p.projectId 
    LEFT JOIN workers w ON t.assignedWorkerId = w.workerId
    WHERE t.taskId = ?
  `).get(id);

  if (!task) return res.status(404).json({ error: 'Task not found' });

  // Security check for worker
  if (req.user.role === 'WORKER' && task.assignedWorkerId !== req.user.workerId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const activities = db.prepare('SELECT * FROM task_activities WHERE taskId = ? ORDER BY activityNumber ASC').all(id);

  const verifications = db.prepare(`
    SELECT v.*, e.imageBase64, e.description, e.timestamp as evidenceTime 
    FROM ai_evidence_verifications v
    LEFT JOIN worker_evidence e ON v.evidenceId = e.evidenceId
    WHERE v.taskId = ?
    ORDER BY v.timestamp DESC
  `).all(id);

  res.json({
    task,
    activities,
    verifications
  });
});

app.post('/api/tasks', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate } = req.body;
  const taskId = `TASK-${Math.floor(Math.random() * 10000)}`;

  const insert = db.prepare(`
    INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate, status, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSIGNED', 0)
  `);

  try {
    insert.run(taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate);
    io.emit('task_created', { taskId, assignedWorkerId }); // Broadcast creation
    res.json({ success: true, taskId });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});


// Submit Work Proof (AI Evidence Verification)
app.post('/api/tasks/:id/evidence', authenticateToken, requireRole('WORKER'), (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Unknown upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  const { id } = req.params;
  const description = req.body.description || '';
  const activityId = req.body.activityId;
  const workerId = req.user.workerId;

  if (!req.file && !description.trim()) {
    return res.status(400).json({ error: 'Either an image or a description must be provided.' });
  }
  
  if (!activityId) {
    return res.status(400).json({ error: 'Activity ID is required for evidence submission.' });
  }

  let imageBase64 = null;
  if (req.file) {
    // Convert memory buffer back to the base64 format expected by the existing agent
    imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(id);
  if (!task || task.assignedWorkerId !== workerId) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }
  
  const activity = db.prepare('SELECT * FROM task_activities WHERE taskId = ? AND activityId = ?').get(id, activityId);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found.' });
  }

  try {
    const result = await processEvidence(id, activityId, workerId, imageBase64, description, io);
    res.json({ success: true, verification: result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || 'Verification failed.' });
  }
});

app.get('/api/tasks/:id/verifications', authenticateToken, (req, res) => {
  const { id } = req.params;
  const verifications = db.prepare(`
    SELECT v.*, e.imageBase64, e.description, e.timestamp as evidenceTime 
    FROM ai_evidence_verifications v
    JOIN worker_evidence e ON v.evidenceId = e.evidenceId
    WHERE v.taskId = ?
    ORDER BY v.timestamp DESC
  `).all(id);
  res.json(verifications);
});

// Admin Queue: Get all pending verifications
app.get('/api/admin/verifications/pending', authenticateToken, requireRole('ADMIN'), (req, res) => {
  try {
    const pending = db.prepare(`
      SELECT 
        e.evidenceId, e.taskId, e.activityId, e.workerId, e.imageBase64, e.description, e.detectedCaptureDateTime, e.timestamp as evidenceTime,
        t.title as taskTitle, t.projectName,
        a.name as activityName, a.progress as currentProgress,
        v.completionPercentage as recommendedProgress, v.explanation
      FROM worker_evidence e
      JOIN tasks t ON e.taskId = t.taskId
      JOIN task_activities a ON e.activityId = a.activityId
      LEFT JOIN ai_evidence_verifications v ON e.evidenceId = v.evidenceId
      WHERE e.verificationStatus = 'PENDING' OR a.status = 'VERIFICATION_PENDING'
      ORDER BY e.timestamp ASC
    `).all();
    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pending verifications.' });
  }
});

// Admin Queue: Resolve verification
app.post('/api/admin/verifications/:id/resolve', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { id } = req.params;
  const { action, rejectionReason, spatialData } = req.body;
  const engineerId = req.user.adminId || req.user.username;

  try {
    let evidence = db.prepare('SELECT * FROM worker_evidence WHERE evidenceId = ?').get(id);
    
    // If not found by evidenceId, maybe the id is a verificationId
    if (!evidence) {
      const v = db.prepare('SELECT * FROM ai_evidence_verifications WHERE verificationId = ?').get(id);
      if (v && v.evidenceId) {
        evidence = db.prepare('SELECT * FROM worker_evidence WHERE evidenceId = ?').get(v.evidenceId);
      }
    }
    
    if (!evidence) return res.status(404).json({ error: 'Evidence not found' });
    
    // Save spatial track if provided
    if (spatialData && spatialData.coordinates && spatialData.coordinates.length > 0) {
      const verificationId = `FVERIF-${Date.now()}`;
      try {
        db.prepare(`
          INSERT INTO field_verifications (
            verificationId, taskId, activityId, engineerId, startedAt, stoppedAt, 
            coordinates, distance, estimatedArea, gpsAccuracy, status, aiVerificationResult, approvedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          verificationId, 
          evidence.taskId, 
          evidence.activityId, 
          engineerId, 
          spatialData.coordinates[0]?.timestamp ? new Date(spatialData.coordinates[0].timestamp).toISOString() : new Date().toISOString(), 
          spatialData.coordinates[spatialData.coordinates.length-1]?.timestamp ? new Date(spatialData.coordinates[spatialData.coordinates.length-1].timestamp).toISOString() : new Date().toISOString(),
          JSON.stringify(spatialData.coordinates), 
          spatialData.distance || 0, 
          spatialData.estimatedArea || null, 
          spatialData.gpsAccuracy || 0, 
          action === 'APPROVE' ? 'APPROVED' : 'REJECTED', 
          'Admin Manual Verification',
          action === 'APPROVE' ? new Date().toISOString() : null
        );
      } catch (err) {
        console.error('Failed to save spatial data:', err);
        // Continue anyway to resolve the evidence
      }
    }

    if (action === 'APPROVE') {
      const verification = db.prepare('SELECT * FROM ai_evidence_verifications WHERE evidenceId = ?').get(id);
      const newProgress = verification ? verification.completionPercentage : 100;
      
      db.prepare(`UPDATE worker_evidence SET verificationStatus = 'APPROVED', engineerId = ? WHERE evidenceId = ?`).run(engineerId, id);
      db.prepare(`UPDATE task_activities SET status = 'IN_PROGRESS', progress = ? WHERE activityId = ?`).run(newProgress, evidence.activityId);
      
      if (newProgress === 100) {
        db.prepare(`UPDATE task_activities SET status = 'COMPLETED' WHERE activityId = ?`).run(evidence.activityId);
      }
      
      // Update overall task progress
      const activities = db.prepare('SELECT progress FROM task_activities WHERE taskId = ?').all(evidence.taskId);
      const avg = Math.round(activities.reduce((s, a) => s + a.progress, 0) / (activities.length || 1));
      db.prepare(`UPDATE tasks SET progress = ?, status = ? WHERE taskId = ?`).run(avg, avg === 100 ? 'COMPLETED' : 'IN_PROGRESS', evidence.taskId);
      
    } else if (action === 'REJECT') {
      db.prepare(`UPDATE worker_evidence SET verificationStatus = 'REJECTED', rejectionReason = ?, engineerId = ? WHERE evidenceId = ?`).run(rejectionReason, engineerId, id);
      db.prepare(`UPDATE task_activities SET status = 'IN_PROGRESS' WHERE activityId = ?`).run(evidence.activityId);
      
      const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(evidence.taskId);
      db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE taskId = ?`).run(evidence.taskId);
    }
    
    io.emit('task_updated', { taskId: evidence.taskId });
    io.emit('evidence_verified', { taskId: evidence.taskId });
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to resolve verification.' });
  }
});

// Submit Field Verification (Spatial Tracking)
app.post('/api/tasks/:id/verify-field', authenticateToken, requireRole('WORKER'), (req, res, next) => {
  upload.single('image')(req, res, function (err) {
    if (err) return res.status(500).json({ error: `Upload error: ${err.message}` });
    next();
  });
}, async (req, res) => {
  const { id } = req.params;
  const workerId = req.user.workerId;
  const { activityId, distance, estimatedArea, gpsAccuracy, startedAt, stoppedAt, coordinates, description } = req.body;

  if (!distance || distance < 0) return res.status(400).json({ error: 'Invalid distance.' });

  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(id);
  if (!task || task.assignedWorkerId !== workerId) {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  let imageBase64 = null;
  if (req.file) {
    imageBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  try {
    const fieldData = {
      activityId,
      distance: parseFloat(distance),
      estimatedArea: estimatedArea && estimatedArea !== 'null' ? parseFloat(estimatedArea) : null,
      gpsAccuracy: parseFloat(gpsAccuracy),
      startedAt,
      stoppedAt,
      description,
      imageBase64
    };

    const aiResult = await processFieldVerification(id, workerId, fieldData, io);

    // Save the session as PENDING_APPROVAL
    const verificationId = `FVERIF-${Date.now()}`;
    db.prepare(`
      INSERT INTO field_verifications (
        verificationId, taskId, activityId, engineerId, startedAt, stoppedAt, 
        coordinates, distance, estimatedArea, gpsAccuracy, status, aiVerificationResult
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?)
    `).run(
      verificationId, id, activityId, workerId, startedAt, stoppedAt,
      coordinates, fieldData.distance, fieldData.estimatedArea, fieldData.gpsAccuracy,
      JSON.stringify(aiResult)
    );

    res.json({ success: true, verificationId, aiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Field Verification failed.' });
  }
});

// Approve Field Verification
app.post('/api/field-verifications/:id/approve', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { id } = req.params;
  const workerId = req.user.workerId;

  const verification = db.prepare('SELECT * FROM field_verifications WHERE verificationId = ?').get(id);
  if (!verification || verification.engineerId !== workerId || verification.status !== 'PENDING_APPROVAL') {
    return res.status(400).json({ error: 'Invalid verification session.' });
  }

  const aiResult = JSON.parse(verification.aiVerificationResult);
  const targetActivityId = verification.activityId || aiResult.matchedActivityId;

  try {
    db.transaction(() => {
      // 1. Mark Approved
      db.prepare(`UPDATE field_verifications SET status = 'APPROVED', approvedAt = CURRENT_TIMESTAMP WHERE verificationId = ?`).run(id);

      // 2. Update Activity
      if (targetActivityId) {
        let actStatus = 'IN_PROGRESS';
        if (aiResult.recommendedProgress >= 100) actStatus = 'COMPLETED';
        db.prepare(`UPDATE task_activities SET progress = ?, status = ?, aiConfidence = ? WHERE activityId = ?`).run(
          aiResult.recommendedProgress, actStatus, aiResult.confidence, targetActivityId
        );
      }

      // 3. Recalculate Global Task Progress
      const activities = db.prepare('SELECT * FROM task_activities WHERE taskId = ?').all(verification.taskId);
      let overallProgress = aiResult.recommendedProgress;

      if (activities.length > 0) {
        const total = activities.reduce((sum, act) => sum + act.progress, 0);
        overallProgress = Math.round(total / activities.length);
      }

      let newStatus = overallProgress >= 100 ? 'SUBMITTED' : 'IN_PROGRESS';

      db.prepare(`UPDATE tasks SET progress = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE taskId = ?`).run(
        overallProgress, newStatus, verification.taskId
      );

      db.prepare(`
        INSERT INTO task_updates (updateId, taskId, workerId, text, location) 
        VALUES (?, ?, ?, ?, ?)
      `).run(`UPD-${Date.now()}`, verification.taskId, workerId, `Field Verification Approved. Progress: ${overallProgress}%`, 'System');

      // 4. Emit Events
      io.emit('field_verification_approved', { taskId: verification.taskId });
      io.emit('task_updated', { taskId: verification.taskId, status: newStatus });
    })();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to approve verification.' });
  }
});

// Reject Field Verification
app.post('/api/field-verifications/:id/reject', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { id } = req.params;
  const workerId = req.user.workerId;

  const verification = db.prepare('SELECT * FROM field_verifications WHERE verificationId = ?').get(id);
  if (!verification || verification.engineerId !== workerId) {
    return res.status(400).json({ error: 'Invalid verification session.' });
  }

  db.prepare(`UPDATE field_verifications SET status = 'REJECTED' WHERE verificationId = ?`).run(id);
  res.json({ success: true });
});

// --- LIVE LOCATION ROUTES ---

app.post('/api/location/update', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { latitude, longitude, accuracy, timestamp } = req.body;
  const { workerId, name } = req.user;

  try {
    const stmt = db.prepare(`
      INSERT INTO worker_locations (workerId, workerName, latitude, longitude, accuracy, timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, 'LIVE')
      ON CONFLICT(workerId) DO UPDATE SET
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        accuracy = excluded.accuracy,
        timestamp = excluded.timestamp,
        status = 'LIVE'
    `);

    stmt.run(workerId, name, latitude, longitude, accuracy, timestamp);

    // Also append to history
    const historyStmt = db.prepare(`
      INSERT INTO worker_location_history (workerId, latitude, longitude, accuracy, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);
    historyStmt.run(workerId, latitude, longitude, accuracy, timestamp);

    const locationData = { workerId, workerName: name, latitude, longitude, accuracy, timestamp, status: 'LIVE' };
    io.to('admin_room').emit('worker_location_updated', locationData);

    res.json({ success: true, location: locationData });
  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ error: 'Database error updating location.' });
  }
});

app.post('/api/location/stop', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { workerId } = req.user;

  try {
    const timestamp = new Date().toISOString();
    db.prepare(`UPDATE worker_locations SET status = 'OFFLINE', timestamp = ? WHERE workerId = ?`).run(timestamp, workerId);

    io.to('admin_room').emit('worker_location_stopped', { workerId, status: 'OFFLINE', timestamp });
    res.json({ success: true, status: 'OFFLINE' });
  } catch (err) {
    res.status(500).json({ error: 'Database error stopping location.' });
  }
});

app.get('/api/location/me', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { workerId } = req.user;
  const location = db.prepare('SELECT * FROM worker_locations WHERE workerId = ?').get(workerId);
  res.json(location || null);
});

app.get('/api/admin/locations', authenticateToken, requireRole('ADMIN', 'OWNER'), (req, res) => {
  const locations = db.prepare('SELECT * FROM worker_locations').all();
  res.json(locations);
});

app.get('/api/admin/locations/:workerId/history', authenticateToken, requireRole('ADMIN', 'OWNER'), (req, res) => {
  const { workerId } = req.params;
  const points = db.prepare('SELECT latitude, longitude, accuracy, timestamp FROM worker_location_history WHERE workerId = ? ORDER BY timestamp ASC').all(workerId);
  res.json({ workerId, points });
});

// --- SOCKET.IO ---

// Socket Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error: Invalid token'));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id} (${socket.user.role})`);

  if (socket.user.role === 'WORKER') {
    socket.join(`worker_${socket.user.workerId}`);

    socket.on('worker_location_update', (payload) => {
      const { workerId, name } = socket.user;
      const { latitude, longitude, accuracy, timestamp } = payload;

      try {
        db.prepare(`
          INSERT INTO worker_locations (workerId, workerName, latitude, longitude, accuracy, timestamp, status)
          VALUES (?, ?, ?, ?, ?, ?, 'LIVE')
          ON CONFLICT(workerId) DO UPDATE SET
            latitude = excluded.latitude,
            longitude = excluded.longitude,
            accuracy = excluded.accuracy,
            timestamp = excluded.timestamp,
            status = 'LIVE'
        `).run(workerId, name, latitude, longitude, accuracy, timestamp);

        db.prepare(`
          INSERT INTO worker_location_history (workerId, latitude, longitude, accuracy, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `).run(workerId, latitude, longitude, accuracy, timestamp);

        const locationData = { workerId, workerName: name, latitude, longitude, accuracy, timestamp, status: 'LIVE' };
        io.to('admin_room').emit('worker_location_updated', locationData);
        // console.log(`[LOCATION] Broadcasted update for ${workerId}`);
      } catch (err) {
        console.error('Socket location update error:', err);
      }
    });

    socket.on('worker_location_stop', () => {
      const { workerId } = socket.user;
      try {
        const timestamp = new Date().toISOString();
        db.prepare(`UPDATE worker_locations SET status = 'OFFLINE', timestamp = ? WHERE workerId = ?`).run(timestamp, workerId);
        io.to('admin_room').emit('worker_location_stopped', { workerId, status: 'OFFLINE', timestamp });
      } catch (err) {
        console.error('Socket location stop error:', err);
      }
    });
  }

  socket.on('join_admin_room', () => {
    if (socket.user.role === 'ADMIN') {
      socket.join('admin_room');
      console.log(`[SOCKET] Admin joined admin_room: ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// --- DEADLINE ENFORCEMENT & LIFECYCLE WORKER ---
setInterval(() => {
  try {
    const activeActivities = db.prepare(`
      SELECT * FROM task_activities 
      WHERE status IN ('Pending', 'IN_PROGRESS', 'ASSIGNED') 
        AND evidenceReceivedAt IS NULL
    `).all();

    const now = new Date();

    for (const act of activeActivities) {
      const targetDateStr = act.endDate || act.startDate;
      if (!targetDateStr) continue;

      const deadline = new Date(targetDateStr);
      if (isNaN(deadline.getTime())) continue;

      deadline.setHours(23, 59, 59, 999);
      
      const startDateObj = new Date(act.startDate || targetDateStr);
      startDateObj.setHours(0, 0, 0, 0);

      const taskObj = db.prepare('SELECT assignedWorkerId FROM tasks WHERE taskId = ?').get(act.taskId);

      // Transition to MISSED
      if (now.getTime() > deadline.getTime()) {
        console.log(`[LIFECYCLE WORKER] Activity ${act.activityId} missed deadline (${deadline.toISOString()}). Current time: ${now.toISOString()}`);
        
        db.transaction(() => {
          db.prepare(`UPDATE task_activities SET status = 'MISSED', missedAt = CURRENT_TIMESTAMP WHERE activityId = ?`).run(act.activityId);
          db.prepare(`UPDATE tasks SET status = 'MISSED', missedAt = CURRENT_TIMESTAMP WHERE taskId = ?`).run(act.taskId);
        })();

        // Broadcast securely
        if (taskObj && taskObj.assignedWorkerId) {
          io.to(`worker_${taskObj.assignedWorkerId}`).emit('task_updated', { taskId: act.taskId, activityId: act.activityId, status: 'MISSED' });
        }
        io.to('admin_room').emit('task_updated', { taskId: act.taskId, activityId: act.activityId, status: 'MISSED' });
      } 
      // Transition to IN_PROGRESS
      else if (now.getTime() >= startDateObj.getTime() && (act.status === 'ASSIGNED' || act.status === 'Pending')) {
        console.log(`[LIFECYCLE WORKER] Auto-starting Activity ${act.activityId}`);
        
        db.transaction(() => {
          db.prepare(`UPDATE task_activities SET status = 'IN_PROGRESS' WHERE activityId = ?`).run(act.activityId);
          db.prepare(`UPDATE tasks SET status = 'IN_PROGRESS' WHERE taskId = ? AND status IN ('ASSIGNED', 'Pending')`).run(act.taskId);
        })();

        if (taskObj && taskObj.assignedWorkerId) {
          io.to(`worker_${taskObj.assignedWorkerId}`).emit('task_updated', { taskId: act.taskId, activityId: act.activityId, status: 'IN_PROGRESS' });
        }
        io.to('admin_room').emit('task_updated', { taskId: act.taskId, activityId: act.activityId, status: 'IN_PROGRESS' });
      }
    }
  } catch (err) {
    console.error('Lifecycle worker error:', err);
  }
}, 10000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
