/**
 * pages/index.ts — รายชื่อ "หน้า" ทั้งหมดของระบบฝั่งหลังบ้าน (เขียนมือ ไม่มีการค้นไฟล์อัตโนมัติ)
 *
 * เพิ่มหน้าใหม่ = 1) ก๊อปโฟลเดอร์หน้าตัวอย่าง (เช่น vendor) แล้วเปลี่ยนชื่อ  2) import แล้วต่อท้ายรายการด้านล่าง
 */
import type { PageDef } from '../core/pages';
import { logPage } from './log';
import { vendorPage } from './vendor';

export const pages: PageDef[] = [
  vendorPage, // ตัวอย่าง: ตาราง + ฟอร์ม CRUD
  logPage, // ตัวอย่าง: หน้าอ่านอย่างเดียว (ดู audit log)
];
