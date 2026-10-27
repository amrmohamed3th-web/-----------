const router = require('express').Router();
const db = require('../db');
const { wrap, clean, fail } = require('../utils');

const AVATAR_COLORS = ['#1c5d73', '#d94f6a', '#c98a0c', '#4a7c59', '#7b4fa3', '#c4552d'];

// GET /api/reviews -> آخر 30 رأي، الأحدث الأول
router.get('/', wrap(async (req, res) => {
  const [rows] = await db.query(
    'SELECT name, job, color, stars, body AS text FROM reviews ORDER BY id DESC LIMIT 30'
  );
  res.json(rows);
}));

// POST /api/reviews  { name, job?, stars, text }
router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name);
  const job = clean(b.job);
  const text = clean(b.text);
  const stars = Number(b.stars);

  const errors = {};
  if (name.length < 2 || name.length > 30) errors.name = 'اكتب اسمك (حرفين على الأقل)';
  if (job.length > 25) errors.job = 'الوظيفة طويلة (25 حرف بالكتير)';
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) errors.stars = 'اختار عدد النجوم';
  if (text.length < 3 || text.length > 200) errors.text = 'اكتب رأيك (3 حروف على الأقل)';
  if (Object.keys(errors).length) return fail(res, errors);

  // اللون بيتحدد من السيرفر مش من الزائر
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  await db.query(
    'INSERT INTO reviews (name, job, color, stars, body) VALUES (?, ?, ?, ?, ?)',
    [name, job || null, color, stars, text]
  );
  res.status(201).json({ name, job: job || null, color, stars, text });
}));

module.exports = router;
