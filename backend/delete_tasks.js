const db = require('./db.js');
db.pragma('foreign_keys = OFF');
const tasks = db.prepare("SELECT taskId FROM tasks WHERE status = 'ASSIGNED' OR status = 'Pending'").all();
for (const task of tasks) {
  db.prepare("DELETE FROM task_activities WHERE taskId = ?").run(task.taskId);
  db.prepare("DELETE FROM worker_evidence WHERE taskId = ?").run(task.taskId);
  db.prepare("DELETE FROM ai_evidence_verifications WHERE taskId = ?").run(task.taskId);
  db.prepare("DELETE FROM field_verifications WHERE taskId = ?").run(task.taskId);
  try {
     db.prepare("DELETE FROM task_updates WHERE taskId = ?").run(task.taskId);
  } catch(e){}
  db.prepare("DELETE FROM tasks WHERE taskId = ?").run(task.taskId);
}
db.pragma('foreign_keys = ON');
console.log('Deleted ' + tasks.length + ' assigned tasks');
