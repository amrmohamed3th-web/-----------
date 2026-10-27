require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const db = require('./db');

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Rate Limiter
const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    statusCode: 429,
    message: { ok: false, message: 'طلبات كتير أوي، استنى شويه وجرب تاني' }
});

app.use('/api', (req, res, next) => (req.method === 'GET' ? next() : writeLimiter(req, res, next)));

// ------------ Routes ------------
app.use('/api/menu', require('./routes/menu'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admin', require('./routes/admin'));

// ------------ مسار الطلبات المباشر (Orders) ------------
app.post('/api/orders', (req, res) => {
    const { items, totalPrice } = req.body;
    const itemsJson = typeof items === 'object' ? JSON.stringify(items) : (items || '{}');
    const price = parseFloat(totalPrice) || 0;

    const sql = "INSERT INTO orders (items, total_price) VALUES (?, ?)";
    db.query(sql, [itemsJson, price], (err, result) => {
        if (err) {
            console.error('❌ خطأ قاعدة البيانات:', err);
            return res.status(500).json({ ok: false, error: err.message });
        }
        console.log('✅ تم حفظ طلب جديد برقم:', result.insertId);
        res.json({ ok: true, message: 'تم تأكيد طلبك بنجاح ☕', orderId: result.insertId });
    });
});

// ------------ Static Files ------------
app.use(express.static(path.join(__dirname, 'public')));

// ------------ Error Handler ------------
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ ok: false, message: 'المبعوث فيه غلط JSON الـ' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ ok: false, message: 'بيانات كبيرة أوي' });
    }
    console.error(err);
    res.status(500).json({ ok: false, message: 'حصلت مشكله عندنا، جرب تاني بعد شويه' });
});

// ------------ 404 Handler ------------
app.use('/api', (req, res) => res.status(404).json({ ok: false, message: 'المسار ده مش موجود' }));

// ------------ Server Listen ------------
const PORT = 5000;
app.listen(PORT, async () => {
    console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
    try {
        await db.query('SELECT 1');
        console.log('✔ اتصلنا بقاعدة البيانات');
    } catch (e) {
        console.error('❌ مش قادر أتصل بقاعدة البيانات:');
        console.error('السبب:', e.message);
    }
});