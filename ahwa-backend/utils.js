// عشان أي خطأ جوه async يوصل لمعالج الأخطاء بدل ما السيرفر يقع
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const PHONE_RE = /^01[0125][0-9]{8}$/;

const clean = v => (typeof v === 'string' ? v.trim() : '');

// رد الأخطاء بشكل موحد: { ok:false, message:'أول خطأ', errors:{ field: 'الرسالة' } }
function fail(res, errors, status = 400) {
  return res.status(status).json({ ok: false, message: Object.values(errors)[0], errors });
}

function safeParse(text, fallback = []) {
  try { return JSON.parse(text); } catch (e) { return fallback; }
}

module.exports = { wrap, PHONE_RE, clean, fail, safeParse };
