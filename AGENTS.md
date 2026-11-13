# กติกาสำหรับ AI ที่ช่วยเขียนโค้ด (vibe coding) และคนในทีม

อ่านก่อนแก้โค้ด — กติกาสั้น ๆ เพื่อให้โปรเจกต์อ่านง่ายและไม่พังเมื่อหลายคนช่วยกันแก้

## ก่อนเริ่ม: repo นี้คือ "โครงอ้างอิง" ไม่ใช่ระบบที่ต้องลอกทั้งชุด

ของใน repo นี้มี 4 ชนิด — ถ้าเริ่มโปรเจกต์ใหม่หรือเพิ่มฟีเจอร์ ให้แยกชนิดก่อนแล้วค่อยหยิบ:

| ชนิด | อยู่ที่ไหน | ทำอย่างไร |
|---|---|---|
| **แกน** (ทุกระบบต้องมี) | `backend/src/core/`, `backend/src/app.ts`, `frontend/src/{api/client.ts,components,hooks,lib}`, หน้า Login/Home/Forbidden/NotFound, หน้า `log` และ `connection` (ของระบบ), `database/`, `scripts/` | เก็บไว้ ไม่ต้องลอกซ้ำ ไม่แก้ถ้าไม่ได้รับอนุญาต |
| **ตัวอย่าง** (ไว้ลอกรูปแบบ) | `backend/src/examples/*`, `frontend/src/examples/*` (ตอนนี้: `vendor`) | **ไม่ลงทะเบียนในระบบ** — สร้างหน้าใหม่จากมันด้วย `npm run new:page <ชื่อ> -- --label <ชื่อไทย>` |
| **ตัวเชื่อมต่อ** (ติดต่อระบบข้างนอก: LLM, LINE, MOPH, Core Backend, ฐานข้อมูลภายนอก) | `backend/src/integrations/*`, `core/datasource.ts` | ใช้เฉพาะตัวที่โปรเจกต์ต้องใช้จริง — ดู `backend/src/integrations/README.md` |
| **ของโปรเจกต์** (ที่ทีมเขียนเอง) | `backend/src/pages/*`, `frontend/src/pages/*`, `frontend/src/api/*Api.ts`, `roles.ts` | แก้ได้เลย |

**ห้ามลอก `examples/` ทั้งโฟลเดอร์ ห้ามลอกหน้าที่โปรเจกต์ใหม่ไม่ได้ใช้ (เช่น vendor ถ้าระบบนี้ไม่มีคู่ค้า)** ลอกต้นแบบที่ใกล้เคียงแค่หน้าเดียว แล้วเปลี่ยนชื่อ/ฟิลด์ให้เป็นของระบบนั้นจริง ๆ
ก่อนเริ่มโปรเจกต์ใหม่ถามตัวเองว่า "ระบบนี้ต้องใช้อะไรจากชุดนี้บ้าง" แล้วหยิบเฉพาะนั้น ไม่ใช่ "เอามาให้หมดก่อนแล้วค่อยลบ"

1. **สร้างหน้าใหม่จากต้นแบบ อย่าเขียนจากศูนย์ และอย่าลอกทั้งชุด** — หน้า CRUD ใช้ `npm run new:page <ชื่อ> -- --label <ชื่อไทย>` (ก๊อปต้นแบบ vendor ใน `backend/src/examples/` แล้วเปลี่ยนชื่อ + ต่อรายการลงทะเบียนให้) หน้าอ่านอย่างเดียวดูแบบจาก `pages/log` (ดู docs/03)
2. **โซนเขียว แก้ได้เลย**: `backend/src/pages/*`, `frontend/src/pages/*`, `frontend/src/api/*Api.ts`, `config/routes.tsx`, `config/menu.ts`, `lib/messages.ts`
   รวมถึง `backend/src/roles.ts` + `frontend/src/config/roles.ts` (เพิ่ม role), `backend/src/integrations/index.ts` (เลือกตัวเชื่อมต่อ)
   **โซนแดง ห้ามแก้ถ้าไม่ได้รับอนุญาต**: `backend/src/core/*`, `frontend/src/api/client.ts`, `lib/session.tsx`, `hooks/*`, `components/*`
   `examples/*` คือต้นแบบ: แก้เมื่อปรับรูปแบบมาตรฐานของตัวกลางเท่านั้น (ต้องรัน `npm test` ซึ่งทดสอบต้นแบบด้วย)
   ถ้าต้องแก้โซนแดง ให้อธิบายเหตุผลก่อน และรัน `npm run check` + `npm test`
3. **หลังบ้านแยกชั้น Controller → Service → Repository** (ห้ามข้ามชั้น, Controller ไม่มี Business Logic, Repository ไม่มี Business Logic — Business Logic อยู่ที่ Service ที่เดียว) ดู docs/05
   **หลังบ้านแยกเป็นโฟลเดอร์ตามชั้น (Layer) ก่อน แล้วข้างในแยกตามชื่อหน้า**: `backend/src/{entity,dto,controller,service,repository}/<หน้า>/<หน้า>_<layer>.ts` (เช่น `service/log/log_service.ts`) + `pages/<หน้า>.ts` (ประกอบ Repository → Service → Controller แล้วลงทะเบียนหน้า) + `migration/<หน้า>_migration.ts` (ถ้ามีตาราง) — Entity = หน้าตาข้อมูล/ค่าคงที่ · DTO = ตรวจข้อมูลที่รับเข้าด้วย zod · Controller = รับ request/ส่ง response · Service = Business Logic · Repository = คำสั่งฐานข้อมูล (knex) อย่างเดียว
4. **ห้ามส่งข้อมูลหรือ id ผ่าน URL (path / query)** — API ทุกตัวเป็น `POST` อ่านจาก `req.body` ตรวจด้วย DTO (zod) และหน้าเว็บเรียกผ่าน `api.post`; หน้าแก้ไขรับ id ผ่าน state ของ router (`navigate(path, { state: { id } })`) ไม่ใช่ `:id` ใน route
5. **เขียนตรง ๆ อ่านตามได้** — ห้ามสร้าง abstraction ที่ซ่อนการทำงาน (ไม่ใช้ค้นไฟล์อัตโนมัติ, decorator, ตัวสร้างหน้าอัตโนมัติจากการประกาศฟิลด์) ลงทะเบียนหน้าด้วยมือใน `backend/src/pages/index.ts` และ `frontend/src/config/routes.tsx` (1 ฟีเจอร์ = 1 บรรทัด ชี้ไป `XxxPage` ที่ถือ route ย่อยเอง)
6. **ชื่อฟิลด์เป็น snake_case เดียวกันทุกชั้น** (ฟอร์ม = API = คอลัมน์ฐานข้อมูล) ไม่แปลงชื่อ · ชื่อฟีเจอร์เป็นเอกพจน์ (`vendor`) · ชื่อไฟล์หลังบ้านเป็น `<หน้า>_<layer>.ts` (`service/vendor/vendor_service.ts`) ส่วนไฟล์หน้าเว็บ (React) เป็น PascalCase (`VendorTable.tsx`)
7. **ฐานข้อมูลต้องสลับได้**: ใช้ knex query builder เท่านั้น ห้าม ENUM, SQL ดิบ, `NOW()` ฯลฯ นอก `core/db.ts` — วันที่-เวลาเก็บเป็น string ISO UTC (`nowIso()`)
8. **ข้อความที่ผู้ใช้เห็น** เป็นภาษาไทย ข้อความที่ใช้ซ้ำใส่ที่ `lib/messages.ts`
9. **modal ของหน้าไหนเก็บใน `modal/` ของหน้านั้น**; modal เลือกจากตารางใช้ `components/SelectModal.tsx`
10. **TypeScript strict**: ห้ามใช้ `any` ยกเว้นจำเป็นจริง ๆ (ใส่คอมเมนต์เหตุผล) — ก่อนส่งงานรัน `npm run check` และ `npm test` ให้ผ่าน
11. **อย่าส่งข้อมูลผู้ใช้/ประวัติจากหน้าจอ** — `created_by`, ชื่อผู้ทำรายการ ฯลฯ มาจาก session ฝั่งเซิร์ฟเวอร์ (`req.user`) และ audit log บันทึกให้อัตโนมัติ
12. ทุกไฟล์ใหม่ใส่คอมเมนต์หัวไฟล์ภาษาไทย บอกว่าไฟล์นี้ทำอะไร ใช้ยังไง
13. **ก่อนบันทึก/ลบ ต้องมี popup ถามยืนยันเสมอ** (`popup.confirm`) และฟอร์มต้องมี `onKeyDown={noEnterSubmit}` — กัน Enter ในช่องกรอกทำให้บันทึกทั้งที่ยังพิมพ์ไม่เสร็จ (ดู `VendorAdd.tsx`)
14. **ต้องใช้ได้บนมือถือ (360px)**: คอลัมน์ตารางที่ไม่สำคัญซ่อนด้วย `className: 'hidden md:table-cell'` แต่คอลัมน์ "จัดการ" ห้ามซ่อน; label ของช่องกรอกต้องผูกกับช่อง (ใช้ `TextField` / `FilterInput` ฯลฯ ที่ผูกให้แล้ว)
15. **ห้ามใช้อีโมจิ** ในหน้าเว็บ โค้ด คอมเมนต์ และเอกสาร — ใช้ไอคอนเส้น (lucide-react) หรือข้อความธรรมดา (เตือนด้วยคำว่า "สำคัญ:" / "ระวัง:"); หน้าตาต้องดูเป็นงานมืออาชีพ ไม่ตกแต่งเกินจำเป็น
16. **อัปเดต `CHANGELOG.md` ทุกครั้งที่ส่งมอบรอบใหม่** (ใส่เวอร์ชัน วันที่ สิ่งที่เพิ่ม/แก้/เปลี่ยน และสิ่งที่ผู้ใช้ต้องทำตาม)
17. **ตัวเชื่อมต่อ (integrations) ต้องมีรูปแบบเดียวกัน**: 1 ตัว = 1 โฟลเดอร์ใน `backend/src/integrations/<ชื่อ>/` ตามแบบ `llm/` — มีโหมด `real | fake | off` (`<NAME>_MODE`), ตัวตรวจสถานะ `status()` ที่ไม่ส่งข้อความหาคนจริง, ค่าลับอยู่ใน `.env` เท่านั้น, ข้อความ error เป็นภาษาไทย แกน (`core/`) ห้าม import ตัวเชื่อมต่อ (ทิศทาง: หน้า → ตัวเชื่อมต่อ → แกน)
18. **ฐานข้อมูลของคนอื่น (เช่น HOSxP) ใช้ `readonlyDb('<ชื่อ>')` เท่านั้น** (`core/datasource.ts`) — อ่านอย่างเดียว ไม่มี migration ห้ามสร้าง/แก้ตารางในนั้น ห้ามใช้ `db` หลักไปต่อฐานข้อมูลนั้น
19. **role เพิ่มที่ `backend/src/roles.ts` และ `frontend/src/config/roles.ts`** (ต้องตรงกัน และต้องมี `ADMIN`) ไม่ต้องแตะ `core/`
