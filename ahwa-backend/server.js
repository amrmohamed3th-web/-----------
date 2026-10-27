require('dotenv').config();   // لازم أول سطر قبل ما نحمّل db.js

const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// تحديد عدد الطلبات المكتوبة (POST/PUT/PATCH/DELETE) عشان الإزعاج والسبام
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'طلبات كتير أوي، استنى شوية وجرب تاني' }
});
app.use('/api', (req, res, next) => (req.method === 'GET' ? next() : writeLimiter(req, res, next)));

// ---------- API ----------
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: 'قاعدة البيانات مش شغالة' });
  }
});
app.use('/api/menu', require('./routes/menu'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

app.use('/api', (req, res) => res.status(404).json({ ok: false, message: 'المسار ده مش موجود' }));

// ---------- الفرونت ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- معالج الأخطاء ----------
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ ok: false, message: 'الـ JSON المبعوت فيه غلط' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ ok: false, message: 'البيانات كبيرة أوي' });
  }
  console.error(err);
  res.status(500).json({ ok: false, message: 'حصلت مشكلة عندنا، جرب تاني بعد شوية' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, async () => {
  console.log(`السيرفر شغال على http://localhost:${PORT}`);
  try {
    await db.query('SELECT 1');
    console.log('✔ اتصلنا بقاعدة البيانات');
  } catch (e) {
    console.error('✖ مش قادر أتصل بقاعدة البيانات. تأكد إن MySQL شغال في XAMPP وإنك عملت Import لـ database.sql');
    console.error('  السبب:', e.message);
  }
});
