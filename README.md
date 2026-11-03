# app-core-kit — ตัวกลางสำหรับเว็บภายในองค์กร

ชุดเริ่มต้นสำหรับสร้างระบบเว็บภายใน (ตาราง/ฟอร์ม, รายงาน/log, งานตั้งเวลา, หน้าที่มี logic เฉพาะ ฯลฯ) ใช้ได้กับงานหลายแบบ
**ไม่ผูกกับระบบจอง** — "หน้า" แต่ละหน้าเป็นหน่วยอิสระ ก๊อปหน้าที่ใกล้เคียงแล้วแก้ ก็ได้หน้าใหม่

- **TypeScript** ทั้งหน้าเว็บและหลังบ้าน (editor ขีดแดงเมื่อพิมพ์ผิด)
- **React + Tailwind** ธีมสีเปลี่ยนที่ไฟล์เดียว (`frontend/src/theme.css`)
- **Express + knex** ใช้ **MariaDB** เป็นหลัก (สลับเป็น MySQL / PostgreSQL ได้) — **ไม่มี SQLite ต้องมีฐานข้อมูลจริงเสมอ** เตรียมได้ในโฟลเดอร์ `database/`
- login + สิทธิ์ตาม role + **audit log อัตโนมัติ** (ใครทำอะไร ที่หน้าไหน เมื่อไร)

## เริ่มใช้

**1) เตรียมฐานข้อมูล MariaDB ก่อน (ครั้งเดียว)** — ดูวิธีทีละขั้นที่ [database/README.md](database/README.md)
(ถ้ามี Docker: `docker compose -f database/docker-compose.yml up -d` จบในคำสั่งเดียว)

**2) รันระบบ**

```powershell
npm install
npm run dev
```

เปิด http://localhost:5173 — เข้าสู่ระบบด้วย `admin` / `ChangeMe!123`
(ไม่ต้องสร้าง `.env` ถ้าใช้ค่าตั้งต้นของ `database/init.sql` — ระบบสร้างตารางและแอดมินคนแรกให้เอง ถ้าต่อฐานข้อมูลไม่ได้จะบอกสาเหตุเป็นภาษาไทย)

อยากเปลี่ยนชื่อระบบ/ธีม/ฐานข้อมูล: `npm run setup` แล้วแก้ไฟล์ `.env`

## โครงสร้าง (อ่านสั้น ๆ)

ของใน repo มี 4 ชนิด — **ลอกเฉพาะที่ต้องใช้ ไม่ลอกทั้งชุด** (กติกาเต็มอยู่ที่ [AGENTS.md](AGENTS.md))

| ชนิด | คืออะไร |
|---|---|
| แกน | `core/`, component กลาง, login, audit, หน้า `log` และ `connection` — ทุกระบบมี ไม่ต้องแก้ |
| ตัวอย่าง | `examples/vendor` — ไว้ลอกเป็นหน้าใหม่ **ไม่ได้ลงทะเบียนในระบบ** (โปรเจกต์ใหม่จึงไม่มีตาราง/เมนูคู่ค้า) |
| ตัวเชื่อมต่อ | `integrations/` (เช่น LLM) และ `readonlyDb` (ฐานข้อมูลของระบบอื่น เช่น HOSxP) — เลือกใช้เฉพาะที่โปรเจกต์ต้องใช้ |
| ของโปรเจกต์ | `pages/`, `api/*Api.ts`, `roles.ts` — ที่ทีมเขียนเอง |

```
backend/src/
  core/                      แกน: config, db, datasource (อ่านอย่างเดียว), auth, audit, http, migrate (ปกติไม่ต้องแก้)
  roles.ts                   รายชื่อ role ของระบบ (เพิ่ม role ที่นี่ ไม่ต้องแตะ core/)
  pages/                     ← ที่ทีมทำงาน: 1 โฟลเดอร์ = 1 หน้า แยกเป็นชั้นแบบ Spring Boot
    log/  connection/        หน้าของระบบ (บันทึกการใช้งาน, สถานะการเชื่อมต่อ)
    index.ts                 รายชื่อหน้าทั้งหมด (เขียนมือ)
  integrations/              ตัวเชื่อมต่อกับระบบข้างนอก (llm/ ...) — กติกาใน integrations/README.md
  examples/vendor/           ต้นแบบ CRUD แยกเป็นชั้น (ไม่ได้ลงทะเบียนในระบบ ยังถูกตรวจและทดสอบทุกครั้ง)
      Vendor.ts              Entity (หน้าตาข้อมูล)
      VendorDto.ts           ข้อมูลที่รับเข้า + กติกาตรวจ
      VendorController.ts    รับ request / ส่ง response
      VendorService.ts       กติกาธุรกิจ
      VendorRepository.ts    คุยกับฐานข้อมูล
      VendorMigration.ts     สร้างตาราง
      index.ts               ประกอบชั้นเข้าด้วยกัน + ลงทะเบียนหน้า
frontend/src/
  api/                       ไฟล์เรียก API: client.ts (กลาง) + <ชื่อ>Api.ts ของแต่ละหน้า
  components/                ชุด component กลาง: Button, PageCard, Fields, DataTable, Pagination, Popup, SelectModal
    layout/                  Layout, Header, Sidebar (ออกจากระบบอยู่มุมซ้ายล่าง), Footer
  hooks/                     useTableData (โหลด+แบ่งหน้า+กรอง)
  config/                    routes.tsx (1 ฟีเจอร์ = 1 บรรทัด), menu.ts (เมนูซ้าย), roles.ts — เขียนมือ
  pages/                     ← ที่ทีมทำงาน: log/ connection/ + หน้าของระบบที่สร้างขึ้น
  examples/vendor/           ต้นแบบหน้า CRUD: VendorPage / Table / Add / Edit / Form / modal/ + vendorApi.ts
```

สร้างหน้าใหม่: `npm run new:page product -- --label สินค้า` (ก๊อปต้นแบบ + เปลี่ยนชื่อ + ต่อรายการลงทะเบียนให้ แล้วแก้ฟิลด์ — ดู [docs/03](docs/03-ทำหน้าใหม่.md))

**กติกาความปลอดภัย:** ไม่ส่ง id หรือข้อมูลใด ๆ ทาง URL (path / query) — ทุก API เป็น POST ส่งข้อมูลใน body และหน้าแก้ไขรับ id ผ่าน state ของ router

## คู่มือ (อ่านตามลำดับ)

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/01-เริ่มต้นใช้งาน.md](docs/01-เริ่มต้นใช้งาน.md) | รัน, สลับฐานข้อมูล, ขึ้นใช้งานจริง, แก้ปัญหาที่เจอบ่อย |
| [docs/02-อ่านโค้ดทีละขั้น.md](docs/02-อ่านโค้ดทีละขั้น.md) | กด "บันทึก" 1 ครั้ง โค้ดวิ่งผ่านไฟล์ไหนบ้าง |
| [docs/03-ทำหน้าใหม่.md](docs/03-ทำหน้าใหม่.md) | ก๊อปหน้าตัวอย่างเป็นหน้าใหม่ทีละขั้น |
| [docs/04-typescript-ที่ต้องรู้.md](docs/04-typescript-ที่ต้องรู้.md) | TS ที่ต้องรู้ในโปรเจกต์นี้ (5 เรื่อง) |
| [docs/05-เทียบกับ-spring-boot.md](docs/05-เทียบกับ-spring-boot.md) | สำหรับคนมาจาก Spring Boot: อะไรตรงกับอะไร |
| [docs/06-ตัวเชื่อมต่อและฐานข้อมูลภายนอก.md](docs/06-ตัวเชื่อมต่อและฐานข้อมูลภายนอก.md) | ต่อ LLM / LINE / ฐานข้อมูลของระบบอื่น (HOSxP) แบบอ่านอย่างเดียว |

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันหลังบ้าน + หน้าเว็บ (รีโหลดเอง) |
| `npm run check` | ตรวจ TypeScript ทั้งสองฝั่ง (ควรรันก่อน commit) |
| `npm test` | ทดสอบ API (ใช้ฐานข้อมูล `app_core_test` ที่ `init.sql` สร้างไว้ — ไม่แตะข้อมูลจริง) |
| `npm run build` / `npm start` | build หน้าเว็บ / รันแบบ production (หลังบ้านเสิร์ฟหน้าเว็บให้) |
| `npm run new:page <ชื่อ> -- --label <ชื่อไทย>` | สร้างหน้าใหม่จากต้นแบบ (ทั้งหลังบ้านและหน้าเว็บ + ต่อรายการลงทะเบียน) |
| `npm run migrate` / `migrate:status` | สร้าง/ดูสถานะตาราง |
| `npm run db:reset -- --yes` | ลบข้อมูลทั้งหมดแล้วสร้างตารางใหม่ (ต้องใส่ `--yes` เอง) |

## สิ่งที่ยังไม่ได้ทำ / ข้อควรรู้ (พูดตรง ๆ)

- ต้นแบบมี 1 แบบ: **CRUD (`examples/vendor`)** และหน้าของระบบที่ใช้เป็นแบบอ่านอย่างเดียวได้ (`pages/log`) — ตัวอย่าง Scheduler, หน้า Logic เฉพาะ, Dashboard อยู่ในขั้นถัดไป
- ตัวเชื่อมต่อที่มีให้ตอนนี้: LLM (OpenAI-compatible) ตัวเดียว · LINE / MOPH Notify / Core Backend ยังไม่อยู่ในตัวกลาง (เพิ่มตามรูปแบบเดียวกับ `llm/` เมื่อมีระบบที่ใช้จริง)
- ทดสอบ READ ONLY ของ `readonlyDb` กับ MariaDB แล้ว (PostgreSQL ยังไม่ได้ทดสอบ)
- ทดสอบแล้วกับ MariaDB 10.11 และ PostgreSQL 16 (เทสต์ 13 ข้อผ่าน) — **MySQL 8 และ `docker-compose.yml` ยังไม่ได้ทดสอบจริง** (เครื่องที่ผมใช้ทดสอบไม่มี Docker)
- โฟลเดอร์ `database/` ขึ้น GitHub เฉพาะ `init.sql`, `docker-compose.yml`, `README.md` — ไฟล์สำรองและข้อมูลถูก `.gitignore` กันไว้
- ยังไม่มีหน้าจัดการผู้ใช้ (เพิ่มผู้ใช้ตอนนี้ทำผ่านฐานข้อมูล/seed) และยังไม่มีหน้าเปลี่ยนรหัสผ่าน (มี API แล้ว: `POST /api/auth/change-password`)
- `/api/auth/login` ยังรับค่าใน body ตามปกติ แต่ปุ่ม refresh หน้าแก้ไขอาศัย state ของ router ในแท็บเดิม — เปิดลิงก์ `/vendor/edit` ตรง ๆ ในแท็บใหม่จะกลับหน้ารายการ (ตั้งใจ เพราะไม่มี id ใน URL)
- ข้อความบนหน้าจอเป็นภาษาไทยภาษาเดียว รวมไว้ที่ `frontend/src/lib/messages.ts` เผื่อแปลภายหลัง
