/**
 * core/datasource.ts — แหล่งข้อมูลเพิ่มเติม "อ่านอย่างเดียว" (เช่น ฐานข้อมูล HOSxP ที่เป็นของระบบอื่น)
 *
 * ต่างจากฐานข้อมูลหลักของระบบ (core/db.ts) ตรงที่
 *   - อ่านอย่างเดียวเสมอ: เซสชันถูกตั้งเป็น READ ONLY ที่ฝั่งฐานข้อมูล (แม้ user ที่ใช้จะมีสิทธิ์เขียนก็เขียนไม่ได้)
 *   - ไม่มี migration และไม่เคยสร้าง/แก้ตารางในนั้น
 *   - แยก connection pool เล็ก ๆ + จำกัดเวลา query (ฐานข้อมูลของคนอื่นที่เปิดใช้สด ต้องไม่ถูกเราทำให้ช้า)
 *
 * ประกาศใน .env (ชื่อแหล่ง = ส่วนหน้าของตัวแปร) เช่นแหล่งชื่อ hosxp:
 *   HOSXP_DB_HOST=192.168.100.82   HOSXP_DB_NAME=hosxp   HOSXP_DB_USER=readonly_user   HOSXP_DB_PASSWORD=...
 *   HOSXP_DB_CLIENT=mariadb (ค่าเริ่มต้น; mysql | postgres)   HOSXP_DB_PORT=3306   HOSXP_DB_QUERY_TIMEOUT_SEC=30
 * ใช้งาน:  const rows = await readonlyDb('hosxp')('patient').select('hn').limit(10);
 * สำคัญ: ควรขอ user ฐานข้อมูลที่มีสิทธิ์ SELECT อย่างเดียวด้วย — READ ONLY ของเซสชันเป็นชั้นป้องกันที่สอง ไม่ใช่ชั้นเดียว
 */
import knex, { type Knex } from 'knex';
import { env } from './config';

type Conn = { query: (s: string, cb: (e: Error | null) => void) => void };
type Done = (err: Error | null, conn: unknown) => void;

const instances = new Map<string, Knex>();
const prefixOf = (name: string) => `${name.toUpperCase()}_DB_`;

export const isDatasourceName = (name: string) => /^[a-z][a-z0-9_]{0,29}$/.test(name);

/** ชื่อแหล่งข้อมูลที่ประกาศไว้ใน .env (หาจากตัวแปรที่ลงท้าย _DB_HOST ยกเว้น DB_HOST ของฐานข้อมูลหลัก) */
export function datasourcesConfigured(): string[] {
  return Object.keys(process.env)
    .filter((k) => /^[A-Z][A-Z0-9_]*_DB_HOST$/.test(k) && process.env[k])
    .map((k) => k.replace(/_DB_HOST$/, '').toLowerCase())
    .filter(isDatasourceName)
    .sort((a, b) => a.localeCompare(b));
}

function settingsOf(name: string) {
  if (!isDatasourceName(name)) throw new Error(`ชื่อแหล่งข้อมูล "${name}" ไม่ถูกต้อง (ใช้ตัวพิมพ์เล็ก ตัวเลข _ )`);
  const p = prefixOf(name);
  const host = env(`${p}HOST`, '');
  const database = env(`${p}NAME`, '');
  const user = env(`${p}USER`, '');
  const missing = [host ? '' : `${p}HOST`, database ? '' : `${p}NAME`, user ? '' : `${p}USER`].filter(Boolean);
  if (missing.length) throw new Error(`ยังไม่ได้ตั้งค่าแหล่งข้อมูล "${name}" — ใส่ค่าใน .env: ${missing.join(', ')} (และ ${p}PASSWORD)`);
  const clientName = env(`${p}CLIENT`, 'mariadb').toLowerCase();
  const client = clientName === 'postgres' || clientName === 'postgresql' || clientName === 'pg' ? 'postgres' : 'mysql';
  return {
    client,
    host,
    port: Number(env(`${p}PORT`, client === 'postgres' ? '5432' : '3306')),
    user,
    password: env(`${p}PASSWORD`, ''),
    database,
    queryTimeoutSec: Math.max(1, Number(env(`${p}QUERY_TIMEOUT_SEC`, '30')) || 30),
    mariadb: clientName === 'mariadb',
  };
}

/** คืน knex ของแหล่งข้อมูลนั้น (สร้างครั้งแรกที่เรียก ใช้ซ้ำหลังจากนั้น) */
export function readonlyDb(name: string): Knex {
  const hit = instances.get(name);
  if (hit) return hit;
  const s = settingsOf(name);

  const sessionSql =
    s.client === 'postgres'
      ? ["SET default_transaction_read_only = on", `SET statement_timeout = ${s.queryTimeoutSec * 1000}`, "SET TIME ZONE 'UTC'"]
      : [
          'SET SESSION TRANSACTION READ ONLY',
          s.mariadb ? `SET SESSION max_statement_time = ${s.queryTimeoutSec}` : `SET SESSION MAX_EXECUTION_TIME = ${s.queryTimeoutSec * 1000}`,
          "SET time_zone = '+00:00'",
        ];
  const afterCreate = (conn: Conn, done: Done) => {
    const run = (i: number): void => {
      if (i >= sessionSql.length) return done(null, conn);
      conn.query(sessionSql[i]!, (err) => {
        // MySQL ไม่รู้จัก max_statement_time / MariaDB ไม่รู้จัก MAX_EXECUTION_TIME → ข้ามได้ แต่ READ ONLY ต้องสำเร็จเสมอ
        if (err && i === 0) return done(err, conn);
        if (err && s.client === 'postgres') return done(err, conn);
        run(i + 1);
      });
    };
    run(0);
  };

  const k = knex({
    log: { warn() {} },
    client: s.client === 'postgres' ? 'pg' : 'mysql2',
    connection:
      s.client === 'postgres'
        ? { host: s.host, port: s.port, user: s.user, password: s.password, database: s.database, connectionTimeoutMillis: 10000 }
        : { host: s.host, port: s.port, user: s.user, password: s.password, database: s.database, charset: 'utf8mb4', dateStrings: true, decimalNumbers: true, connectTimeout: 10000 },
    pool: { min: 0, max: 5, afterCreate },
    acquireConnectionTimeout: 15000,
  });
  instances.set(name, k);
  return k;
}

/** ลองต่อและ select 1 — คืนผลเป็นข้อความภาษาไทย (ใช้กับหน้าสถานะการเชื่อมต่อ) */
export async function pingDatasource(name: string): Promise<{ ok: boolean; detail: string }> {
  let s;
  try {
    s = settingsOf(name);
    await readonlyDb(name).raw('select 1');
    return { ok: true, detail: `ต่อได้ (${s.client} ${s.host}:${s.port} ฐานข้อมูล ${s.database}) อ่านอย่างเดียว` };
  } catch (err) {
    const e = err as { code?: string; errors?: { code?: string }[]; message?: string };
    const code = e.code ?? e.errors?.[0]?.code ?? '';
    if (!s) return { ok: false, detail: e.message ?? 'ตั้งค่าไม่ครบ' };
    if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return { ok: false, detail: `ต่อไม่ได้ (${s.host}:${s.port}) — ตรวจ ${prefixOf(name)}HOST/PORT และว่าเครื่องนี้เข้าถึงได้` };
    // รหัสผ่านผิดบน MariaDB ที่เปิด plugin gssapi/อื่น ๆ: เซิร์ฟเวอร์ขอวิธียืนยันตัวตนที่ไดรเวอร์ไม่รู้จัก แทนที่จะตอบ "รหัสผ่านผิด"
    if (code === 'AUTH_SWITCH_PLUGIN_ERROR') return { ok: false, detail: `ฐานข้อมูลปฏิเสธ user ${s.user} (เซิร์ฟเวอร์ขอวิธียืนยันตัวตนที่ระบบไม่รองรับ มักเกิดจากรหัสผ่านผิด) — ตรวจ ${prefixOf(name)}USER/PASSWORD` };
    if (code === 'ER_ACCESS_DENIED_ERROR' || code === '28P01') return { ok: false, detail: `ฐานข้อมูลปฏิเสธ user ${s.user} — ตรวจ ${prefixOf(name)}USER/PASSWORD` };
    if (code === 'ER_BAD_DB_ERROR' || code === 'ER_DBACCESS_DENIED_ERROR' || code === '3D000') return { ok: false, detail: `ไม่พบฐานข้อมูล ${s.database} หรือ user นี้ไม่มีสิทธิ์ใช้` };
    return { ok: false, detail: e.message ?? 'ต่อไม่สำเร็จ' };
  }
}

export async function closeDatasources() {
  await Promise.all([...instances.values()].map((k) => k.destroy()));
  instances.clear();
}
