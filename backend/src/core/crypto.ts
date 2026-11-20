/**
 * core/crypto.ts — เข้ารหัสข้อมูลที่ต้องเก็บแบบถอดกลับได้ (เช่น ชื่อ-สกุลผู้ป่วย) และทำ "รหัสแทน" ไว้ค้นหา
 *
 * ใช้เมื่อโปรเจกต์ต้องเก็บข้อมูลส่วนบุคคลในฐานข้อมูลของตัวเอง (ปกติข้อมูลผู้ป่วยอยู่ที่ Backend Core ไม่เก็บซ้ำ)
 *
 *   encryptText / decryptText  AES-256-GCM  กุญแจ = DATA_ENC_KEY  (เก็บในคอลัมน์ข้อความ ผลลัพธ์ v1.<iv>.<tag>.<ข้อมูล>)
 *   blindIndex                 HMAC-SHA256 กุญแจ = HASH_KEY       (ค่าเดิม → รหัสเดิมเสมอ ใช้ค้น "WHERE hn_hash = ?" โดยไม่ต้องเก็บ HN จริง)
 *
 * ข้อควรจำ:
 *   - เข้ารหัสแล้วค้นด้วยค่าจริงไม่ได้ → เก็บ 2 คอลัมน์: hn_enc (เข้ารหัส ไว้แสดง) + hn_hash (blindIndex ไว้ค้น)
 *   - สองกุญแจแยกกัน (DATA_ENC_KEY กับ HASH_KEY) และ production ต้องตั้งทั้งคู่ยาว 32 ตัวอักษรขึ้นไป (สุ่มด้วย npm run setup)
 *   - ถ้าเปลี่ยน DATA_ENC_KEY ข้อมูลที่เข้ารหัสไว้เดิมจะถอดไม่ได้ · ถ้าเปลี่ยน HASH_KEY รหัสแทนเดิมจะค้นไม่เจอ → สำรองกุญแจไว้ที่ปลอดภัย
 *   - ตอนพัฒนา/ทดสอบ ถ้าไม่ตั้งกุญแจ จะใช้ค่าจาก JWT_SECRET แทน (production ไม่ทำ — โยน error บอกให้ตั้ง)
 */
import crypto from 'node:crypto';
import { config } from './config';

const deriveKey = (secret: string, label: string) => Buffer.from(crypto.hkdfSync('sha256', secret, 'app-core', label, 32));

function secretFor(configured: string, name: string): string {
  if (configured) {
    if (config.isProd && configured.length < 32) throw new Error(`${name} สั้นเกินไป — production ต้องยาวอย่างน้อย 32 ตัวอักษร (รัน npm run setup เพื่อสุ่มให้)`);
    return configured;
  }
  if (config.isProd) throw new Error(`ยังไม่ได้ตั้ง ${name} ใน .env — จำเป็นเมื่อใช้ core/crypto บน production (รัน npm run setup เพื่อสุ่มให้)`);
  return config.jwtSecret; // พัฒนา/ทดสอบเท่านั้น
}

/** เข้ารหัส → v1.<iv>.<tag>.<ข้อมูล> (base64url) — ข้อความเดียวกันเข้ารหัสสองครั้งได้ผลต่างกัน (ค้นหาไม่ได้ ใช้ blindIndex แทน) */
export function encryptText(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secretFor(config.dataEncKey, 'DATA_ENC_KEY'), 'data-enc-v1'), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join('.');
}

/** ถอดรหัส — โยน error ถ้ากุญแจเปลี่ยนหรือข้อมูลถูกแก้ */
export function decryptText(stored: string): string {
  const [version, iv, tag, data] = stored.split('.');
  if (version !== 'v1' || !iv || !tag || !data) throw new Error('รูปแบบข้อมูลเข้ารหัสไม่ถูกต้อง');
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(secretFor(config.dataEncKey, 'DATA_ENC_KEY'), 'data-enc-v1'), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}

/** รหัสแทน (hex 64 ตัว) ของค่าที่ใช้ค้นหา เช่น HN — ตัดช่องว่างหัวท้ายก่อน ค่าตัวเลขกับข้อความหน้าตาเหมือนกันได้รหัสเดียวกัน */
export function blindIndex(value: unknown): string {
  return crypto.createHmac('sha256', deriveKey(secretFor(config.hashKey, 'HASH_KEY'), 'blind-index-v1')).update(String(value).trim()).digest('hex');
}
