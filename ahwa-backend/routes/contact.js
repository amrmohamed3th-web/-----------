const router = require('express').Router();
const db = require('../db');
const { wrap, clean, fail, PHONE_RE } = require('../utils');

// POST /api/contact  { name, phone, message }
router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name);
  const phone = clean(b.phone);
  const message = clean(b.message);

  const errors = {};
  if (name.length < 3 || name.length > 60) errors.name = 'اكتب اسمك (3 حروف على الأقل)';
  if (!PHONE_RE.test(phone)) errors.phone = 'رقم الموبايل لازم يبدأ بـ 01 ويكون 11 رقم';
  if (message.length < 5 || message.length > 1000) errors.message = 'اكتب رسالتك (5 حروف على الأقل)';
  if (Object.keys(errors).length) return fail(res, errors);

  const [r] = await db.query(
    'INSERT INTO messages (name, phone, message) VALUES (?, ?, ?)',
    [name, phone, message]
  );
  res.status(201).json({ ok: true, id: r.insertId });
}));

module.exports = router;
