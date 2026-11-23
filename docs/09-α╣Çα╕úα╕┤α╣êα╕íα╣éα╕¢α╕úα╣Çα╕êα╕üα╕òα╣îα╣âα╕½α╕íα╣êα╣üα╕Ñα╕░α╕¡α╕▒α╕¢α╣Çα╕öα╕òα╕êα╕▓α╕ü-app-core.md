# 09 — เริ่มโปรเจกต์ใหม่จาก App-Core และอัปเดตจาก App-Core

App-Core คือ "มาตรฐานโครงสร้าง" — โปรเจกต์จริงเป็น repo ใหม่ ประวัติ git ใหม่ ไม่ใช่ branch ของ App-Core

## เริ่มโปรเจกต์ใหม่

```
git clone https://github.com/Mayochiki03/App-Core.git && cd App-Core && npm install && npm run new:project bst_noi
```

สคริปต์ก๊อปทั้งชุดไปโฟลเดอร์ข้าง ๆ (`../bst_noi`) โดยไม่เอา `.git`, `node_modules`, `dist`, `.env` พร้อมไฟล์ `.app-core-base.json` จดว่าเริ่มจากเวอร์ชันไหน (ระบุโฟลเดอร์เองได้: `npm run new:project bst_noi D:\work\bst_noi`) แล้วพิมพ์คำสั่ง `git init && git add -A && git commit ...` ให้รันต่อ (สคริปต์ไม่เรียก git เอง)

จากนั้นในโปรเจกต์ใหม่:
1. `npm install && npm run setup` (สร้าง `.env` สุ่มกุญแจให้)
2. แก้ `.env`: `APP_NAME`, `DB_NAME`, และตั้ง `TEST_DB_NAME` ของโปรเจกต์ (ดู docs/08)
3. ลบหน้าตัวอย่างที่ไม่ใช้ (`examples/`) หรือเก็บไว้เป็นแบบก็ได้ (ไม่ถูกลงทะเบียนในระบบ)
4. สร้าง repo เปล่าบน GitHub แล้ว `git remote add origin <url> && git push -u origin main`
5. สร้างหน้าแรกด้วย `npm run new:page`

## อัปเดตแกนจาก App-Core รุ่นใหม่ (นาน ๆ ครั้ง)

1. clone/แตก App-Core ตัวใหม่ไว้โฟลเดอร์อื่น
2. ในโปรเจกต์: `npm run kit:diff -- ../App-Core` — แสดงไฟล์แกนที่เปลี่ยน/เพิ่ม/ลบ (อ่านอย่างเดียว ไม่แก้อะไร)
3. อ่าน `CHANGELOG.md` ของ App-Core ตัวใหม่ โดยเฉพาะหัวข้อ "ต้องทำตาม"
4. ก๊อปเฉพาะไฟล์แกนที่ต้องการทับ แล้วรัน `npm run check && npm run lint && npm test`
5. แก้เลขใน `.app-core-base.json` เป็นเวอร์ชันใหม่ แล้ว commit

ถ้า `kit:diff` ชี้ว่าไฟล์แกนต่างเพราะโปรเจกต์ไปแก้เอง ให้ตัดสินใจเป็นรายไฟล์ (เก็บของโปรเจกต์ / รับของ App-Core / ส่งการแก้กลับไปที่ App-Core)
