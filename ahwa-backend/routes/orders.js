const router = require('express').Router();
const db = require('../db');
const { wrap, clean, fail, PHONE_RE } = require('../utils');

// POST /api/orders
// { name, phone, notes?, items: [ { id, qty }, ... ] }
// السعر والإجمالي بيتحسبوا هنا من قاعدة البيانات، مش من اللي جاي من المتصفح
router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  const name = clean(b.name);
  const phone = clean(b.phone);
  const notes = clean(b.notes).slice(0, 300);

  const errors = {};
  if (name.length < 2 || name.length > 60) errors.name = 'اكتب اسمك (حرفين على الأقل)';
  if (!PHONE_RE.test(phone)) errors.phone = 'رقم الموبايل لازم يبدأ بـ 01 ويكون 11 رقم';

  // دمج الأصناف المتكررة والتأكد من الكميات
  const qtyById = new Map();
  const lines = Array.isArray(b.items) ? b.items : [];
  for (const l of lines) {
    const id = Number(l && l.id);
    const qty = Number(l && l.qty);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(qty) || qty < 1) {
      errors.items = 'الطلب فيه بيانات غلط';
      break;
    }
    qtyById.set(id, (qtyById.get(id) || 0) + qty);
  }
  if (!errors.items) {
    if (qtyById.size === 0) errors.items = 'الطلب فاضي';
    else if (qtyById.size > 30) errors.items = 'الطلب كبير أوي، كلمنا على الموبايل';
    else if ([...qtyById.values()].some(q => q > 20)) errors.items = 'أقصى كمية من الصنف الواحد 20';
  }
  if (Object.keys(errors).length) return fail(res, errors);

  const ids = [...qtyById.keys()];
  const [menu] = await db.query(
    'SELECT id, name, price FROM menu_items WHERE is_available = 1 AND id IN (?)',
    [ids]
  );
  if (menu.length !== ids.length) return fail(res, { items: 'في صنف في الطلب مش متاح دلوقتي' });

  let total = 0;
  const rows = menu.map(m => {
    const qty = qtyById.get(m.id);
    total += m.price * qty;
    return [null, m.id, m.name, m.price, qty]; // order_id بيتحط تحت
  });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO orders (customer_name, phone, notes, total) VALUES (?, ?, ?, ?)',
      [name, phone, notes || null, total]
    );
    const values = rows.map(row => [r.insertId, row[1], row[2], row[3], row[4]]);
    await conn.query('INSERT INTO order_items (order_id, item_id, name, price, qty) VALUES ?', [values]);
    await conn.commit();
    res.status(201).json({ ok: true, orderId: r.insertId, total });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}));

module.exports = router;
