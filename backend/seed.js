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

  // Seed Admin & Owner
  const adminPwd = bcrypt.hashSync('admin123', 10);
  const ownerPwd = bcrypt.hashSync('owner123', 10);
  insertUser.run('user_admin', 'Site Engineer User', 'admin', adminPwd, 'ADMIN');
  insertUser.run('user_owner', 'Owner Executive', 'owner', ownerPwd, 'OWNER');

  workers.forEach(w => {
    const userId = `user_${w.workerId}`;
    const pwd = bcrypt.hashSync(w.mobile, 10);
    insertUser.run(userId, w.name, w.mobile, pwd, 'WORKER');
    insertWorker.run(w.workerId, userId, w.name, w.mobile, 'Male', 30);
  });

  // Temporarily disable foreign keys for clean re-seed
  db.pragma('foreign_keys = OFF');
  db.prepare("DELETE FROM activity_dependencies").run();
  db.prepare("DELETE FROM ai_evidence_verifications").run();
  db.prepare("DELETE FROM field_verifications").run();
  db.prepare("DELETE FROM worker_evidence").run();
  db.prepare("DELETE FROM task_activities").run();
  db.prepare("DELETE FROM tasks").run();
  db.pragma('foreign_keys = ON');

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

  // Seed Task Activities
  db.prepare("DELETE FROM task_activities").run();
  const insertActivity = db.prepare(`
    INSERT INTO task_activities (activityId, taskId, activityNumber, name, description, startDate, endDate, status, progress, aiConfidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const activities = [
    // CIV-101 (Pump Foundation Excavation)
    { id: 'ACT-CIV-1', taskId: 'CIV-101', num: 1, name: 'Site Marking & Perimeter Survey', desc: 'Survey benchmark and line marking.', start: '2026-08-20', end: '2026-08-22', status: 'COMPLETED', prog: 100, conf: 98 },
    { id: 'ACT-CIV-2', taskId: 'CIV-101', num: 2, name: 'Initial Excavation & Soil Removal', desc: 'Excavate 2.5m depth foundation pit.', start: '2026-08-23', end: '2026-08-26', status: 'IN_PROGRESS', prog: 65, conf: 92 },
    { id: 'ACT-CIV-3', taskId: 'CIV-101', num: 3, name: 'PCC Base Concreting', desc: 'Lay 150mm PCC bed.', start: '2026-08-27', end: '2026-08-28', status: 'ASSIGNED', prog: 0, conf: 85 },
    { id: 'ACT-CIV-4', taskId: 'CIV-101', num: 4, name: 'Foundation Rebar Binding', desc: 'Bind heavy high-yield rebar cage.', start: '2026-08-29', end: '2026-08-30', status: 'ASSIGNED', prog: 0, conf: 85 },

    // PIP-204 (Piping Section P-204)
    { id: 'ACT-PIP-1', taskId: 'PIP-204', num: 1, name: 'Pipe Spool Fabrication', desc: 'Fabricate 12-inch CS spools in shop.', start: '2026-08-24', end: '2026-08-26', status: 'COMPLETED', prog: 100, conf: 95 },
    { id: 'ACT-PIP-2', taskId: 'PIP-204', num: 2, name: 'Pipe Support Structure Anchor', desc: 'Weld anchor plates on foundation.', start: '2026-08-27', end: '2026-08-28', status: 'IN_PROGRESS', prog: 40, conf: 88 },
    { id: 'ACT-PIP-3', taskId: 'PIP-204', num: 3, name: 'Spool Erection & Butt Welding', desc: 'Position pipe and perform GTAW/SMAW welding.', start: '2026-08-29', end: '2026-08-30', status: 'ASSIGNED', prog: 0, conf: 80 },

    // ELE-203 (Electrical Cable Laying)
    { id: 'ACT-ELE-1', taskId: 'ELE-203', num: 1, name: 'Cable Tray Installation', desc: 'Mount perforated GI trays on pipe rack.', start: '2026-08-20', end: '2026-08-21', status: 'COMPLETED', prog: 100, conf: 96 },
    { id: 'ACT-ELE-2', taskId: 'ELE-203', num: 2, name: 'HT Power Cable Pulling', desc: 'Pull 11kV 3C 300sqmm XLPE cable.', start: '2026-08-21', end: '2026-08-22', status: 'COMPLETED', prog: 100, conf: 94 },

    // STR-110 (Steel Structure Erection)
    { id: 'ACT-STR-1', taskId: 'STR-110', num: 1, name: 'Base Plate Alignment & Grouting', desc: 'Align column base plates with leveling shims.', start: '2026-08-25', end: '2026-08-27', status: 'IN_PROGRESS', prog: 50, conf: 91 },
    { id: 'ACT-STR-2', taskId: 'STR-110', num: 2, name: 'Main Column Crane Lifting', desc: 'Erect primary HEB-400 columns with 50T mobile crane.', start: '2026-08-28', end: '2026-08-30', status: 'ASSIGNED', prog: 0, conf: 85 }
  ];

  activities.forEach(a => {
    insertActivity.run(a.id, a.taskId, a.num, a.name, a.desc, a.start, a.end, a.status, a.prog, a.conf);
  });

  // Seed Activity Dependencies (DAG)
  db.prepare("DELETE FROM activity_dependencies").run();
  const insertDep = db.prepare(`
    INSERT INTO activity_dependencies (id, projectId, taskId, predecessorActivityId, successorActivityId, dependencyType, lagDays)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const dependencies = [
    { id: 'DEP-1', pid: 'PROJ-001', tid: 'CIV-101', pred: 'ACT-CIV-1', succ: 'ACT-CIV-2', type: 'FS', lag: 0 },
    { id: 'DEP-2', pid: 'PROJ-001', tid: 'CIV-101', pred: 'ACT-CIV-2', succ: 'ACT-CIV-3', type: 'FS', lag: 0 },
    { id: 'DEP-3', pid: 'PROJ-001', tid: 'CIV-101', pred: 'ACT-CIV-3', succ: 'ACT-CIV-4', type: 'FS', lag: 1 },
    { id: 'DEP-4', pid: 'PROJ-001', tid: 'PIP-204', pred: 'ACT-CIV-4', succ: 'ACT-PIP-2', type: 'FS', lag: 0 },
    { id: 'DEP-5', pid: 'PROJ-001', tid: 'PIP-204', pred: 'ACT-PIP-1', succ: 'ACT-PIP-3', type: 'FS', lag: 0 },
    { id: 'DEP-6', pid: 'PROJ-001', tid: 'PIP-204', pred: 'ACT-PIP-2', succ: 'ACT-PIP-3', type: 'FS', lag: 0 },
  ];

  dependencies.forEach(d => {
    insertDep.run(d.id, d.pid, d.tid, d.pred, d.succ, d.type, d.lag);
  });

  console.log("Database seed complete with activities and DAG dependencies!");
};

seedData();
