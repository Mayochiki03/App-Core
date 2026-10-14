-- ============================================================
-- database/init.sql — สร้างฐานข้อมูลและผู้ใช้สำหรับระบบ (MariaDB / MySQL)
--
-- รันครั้งเดียวด้วยผู้ใช้ root (ดูวิธีที่ database/README.md)
-- ตาราง "ไม่ต้องสร้างเอง" — ระบบสร้างให้ตอนรัน npm run dev / npm run migrate
--
-- ค่าด้านล่างตรงกับค่าเริ่มต้นใน .env (DB_NAME / DB_USER / DB_PASSWORD) จึงรันระบบได้โดยไม่ต้องแก้อะไร
-- สำคัญ: ระบบจริง (production): เปลี่ยนรหัสผ่าน 'app_password' ก่อนรันไฟล์นี้ แล้วตั้ง DB_PASSWORD ใน .env ให้ตรงกัน
-- ============================================================

-- ฐานข้อมูลของระบบ
CREATE DATABASE IF NOT EXISTS app_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ฐานข้อมูลสำหรับ npm test เท่านั้น (เทสต์จะลบ-สร้างตารางใหม่ทุกครั้ง จึงแยกออกมา ไม่ให้ไปแตะข้อมูลจริง)
CREATE DATABASE IF NOT EXISTS app_core_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ผู้ใช้ที่ระบบใช้ต่อฐานข้อมูล (ไม่ใช้ root)
-- '%' = ต่อจากเครื่องไหนก็ได้ (สะดวกตอนพัฒนา/ใช้กับ Docker) — เซิร์ฟเวอร์จริงควรจำกัด เช่น 'app'@'10.0.0.%'
CREATE USER IF NOT EXISTS 'app'@'%' IDENTIFIED BY 'app_password';

GRANT ALL PRIVILEGES ON app_core.*      TO 'app'@'%';
GRANT ALL PRIVILEGES ON app_core_test.* TO 'app'@'%';
FLUSH PRIVILEGES;
