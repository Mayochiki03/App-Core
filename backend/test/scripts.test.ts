/**
 * ทดสอบสคริปต์ npm run new:project, kit:diff, new:page และ setup (รันเป็นโปรเซสจริงในโฟลเดอร์ชั่วคราว ไม่ต้องใช้ฐานข้อมูล)
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'appcore-scripts-'));
const run = (script: string, ...args: string[]) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { encoding: 'utf8' });
/** รันสคริปต์ของ repo นี้ แต่ให้ทำงานกับโฟลเดอร์โปรเจกต์ชั่วคราว (APP_CORE_ROOT) ไม่แตะไฟล์จริง */
const runIn = (dir: string, script: string, ...args: string[]) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { encoding: 'utf8', env: { ...process.env, APP_CORE_ROOT: dir } });

after(() => fs.rmSync(tmp, { recursive: true, force: true }));

describe('npm run new:project', () => {
  const dest = path.join(tmp, 'bst_noi');

  it('ชื่อไม่ถูกรูปแบบ → ปฏิเสธ', () => {
    const r = run('new-project.mjs', 'Bad Name');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /ใช้: npm run new:project/);
  });

  it('ก๊อปชุดไปโฟลเดอร์ใหม่ ไม่เอา .git/node_modules/.env และตั้งชื่อ/เวอร์ชันใหม่', () => {
    const r = run('new-project.mjs', 'bst_noi', dest);
    assert.equal(r.status, 0, r.stderr);
    assert.ok(fs.existsSync(path.join(dest, 'backend/src/core/crypto.ts')));
    for (const skipped of ['.git', 'node_modules', '.env']) assert.ok(!fs.existsSync(path.join(dest, skipped)), skipped);
    const base = JSON.parse(fs.readFileSync(path.join(dest, '.app-core-base.json'), 'utf8'));
    const rootVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
    assert.equal(base.app_core_version, rootVersion);
    const pkg = JSON.parse(fs.readFileSync(path.join(dest, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'bst_noi');
    assert.equal(pkg.version, '0.1.0');
    assert.equal(JSON.parse(fs.readFileSync(path.join(dest, 'backend/package.json'), 'utf8')).name, 'bst_noi-backend');
    assert.match(r.stdout, /git init/);
  });

  it('โฟลเดอร์ปลายทางมีไฟล์อยู่แล้ว → ไม่ทับ', () => {
    const r = run('new-project.mjs', 'bst_noi', dest);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /มีไฟล์อยู่แล้ว/);
  });
});

describe('npm run kit:diff', () => {
  const project = path.join(tmp, 'bst_noi');

  it('ไม่ระบุโฟลเดอร์ → บอกวิธีใช้', () => {
    assert.equal(run('kit-diff.mjs').status, 1);
  });

  it('โฟลเดอร์ที่ให้มาไม่ใช่ App-Core → บอกวิธีใช้', () => {
    assert.equal(run('kit-diff.mjs', tmp).status, 1);
  });

  it('ส่วนแกนตรงกัน → ไม่มีอะไรต้องอัปเดต', () => {
    const r = run('kit-diff.mjs', project);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /ตรงกับ App-Core ตัวนั้นทุกไฟล์/);
  });

  it('App-Core ตัวใหม่แก้/เพิ่ม/ลบไฟล์แกน → แสดงในรายการ (ตัวที่ให้มาคือ "ตัวใหม่")', () => {
    fs.appendFileSync(path.join(project, 'backend/src/core/http.ts'), '\n// แก้ในโปรเจกต์\n');
    fs.writeFileSync(path.join(project, 'backend/src/core/extra_only_here.ts'), '// ไฟล์เพิ่มเอง\n');
    fs.rmSync(path.join(project, 'backend/src/core/crypto.ts'));
    const r = run('kit-diff.mjs', project);
    assert.match(r.stdout, /backend\/src\/core\/http\.ts/);
    assert.match(r.stdout, /backend\/src\/core\/extra_only_here\.ts/);
    assert.match(r.stdout, /backend\/src\/core\/crypto\.ts/);
  });
});

describe('npm run new:page', () => {
  const proj = path.join(tmp, 'page_proj');
  const read = (rel: string) => fs.readFileSync(path.join(proj, rel), 'utf8');

  it('เตรียมโปรเจกต์ชั่วคราว', () => {
    assert.equal(run('new-project.mjs', 'page_proj', proj).status, 0);
  });

  it('ชื่อ/ตัวเลือกไม่ถูกต้อง → ปฏิเสธและไม่สร้างไฟล์', () => {
    assert.match(runIn(proj, 'new-page.mjs').stderr, /ต้องระบุชื่อหน้า/);
    assert.match(runIn(proj, 'new-page.mjs', 'Bad-Name', '--label', 'x').stderr, /ไม่ถูกต้อง/);
    assert.match(runIn(proj, 'new-page.mjs', 'log', '--label', 'x').stderr, /ถูกระบบใช้แล้ว/);
    assert.match(runIn(proj, 'new-page.mjs', 'product', '--label', ' ').stderr, /ว่างไม่ได้/);
    assert.match(runIn(proj, 'new-page.mjs', 'product', '--label', 'a<b').stderr, /อักขระ/);
    assert.match(runIn(proj, 'new-page.mjs', 'product', '--label', 'x', '--from', 'nothere').stderr, /ไม่พบต้นแบบ/);
    assert.ok(!fs.existsSync(path.join(proj, 'backend/src/pages/product.ts')));
  });

  it('สร้างหน้าใหม่จากต้นแบบ vendor และต่อรายการลงทะเบียนให้', () => {
    const r = runIn(proj, 'new-page.mjs', 'product', '--label', 'สินค้า');
    assert.equal(r.status, 0, r.stderr);
    for (const f of ['backend/src/service/product/product_service.ts', 'backend/src/pages/product.ts', 'backend/src/migration/product_migration.ts', 'frontend/src/api/productApi.ts', 'frontend/src/pages/product/ProductPage.tsx']) assert.ok(fs.existsSync(path.join(proj, f)), f);
    assert.match(read('backend/src/pages/product.ts'), /name: 'product'/);
    assert.match(read('backend/src/pages/product.ts'), /from '\.\.\/core\/pages'/); // เลข ../ ของ import แกนถูกลดระดับ
    assert.match(read('backend/src/service/product/product_service.ts'), /from '\.\.\/\.\.\/core/);
    assert.match(read('backend/src/pages/index.ts'), /productPage/);
    assert.match(read('frontend/src/config/routes.tsx'), /\/product\/\*/);
    assert.match(read('frontend/src/config/menu.ts'), /label: 'สินค้า'/);
    assert.ok(!/vendor/i.test(read('backend/src/service/product/product_service.ts')));
  });

  it('มีหน้านั้นอยู่แล้ว → ไม่เขียนทับ', () => {
    const r = runIn(proj, 'new-page.mjs', 'product', '--label', 'สินค้า');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /มีอยู่แล้ว/);
  });

  it('ไม่พบเครื่องหมายลงทะเบียน → หยุดก่อนสร้างไฟล์ครึ่งๆ กลางๆ', () => {
    fs.writeFileSync(path.join(proj, 'frontend/src/config/menu.ts'), '// ไม่มีเครื่องหมาย\n');
    const r = runIn(proj, 'new-page.mjs', 'queue', '--label', 'คิว');
    assert.equal(r.status, 1);
    assert.match(r.stderr, /ไม่พบเครื่องหมาย/);
    assert.ok(!fs.existsSync(path.join(proj, 'backend/src/pages/queue.ts')));
  });
});

describe('npm run setup', () => {
  const proj = path.join(tmp, 'setup_proj');

  it('สร้าง .env พร้อมสุ่มกุญแจ และไม่ทับของเดิม', () => {
    fs.mkdirSync(proj, { recursive: true });
    fs.copyFileSync(path.join(root, '.env.example'), path.join(proj, '.env.example'));
    const r = runIn(proj, 'setup.mjs');
    assert.equal(r.status, 0, r.stderr);
    const env = fs.readFileSync(path.join(proj, '.env'), 'utf8');
    for (const k of ['JWT_SECRET', 'DATA_ENC_KEY', 'HASH_KEY']) assert.match(env, new RegExp(`^${k}=[0-9a-f]{64} #`, 'm'));
    const again = runIn(proj, 'setup.mjs');
    assert.match(again.stdout, /มีไฟล์ .env อยู่แล้ว/);
    assert.equal(fs.readFileSync(path.join(proj, '.env'), 'utf8'), env);
  });
});
