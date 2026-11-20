/**
 * integrations/index.ts — รายชื่อตัวเชื่อมต่อของระบบ (เขียนมือ) + แหล่งข้อมูลอ่านอย่างเดียวที่ประกาศใน .env (ใส่ให้เอง)
 * หน้า "สถานะการเชื่อมต่อ" (pages/connection) อ่านรายการนี้ไปตรวจทีละตัว
 *
 * เพิ่มตัวเชื่อมต่อใหม่: สร้างโฟลเดอร์ integrations/<ชื่อ>/ ตามแบบ llm/ แล้วต่อ import + รายการด้านล่าง (ดู README.md)
 * กติกา: แกน (core/) ไม่ import ไฟล์ในโฟลเดอร์นี้เด็ดขาด — ทิศทางคือ หน้า → ตัวเชื่อมต่อ → แกน
 */
import { datasourcesConfigured, pingDatasource } from '../core/datasource';
import type { Integration } from './Integration';
import { coreGatewayIntegration } from './core_gateway';
import { llmIntegration } from './llm';

/** ตัวเชื่อมต่อที่โปรเจกต์นี้ใช้ (ลบบรรทัดที่ไม่ใช้ออกได้) */
export const integrations: Integration[] = [
  llmIntegration,
  coreGatewayIntegration, // Backend Core (ไม่ตั้ง CORE_URL = ปิด ไม่กระทบอะไร)
  // เพิ่มตัวเชื่อมต่ออื่นที่นี่ เช่น lineIntegration, mophIntegration
];

/** แหล่งข้อมูลอ่านอย่างเดียวที่ประกาศใน .env (<ชื่อ>_DB_HOST) — แสดงบนหน้าสถานะเหมือนตัวเชื่อมต่อ */
export const datasourceIntegrations = (): Integration[] =>
  datasourcesConfigured().map((name) => ({
    name,
    title: `ฐานข้อมูล ${name} (อ่านอย่างเดียว)`,
    status: async () => {
      const r = await pingDatasource(name);
      return { ok: r.ok, mode: 'real' as const, detail: r.detail };
    },
  }));

export const allIntegrations = (): Integration[] => [...integrations, ...datasourceIntegrations()];
