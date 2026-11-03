/**
 * ConnectionService.ts — รันการตรวจของตัวเชื่อมต่อทุกตัว (integrations/index.ts) พร้อมกัน
 * แต่ละตัวมีเวลาจำกัด ตัวไหนค้างไม่ทำให้ทั้งหน้าค้าง · ไม่มีกติกาธุรกิจอื่น และไม่แตะฐานข้อมูลของระบบ
 */
import { allIntegrations } from '../../integrations';
import type { IntegrationStatus } from '../../integrations/Integration';

export type ConnectionRow = { name: string; title: string } & IntegrationStatus;

const TIMEOUT_MS = 8000;

const withTimeout = <T>(p: Promise<T>, fallback: T): Promise<T> => new Promise((resolve) => {
  const t = setTimeout(() => resolve(fallback), TIMEOUT_MS);
  p.then((v) => resolve(v), () => resolve(fallback)).finally(() => clearTimeout(t));
});

export class ConnectionService {
  async status(): Promise<ConnectionRow[]> {
    return Promise.all(
      allIntegrations().map(async (i) => ({
        name: i.name,
        title: i.title,
        ...(await withTimeout(i.status(), { ok: false, mode: 'real' as const, detail: `ไม่ตอบภายใน ${TIMEOUT_MS / 1000} วินาที` })),
      })),
    );
  }
}
