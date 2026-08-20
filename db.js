const path = require('path');
const Database = require('better-sqlite3');

// SQLite 資料庫檔案，會存放在專案根目錄的 data/ 資料夾裡
// 團隊多人共用時，只要大家連到同一個部署好的伺服器，
// 這個檔案裡的課程資料就是共用、跨裝置同步的。
const DB_PATH = path.join(__dirname, 'data', 'courses.db');

const fs = require('fs');
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function listCourses() {
  const rows = db.prepare(
    'SELECT id, name, updated_at FROM courses ORDER BY updated_at DESC'
  ).all();
  return rows;
}

function getCourse(id) {
  const row = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
  if (!row) return null;
  return { id: row.id, name: row.name, data: JSON.parse(row.data), updated_at: row.updated_at, created_at: row.created_at };
}

function createCourse(id, name, data) {
  db.prepare(
    'INSERT INTO courses (id, name, data) VALUES (?, ?, ?)'
  ).run(id, name, JSON.stringify(data));
  return getCourse(id);
}

function updateCourse(id, name, data) {
  const result = db.prepare(
    `UPDATE courses SET name = ?, data = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(name, JSON.stringify(data), id);
  if (result.changes === 0) return null;
  return getCourse(id);
}

function deleteCourse(id) {
  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = { listCourses, getCourse, createCourse, updateCourse, deleteCourse };
