/**
 * CoreGatewayClient.ts — ตัวเชื่อมต่อ "Backend Core" (ตัวกลาง API ที่ต่อกับข้อมูลโรงพยาบาล)
 * เรียกจาก Service ฝั่ง backend เท่านั้น — ห้ามเรียกจากเบราว์เซอร์ และห้ามต่อฐานข้อมูลโรงพยาบาล (HOSxP) ตรง ๆ
 *
 * ตั้งค่าใน .env:
 *   CORE_URL=https://core.hospital.local   CORE_CLIENT_ID=...   CORE_CLIENT_SECRET=...
 *   CORE_MODE=real | fake | off            (ไม่ตั้ง CORE_URL = ปิด)
 *
 * ที่ทำให้อัตโนมัติ: ขอ token เอง/ใช้ซ้ำจนใกล้หมดอายุ/ได้ 401 ขอใหม่แล้วลองซ้ำครั้งเดียว/หลายคำขอแชร์การขอ token ครั้งเดียว
 * retry เฉพาะ 429 (ถ้ามี Retry-After สั้น ๆ), 503, 5xx และ timeout — ไม่ retry 400/401/403 (ลองซ้ำก็ผิดเหมือนเดิม)
 * ห้ามเขียน HN/ชื่อ/ผลลัพธ์ลง log — ไฟล์นี้ไม่ log อะไรนอกจากโหมดจำลอง (ซึ่งไม่แสดงค่า where)
 */
import { env } from '../../core/config';
import { badRequest, HttpError } from '../../core/http';
import type { IntegrationStatus } from '../Integration';
import { fakeLog, integrationMode } from '../mode';

type Envelope<T> = { status: string; message?: string; data?: T };
export type CoreQuery = { dataset: string; where?: Record<string, unknown>; pageNo?: number; pageSize?: number };
export type CoreQueryResult = { resultList: Record<string, unknown>[]; pageNo?: number; pageSize?: number; totalRow?: number };

const SAFETY_MARGIN_MS = 30_000;

const baseUrl = () => {
  const url = env('CORE_URL', '');
  let end = url.length;
  while (end > 0 && url.charAt(end - 1) === '/') end--;
  return url.slice(0, end);
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class CoreGatewayClient {
  private token: string | null = null;
  private expiresAt = 0;
  private pending: Promise<void> | null = null;

  private get mode() {
    return integrationMode('core', baseUrl() !== '');
  }
  private get timeoutMs() {
    return Math.max(1, Number(env('CORE_TIMEOUT_SEC', '15')) || 15) * 1000;
  }

  /** ถามข้อมูลจาก dataset (เช่น ค้น HN: where = { hn: '...' }) — HN ใช้ค้นได้เฉพาะ dataset ที่ผู้ดูแลตัวกลางเปิด lookup ไว้ และนับโควตารายวัน */
  async query(q: CoreQuery): Promise<CoreQueryResult> {
    if (this.mode === 'off') throw badRequest('ยังไม่ได้ตั้งค่าตัวกลาง — ใส่ CORE_URL, CORE_CLIENT_ID, CORE_CLIENT_SECRET ใน .env');
    if (this.mode === 'fake') {
      fakeLog('core', `จะถาม dataset ${q.dataset} (ไม่แสดงเงื่อนไขค้นหา)`);
      return { resultList: [], pageNo: q.pageNo ?? 1, pageSize: q.pageSize ?? 1, totalRow: 0 };
    }
    return this.post<CoreQueryResult>('/gw/data/query', q);
  }

  /** เรียก API ของตัวกลางโดยตรง (ทุกอันเป็น POST) พร้อม retry ตามกติกาด้านบน */
  async post<T = unknown>(path: string, body: unknown = {}): Promise<T> {
    let attempt = 0;
    for (;;) {
      try {
        return await this.postOnce<T>(path, body);
      } catch (err) {
        attempt++;
        if (attempt >= 3 || !isRetryable(err)) throw err;
        await sleep(Math.min(retryAfterMs(err), 2000) || 300 * attempt);
      }
    }
  }

  private async postOnce<T>(path: string, body: unknown): Promise<T> {
    await this.ensureToken();
    let res = await this.raw(path, body, this.token ?? undefined);
    if (res.status === 401) {
      this.token = null; // ถูกเพิกถอน/หมดอายุก่อนเวลา: ขอใหม่แล้วลองซ้ำครั้งเดียว
      await this.ensureToken();
      res = await this.raw(path, body, this.token ?? undefined);
    }
    return this.unwrap<T>(res);
  }

  private async ensureToken(): Promise<void> {
    if (this.token && Date.now() < this.expiresAt - SAFETY_MARGIN_MS) return;
    this.pending ??= this.fetchToken().finally(() => {
      this.pending = null;
    });
    await this.pending;
  }

  private async fetchToken(): Promise<void> {
    const res = await this.raw('/gw/token', { client_id: env('CORE_CLIENT_ID', ''), client_secret: env('CORE_CLIENT_SECRET', '') });
    const data = await this.unwrap<{ access_token: string; expires_in: number }>(res);
    this.token = data.access_token;
    this.expiresAt = Date.now() + data.expires_in * 1000;
  }

  private async raw(path: string, body: unknown, token?: string): Promise<Response> {
    try {
      return await fetch(`${baseUrl()}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'TimeoutError' || name === 'AbortError') throw new HttpError(504, 'ERROR', `ตัวกลางไม่ตอบภายใน ${this.timeoutMs / 1000} วินาที (ปรับ CORE_TIMEOUT_SEC ได้)`);
      throw new HttpError(502, 'ERROR', `ต่อตัวกลางไม่ได้ (${baseUrl()}) — ตรวจ CORE_URL และว่าตัวกลางเปิดอยู่`);
    }
  }

  private async unwrap<T>(res: Response): Promise<T> {
    const json = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (res.ok && json?.status === 'SUCCESS') return json.data as T;
    const msg = json?.message ?? `ตัวกลางตอบกลับผิดรูปแบบ (HTTP ${res.status})`;
    const err = new CoreGatewayError(res.status, res.status === 429 ? `เกินโควตาการค้นหารายวันของตัวกลาง — ${msg}` : msg, res.headers.get('retry-after'));
    throw err;
  }

  /** ตรวจการเชื่อมต่อ: ขอ token อย่างเดียว (ไม่แตะข้อมูลผู้ป่วย ไม่นับโควตาค้นหา) */
  async status(): Promise<IntegrationStatus> {
    const mode = this.mode;
    if (mode === 'off') return { ok: true, mode, detail: 'ปิดอยู่ (ไม่ได้ตั้ง CORE_URL)' };
    if (mode === 'fake') return { ok: true, mode, detail: 'โหมดจำลอง — ไม่ได้เรียกตัวกลางจริง' };
    try {
      this.token = null;
      await this.ensureToken();
      return { ok: true, mode, detail: `ต่อได้ และขอ token ผ่าน (${baseUrl()})` };
    } catch (err) {
      const code = err instanceof CoreGatewayError ? err.upstreamStatus : 0;
      if (code === 401 || code === 403) return { ok: false, mode, detail: `ตัวกลางปฏิเสธ (HTTP ${code}) — ตรวจ CORE_CLIENT_ID/CORE_CLIENT_SECRET และว่าผู้ดูแลตัวกลางอนุญาต IP ของเครื่องนี้แล้ว` };
      return { ok: false, mode, detail: err instanceof Error ? err.message : 'ต่อตัวกลางไม่ได้' };
    }
  }
}

/** error จากตัวกลาง — httpStatus เป็นของตัวกลาง (ถูกแปลงเป็น HttpError ตอนส่งออกถ้าไม่ได้ดักไว้) */
export class CoreGatewayError extends HttpError {
  constructor(
    public upstreamStatus: number,
    message: string,
    public retryAfter: string | null = null,
  ) {
    // 400/401/403/404 จากตัวกลางไม่ควรทำให้ผู้ใช้เราเห็นเป็น 401/403 (จะสับสนกับการล็อกอินของเราเอง) → แปลงเป็น 502; 429/5xx คงเดิม
    super(upstreamStatus === 429 || upstreamStatus >= 500 ? upstreamStatus : 502, 'ERROR', message);
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof CoreGatewayError) return err.upstreamStatus === 429 ? !/lookup_quota_exceeded/.test(err.message) : err.upstreamStatus >= 500;
  return err instanceof HttpError && (err.httpStatus === 504 || err.httpStatus === 502);
}

function retryAfterMs(err: unknown): number {
  const v = err instanceof CoreGatewayError ? Number(err.retryAfter) : NaN;
  return Number.isFinite(v) ? v * 1000 : 0;
}
