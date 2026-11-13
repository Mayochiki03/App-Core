/**
 * core/pages.ts — "หน้า" (page) ของระบบฝั่งหลังบ้าน
 *
 * 1 หน้า = ไฟล์ src/pages/<ชื่อ>.ts  → definePage({ name, roles, router, migrations })
 * (ส่วน Controller/Service/Repository/Entity/DTO อยู่ในโฟลเดอร์ของแต่ละชั้น: src/<layer>/<ชื่อ>/<ชื่อ>_<layer>.ts)
 *
 * แล้วเอาไปต่อรายชื่อใน src/pages/index.ts (เขียนมือ — เปิดไฟล์นั้นดูก็รู้ว่าระบบมีหน้าอะไรบ้าง)
 * API ของหน้าจะอยู่ที่  /api/<name>/...  โดยอัตโนมัติ และถูกบันทึก audit log ให้เอง
 */
import type { Knex } from 'knex';
import type { Router } from 'express';

// รายชื่อ role แก้ที่ src/roles.ts (ไม่ต้องแก้ไฟล์นี้)
export { ROLES, type Role } from '../roles';
import type { Role } from '../roles';

export type Migration = {
  /** ชื่อไม่ซ้ำ + เรียงตามวันที่ เช่น '20260105_vendor' */
  name: string;
  up: (db: Knex) => Promise<void>;
  down: (db: Knex) => Promise<void>;
};

export type PageDef = {
  /** ชื่อหน้า = ส่วนหนึ่งของ URL (/api/vendor) และชื่อที่ใช้ในบันทึก audit */
  name: string;
  /** role ที่เรียก API นี้ได้ (ไม่ใส่ = ทุก role ที่ล็อกอินแล้ว) */
  roles?: Role[];
  router: Router;
  migrations?: Migration[];
};

export const definePage = (page: PageDef): PageDef => page;
