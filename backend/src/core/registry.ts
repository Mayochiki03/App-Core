/**
 * core/registry.ts — รายชื่อหน้าที่ "ใช้งานอยู่จริง" ของระบบ (app.ts และ migrate.ts อ่านจากที่นี่ที่เดียว)
 *
 * ปกติ = รายชื่อใน src/pages/index.ts เท่านั้น
 * หน้าตัวอย่างใน src/examples/ ไม่ถูกลงทะเบียน (โปรเจกต์ใหม่จึงสะอาด) — เทสต์ใช้ useExtraPages() เพิ่มเข้ามาชั่วคราว
 * เพื่อพิสูจน์ว่าต้นแบบยังทำงานได้จริงทุกครั้งที่รัน npm test
 */
import { pages } from '../pages';
import type { PageDef } from './pages';

let extra: PageDef[] = [];

/** ใช้เฉพาะในเทสต์: เพิ่มหน้าเข้าระบบชั่วคราว (เรียกก่อน createApp / resetDb) */
export function useExtraPages(list: PageDef[]): void {
  extra = list;
}

export const allPages = (): PageDef[] => [...pages, ...extra];
