/**
 * ทดสอบสคริปต์ npm run new:project และ npm run kit:diff (รันเป็นโปรเซสจริงในโฟลเดอร์ชั่วคราว ไม่ต้องใช้ฐานข้อมูล)
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
