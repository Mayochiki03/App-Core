/**
 * roles.ts — รายชื่อ role (สิทธิ์) ของระบบ ที่เดียวของฝั่งหลังบ้าน (โซนเขียว: โปรเจกต์ไหนต้องการ role เพิ่มแก้ที่นี่ได้เลย ไม่ต้องแตะ core/)
 *
 * ตัวอย่างเพิ่ม role แคชเชียร์:  export const ROLES = ['ADMIN', 'STAFF', 'CASHIER'] as const;
 * แล้วแก้ frontend/src/config/roles.ts ให้ตรงกัน และใช้ในหน้าด้วย roles: ['ADMIN', 'CASHIER']
 * ต้องมี 'ADMIN' เสมอ (แกนกลางใช้สร้างผู้ดูแลระบบคนแรก) — ถ้าลืม TypeScript จะแจ้ง error ทันที
 * ค่า role เก็บในคอลัมน์ users.role (ข้อความ ไม่เกิน 20 ตัว) จึงเพิ่มได้โดยไม่ต้อง migrate
 */
export const ROLES = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];

// ตรวจตอน compile ว่ายังมี ADMIN อยู่
const _mustHaveAdmin: 'ADMIN' extends Role ? true : never = true;
void _mustHaveAdmin;
