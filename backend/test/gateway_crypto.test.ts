/**
 * ทดสอบ core/crypto และตัวเชื่อม Backend Core (เซิร์ฟเวอร์จำลองในเครื่อง ไม่ยิงออกอินเทอร์เน็ต ไม่ต้องใช้ฐานข้อมูล)
 */
process.env.NODE_ENV = 'test';

import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

const { encryptText, decryptText, blindIndex } = await import('../src/core/crypto');
const { CoreGatewayClient } = await import('../src/integrations/core_gateway/CoreGatewayClient');
const { allIntegrations } = await import('../src/integrations');

const setEnv = (kv: Record<string, string | undefined>) => {
  for (const [k, v] of Object.entries(kv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};

describe('core/crypto', () => {
  it('เข้ารหัสแล้วถอดกลับได้ และเข้ารหัสซ้ำได้ผลต่างกัน', () => {
    const a = encryptText('สมชาย ใจดี');
    const b = encryptText('สมชาย ใจดี');
    assert.match(a, /^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.notEqual(a, b);
    assert.equal(decryptText(a), 'สมชาย ใจดี');
    assert.ok(!a.includes('สมชาย'));
  });

  it('ข้อมูลถูกแก้ → ถอดไม่ได้', () => {
    const parts = encryptText('abc').split('.');
    parts[3] = Buffer.from('xxxx').toString('base64url');
    assert.throws(() => decryptText(parts.join('.')));
    assert.throws(() => decryptText('ไม่ใช่รูปแบบ'), /รูปแบบ/);
  });

  it('blindIndex: ค่าเดิม → รหัสเดิม (ตัดช่องว่าง/ตัวเลขเท่ากับข้อความ) ค่าต่างกัน → ต่างกัน', () => {
    assert.equal(blindIndex('0001234'), blindIndex(' 0001234 '));
    assert.equal(blindIndex(123), blindIndex('123'));
    assert.notEqual(blindIndex('0001234'), blindIndex('0001235'));
    assert.match(blindIndex('x'), /^[0-9a-f]{64}$/);
  });
});

describe('Backend Core client', () => {
  let server: http.Server;
  let url = '';
  let tokenCalls = 0;
  let queryCalls = 0;
  let queryMode: 'ok' | '401-once' | '503-once' | '403' | '429-quota' = 'ok';
  let seenAuth = '';
  let seenBody: unknown = null;

  before(async () => {
    server = http.createServer((req, res) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        if (req.url === '/gw/token') {
          tokenCalls++;
          const body = JSON.parse(raw);
          if (body.client_secret !== 'good-secret') return void res.writeHead(401).end(JSON.stringify({ status: 'UNAUTHORIZED', message: 'client ไม่ถูกต้อง' }));
          return void res.end(JSON.stringify({ status: 'SUCCESS', data: { access_token: `tok-${tokenCalls}`, expires_in: 600 } }));
        }
        if (req.url === '/gw/data/query') {
          queryCalls++;
          seenAuth = String(req.headers.authorization);
          seenBody = JSON.parse(raw);
          if (queryMode === '401-once' && queryCalls === 1) return void res.writeHead(401).end(JSON.stringify({ status: 'UNAUTHORIZED', message: 'หมดอายุ' }));
          if (queryMode === '503-once' && queryCalls === 1) return void res.writeHead(503).end(JSON.stringify({ status: 'ERROR', message: 'ไม่ว่าง' }));
          if (queryMode === '403') return void res.writeHead(403).end(JSON.stringify({ status: 'FORBIDDEN', message: 'IP ไม่ได้รับอนุญาต' }));
          if (queryMode === '429-quota') return void res.writeHead(429).end(JSON.stringify({ status: 'ERROR', message: 'lookup_quota_exceeded' }));
          return void res.end(JSON.stringify({ status: 'SUCCESS', data: { resultList: [{ hn: '1' }], totalRow: 1 } }));
        }
        res.writeHead(404).end('{}');
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    setEnv({ CORE_URL: url, CORE_CLIENT_ID: 'app', CORE_CLIENT_SECRET: 'good-secret', CORE_MODE: undefined });
  });
  after(() => {
    server.closeAllConnections();
    server.close();
    setEnv({ CORE_URL: undefined, CORE_CLIENT_ID: undefined, CORE_CLIENT_SECRET: undefined, CORE_MODE: undefined });
  });

  const reset = (mode: typeof queryMode) => {
    tokenCalls = 0;
    queryCalls = 0;
    queryMode = mode;
  };

  it('ขอ token เองแล้วใช้ซ้ำ ไม่ขอใหม่ทุกคำขอ และส่ง where ไปตามที่ขอ', async () => {
    reset('ok');
    const c = new CoreGatewayClient();
    const [a] = await Promise.all([c.query({ dataset: 'patients', where: { hn: '1' } }), c.query({ dataset: 'patients', where: { hn: '1' } })]);
    await c.query({ dataset: 'patients', where: { hn: '1' } });
    assert.equal(a.resultList.length, 1);
    assert.equal(tokenCalls, 1);
    assert.match(seenAuth, /^Bearer tok-/);
    assert.deepEqual((seenBody as { where: unknown }).where, { hn: '1' });
  });

  it('ได้ 401 → ขอ token ใหม่แล้วลองซ้ำครั้งเดียว', async () => {
    reset('401-once');
    const r = await new CoreGatewayClient().query({ dataset: 'patients' });
    assert.equal(r.totalRow, 1);
    assert.equal(tokenCalls, 2);
  });

  it('ได้ 503 → retry แล้วสำเร็จ', async () => {
    reset('503-once');
    const r = await new CoreGatewayClient().query({ dataset: 'patients' });
    assert.equal(r.totalRow, 1);
    assert.equal(queryCalls, 2);
  });

  it('ได้ 403 → ไม่ retry และผู้ใช้เราไม่เห็นเป็น 403 (กันสับสนกับสิทธิ์ของเราเอง)', async () => {
    reset('403');
    await assert.rejects(new CoreGatewayClient().query({ dataset: 'patients' }), (e: { httpStatus?: number; message: string }) => e.httpStatus === 502 && /IP/.test(e.message));
    assert.equal(queryCalls, 1);
  });

  it('โควตาค้นหารายวันหมด (429 lookup_quota_exceeded) → ไม่ retry บอกเป็นภาษาไทย', async () => {
    reset('429-quota');
    await assert.rejects(new CoreGatewayClient().query({ dataset: 'patients' }), (e: { httpStatus?: number; message: string }) => e.httpStatus === 429 && /โควตา/.test(e.message));
    assert.equal(queryCalls, 1);
  });

  it('status: ขอ token อย่างเดียว ไม่ยิง data endpoint; secret ผิด → บอกให้ตรวจค่า', async () => {
    reset('ok');
    const ok = await new CoreGatewayClient().status();
    assert.equal(ok.ok, true);
    assert.equal(queryCalls, 0);
    setEnv({ CORE_CLIENT_SECRET: 'wrong' });
    const bad = await new CoreGatewayClient().status();
    setEnv({ CORE_CLIENT_SECRET: 'good-secret' });
    assert.equal(bad.ok, false);
    assert.match(bad.detail, /CORE_CLIENT_SECRET/);
  });

  it('ไม่ตั้ง CORE_URL = ปิด / CORE_MODE=fake ไม่ยิงจริง', async () => {
    reset('ok');
    setEnv({ CORE_MODE: 'fake' });
    assert.deepEqual((await new CoreGatewayClient().query({ dataset: 'patients', where: { hn: '9' } })).resultList, []);
    assert.equal(tokenCalls + queryCalls, 0);
    setEnv({ CORE_MODE: undefined, CORE_URL: undefined });
    const c = new CoreGatewayClient();
    assert.equal((await c.status()).mode, 'off');
    await assert.rejects(c.query({ dataset: 'x' }), /CORE_URL/);
    setEnv({ CORE_URL: url });
  });

  it('ลงทะเบียนในหน้าสถานะการเชื่อมต่อ', () => {
    assert.ok(allIntegrations().some((i) => i.name === 'core'));
  });
});
