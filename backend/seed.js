const db = require('./db');
const bcrypt = require('bcryptjs');

const seedData = () => {
  console.log("Starting database seed...");

  // Seed Projects
  const projects = [
    { projectId: 'PROJ-001', name: 'Project Alpha - Refinery Expansion', location: 'Site A' },
    { projectId: 'PROJ-002', name: 'Project Beta - Pipeline Installation', location: 'Site B' },
    { projectId: 'PROJ-003', name: 'Project Gamma - Plant Modernization', location: 'Site C' }
  ];
  
  const insertProject = db.prepare('INSERT OR IGNORE INTO projects (projectId, name, location) VALUES (?, ?, ?)');
  projects.forEach(p => insertProject.run(p.projectId, p.name, p.location));

  // Seed Workers
  const workers = [
    { workerId: 'WRK-101', name: 'Arun Kumar', mobile: '9999999901', team: 'Team Alpha' },
    { workerId: 'WRK-102', name: 'Karthik Raj', mobile: '9999999902', team: 'Team Alpha' },
    { workerId: 'WRK-103', name: 'Rahul Sharma', mobile: '9999999903', team: 'Team Beta' },
    { workerId: 'WRK-104', name: 'Sanjay Kumar', mobile: '9999999904', team: 'Team Gamma' }
  ];

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, name, email_mobile, password, role) VALUES (?, ?, ?, ?, ?)');
  const insertWorker = db.prepare('INSERT OR IGNORE INTO workers (workerId, userId, name, mobile, gender, age) VALUES (?, ?, ?, ?, ?, ?)');

  workers.forEach(w => {
    const userId = `user_${w.workerId}`;
    const pwd = bcrypt.hashSync(w.mobile, 10);
    insertUser.run(userId, w.name, w.mobile, pwd, 'WORKER');
    insertWorker.run(w.workerId, userId, w.name, w.mobile, 'Male', 30);
  });

  // Clear existing dummy tasks and seed real tasks
  db.prepare("DELETE FROM tasks").run();

  const insertTask = db.prepare(`
    INSERT INTO tasks (taskId, title, description, projectId, site, assignedWorkerId, priority, startDate, dueDate, status, progress)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    { id: 'CIV-101', title: 'Pump Foundation Excavation', desc: 'Complete excavation.', pid: 'PROJ-001', site: 'Site B', wid: 'WRK-102', pri: 'High', start: '2026-08-26', due: '2026-08-28', status: 'ASSIGNED', prog: 0 },
    { id: 'PIP-204', title: 'Piping Section P-204', desc: 'Install piping.', pid: 'PROJ-001', site: 'Site B', wid: 'WRK-102', pri: 'Medium', start: '2026-08-24', due: '2026-08-29', status: 'IN_PROGRESS', prog: 30 },
    { id: 'ELE-203', title: 'Electrical Cable Laying', desc: 'Lay cables.', pid: 'PROJ-001', site: 'Site B', wid: 'WRK-102', pri: 'High', start: '2026-08-20', due: '2026-08-22', status: 'SUBMITTED', prog: 100 },
    { id: 'STR-110', title: 'Steel Structure Erection', desc: 'Erect structure.', pid: 'PROJ-002', site: 'Site B', wid: 'WRK-101', pri: 'High', start: '2026-08-25', due: '2026-08-30', status: 'ASSIGNED', prog: 0 },
    { id: 'CIV-115', title: 'Trench Backfilling', desc: 'Backfill trench.', pid: 'PROJ-003', site: 'Site A', wid: 'WRK-103', pri: 'Low', start: '2026-08-25', due: '2026-08-28', status: 'IN_PROGRESS', prog: 50 },
  ];

  tasks.forEach(t => {
    insertTask.run(t.id, t.title, t.desc, t.pid, t.site, t.wid, t.pri, t.start, t.due, t.status, t.prog);
  });

  console.log("Database seed complete!");
};

seedData();
