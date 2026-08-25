const db = require('better-sqlite3')('D:\\Knight Helix\\backend\\sanchalan.db');
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
