/**
 * config/routes.tsx — รายการหน้าทั้งหมดของระบบ (เขียนมือ ไล่อ่านได้ทีเดียว)
 *
 * 1 ฟีเจอร์ = 1 บรรทัด: ชี้ไปที่ "XxxPage" ซึ่งถือ route ย่อยของตัวเอง (list / add / edit ...)
 * เพิ่มหน้าย่อยในฟีเจอร์ = แก้แค่ XxxPage.tsx ไม่ต้องแตะไฟล์นี้
 *
 * path ต้องลงท้ายด้วย /* (ให้หน้าถือ route ย่อยได้)
 * roles: role ที่เข้าหน้านี้ได้ (ไม่ใส่ = ทุกคนที่ล็อกอิน) — ต้องตรงกับ roles ของหน้าฝั่ง backend
 */
import type { ReactElement } from 'react';
import type { Role } from '../lib/session';
import { ROLES } from './roles';
import Home from '../pages/Home';
import ConnectionPage from '../pages/connection/ConnectionPage';
import LogPage from '../pages/log/LogPage';
// @new-page:import

export type AppRoute = { path: string; element: ReactElement; roles?: Role[] };

/** ทุก role ที่ล็อกอินได้ (แก้รายชื่อ role ที่ config/roles.ts) */
export const ALL_STAFF: Role[] = [...ROLES];

export const routes: AppRoute[] = [
  { path: '/', element: <Home /> },

  { path: '/log/*', element: <LogPage />, roles: ['ADMIN'] }, // หน้าของระบบ: บันทึกการใช้งาน
  { path: '/connection/*', element: <ConnectionPage />, roles: ['ADMIN'] }, // หน้าของระบบ: สถานะการเชื่อมต่อ
  // @new-page:route
];

/** role นี้เข้าหน้าของเมนู path นี้ได้ไหม (ใช้กรองเมนู) — เมนู '/log' เทียบกับ route '/log/*' */
export function canAccess(menuPath: string, role: Role | undefined): boolean {
  const route = routes.find((r) => r.path.replace(/\/\*$/, '') === menuPath);
  if (!route) return true;
  return !route.roles || (!!role && route.roles.includes(role));
}
