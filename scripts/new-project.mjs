// สร้างโปรเจกต์ใหม่จาก App-Core  —  รัน: npm run new:project <ชื่อโปรเจกต์> [โฟลเดอร์ปลายทาง]
// ก๊อปทั้งชุดไปโฟลเดอร์ใหม่ (ไม่เอา .git, node_modules, dist, .env, ไฟล์ database/ ที่ไม่ใช่ตั้งต้น) แล้วบอกคำสั่ง git init ให้รันต่อ (ไม่เรียก git เอง)
// ประวัติ git ของโปรเจกต์ใหม่เริ่มใหม่หมด (ไม่ใช่ branch ของ App-Core) — ไฟล์ .app-core-base.json จดว่าเริ่มจากเวอร์ชันไหน เอาไว้ให้ npm run kit:diff เทียบ
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];
if (!name || !/^[a-z][a-z0-9_-]{1,40}$/.test(name)) {
  console.error('ใช้: npm run new:project <ชื่อ>   ชื่อเป็นตัวพิมพ์เล็ก/ตัวเลข/-/_ ขึ้นต้นด้วยตัวอักษร เช่น bst_noi');
  process.exit(1);
}
const dest = path.resolve(process.argv[3] ?? path.join(root, '..', name));
if (fs.existsSync(dest) && fs.readdirSync(dest).length > 0) {
  console.error(`โฟลเดอร์ ${dest} มีไฟล์อยู่แล้ว — เลือกชื่ออื่น หรือลบก่อน`);
  process.exit(1);
}

const SKIP = new Set(['.git', 'node_modules', 'dist', '.env', 'coverage', 'backups']);
const skip = (rel) => rel.split(path.sep).some((p) => SKIP.has(p)) || /\.(sql|dump|bak|log)$/.test(rel) && rel !== path.join('database', 'init.sql');

function copy(from, to, rel = '') {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const r = path.join(rel, entry.name);
    if (skip(r)) continue;
    if (entry.isDirectory()) copy(path.join(from, entry.name), path.join(to, entry.name), r);
    else fs.copyFileSync(path.join(from, entry.name), path.join(to, entry.name));
  }
}
copy(root, dest);

const base = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
fs.writeFileSync(path.join(dest, '.app-core-base.json'), JSON.stringify({ app_core_version: base, created: new Date().toISOString().slice(0, 10), project: name }, null, 2) + '\n');

// ตั้งชื่อ package ให้ตรงโปรเจกต์ และรีเซ็ตเวอร์ชันเป็น 0.1.0
for (const f of ['package.json', 'backend/package.json', 'frontend/package.json']) {
  const p = path.join(dest, f);
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.name = f === 'package.json' ? name : `${name}-${f.split('/')[0]}`;
  j.version = '0.1.0';
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
}

console.log(`\nสร้างโปรเจกต์ ${name} แล้วที่ ${dest} (เริ่มจาก App-Core v${base})\nขั้นต่อไป (ประวัติ git เริ่มใหม่): cd ${dest} && git init && git add -A && git commit -m "เริ่มโปรเจกต์ ${name} จาก App-Core v${base}" && npm install && npm run setup && npm run check\nต้องแก้ DB_NAME/TEST_DB_NAME ให้เป็นของโปรเจกต์นี้ — ดู docs/09-เริ่มโปรเจกต์ใหม่และอัปเดตจาก-app-core.md\n`);
console.log('หมายเหตุ: package-lock.json ถูกก๊อปมาด้วย (ชื่อ package ใน lock อาจยังเป็นของ App-Core — npm install จะแก้ให้)');
