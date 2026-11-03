/**
 * config/roles.ts — รายชื่อ role (สิทธิ์) ฝั่งหน้าเว็บ — ต้องตรงกับ backend/src/roles.ts
 * (โซนเขียว: เพิ่ม role ที่นี่ได้เลย ไม่ต้องแตะ lib/session.tsx)
 */
export const ROLES = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];

const _mustHaveAdmin: 'ADMIN' extends Role ? true : never = true;
void _mustHaveAdmin;
