const express = require('express');
const crypto = require('crypto');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- API ----

// 取得所有課程列表（只回傳 id / name / updated_at，減少傳輸量）
app.get('/api/courses', (req, res) => {
  try {
    res.json(db.listCourses());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '讀取課程列表失敗' });
  }
});

// 取得單一課程完整資料
app.get('/api/courses/:id', (req, res) => {
  try {
    const course = db.getCourse(req.params.id);
    if (!course) return res.status(404).json({ error: '找不到這筆課程資料' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '讀取課程資料失敗' });
  }
});

// 新增課程
app.post('/api/courses', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: '缺少 name 或 data' });
    const id = crypto.randomUUID();
    const course = db.createCourse(id, name, data);
    res.status(201).json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '新增課程失敗' });
  }
});

// 更新課程（另存新檔以外，也可覆蓋既有課程）
app.put('/api/courses/:id', (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) return res.status(400).json({ error: '缺少 name 或 data' });
    const course = db.updateCourse(req.params.id, name, data);
    if (!course) return res.status(404).json({ error: '找不到這筆課程資料' });
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '更新課程失敗' });
  }
});

// 刪除課程
app.delete('/api/courses/:id', (req, res) => {
  try {
    const ok = db.deleteCourse(req.params.id);
    if (!ok) return res.status(404).json({ error: '找不到這筆課程資料' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '刪除課程失敗' });
  }
});

app.listen(PORT, () => {
  console.log(`KOL 合作邀約信件產生器已啟動： http://localhost:${PORT}`);
});
