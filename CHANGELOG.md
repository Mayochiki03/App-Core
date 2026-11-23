# บันทึกการเปลี่ยนแปลง (Changelog)

รูปแบบ: ใหม่สุดอยู่บนสุด · เวอร์ชันแบบ MAJOR.MINOR.PATCH (เพิ่มความสามารถ = MINOR, แก้บั๊ก = PATCH, เปลี่ยนจนโค้ดเดิมต้องแก้ตาม = MAJOR)
ทุกครั้งที่ส่งมอบรอบใหม่ให้เพิ่มหัวข้อที่นี่ พร้อมสิ่งที่ผู้ใช้ต้องทำตาม (เช่น migrate, แก้ .env)

## [1.5.4] 2026-11-23
### อัปเดต (npm audit เหลือ 0 ช่องโหว่ — เดิม 4: body-parser, qs, vite, zod)
- `zod` 3.25 -> **4.6.7** (ช่องโหว่ระดับ high); โค้ดที่ต้องแก้มีจุดเดียว: ต้นแบบ `examples/dto/vendor/vendor_dto.ts` ใช้ `{ message: '...' }` แทน `{ errorMap: ... }` ของ `z.enum` — `core/http.ts` (`fromZod`, `parse`) ใช้ได้เหมือนเดิม ข้อความ error เหมือนเดิม
- `body-parser`, `qs`, `vite` อัปเดตใน `package-lock.json` (เวอร์ชันย่อย ไม่เปลี่ยนวิธีใช้)
### เพิ่ม
- เทสต์ `new:page` (ชื่อผิด/ซ้ำ/ไม่พบเครื่องหมายลงทะเบียน/สร้างหน้าสำเร็จ) และ `setup` (สุ่มกุญแจ ไม่ทับ .env เดิม) — `scripts/new-page.mjs` และ `scripts/setup.mjs` รับ `APP_CORE_ROOT` ใช้ในเทสต์เท่านั้น
### ต้องทำตาม
- [ ] `npm install` (ได้ zod 4 และไลบรารีที่อัปเดต) แล้วรัน `npm run check && npm run lint && npm test`
- [ ] โปรเจกต์ที่ก๊อปจาก App-Core ไปแล้วและมี `z.enum(..., { errorMap })` ในโค้ดตัวเอง: เปลี่ยนเป็น `{ message: '...' }` (ถ้าอัปเดต zod เป็น 4 ตาม)

## [1.5.3] 2026-11-23
### แก้
- `core/auth.ts`: ข้อความ "รหัสผ่านเดิมไม่ถูกต้อง" เก็บในตัวแปร `currentMismatchMsg` แทนการเขียนตรงในฟิลด์ `current_password` — SonarQube S2068 เข้าใจผิดว่าเป็นรหัสผ่านที่ฝังในโค้ด (พฤติกรรมเหมือนเดิม)
### ต้องทำตาม
- [ ] ไม่ต้อง migrate · ไม่ต้องแก้ `.env`

## [1.5.2] 2026-11-23
เป้าหมาย: ให้ SonarQube quality gate ใน Deploy Console ผ่าน (รอบ #111: coverage โค้ดใหม่ 0% และ issue ใหม่ 3 ข้อ)
### เพิ่ม
- `npm run test:coverage` (backend) — รันเทสต์พร้อมวัด coverage แล้วเขียน `backend/lcov.info` ให้ Console ส่งต่อ SonarQube (ไม่มีสคริปต์นี้ = coverage เป็น 0%)
- เทสต์ใหม่ `backend/test/scripts.test.ts` ครอบคลุม `new:project` และ `kit:diff`
### แก้
- `scripts/kit-diff.mjs`: `sort()` ใช้ `localeCompare` · `CoreGatewayClient.ts`: `Number.NaN` แทน `NaN`
- `scripts/new-project.mjs`: **ไม่เรียก `git` เองแล้ว** (Sonar S4036 เรื่อง PATH) — พิมพ์คำสั่ง `git init && git add -A && git commit ...` ให้คัดลอกไปรันเอง
- `sonar-project.properties`: ชี้ไฟล์ coverage เป็น `backend/lcov.info`
### ต้องทำตาม
- [ ] ไม่ต้อง migrate · ไม่ต้องแก้ `.env`
- [ ] ใช้ `npm run new:project` แล้วต้องรันคำสั่ง git ที่สคริปต์พิมพ์ให้เอง

## [1.5.1] 2026-11-23
### แก้ (ข้อที่ SonarQube รายงานจากรอบ Quality check ก่อนหน้า)
- `core/datasource.ts`: `sort()` ใช้ `localeCompare` · `LlmClient.ts`: ตัด `/` ท้าย URL ด้วยลูปแทน regex (เลี่ยง backtracking) · `Layout.tsx`: พื้นหลังปิดเมนูมือถือเป็น `<button>` จริง (เข้าถึงด้วยคีย์บอร์ดได้)
- ไม่แก้: `auth.ts` "hard-coded password" เป็นผลบวกลวง (ชื่อฟิลด์ `current_password`/`password_hash` ไม่ใช่รหัสผ่านจริง) — ให้กด "False positive" ใน SonarQube
### ต้องทำตาม
- [ ] ไม่ต้อง migrate · ไม่ต้องแก้ `.env`
- [ ] Console: ตั้ง DB_NAME ของ App-Core เป็นฐานข้อมูลเทสต์ว่างที่ใช้เฉพาะโปรเจกต์นี้ (เช่น `app_core_remote_test`) ไม่เช่นนั้นขั้น `npm test` ล้มด้วย "ประวัติ migration ไม่ตรง"

## [1.5.0] 2026-11-20
เป้าหมาย: ให้ App-Core พร้อมทำงานร่วมกับ Backend Core และ Deploy Console (CI/CD) ตั้งแต่ก่อนเริ่มโปรเจกต์จริง (เช่น บสต.น้อย) — รวมเป็นเวอร์ชันเดียว ไม่เปลี่ยนโครงโฟลเดอร์เดิม
### เพิ่ม
- **ตัวเชื่อมต่อ Backend Core** `backend/src/integrations/core_gateway/` (`CORE_URL`, `CORE_CLIENT_ID`, `CORE_CLIENT_SECRET`, `CORE_MODE`, `CORE_TIMEOUT_SEC`): ขอ/ต่ออายุ token เอง, retry เฉพาะ 429/503/5xx/timeout (ไม่ retry 400/401/403 และโควตารายวันหมด), `status()` ขอ token อย่างเดียวไม่นับโควตาค้นหา, โหมดจำลอง; ลงทะเบียนในหน้าสถานะการเชื่อมต่อแล้ว (ไม่ตั้ง `CORE_URL` = ปิด)
- **`core/crypto.ts`**: `encryptText`/`decryptText` (AES-256-GCM) และ `blindIndex` (HMAC-SHA256 ไว้ค้นโดยไม่เก็บค่าจริง) ด้วยกุญแจ `DATA_ENC_KEY` และ `HASH_KEY` แยกกัน; production ไม่ตั้ง/สั้นกว่า 32 ตัว = error ภาษาไทย; `npm run setup` สุ่มให้
- **audit log ปิดบังข้อมูลส่วนบุคคลได้**: `definePage({ audit: { redact: ['hn', ...], logSearch: true } })` — redact ทุกระดับของ body ไม่สนตัวพิมพ์ และ `logSearch` จดว่าใครค้น/เปิดดู โดยไม่เก็บค่าที่ค้น
- **`npm run lint`** (ESLint flat config + กันการใช้ `Math.random()`), `sonar-project.properties`, `.gitattributes` (LF) — ชุดเดียวกับที่ Deploy Console ตรวจ
- **`GET /api/health`** บอกเวอร์ชัน (`config.version` อ่านจาก package.json) — ข้อยกเว้นเดียวของกฎ POST-only
- **`npm run new:project <ชื่อ>`**: ก๊อปชุดไปโปรเจกต์ใหม่ + git init + commit แรก + `.app-core-base.json` · **`npm run kit:diff -- <โฟลเดอร์ App-Core ใหม่>`**: เทียบไฟล์แกน (อ่านอย่างเดียว)
- เอกสารใหม่: `docs/07-ต่อกับ-backend-core.md`, `docs/08-เตรียมพร้อมส่งเข้า-cicd.md`, `docs/09-เริ่มโปรเจกต์ใหม่และอัปเดตจาก-app-core.md`
- เทสต์ใหม่ 12 ข้อ (crypto, ตัวเชื่อม Core ด้วยเซิร์ฟเวอร์จำลอง, audit redact, health)
### เปลี่ยน
- **`AGENTS.md` แบ่งสองระดับ**: "ห้ามเด็ดขาด" (ความปลอดภัยข้อมูลผู้ป่วย, ไม่ส่งข้อมูลทาง URL, ไม่ log HN/ชื่อ, ไม่เรียก Backend Core จากเบราว์เซอร์, ห้ามต่อฐานข้อมูลโรงพยาบาลตรงโดยไม่ผ่านตัวกลาง, ชั้น/โซนแดง, ค่าลับใน .env) กับ "ค่าตั้งต้นที่ปรับได้ถ้ามีเหตุผล" (การตั้งชื่อ หน้าตา โครงหน้า) + หัวข้อกฎโค้ดที่ SonarQube จับบ่อย (regex backtrack, `Math.random()`, promise ไม่ await)
### ไม่ได้ใส่ในรอบนี้
- ชุด e2e (Playwright) — ต้องรู้ค่าตั้ง e2e ของ Deploy Console และดาวน์โหลดเบราว์เซอร์ ทำเมื่อมีโปรเจกต์จริงที่ต้องใช้
### ต้องทำตาม
- [ ] `npm install` (เพิ่ม eslint และปลั๊กอินที่ใช้ตอน lint) แล้วรัน `npm run check && npm run lint && npm test`
- [ ] โปรเจกต์ที่ก๊อปไปแล้ว: ใส่ `DATA_ENC_KEY` / `HASH_KEY` ใน `.env` เฉพาะเมื่อใช้ `core/crypto` · ตั้ง `CORE_*` เฉพาะเมื่อใช้ Backend Core · ไม่ต้อง migrate
- [ ] ใน Deploy Console ตั้งฐานข้อมูลเทสต์ของโปรเจกต์แยกกัน (ดู docs/08)

## [1.4.1] 2026-11-18
### แก้
- `pingDatasource`: ถ้า MariaDB ตอบกลับด้วยวิธียืนยันตัวตนที่ไดรเวอร์ไม่รู้จัก (`auth_gssapi_client` — เกิดตอนรหัสผ่านผิดบนบางเซิร์ฟเวอร์) ระบบแสดงข้อความภาษาไทยว่า "ฐานข้อมูลปฏิเสธ user ..." เหมือนกรณีรหัสผ่านผิดปกติ แทนข้อความภาษาอังกฤษของไดรเวอร์ — ทำให้ชุดทดสอบ `pingDatasource` ผ่านบน MariaDB ของทีมด้วย
### ต้องทำตาม
- ไม่ต้อง migrate · ไม่ต้องแก้ `.env`

## [1.4.0] 2026-11-13
เป้าหมาย: จัดโครงหลังบ้านแบบ Spring Boot ดั้งเดิม — **แยกโฟลเดอร์ตามชั้น (Layer) ก่อน แล้วข้างในแยกตามชื่อหน้า** อ่านง่ายและเหมือนกันทุกหน้า — **พฤติกรรมของระบบเหมือนเดิมทุกอย่าง** (URL, ข้อมูล, ฐานข้อมูล, หน้าเว็บ ไม่เปลี่ยน) เปลี่ยนเฉพาะตำแหน่งและชื่อไฟล์หลังบ้าน
### เปลี่ยน
- **โครงโฟลเดอร์หลังบ้าน** (`log`, `connection` และต้นแบบ `vendor`):
  ```
  backend/src/
    entity/<หน้า>/<หน้า>_entity.ts          Entity: หน้าตาข้อมูล / ค่าคงที่
    dto/<หน้า>/<หน้า>_dto.ts                DTO: ตรวจข้อมูลที่รับเข้า (zod)
    controller/<หน้า>/<หน้า>_controller.ts  Controller: รับ request / ส่ง response (ไม่มี Business Logic)
    service/<หน้า>/<หน้า>_service.ts        Service: Business Logic ทั้งหมด
    repository/<หน้า>/<หน้า>_repository.ts  Repository: คำสั่งฐานข้อมูลอย่างเดียว
    migration/<หน้า>_migration.ts           Migration (ถ้ามีตาราง)
    pages/<หน้า>.ts                         ประกอบ Repository -> Service -> Controller + ลงทะเบียนหน้า
    pages/index.ts                          รายชื่อหน้าทั้งหมด (เขียนมือ)
  ```
  ต้นแบบ `examples/` ใช้โครงเดียวกัน (`backend/src/examples/<layer>/vendor/...`) · ลำดับเรียก Controller -> Service -> Repository ห้ามข้ามชั้น เหมือนเดิม · ชื่อ class ในไฟล์ยังเป็น PascalCase · หน้าที่ไม่ใช้บางชั้น (`connection`) ไม่สร้างไฟล์ของชั้นนั้น
- `npm run new:page` ก๊อปโครงใหม่ให้ (ลงโฟลเดอร์ของแต่ละชั้น เปลี่ยนชื่อ และปรับเลข `../` ของ import ให้)
- ใช้คำว่า "Business Logic" แทน "กติกาธุรกิจ" ในโค้ด คอมเมนต์ และเอกสาร
- `AGENTS.md` ข้อ 3 และข้อ 6, `README.md`, `docs/02`, `03`, `05` ปรับตามโครงใหม่
### ต้องทำตาม
- ไม่ต้อง migrate · ไม่ต้องแก้ `.env` · หน้าเว็บ (frontend) ไม่เปลี่ยน
- โปรเจกต์ที่แตกไปจากเวอร์ชันก่อนหน้า ไม่ได้รับผลกระทบ (เป็นการลอกครั้งเดียว) · ถ้าต้องการโครงใหม่ ให้ย้ายไฟล์ตามผังข้างบนและแก้ import

## [1.3.0] 2026-11-03
เป้าหมาย: ให้ตัวกลาง "บอกตัวเองว่ามันคืออะไร" — คนและ AI ที่เริ่มโปรเจกต์ใหม่จะหยิบเฉพาะที่ต้องใช้ ไม่ลอกทั้งชุด · และรองรับระบบที่ต้องต่อของข้างนอก
### เปลี่ยน
- **ย้ายหน้าตัวอย่าง `vendor` ออกจากระบบจริง** ไปไว้ที่ `backend/src/examples/vendor` และ `frontend/src/examples/vendor` (รวม `vendorApi.ts`) — ไม่ลงทะเบียนใน `pages/index.ts`, `routes.tsx`, `menu.ts` จึงไม่มีตาราง/เมนู/API คู่ค้าในโปรเจกต์ใหม่ · ยังถูกตรวจ TypeScript และทดสอบทุกครั้ง (เทสต์เพิ่มเข้าระบบชั่วคราวผ่าน `core/registry.ts`)
- **`AGENTS.md`**: เพิ่มหัวข้อ "repo นี้คือโครงอ้างอิง ไม่ใช่ระบบที่ต้องลอกทั้งชุด" แยกของเป็น 4 ชนิด (แกน / ตัวอย่าง / ตัวเชื่อมต่อ / ของโปรเจกต์) และห้ามลอก `examples/` ทั้งโฟลเดอร์ · ข้อ 1 ชี้ไปที่ `npm run new:page` · เพิ่มข้อ 17-19 (ตัวเชื่อมต่อ, ฐานข้อมูลของคนอื่น, role)
- หน้า `log` ถูกจัดเป็น "หน้าของระบบ" (เก็บไว้ทุกโปรเจกต์) ไม่ใช่แค่ตัวอย่าง
- `README.md` และ `docs/02`, `03`, `05` ปรับตามโครงสร้างใหม่
### เพิ่ม
- **`npm run new:page <ชื่อ> -- --label <ชื่อไทย>`** (`scripts/new-page.mjs`): ก๊อปต้นแบบ 1 หน้าทั้งหลังบ้านและหน้าเว็บ เปลี่ยนชื่อ (ไฟล์ ตัวแปร ข้อความไทย ชื่อ migration ใหม่) แล้วต่อรายการลงทะเบียนให้ 3 ไฟล์ที่บรรทัด `@new-page` — ได้ไฟล์ธรรมดาที่อ่านและแก้ได้ ไม่มีโค้ดอัตโนมัติซ่อนในระบบ · ไม่เขียนทับของเดิม และไม่เหลือไฟล์ครึ่งๆ กลางๆ ถ้าพลาด
- **ตัวเชื่อมต่อ** `backend/src/integrations/`: รูปแบบกลาง (`Integration`, โหมด `real | fake | off` ผ่าน `<NAME>_MODE`, `status()` ที่ไม่ส่งข้อความหาคนจริง) + ตัวเชื่อมต่อ **LLM แบบ OpenAI-compatible** (Ollama / LM Studio / vLLM; timeout ปรับได้; error ภาษาไทย) · กติกาที่ `integrations/README.md` · `production` ใช้โหมด fake ไม่ได้
- **หน้า "สถานะการเชื่อมต่อ"** (ระบบ > สถานะการเชื่อมต่อ, เฉพาะ ADMIN): ตรวจตัวเชื่อมต่อและแหล่งข้อมูลภายนอกทุกตัวพร้อมกัน ตัวที่ค้างไม่ทำให้ทั้งหน้าค้าง
- **`readonlyDb('<ชื่อ>')`** (`core/datasource.ts`): แหล่งข้อมูลเพิ่มเติมแบบอ่านอย่างเดียวสำหรับฐานข้อมูลของระบบอื่น (เช่น HOSxP) ประกาศใน `.env` ด้วย `<ชื่อ>_DB_*` · เซสชัน READ ONLY ที่ฝั่งฐานข้อมูล (เขียนไม่ได้แม้ user มีสิทธิ์เขียน — มีเทสต์พิสูจน์) · ไม่มี migration · pool เล็ก + จำกัดเวลา query
- **role กำหนดเองโดยไม่แตะแกน**: `backend/src/roles.ts` และ `frontend/src/config/roles.ts` (ต้องมี `ADMIN` — TypeScript ตรวจให้)
- `core/registry.ts` (รายชื่อหน้าที่ใช้งานจริง ให้ `app.ts`/`migrate.ts` อ่านที่เดียว) · `docs/06-ตัวเชื่อมต่อและฐานข้อมูลภายนอก.md` · ตัวแปรตัวอย่างใน `.env.example`
### ต้องทำตาม
- ไม่ต้อง migrate · ไม่ต้องแก้ `.env` (ตัวแปรใหม่เป็นทางเลือกทั้งหมด)
- **โปรเจกต์ที่แตกจากเวอร์ชันก่อนหน้าไม่ได้รับผลกระทบ** (เป็นการลอกครั้งเดียว) · ถ้าจะอัปเดต: ไฟล์แกนใหม่คือ `core/registry.ts`, `core/datasource.ts`, `roles.ts`
- เทสต์เพิ่มเป็น 25 ชุด (ตัวเชื่อมต่อ LLM กับเซิร์ฟเวอร์จำลอง, READ ONLY กับฐานข้อมูลจริง, หน้าสถานะ)

## [1.2.0] 2026-10-14
### เพิ่ม
- ธีมสีใหม่ 4 ชุด: `care` (เขียวน้ำเงิน), `indigo` (น้ำเงินคราม), `amber` (ส้มอำพัน), `graphite` (เทาถ่าน) รวมกับเดิม `herb`, `ocean`, `rose`, `slate` เป็น 8 ธีม — เลือกด้วย `APP_THEME` ใน `.env`
- ตัวแปรสี `--hero-from` / `--hero-to` ในทุกธีม (ใช้ทำแถบหัวแบบไล่สีด้วย `bg-gradient-to-r from-hero-from to-hero-to`)
- `CHANGELOG.md` และกติกาข้อ 15-16 ใน `AGENTS.md`
### เปลี่ยน
- เอาอีโมจิออกจากโค้ด คอมเมนต์ และเอกสารทั้งหมด (ใช้ "สำคัญ:" / "ระวัง:" และไอคอนเส้นแทน); ปุ่มล้างค่าในช่อง PickerInput เปลี่ยนเป็นไอคอน lucide
### ต้องทำตาม
- ไม่ต้อง migrate · อยากใช้ธีมใหม่แค่แก้ `APP_THEME` ใน `.env`

## [1.1.0] 2026-10-13 (รวบรวมย้อนหลังจากรอบที่ส่งมอบก่อนหน้า)
### เพิ่ม
- ก่อนเพิ่ม/แก้ไข/ลบ ต้องมี popup ถามยืนยัน (ปุ่มโฟกัสที่ "ยกเลิก" ไว้ก่อน) และฟอร์มกัน Enter ส่งฟอร์มโดยไม่ตั้งใจ
- โฟลเดอร์ `database/` (`init.sql`, `docker-compose.yml`, README) และ `.gitignore` ที่กันไม่ให้ข้อมูล/แบ็กอัปฐานข้อมูลขึ้น GitHub
### เปลี่ยน
- ใช้ MariaDB เป็นหลัก (ถอด SQLite ออก เพื่อกันการรันโดยไม่ตั้งฐานข้อมูลจริง)
- ตารางบนมือถือ (360px): ซ่อนคอลัมน์ที่ไม่สำคัญ คงปุ่มจัดการไว้ครบ; label ของช่องกรองผูกกับช่องด้วย `htmlFor`
### ต้องทำตาม
- ต้องสร้างฐานข้อมูลก่อนรัน: ทำตาม `database/README.md`

## [1.0.0] 2026-10-12 (รวบรวมย้อนหลัง)
- ชุดตัวกลางชุดแรก: backend (Express + knex, โครงชั้น Entity/Dto/Repository/Service/Controller/Migration), frontend (React + Vite + Tailwind v4), ล็อกอิน JWT ใน httpOnly cookie, audit log, หน้าตัวอย่าง CRUD + หน้า log, ธีมสี 4 ชุด, เอกสารภาษาไทยใน `docs/`

> หมายเหตุ: บันทึกของ 1.0.0 และ 1.1.0 เรียบเรียงย้อนหลังเพื่อให้ประวัติครบ จึงสรุปเฉพาะหัวข้อหลัก
