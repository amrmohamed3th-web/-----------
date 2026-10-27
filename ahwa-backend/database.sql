-- قاعدة بيانات قهوة المعلّم
-- الاستيراد: phpMyAdmin > Import > اختار الملف ده > Go
-- آمن تعمله Import أكتر من مرة (مش بيمسح الطلبات ولا الرسايل)

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS ahwa_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ahwa_db;

-- ---------- المنيو ----------
CREATE TABLE IF NOT EXISTS menu_items (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(60)  NOT NULL,
  cat           VARCHAR(30)  NOT NULL,
  price         INT UNSIGNED NOT NULL,
  emoji         VARCHAR(16)  NOT NULL DEFAULT '',
  is_available  TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------- الخدمات ----------
CREATE TABLE IF NOT EXISTS services (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  icon        VARCHAR(16)  NOT NULL,
  bg          VARCHAR(9)   NOT NULL,
  title       VARCHAR(80)  NOT NULL,
  points      TEXT         NOT NULL,            -- JSON array
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ---------- آراء العملاء ----------
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(30)  NOT NULL,
  job         VARCHAR(25)  NULL,
  color       VARCHAR(9)   NOT NULL,
  stars       TINYINT UNSIGNED NOT NULL,
  body        VARCHAR(200) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- رسايل التواصل ----------
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL,
  phone       VARCHAR(11)  NOT NULL,
  message     TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- الطلبات ----------
CREATE TABLE IF NOT EXISTS orders (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_name  VARCHAR(60)  NOT NULL,
  phone          VARCHAR(11)  NOT NULL,
  notes          VARCHAR(300) NULL,
  total          INT UNSIGNED NOT NULL,
  status         ENUM('new','preparing','done','cancelled') NOT NULL DEFAULT 'new',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id  INT UNSIGNED NOT NULL,
  item_id   INT UNSIGNED NULL,                  -- من غير FK عشان الطلبات القديمة تفضل سليمة لو الصنف اتغير
  name      VARCHAR(60)  NOT NULL,              -- نسخة من الاسم والسعر وقت الطلب
  price     INT UNSIGNED NOT NULL,
  qty       SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- بيانات مبدئية ----------
INSERT IGNORE INTO menu_items (id, name, cat, price, emoji) VALUES
  (1,  'شاي بنعناع',     'ساخن',    20, '🍵'),
  (2,  'قهوة تركي',      'ساخن',    35, '☕'),
  (3,  'سحلب بالمكسرات', 'ساخن',    45, '🥛'),
  (4,  'ينسون',          'ساخن',    18, '🌿'),
  (5,  'عصير ليمون',     'بارد',    30, '🍋'),
  (6,  'قصب',            'بارد',    25, '🥤'),
  (7,  'كركديه مثلج',    'بارد',    28, '🧊'),
  (8,  'بسبوسة',         'حلويات',  40, '🍰'),
  (9,  'كنافة',          'حلويات',  55, '🧁'),
  (10, 'أم علي',         'حلويات',  50, '🍮');

INSERT IGNORE INTO services (id, icon, bg, title, points, is_active, sort_order) VALUES
  (1, '🪑', '#cfe4ec', 'حجز الترابيزات والقعدات',
      '["احجز قبلها بيوم على الأقل","قعدات للعائلات والصحاب","ركن هادي للشغل"]', 1, 1),
  (2, '🎉', '#fbe7bb', 'تجهيز المناسبات والحفلات',
      '["مشروبات وحلويات لحد 50 شخص","أسعار خاصة للكميات","تجهيز في نفس اليوم"]', 1, 2),
  (3, '🛵', '#f7d3da', 'توصيل لحد الباب',
      '["التوصيل داخل المحلة الكبرى","مدة التوصيل من 30 لـ 45 دقيقة","دفع عند الاستلام"]', 1, 3),
  (4, '📦', '#dfe3e6', 'اشتراك القهوة الشهري', '[]', 0, 4);

-- الآراء بتتعرض من الأحدث (id الأكبر) للأقدم، فبنضيف القديم الأول
INSERT IGNORE INTO reviews (id, name, job, color, stars, body) VALUES
  (1, 'محمود علي', 'طالب جامعي', '#c98a0c', 4, 'مكان حلو للمذاكرة مع الصحاب، والأسعار معقولة جداً.'),
  (2, 'منى خالد',  'مدرسة',      '#d94f6a', 5, 'الأم علي والكنافة طازة كل مرة، والخدمة سريعة وبشوشة.'),
  (3, 'أحمد سمير', 'مهندس',      '#1c5d73', 5, 'الشاي بالنعناع عندهم حاجة تانية، والقعدة هادية ومناسبة للشغل.');
