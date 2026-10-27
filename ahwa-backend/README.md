# باك اند قهوة المعلّم

Node.js + Express + MySQL (من XAMPP). السيرفر بيشغّل الفرونت كمان من فولدر `public`، فكله بيشتغل على عنوان واحد.

## التشغيل (أول مرة)

1. افتح **XAMPP Control Panel** وشغّل **MySQL** (Apache مش لازم).
2. افتح `http://localhost/phpmyadmin` ← **Import** ← اختار `database.sql` ← **Go**.
3. انسخ `.env.example` باسم `.env` وغيّر `ADMIN_KEY` (باقي القيم مظبوطة لـ XAMPP الافتراضي).
4. في الـ terminal جوه الفولدر:
   ```
   npm install
   npm start
   ```
5. افتح `http://localhost:3000`

لو ظهرت رسالة "مش قادر أتصل بقاعدة البيانات"، اتأكد إن MySQL شغال وإنك عملت Import.

## الـ API

### عام (من غير مفتاح)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/menu` | المنيو (`?cat=ساخن` للفلترة) |
| GET | `/api/services` | الخدمات |
| GET | `/api/reviews` | آخر 30 رأي |
| POST | `/api/reviews` | `{ "name":"سارة", "job":"مصممة", "stars":5, "text":"حلو أوي" }` |
| POST | `/api/contact` | `{ "name":"عمرو", "phone":"01012345678", "message":"عايز أحجز" }` |
| POST | `/api/orders` | `{ "name":"عمرو", "phone":"01012345678", "notes":"ترابيزة 4", "items":[{"id":1,"qty":2},{"id":9,"qty":1}] }` |
| GET | `/api/health` | اختبار الاتصال بقاعدة البيانات |

الإجمالي بيتحسب في السيرفر من أسعار قاعدة البيانات، فتغيير الأسعار من المتصفح مش هيأثر.

### الإدارة (لازم هيدر `x-admin-key: <ADMIN_KEY بتاعك>`)

| الطريقة | المسار | الوصف |
|---|---|---|
| GET | `/api/admin/orders` | الطلبات (`?status=new`) |
| PATCH | `/api/admin/orders/:id/status` | `{ "status":"preparing" }` (new / preparing / done / cancelled) |
| GET | `/api/admin/messages` | رسايل التواصل |
| POST | `/api/admin/menu` | `{ "name":"لاتيه", "cat":"ساخن", "price":40, "emoji":"☕" }` |
| PUT | `/api/admin/menu/:id` | نفس الحقول، و`"is_available":false` بتخفي الصنف |
| GET | `/api/admin/reviews` | الآراء بالـ id |
| DELETE | `/api/admin/reviews/:id` | مسح رأي |

## ملاحظات

- الحد الأقصى 20 طلب كتابة (POST وغيره) في الدقيقة للـ IP الواحد.
- لو هتنشر السيرفر على الإنترنت: استخدم HTTPS، وعيّن يوزر وباسورد لـ MySQL غير `root` الفاضي، وخلي `ADMIN_KEY` طويل.
