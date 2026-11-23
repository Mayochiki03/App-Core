// เทียบ "ส่วนแกน (โซนแดง)" ของโปรเจกต์นี้กับ App-Core ตัวใหม่  —  รัน: npm run kit:diff -- <โฟลเดอร์ App-Core ตัวใหม่>
// แสดงไฟล์แกนที่ App-Core เปลี่ยน/เพิ่ม/ลบ และเตือนถ้าโปรเจกต์นี้เคยแก้ไฟล์แกนเอง — ไม่แก้ไฟล์ใดๆ (อ่านอย่างเดียว) คนตัดสินใจก๊อปเอง
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const other = process.argv[2] && path.resolve(process.argv[2]);
if (!other || !fs.existsSync(path.join(other, 'package.json'))) {
  console.error('ใช้: npm run kit:diff -- <โฟลเดอร์ App-Core ตัวใหม่ (clone/แตก zip ไว้ก่อน)>');
  process.exit(1);
}

// โซนแดง = ส่วนแกนที่โปรเจกต์ไม่ควรแก้ (ดู AGENTS.md) — เพิ่มรายการได้ถ้าโปรเจกต์ใช้เกณฑ์ต่างออกไป
const RED = ['backend/src/core', 'backend/src/integrations/Integration.ts', 'backend/src/integrations/mode.ts', 'backend/src/roles.ts', 'frontend/src/api', 'frontend/src/hooks', 'frontend/src/components', 'scripts', 'eslint.config.js', '.gitattributes', 'AGENTS.md', 'docs'];

const walk = (dir, rel = '') =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const r = path.posix.join(rel, e.name);
        return e.isDirectory() ? walk(path.join(dir, e.name), r) : [r];
      })
    : [];
const files = (base) => new Set(RED.flatMap((r) => (fs.existsSync(path.join(base, r)) && fs.statSync(path.join(base, r)).isFile() ? [r] : walk(path.join(base, r), r))));
const hash = (f) => (fs.existsSync(f) ? crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex') : null);

const baseInfo = fs.existsSync(path.join(root, '.app-core-base.json')) ? JSON.parse(fs.readFileSync(path.join(root, '.app-core-base.json'), 'utf8')) : null;
const newVer = JSON.parse(fs.readFileSync(path.join(other, 'package.json'), 'utf8')).version;
console.log(`โปรเจกต์นี้เริ่มจาก App-Core v${baseInfo?.app_core_version ?? '?'}  →  เทียบกับ v${newVer}\n`);

const mine = files(root);
const theirs = files(other);
const all = [...new Set([...mine, ...theirs])].sort((a, b) => a.localeCompare(b));
const changed = [], added = [], removed = [];
for (const f of all) {
  const a = hash(path.join(root, f));
  const b = hash(path.join(other, f));
  if (a === b) continue;
  if (a === null) added.push(f);
  else if (b === null) removed.push(f);
  else changed.push(f);
}
const show = (title, list) => list.length && console.log(`${title} (${list.length})\n${list.map((f) => `  ${f}`).join('\n')}\n`);
show('แกนที่ App-Core เปลี่ยน — ก๊อปทับได้ถ้าโปรเจกต์ไม่ได้แก้ไฟล์นั้นเอง', changed);
show('แกนที่ App-Core เพิ่มใหม่ — ก๊อปมาใส่', added);
show('แกนที่ App-Core ลบ (หรือโปรเจกต์นี้มีเพิ่มเอง) — ตรวจก่อนลบ', removed);
if (!changed.length && !added.length && !removed.length) console.log('ส่วนแกนตรงกับ App-Core ตัวนั้นทุกไฟล์ — ไม่มีอะไรต้องอัปเดต');
console.log('ดูรายการเปลี่ยนแปลงและ "ต้องทำตาม" ของแต่ละเวอร์ชันที่ CHANGELOG.md ของ App-Core ตัวใหม่ ก่อนก๊อปทับ');
