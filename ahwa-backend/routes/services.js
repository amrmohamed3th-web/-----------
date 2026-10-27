const router = require('express').Router();
const db = require('../db');
const { wrap, safeParse } = require('../utils');

// GET /api/services
router.get('/', wrap(async (req, res) => {
  const [rows] = await db.query('SELECT id, icon, bg, title, points, is_active FROM services ORDER BY sort_order, id');
  res.json(rows.map(r => ({
    id: r.id,
    icon: r.icon,
    bg: r.bg,
    title: r.title,
    on: !!r.is_active,
    points: safeParse(r.points)
  })));
}));

module.exports = router;
