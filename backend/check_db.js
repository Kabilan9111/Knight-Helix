const db = require('better-sqlite3')('sanchalan.db');
console.log("PROJECTS:", db.prepare("SELECT projectId, name FROM projects").all());
console.log("WORKERS:", db.prepare("SELECT workerId, name FROM workers").all());
