/**
 * core/audit.ts — บันทึกประวัติการใช้งาน (audit log) ให้อัตโนมัติ
 *
 * ทุก request แบบ POST ภายใต้ /api/<หน้า>/<การกระทำ> จะถูกบันทึกว่า
 * "ใคร ทำอะไร ที่หน้าไหน เมื่อไร ผลเป็นอย่างไร" (action = ท้าย path เช่น ADD / UPDATE / DELETE / GET)
 * ยกเว้น /search (แค่ค้นหารายการ ไม่บันทึกเพื่อไม่ให้ log ท่วม) — คนเขียนหน้าใหม่ไม่ต้องทำอะไรเลย
 * หน้าที่มีข้อมูลส่วนบุคคลตั้งเพิ่มได้ใน definePage({ audit: { redact: ['hn'], logSearch: true } }) (ดู core/pages.ts)
 * และฝั่งหน้าจอส่งค่าเหล่านี้มาปลอมไม่ได้ (ดึงจาก session ฝั่งเซิร์ฟเวอร์เท่านั้น)
 */
import type { NextFunction, Request, Response } from 'express';
import { db, nowIso } from './db';
import { allPages } from './registry';

const SENSITIVE = /password|secret|token/i;
const SKIPPED = /\/search$/;

/** ปิดบังค่า: คีย์ที่ชื่อมี password/secret/token เสมอ + คีย์ที่หน้านั้นสั่ง redact (เทียบแบบไม่สนตัวพิมพ์) */
function mask(value: unknown, redact: ReadonlySet<string> = new Set()): unknown {
  if (Array.isArray(value)) return value.map((v) => mask(v, redact));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) || redact.has(k.toLowerCase()) ? '***' : mask(v, redact)]));
  }
  return value;
}

type AuditEntry = {
  user_id?: number | null;
  username?: string | null;
  page: string;
  action: string;
  path: string;
  status_code: number;
  ip?: string | null;
  detail?: unknown;
  /** ชื่อฟิลด์เพิ่มเติมที่ต้องปิดบังค่า (ปกติมาจาก definePage({ audit: { redact } })) */
  redact?: string[];
};

/** บันทึกเหตุการณ์เอง (เช่น login/logout) — ใช้ได้จากทุกที่ ไม่ throw */
export async function writeAudit(e: AuditEntry): Promise<void> {
  try {
    await db('audit_logs').insert({
      user_id: e.user_id ?? null,
      username: e.username ?? null,
      page: e.page,
      action: e.action,
      path: e.path.slice(0, 200),
      status_code: e.status_code,
      ip: e.ip ?? null,
      detail: e.detail === undefined ? null : JSON.stringify(mask(e.detail, new Set((e.redact ?? []).map((k) => k.toLowerCase())))).slice(0, 4000),
      created_at: nowIso(),
    });
  } catch (err) {
    console.error('[audit] บันทึกไม่สำเร็จ:', err);
  }
}

/** middleware: ใช้ที่ api.use(auditMiddleware) — ข้าม /api/auth (auth บันทึกเอง) */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();
  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0] ?? '';
    const segments = path.split('/'); // ['', 'api', 'vendor', 'add']
    const page = segments[2] ?? '';
    if (!page || page === 'auth') return;
    const opts = allPages().find((p) => p.name === page)?.audit;
    const isSearch = SKIPPED.test(path);
    if (isSearch && !opts?.logSearch) return;
    void writeAudit({
      user_id: req.user?.id,
      username: req.user?.username,
      page,
      action: (segments[3] ?? req.method).toUpperCase(),
      path,
      status_code: res.statusCode,
      ip: req.ip,
      detail: isSearch ? undefined : req.body, // การค้นหา: จดว่าใครเปิดดู แต่ไม่เก็บค่าที่ค้น (อาจเป็น HN/ชื่อ)
      redact: opts?.redact,
    });
  });
  next();
}
