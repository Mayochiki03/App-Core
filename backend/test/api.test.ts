/**
 * ทดสอบ API จริงกับฐานข้อมูลจริง: npm test
 *
 * ระวัง: เทสต์ "ลบตารางทั้งหมดแล้วสร้างใหม่" ทุกครั้ง จึงใช้ฐานข้อมูลแยกเท่านั้น:
 *    ค่าเริ่มต้น app_core_test (สร้างไว้แล้วใน database/init.sql) — เปลี่ยนได้ด้วย TEST_DB_NAME
 *    และ "ชื่อต้องลงท้ายด้วย _test" ไม่งั้นเทสต์ไม่ยอมรัน (กันเผลอลบข้อมูลจริง)
 * ทดสอบกับ PostgreSQL: DB_CLIENT=postgres DB_PORT=5432 TEST_DB_NAME=app_core_test npm test
 */
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'app_core_test'; // ต้องตั้งก่อน import config (ค่านี้ชนะ .env)

import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

const { createApp } = await import('../src/app');
const { ensureAdmin } = await import('../src/core/auth');
const { config } = await import('../src/core/config');
const { checkConnection, closeDb, db } = await import('../src/core/db');
const { resetDb } = await import('../src/core/migrate');

let base = '';
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let cookie = '';

async function call(method: string, path: string, body?: unknown, withCookie = true) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(withCookie && cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json()) as { status: string; message?: string; data?: any; fields?: Record<string, string> };
  return { http: res.status, ...json, headers: res.headers };
}

before(async () => {
  assert.match(config.db.database, /_test$/, `เทสต์ใช้ได้เฉพาะฐานข้อมูลที่ชื่อลงท้าย _test (ตอนนี้: ${config.db.database}) — กันลบข้อมูลจริง`);
  await checkConnection();
  await resetDb(); // เริ่มจากฐานข้อมูลว่างเสมอ (ใช้ซ้ำกับ MariaDB/PostgreSQL ได้)
  await ensureAdmin();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
});

after(async () => {
  server.close();
  await closeDb();
});

describe('auth', () => {
  it('ยังไม่ล็อกอิน → 401', async () => {
    const r = await call('POST', '/vendor/search', {}, false);
    assert.equal(r.http, 401);
    assert.equal(r.status, 'UNAUTHORIZED');
  });

  it('รหัสผิด → 401', async () => {
    const r = await call('POST', '/auth/login', { username: config.admin.username, password: 'wrong' });
    assert.equal(r.http, 401);
  });

  it('ล็อกอินสำเร็จ ได้ cookie', async () => {
    const r = await call('POST', '/auth/login', { username: config.admin.username, password: config.admin.password });
    assert.equal(r.http, 200);
    cookie = (r.headers.get('set-cookie') ?? '').split(';')[0] ?? '';
    assert.ok(cookie.startsWith('app_session='));
    assert.equal((await call('GET', '/auth/me')).data.role, 'ADMIN');
  });
});

describe('vendor (CRUD แบบ POST body)', () => {
  let id = 0;
  const body = { code: 'V001', name: 'ธนาคารตัวอย่าง', category: 'BANK', email: '', is_active: 'Y', note: '' };

  it('เพิ่ม', async () => {
    const r = await call('POST', '/vendor/add', body);
    assert.equal(r.http, 201);
    id = r.data.id;
    assert.ok(id > 0);
  });

  it('รหัสซ้ำ → 409 DUPLICATE พร้อมบอกช่อง', async () => {
    const r = await call('POST', '/vendor/add', body);
    assert.equal(r.http, 409);
    assert.equal(r.status, 'DUPLICATE');
    assert.ok(r.fields?.code);
  });

  it('ข้อมูลไม่ครบ → 400 VALIDATION', async () => {
    const r = await call('POST', '/vendor/add', { ...body, code: '', name: '' });
    assert.equal(r.http, 400);
    assert.equal(r.status, 'VALIDATION');
    assert.ok(r.fields?.code && r.fields?.name);
  });

  it('search + กรอง + แบ่งหน้า', async () => {
    await call('POST', '/vendor/add', { ...body, code: 'V002', name: 'โรงพยาบาลตัวอย่าง', category: 'HOSPITAL' });
    const all = await call('POST', '/vendor/search', { pageSize: 1 });
    assert.equal(all.data.totalRow, 2);
    assert.equal(all.data.totalPage, 2);
    assert.equal(all.data.resultList.length, 1);
    assert.equal((await call('POST', '/vendor/search', { q: 'โรงพยาบาล' })).data.totalRow, 1);
    assert.equal((await call('POST', '/vendor/search', { category: 'BANK' })).data.resultList[0].code, 'V001');
  });

  it('get ด้วย id ใน body', async () => {
    assert.equal((await call('POST', '/vendor/get', { id })).data.code, 'V001');
    assert.equal((await call('POST', '/vendor/get', {})).http, 400); // ไม่ส่ง id
  });

  it('แก้ไข (ใช้รหัสตัวเองต่อได้ แต่ชนรหัสคนอื่นไม่ได้)', async () => {
    assert.equal((await call('POST', '/vendor/update', { ...body, id, name: 'ชื่อใหม่' })).http, 200);
    assert.equal((await call('POST', '/vendor/get', { id })).data.name, 'ชื่อใหม่');
    assert.equal((await call('POST', '/vendor/update', { ...body, id, code: 'V002' })).http, 409);
  });

  it('ไม่มี API ที่รับ id ทาง URL (กันส่งข้อมูลผ่าน path/query)', async () => {
    assert.equal((await call('GET', `/vendor/${id}`)).http, 404);
    assert.equal((await call('GET', `/vendor?q=V001`)).http, 404);
    assert.equal((await call('POST', `/vendor/delete/${id}`, {})).http, 404);
  });

  it('ลบ แล้วไม่พบ', async () => {
    assert.equal((await call('POST', '/vendor/delete', { id })).http, 200);
    assert.equal((await call('POST', '/vendor/get', { id })).http, 404);
  });
});

describe('audit อัตโนมัติ', () => {
  it('บันทึก add/update/delete พร้อมชื่อผู้ใช้ ไม่บันทึก search และไม่เก็บรหัสผ่าน', async () => {
    // รอให้ audit ที่เขียนหลังตอบเสร็จ (res.on('finish')) ลงฐานให้ครบ
    await new Promise((r) => setTimeout(r, 100));
    const rows = await db('audit_logs').where({ page: 'vendor' }).orderBy('id');
    assert.ok(rows.length >= 5);
    assert.ok(rows.every((r) => r.username === config.admin.username));
    assert.ok(rows.some((r) => r.action === 'ADD') && rows.some((r) => r.action === 'UPDATE') && rows.some((r) => r.action === 'DELETE'));
    assert.ok(rows.every((r) => r.action !== 'SEARCH'));
    assert.ok(rows.filter((r) => r.status_code !== 404).every((r) => !/\/\d+$/.test(r.path))); // path ของ API จริงไม่มี id (ยกเว้นที่ทดสอบยิงผิดรูปแบบเอง)
    const login = await db('audit_logs').where({ page: 'auth', action: 'LOGIN' });
    assert.ok(login.length >= 2);
    assert.ok(!JSON.stringify(rows).includes(config.admin.password));
  });

  it('หน้า log อ่านได้ (ADMIN) และกรองตามหน้า/การกระทำได้', async () => {
    const r = await call('POST', '/log/search', { page: 'vendor', action: 'ADD' });
    assert.equal(r.http, 200);
    assert.ok(r.data.totalRow >= 2);
  });
});
