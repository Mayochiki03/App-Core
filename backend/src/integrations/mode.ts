/**
 * integrations/mode.ts — โหมดของตัวเชื่อมต่อ อ่านจาก .env ด้วยกติกาเดียวกันทุกตัว
 *   <NAME>_MODE=real  เชื่อมต่อของจริง
 *   <NAME>_MODE=fake  ปลอม: ไม่ยิงออกข้างนอก แค่บันทึกว่า "จะส่งอะไรไปที่ไหน" (ใช้ตอนพัฒนา — กันข้อความหลุดไปถึงคนจริง)
 *   <NAME>_MODE=off   ปิด
 * ไม่ตั้ง = real ถ้ามีค่าเชื่อมต่อครบ (hasConfig) ไม่งั้น off  · production ห้ามใช้ fake (ระบบไม่ยอมเริ่ม)
 */
import { config, env } from '../core/config';
import type { IntegrationMode } from './Integration';

export function integrationMode(name: string, hasConfig: boolean): IntegrationMode {
  const key = `${name.toUpperCase()}_MODE`;
  const v = env(key, hasConfig ? 'real' : 'off').toLowerCase();
  if (v !== 'real' && v !== 'fake' && v !== 'off') throw new Error(`${key}="${v}" ไม่ถูกต้อง — ใช้ได้: real | fake | off`);
  if (v === 'fake' && config.isProd) throw new Error(`${key}=fake ใช้บน production ไม่ได้ — ตั้งเป็น real หรือ off`);
  return v;
}

/** บันทึกสิ่งที่ "จะส่ง" ในโหมดปลอม (ออก console ของ backend) */
export function fakeLog(name: string, what: string): void {
  console.log(`[${name}:fake] ${what}`);
}
