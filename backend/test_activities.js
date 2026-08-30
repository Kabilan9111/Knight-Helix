const db = require('./db.js');
const activities = db.prepare("SELECT * FROM task_activities LIMIT 5").all();
console.log(JSON.stringify(activities, null, 2));
