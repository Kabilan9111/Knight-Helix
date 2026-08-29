const db = require('better-sqlite3')('sanchalan.db');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get().sql);
