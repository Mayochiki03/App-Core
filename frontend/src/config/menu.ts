/**
 * config/menu.ts — เมนูด้านซ้าย (เขียนมือ) — เพิ่มหน้าใหม่ = เพิ่มบรรทัดที่นี่ + เพิ่ม route ที่ config/routes.tsx
 * สิทธิ์ (role) ดูจาก routes.tsx — เมนูของหน้าที่ role นั้นเข้าไม่ได้จะถูกซ่อนเอง
 */
import { Database, Home, Settings, type LucideIcon } from 'lucide-react';

export type MenuItem = { label: string; path: string };
export type MenuGroup = { label: string; icon: LucideIcon; path?: string; children?: MenuItem[] };

export const menu: MenuGroup[] = [
  { label: 'หน้าหลัก', icon: Home, path: '/' },
  {
    label: 'ข้อมูลหลัก',
    icon: Database,
    // กลุ่มว่างจะถูกซ่อนเอง — npm run new:page ต่อรายการหน้าใหม่ที่บรรทัด @new-page ด้านล่าง
    children: [
      // @new-page:menu
    ],
  },
  {
    label: 'ระบบ',
    icon: Settings,
    children: [
      { label: 'บันทึกการใช้งาน', path: '/log' },
      { label: 'สถานะการเชื่อมต่อ', path: '/connection' },
    ],
  },
];

/** ชื่อหน้าสำหรับแสดงบนแถบหัว (Header) — หาจากเมนูที่ path ตรงกับ URL ปัจจุบัน */
export function titleOf(pathname: string): string {
  const items: MenuItem[] = menu.flatMap((g) => (g.path ? [{ label: g.label, path: g.path }] : (g.children ?? [])));
  const hit = items.find((i) => (i.path === '/' ? pathname === '/' : pathname === i.path || pathname.startsWith(`${i.path}/`)));
  return hit?.label ?? '';
}
