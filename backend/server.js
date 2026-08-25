require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

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
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

const requireRole = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ error: 'Unauthorized role.' });
  }
  next();
};

// --- AUTH ROUTES ---

// 1. ADMIN LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email_mobile, password } = req.body;
  const adminUser = process.env.MOCK_ADMIN_USER;
  const adminPass = process.env.MOCK_ADMIN_PASS;

  if (email_mobile === adminUser && password === adminPass) {
    const userPayload = { id: 'admin-1', role: 'ADMIN', name: 'Admin User' };
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

app.get('/api/dashboard/stats', authenticateToken, requireRole('ADMIN'), (req, res) => {
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
    if (req.user.workerId !== workerId) return res.status(403).json({error: 'Cannot access other worker tasks'});
    tasks = db.prepare(`
      SELECT t.*, p.name as projectName, w.name as workerName 
      FROM tasks t 
      LEFT JOIN projects p ON t.projectId = p.projectId 
      LEFT JOIN workers w ON t.assignedWorkerId = w.workerId
      WHERE t.assignedWorkerId = ?
    `).all(workerId);
  } else if (req.user.role === 'ADMIN') {
    // Admin sees all
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

app.post('/api/tasks', authenticateToken, requireRole('ADMIN'), (req, res) => {
  const { title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate } = req.body;
  const taskId = `TASK-${Math.floor(Math.random()*10000)}`;
  
  const insert = db.prepare(`
    INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  try {
    insert.run(taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate);
    io.emit('task_created', { taskId, assignedWorkerId }); // Broadcast creation
    res.json({ success: true, taskId });
  } catch(err) {
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/tasks/:id/update', authenticateToken, requireRole('WORKER'), (req, res) => {
  const { id } = req.params;
  const { progress, text, location } = req.body;
  
  const task = db.prepare('SELECT * FROM tasks WHERE taskId = ?').get(id);
  if (!task || task.assignedWorkerId !== req.user.workerId) {
    return res.status(403).json({ error: 'Cannot update this task.' });
  }

  let status = task.status;
  if (progress === 100) status = 'Completed';
  else if (progress > 0 && status === 'Pending') status = 'In Progress';

  db.prepare('UPDATE tasks SET progress = ?, status = ?, updatedAt = CURRENT_TIMESTAMP WHERE taskId = ?')
    .run(progress, status, id);
    
  db.prepare(`
    INSERT INTO task_updates (updateId, taskId, workerId, text, location) 
    VALUES (?, ?, ?, ?, ?)
  `).run(`UPD-${Date.now()}`, id, req.user.workerId, text, location);

  io.emit('task_updated', { taskId: id, assignedWorkerId: req.user.workerId });
  res.json({ success: true });
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('join_admin_room', () => {
    socket.join('admin_room');
  });

  socket.on('join_worker_room', (workerId) => {
    socket.join(`worker_${workerId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
