const router = require('express').Router();
const db = require('../db');
const { wrap } = require('../utils');

// GET /api/menu            -> كل الأصناف المتاحة
// GET /api/menu?cat=ساخن   -> أصناف تصنيف معين
router.get('/', wrap(async (req, res) => {
  const cat = typeof req.query.cat === 'string' ? req.query.cat.trim() : '';
  const [rows] = cat
    ? await db.query('SELECT id, name, cat, price, emoji FROM menu_items WHERE is_available = 1 AND cat = ? ORDER BY id', [cat])
    : await db.query('SELECT id, name, cat, price, emoji FROM menu_items WHERE is_available = 1 ORDER BY id');
  res.json(rows);
}));

module.exports = router;
