/**
 * pages/index.ts — รายชื่อ "หน้า" ทั้งหมดของระบบฝั่งหลังบ้าน (เขียนมือ ไม่มีการค้นไฟล์อัตโนมัติ)
 *
 * เพิ่มหน้าใหม่: npm run new:page <ชื่อ>  (สร้างไฟล์ + ต่อบรรทัดที่มี @new-page ด้านล่างให้เอง)
 * หรือทำมือ: ก๊อปไฟล์ของ vendor ในแต่ละชั้นใน src/examples/ มาเป็นชื่อหน้าใหม่ แล้ว import + ต่อท้ายรายการ (ดู docs/03)
 */
import type { PageDef } from '../core/pages';
import { connectionPage } from './connection';
import { logPage } from './log';
// @new-page:import

export const pages: PageDef[] = [
  logPage, // หน้าของระบบ: ดูบันทึกการใช้งาน (audit log) — เก็บไว้ทุกโปรเจกต์
  connectionPage, // หน้าของระบบ: สถานะการเชื่อมต่อ (ตัวเชื่อมต่อ/ฐานข้อมูลภายนอก)
  // @new-page:list
];
