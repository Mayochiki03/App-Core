# 07 — ต่อกับ Backend Core (ตัวกลางข้อมูลโรงพยาบาล)

ข้อมูลของโรงพยาบาล (ผู้ป่วย ฯลฯ) อยู่ที่ Backend Core — โปรเจกต์ที่ก๊อปจาก App-Core **ไม่ต่อฐานข้อมูลโรงพยาบาลเอง** แต่ขอผ่าน API ของตัวกลาง
ตัวเชื่อมต่ออยู่แล้วที่ `backend/src/integrations/core_gateway/` (ไม่ตั้ง `CORE_URL` = ปิด ไม่กระทบอะไร)

## สิ่งที่ผู้ดูแล Backend Core ต้องทำให้ก่อน (ครั้งเดียวต่อโปรเจกต์)

1. สร้าง API key (client_id + client_secret) ของโปรเจกต์นี้
2. อนุญาต IP ของเครื่องที่รันโปรเจกต์
3. เปิด dataset ที่โปรเจกต์ใช้ และคอลัมน์ที่ต้องการ — คอลัมน์ที่ถูกปิดบัง (masked) จะคืนเป็นรหัสแฮชแทนค่าจริง ถ้าต้องใช้ชื่อ/วันเกิดจริงต้องขอให้ผู้ดูแลเปิด (unmask) ให้คีย์นั้น
4. ค้นด้วย HN ได้เฉพาะ dataset ที่ตั้งคอลัมน์ lookup ไว้ และนับโควตารายวัน (ค่าตั้งต้น 200 ครั้ง/วัน) — เกินจะได้ 429 `lookup_quota_exceeded`

## ตั้งค่าใน `.env`

```
CORE_URL=https://core.hospital.local
CORE_CLIENT_ID=<ใส่ client_id>
CORE_CLIENT_SECRET=<ใส่ client_secret>
```

ตรวจที่เมนู ระบบ > สถานะการเชื่อมต่อ (เฉพาะ ADMIN) — ตัวตรวจขอ token อย่างเดียว ไม่นับโควตาค้นหา

## ใช้ใน Service

```ts
import { core } from '../../integrations/core_gateway';

const r = await core.query({ dataset: 'patients', where: { hn }, pageSize: 1 });
const patient = r.resultList[0];
```

ที่ตัวเชื่อมต่อทำให้: ขอ/ต่ออายุ token เอง, ได้ 401 ลองซ้ำครั้งเดียว, retry เฉพาะ 429/503/5xx/timeout (ไม่ retry 400/401/403 และไม่ retry เมื่อโควตารายวันหมด), แปลง error เป็นภาษาไทย (403 ของตัวกลางถูกแปลงเป็น 502 กันสับสนกับสิทธิ์ล็อกอินของเรา)

## กติกาที่ต้องทำตาม (ระดับ "ห้ามเด็ดขาด" ใน AGENTS.md)

- เรียกจาก Service ฝั่ง backend เท่านั้น ไม่เรียกจากเบราว์เซอร์
- ไม่ log HN/ชื่อ/ผลลัพธ์ · หน้าที่รับ HN ตั้ง `audit: { redact: ['hn'], logSearch: true }`
- ถ้าต้องเก็บข้อมูลผู้ป่วยในฐานข้อมูลของโปรเจกต์ (เพื่อประหยัดโควตา/ให้ทำงานต่อได้) ให้เก็บเข้ารหัส:

```ts
import { blindIndex, decryptText, encryptText } from '../../core/crypto';

// บันทึก: hn_enc ไว้แสดง, hn_hash ไว้ค้น (ค้นด้วยค่าจริงไม่ได้เพราะเข้ารหัสแล้ว)
await db('patient').insert({ hn_enc: encryptText(hn), hn_hash: blindIndex(hn), name_enc: encryptText(name) });
// ค้น:
const row = await db('patient').where({ hn_hash: blindIndex(hn) }).first();
const name = row ? decryptText(row.name_enc) : null;
```

- `DATA_ENC_KEY` และ `HASH_KEY` ต้องตั้งบน production (ยาว 32 ตัวอักษรขึ้นไป `npm run setup` สุ่มให้) และ **สำรองไว้ที่ปลอดภัย** — เปลี่ยนแล้วข้อมูลเดิมถอดไม่ได้/ค้นไม่เจอ
- โหมดจำลอง `CORE_MODE=fake` ไม่ยิงจริง (คืนรายการว่าง) ใช้ตอนพัฒนาหน้าจอ
