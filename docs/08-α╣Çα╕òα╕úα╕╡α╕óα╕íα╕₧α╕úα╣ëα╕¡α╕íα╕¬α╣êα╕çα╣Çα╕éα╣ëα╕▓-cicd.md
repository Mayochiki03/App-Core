# 08 — เตรียมพร้อมส่งเข้า CI/CD (Deploy Console)

Deploy Console ตรวจโปรเจกต์ตามขั้นตอนนี้ ถ้าเตรียมครบจะผ่านตั้งแต่รอบแรก

## เช็กลิสต์ก่อนลงทะเบียนโปรเจกต์ใน Console

- [ ] repo มี `package-lock.json` (commit ขึ้น git) และ `tsconfig`
- [ ] สคริปต์ที่ราก: `check`, `lint`, `test`, `build` (App-Core มีครบ)
- [ ] มี `eslint.config.js` และ `sonar-project.properties` (App-Core มีให้ — ไม่ใส่ project key/host/token ไว้ในไฟล์ Console ส่งมาเอง)
- [ ] มี `.gitattributes` (กัน CRLF/LF ทำให้ diff เต็มไปหมดบน Windows)
- [ ] `GET /api/health` ตอบ 200 พร้อม `version` (ใช้เช็กหลัง deploy ว่าขึ้นเวอร์ชันถูก)
- [ ] ไม่มีรหัสผ่าน/token ในโค้ด (gitleaks จับ) · `.env` ไม่ขึ้น git
- [ ] `npm run check && npm run lint && npm test` ผ่านในเครื่องก่อนติด tag

## ฐานข้อมูลสำหรับเทสต์ (จุดที่พลาดบ่อย)

เทสต์ **ลบทุกตารางแล้วสร้างใหม่** ชื่อฐานข้อมูลต้องลงท้าย `_test` และ **ต้องแยกต่อโปรเจกต์** — ถ้าสองโปรเจกต์ใช้ฐานข้อมูลเทสต์ร่วมกัน ประวัติ migration จะชนกัน
- ตั้งชื่อ `<ชื่อโปรเจกต์>_remote_test` (เช่น `bst_noi_remote_test`) สำหรับรันใน Console และให้ user ของ Console (เช่น `deploy_console`) มีสิทธิ์ใช้ฐานข้อมูลนั้น
- ในหน้าตั้งค่าโปรเจกต์ของ Console ใส่ DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD ของฐานข้อมูลเทสต์ — Console ส่งเป็นตัวแปรสภาพแวดล้อมให้ขั้น test (เทสต์อ่าน `TEST_DB_NAME` ก่อน `DB_NAME`)
- เครื่องพัฒนาใช้ `TEST_DB_NAME` ของตัวเอง (เช่น `bst_noi_test`) ไม่ปนกับ Console

## ขั้นตอนที่ Console รัน (เรียงตามลำดับ)

clone ตาม tag → `npm ci` → check → lint → test → build → audit → gitleaks → SonarQube
(Playwright e2e ไม่ได้อยู่ใน App-Core — โปรเจกต์ที่ต้องการเพิ่มเองตามค่าตั้งของ Console)

## รูปแบบ "ต้องทำตาม" ต่อเวอร์ชัน

ทุกเวอร์ชันของโปรเจกต์ใน `CHANGELOG.md` ให้มีหัวข้อ **ต้องทำตาม** สั้น ๆ เป็นรายการติ๊ก เช่น
- [ ] เพิ่มตัวแปรใหม่ใน `.env` ของเซิร์ฟเวอร์ (ระบุชื่อ)
- [ ] รัน `npm run migrate` ก่อนเปิดระบบ (ถ้ามี migration ใหม่)
- [ ] ปรับค่าใน Console (ถ้ามี)
ใช้ติดตามตอน deploy ว่ามีอะไรต้องทำนอกจากกดปุ่ม
