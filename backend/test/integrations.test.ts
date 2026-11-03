/**
 * ทดสอบตัวเชื่อมต่อ (LLM) และแหล่งข้อมูลอ่านอย่างเดียว: npm test
 * LLM ทดสอบกับเซิร์ฟเวอร์จำลองในเครื่องที่พูดมาตรฐาน OpenAI-compatible (ไม่ยิงออกอินเทอร์เน็ต)
 * แหล่งข้อมูลอ่านอย่างเดียวทดสอบกับฐานข้อมูลเทสต์ (_test) ด้วย user ที่ "มีสิทธิ์เขียน" เพื่อพิสูจน์ว่า READ ONLY ของเซสชันกันได้จริง
 */
process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.TEST_DB_NAME ?? 'app_core_test';

import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

const { config } = await import('../src/core/config');
const { db, closeDb } = await import('../src/core/db');
const ds = await import('../src/core/datasource');
const { LlmClient } = await import('../src/integrations/llm/LlmClient');
const { allIntegrations } = await import('../src/integrations');
const { ConnectionService } = await import('../src/pages/connection/ConnectionService');

const setEnv = (kv: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(kv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

describe('LLM (OpenAI-compatible)', () => {
  let server: http.Server;
  let url = '';
  let lastBody: any = null;
  let mode: 'ok' | 'error' | 'hang' = 'ok';

  before(async () => {
    server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        if (mode === 'hang') return; // ไม่ตอบ เพื่อทดสอบ timeout
        if (mode === 'error') {
          res.writeHead(500).end('boom');
          return;
        }
        res.setHeader('content-type', 'application/json');
        if (req.url === '/v1/models') return void res.end(JSON.stringify({ data: [{ id: 'typhoon' }, { id: 'llama' }] }));
        lastBody = JSON.parse(raw);
        res.end(JSON.stringify({ choices: [{ message: { content: 'สวัสดีครับ' } }] }));
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => {
    server.closeAllConnections();
    server.close();
    setEnv({ LLM_BASE_URL: undefined, LLM_MODE: undefined, LLM_MODEL: undefined, LLM_TIMEOUT_SEC: undefined });
  });

  it('ไม่ตั้ง LLM_BASE_URL = ปิด: chat บอกเป็นภาษาไทย และ status ok แต่โหมด off', async () => {
    setEnv({ LLM_BASE_URL: undefined, LLM_MODE: undefined });
    const c = new LlmClient();
    await assert.rejects(c.chat([{ role: 'user', content: 'x' }]), /ยังไม่ได้ตั้งค่า LLM/);
    assert.deepEqual(await c.status(), { ok: true, mode: 'off', detail: 'ปิดอยู่ (ไม่ได้ตั้ง LLM_BASE_URL)' });
  });

  it('โหมด fake: ไม่ยิงออกข้างนอก ตอบจำลอง', async () => {
    setEnv({ LLM_BASE_URL: 'http://127.0.0.1:1', LLM_MODE: 'fake' });
    const c = new LlmClient();
    assert.match(await c.chat([{ role: 'user', content: 'ทดสอบ' }]), /^\[ตอบจำลอง\] ทดสอบ/);
    assert.equal((await c.status()).mode, 'fake');
  });

  it('โหมด real: ส่งตามมาตรฐาน OpenAI และอ่านคำตอบได้', async () => {
    setEnv({ LLM_BASE_URL: url, LLM_MODE: 'real', LLM_MODEL: 'typhoon' });
    mode = 'ok';
    const c = new LlmClient();
    assert.equal(await c.chat([{ role: 'user', content: 'สวัสดี' }]), 'สวัสดีครับ');
    assert.equal(lastBody.model, 'typhoon');
    assert.equal(lastBody.stream, false);
    assert.deepEqual(lastBody.messages, [{ role: 'user', content: 'สวัสดี' }]);
    const st = await c.status();
    assert.equal(st.ok, true);
    assert.match(st.detail, /โมเดล typhoon/);
  });

  it('status: โมเดลที่ตั้งไว้ไม่มีบนเครื่องนั้น → บอกว่าไม่พบ พร้อมรายชื่อที่มี', async () => {
    setEnv({ LLM_BASE_URL: url, LLM_MODE: 'real', LLM_MODEL: 'ไม่มีโมเดลนี้' });
    const st = await new LlmClient().status();
    assert.equal(st.ok, false);
    assert.match(st.detail, /ไม่พบโมเดล/);
    assert.match(st.detail, /typhoon/);
  });

  it('ปลายทางตอบ error → HttpError 502 ภาษาไทย / ต่อไม่ได้ → บอกให้ตรวจ LLM_BASE_URL', async () => {
    setEnv({ LLM_BASE_URL: url, LLM_MODE: 'real', LLM_MODEL: 'typhoon' });
    mode = 'error';
    await assert.rejects(new LlmClient().chat([{ role: 'user', content: 'x' }]), (e: any) => e.httpStatus === 502 && /HTTP 500/.test(e.message));
    setEnv({ LLM_BASE_URL: 'http://127.0.0.1:1' });
    await assert.rejects(new LlmClient().chat([{ role: 'user', content: 'x' }]), (e: any) => e.httpStatus === 502 && /LLM_BASE_URL/.test(e.message));
  });

  it('ปลายทางไม่ตอบ → timeout ตาม LLM_TIMEOUT_SEC (504)', async () => {
    setEnv({ LLM_BASE_URL: url, LLM_MODE: 'real', LLM_TIMEOUT_SEC: '1' });
    mode = 'hang';
    await assert.rejects(new LlmClient().chat([{ role: 'user', content: 'x' }]), (e: any) => e.httpStatus === 504 && /1 วินาที/.test(e.message));
    setEnv({ LLM_TIMEOUT_SEC: undefined });
  });

  it('ค่า LLM_MODE ผิด → บอกค่าที่ใช้ได้', async () => {
    setEnv({ LLM_BASE_URL: url, LLM_MODE: 'maybe' });
    await assert.rejects(new LlmClient().status(), /real \| fake \| off/);
    setEnv({ LLM_MODE: undefined });
  });
});

describe('แหล่งข้อมูลอ่านอย่างเดียว (readonlyDb)', () => {
  before(async () => {
    setEnv({
      EXT_DB_CLIENT: config.db.client,
      EXT_DB_HOST: config.db.host,
      EXT_DB_PORT: String(config.db.port),
      EXT_DB_NAME: config.db.database,
      EXT_DB_USER: config.db.user, // user นี้ "เขียนได้" โดยตั้งใจ — ต้องถูกกันด้วย READ ONLY ของเซสชัน
      EXT_DB_PASSWORD: config.db.password,
    });
    await db.schema.dropTableIfExists('ro_probe_test');
    await db.schema.createTable('ro_probe_test', (t) => {
      t.increments('id');
      t.string('hn', 20).notNullable();
    });
    await db('ro_probe_test').insert({ hn: '000001' });
  });
  after(async () => {
    await db.schema.dropTableIfExists('ro_probe_test');
    await ds.closeDatasources();
    await closeDb();
    setEnv({ EXT_DB_CLIENT: undefined, EXT_DB_HOST: undefined, EXT_DB_PORT: undefined, EXT_DB_NAME: undefined, EXT_DB_USER: undefined, EXT_DB_PASSWORD: undefined });
  });

  it('อ่านได้ปกติ และถูกรวมในรายชื่อแหล่งข้อมูลที่ประกาศไว้', async () => {
    assert.ok(ds.datasourcesConfigured().includes('ext'));
    assert.ok(!ds.datasourcesConfigured().includes('db'), 'DB_HOST ของฐานข้อมูลหลักต้องไม่ถูกนับเป็นแหล่งเพิ่มเติม');
    const rows = await ds.readonlyDb('ext')('ro_probe_test').select('hn');
    assert.deepEqual(rows, [{ hn: '000001' }]);
  });

  it('เขียน/แก้/ลบ/สร้างตาราง ไม่ได้ แม้ user มีสิทธิ์เขียน (READ ONLY ระดับเซสชัน)', async () => {
    const ext = ds.readonlyDb('ext');
    await assert.rejects(ext('ro_probe_test').insert({ hn: '999999' }), /read.?only/i);
    await assert.rejects(ext('ro_probe_test').update({ hn: 'x' }), /read.?only/i);
    await assert.rejects(ext('ro_probe_test').delete(), /read.?only/i);
    assert.equal((await db('ro_probe_test').count({ n: '*' }).first())!.n, 1, 'ข้อมูลต้องไม่เปลี่ยน');
  });

  it('ยังไม่ได้ตั้งค่า → error ภาษาไทยบอกว่าต้องใส่ตัวแปรอะไร / ชื่อผิดรูปแบบถูกปฏิเสธ', () => {
    assert.throws(() => ds.readonlyDb('nothere'), /ยังไม่ได้ตั้งค่าแหล่งข้อมูล "nothere".*NOTHERE_DB_HOST/);
    assert.throws(() => ds.readonlyDb('bad name!'), /ชื่อแหล่งข้อมูล/);
  });

  it('pingDatasource: ต่อได้ / รหัสผ่านผิดบอกเป็นภาษาไทย', async () => {
    assert.equal((await ds.pingDatasource('ext')).ok, true);
    setEnv({ BAD_DB_HOST: config.db.host, BAD_DB_PORT: String(config.db.port), BAD_DB_NAME: config.db.database, BAD_DB_USER: config.db.user, BAD_DB_PASSWORD: 'wrong-password' });
    const r = await ds.pingDatasource('bad');
    assert.equal(r.ok, false);
    assert.match(r.detail, /ปฏิเสธ user/);
    setEnv({ BAD_DB_HOST: undefined, BAD_DB_PORT: undefined, BAD_DB_NAME: undefined, BAD_DB_USER: undefined, BAD_DB_PASSWORD: undefined });
  });
});

describe('หน้าสถานะการเชื่อมต่อ', () => {
  it('รวมตัวเชื่อมต่อ + แหล่งข้อมูลที่ประกาศไว้ และตัวที่ค้างไม่ทำให้ทั้งหมดล้ม', async () => {
    setEnv({ LLM_BASE_URL: undefined, LLM_MODE: undefined, EXT_DB_HOST: '127.0.0.1', EXT_DB_NAME: 'x', EXT_DB_USER: 'x', EXT_DB_PORT: '1' });
    const names = allIntegrations().map((i) => i.name);
    assert.ok(names.includes('llm') && names.includes('ext'));
    const rows = await new ConnectionService().status();
    const llmRow = rows.find((r) => r.name === 'llm')!;
    assert.equal(llmRow.mode, 'off');
    const ext = rows.find((r) => r.name === 'ext')!;
    assert.equal(ext.ok, false);
    assert.match(ext.detail, /ต่อไม่ได้/);
    setEnv({ EXT_DB_HOST: undefined, EXT_DB_NAME: undefined, EXT_DB_USER: undefined, EXT_DB_PORT: undefined });
    await ds.closeDatasources();
  });
});
