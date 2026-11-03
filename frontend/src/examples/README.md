# examples — หน้าตัวอย่างฝั่งหน้าเว็บ (ไม่ได้ลงทะเบียนใน routes/menu)

คู่กับ `backend/src/examples/` — ต้นแบบที่ไว้ลอก ไม่ได้รันในระบบ แต่ถูกตรวจ TypeScript ทุกครั้ง (`npm run check`)

| ตัวอย่าง | ใช้เป็นต้นแบบของ |
|---|---|
| `vendor/` | หน้า CRUD (VendorTable / Add / Edit / Form / modal + `vendorApi.ts`) |

สร้างหน้าใหม่: `npm run new:page <ชื่อ> -- --label <ชื่อไทย>` (สร้างทั้งฝั่งหลังบ้านและหน้าเว็บ พร้อมต่อ routes + เมนูให้)
