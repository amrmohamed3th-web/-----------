const router = require('express').Router();
const crypto = require('crypto');
const db = require('../db');
const { wrap, clean, fail } = require('../utils');

const STATUSES = ['new', 'preparing', 'done', 'cancelled'];

// ---------- حماية: كل المسارات دي لازم هيدر x-admin-key ----------
router.use((req, res, next) => {
  const key = process.env.ADMIN_KEY || '';
  const got = req.get('x-admin-key') || '';
  const a = Buffer.from(got);
  const b = Buffer.from(key);
  if (!key || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ ok: false, message: 'مش مسموحلك' });
  }
  next();
});

// ---------- الطلبات ----------
// GET /api/admin/orders?status=new
router.get('/orders', wrap(async (req, res) => {
  const status = req.query.status;
  if (status !== undefined && !STATUSES.includes(status)) {
    return fail(res, { status: 'الحالة لازم تكون: ' + STATUSES.join(' / ') });
  }
  const [orders] = status
    ? await db.query('SELECT * FROM orders WHERE status = ? ORDER BY id DESC LIMIT 100', [status])
    : await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 100');
  if (!orders.length) return res.json([]);

  const [items] = await db.query(
    'SELECT order_id, item_id, name, price, qty FROM order_items WHERE order_id IN (?)',
    [orders.map(o => o.id)]
  );
  res.json(orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })));
}));

// PATCH /api/admin/orders/:id/status  { status }
router.patch('/orders/:id/status', wrap(async (req, res) => {
  const status = req.body && req.body.status;
  if (!STATUSES.includes(status)) {
    return fail(res, { status: 'الحالة لازم تكون: ' + STATUSES.join(' / ') });
  }
  const [r] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, { id: 'الطلب مش موجود' }, 404);
  res.json({ ok: true });
}));

// ---------- الرسايل ----------
// GET /api/admin/messages
router.get('/messages', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM messages ORDER BY id DESC LIMIT 100');
  res.json(rows);
}));

// ---------- المنيو ----------
function validateMenu(b = {}) {
  const errors = {};
  const name = clean(b.name);
  const cat = clean(b.cat);
  const emoji = clean(b.emoji);
  const price = Number(b.price);
  if (name.length < 2 || name.length > 60) errors.name = 'الاسم من 2 لـ 60 حرف';
  if (cat.length < 1 || cat.length > 30) errors.cat = 'التصنيف مطلوب (30 حرف بالكتير)';
  if (!Number.isInteger(price) || price < 1 || price > 10000) errors.price = 'السعر لازم رقم صحيح بين 1 و 10000';
  if (emoji.length > 16) errors.emoji = 'الإيموجي طويل';
  const is_available = b.is_available === undefined ? 1 : (b.is_available ? 1 : 0);
  return { errors, data: { name, cat, price, emoji, is_available } };
}

// POST /api/admin/menu  { name, cat, price, emoji?, is_available? }
router.post('/menu', wrap(async (req, res) => {
  const { errors, data } = validateMenu(req.body);
  if (Object.keys(errors).length) return fail(res, errors);
  const [r] = await db.query(
    'INSERT INTO menu_items (name, cat, price, emoji, is_available) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.cat, data.price, data.emoji, data.is_available]
  );
  res.status(201).json({ ok: true, id: r.insertId });
}));

// PUT /api/admin/menu/:id  (نفس حقول POST - بيستبدل الصنف كله، وبـ is_available:false بتخفيه)
router.put('/menu/:id', wrap(async (req, res) => {
  const { errors, data } = validateMenu(req.body);
  if (Object.keys(errors).length) return fail(res, errors);
  const [r] = await db.query(
    'UPDATE menu_items SET name = ?, cat = ?, price = ?, emoji = ?, is_available = ? WHERE id = ?',
    [data.name, data.cat, data.price, data.emoji, data.is_available, Number(req.params.id)]
  );
  if (!r.affectedRows) return fail(res, { id: 'الصنف مش موجود' }, 404);
  res.json({ ok: true });
}));

// ---------- الآراء ----------
// GET /api/admin/reviews  (فيها الـ id عشان تقدر تمسح)
router.get('/reviews', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id, name, job, stars, body AS text, created_at FROM reviews ORDER BY id DESC LIMIT 100');
  res.json(rows);
}));

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', wrap(async (req, res) => {
  const [r] = await db.query('DELETE FROM reviews WHERE id = ?', [Number(req.params.id)]);
  if (!r.affectedRows) return fail(res, { id: 'الرأي مش موجود' }, 404);
  res.json({ ok: true });
}));

module.exports = router;
