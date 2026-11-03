/**
 * scripts/new-page.mjs — สร้าง "หน้าใหม่" จากหน้าตัวอย่าง (npm run new:page <ชื่อ> -- --label <ชื่อไทย>)
 *
 * ทำสิ่งเดียวกับที่ docs/03 สอนให้ทำมือ แต่ไม่ผิดพลาด: ก๊อปต้นแบบ 1 หน้า (ทั้งหลังบ้านและหน้าเว็บ) เปลี่ยนชื่อ
 * แล้วต่อรายการลงทะเบียน 4 จุดให้ (backend pages/index.ts, frontend routes.tsx, menu.ts)
 * ผลลัพธ์เป็นไฟล์ธรรมดาที่อ่านและแก้ได้เหมือนเขียนเอง — ไม่มีโค้ดอัตโนมัติซ่อนอยู่ในระบบ
 *
 * ตัวอย่าง:  npm run new:page product -- --label สินค้า
 * ชื่อ: ตัวพิมพ์เล็กอังกฤษ/ตัวเลข คำเดียว เอกพจน์ (product, bed, queue)
 * ต้นแบบ: --from vendor (ค่าเริ่มต้น; ดูรายการที่ backend/src/examples/)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const die = (msg) => {
  console.error(`\nสร้างหน้าไม่สำเร็จ: ${msg}\n`);
  process.exit(1);
};

// ---------- อ่านคำสั่ง ----------
const args = process.argv.slice(2);
const flag = (key, fallback) => {
  const i = args.indexOf(`--${key}`);
  return i >= 0 ? (args[i + 1] ?? '') : fallback;
};
const name = args.find((a, i) => !a.startsWith('--') && !(args[i - 1] ?? '').startsWith('--'));
const from = flag('from', 'vendor');
const label = flag('label', name ?? '');

if (!name) die('ต้องระบุชื่อหน้า เช่น  npm run new:page product -- --label สินค้า');
if (!/^[a-z][a-z0-9]{1,29}$/.test(name)) die(`ชื่อ "${name}" ไม่ถูกต้อง — ใช้ตัวพิมพ์เล็กอังกฤษหรือตัวเลข คำเดียว 2-30 ตัว เช่น product`);
if (!/^[a-z][a-z0-9]*$/.test(from)) die('--from ไม่ถูกต้อง');
if (!label.trim()) die('--label ว่างไม่ได้');
if (/[<>{}`$\\]/.test(label)) die('--label มีอักขระที่ใช้ไม่ได้');
if (['log', 'auth', 'app', 'health', 'connection'].includes(name)) die(`ชื่อ "${name}" ถูกระบบใช้แล้ว`);

const Pascal = name[0].toUpperCase() + name.slice(1);
const FromPascal = from[0].toUpperCase() + from.slice(1);
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

const be = { src: path.join(ROOT, 'backend/src/examples', from), dst: path.join(ROOT, 'backend/src/pages', name) };
const fe = { src: path.join(ROOT, 'frontend/src/examples', from), dst: path.join(ROOT, 'frontend/src/pages', name) };
const apiDst = path.join(ROOT, 'frontend/src/api', `${name}Api.ts`);

if (!fs.existsSync(be.src) || !fs.existsSync(fe.src)) die(`ไม่พบต้นแบบ "${from}" ใน backend/src/examples และ frontend/src/examples`);
for (const p of [be.dst, fe.dst, apiDst]) if (fs.existsSync(p)) die(`มีอยู่แล้ว: ${path.relative(ROOT, p)} (ไม่เขียนทับ)`);

// ---------- เปลี่ยนชื่อในเนื้อไฟล์ ----------
const rename = (s) =>
  s
    .replaceAll(`คู่ค้า (${FromPascal})`, label) // หัวข้อ "คู่ค้า (Vendor)"
    .replace(new RegExp(`\\d{8}_${from}`, 'g'), `${today}_${name}`) // ชื่อ migration ใหม่กว่าเดิมและไม่ซ้ำ
    .replaceAll('คู่ค้า', label)
    .replaceAll(FromPascal, Pascal)
    .replaceAll(from, name);

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? listFiles(path.join(dir, e.name)).map((f) => path.join(e.name, f)) : [e.name]));
}

/** สร้างรายการ [ปลายทาง, เนื้อหา] ในหน่วยความจำก่อน — ถ้าอะไรพลาดจะไม่เหลือไฟล์ครึ่งๆ กลางๆ */
const out = [];
for (const rel of listFiles(be.src)) {
  if (rel.endsWith('README.md')) continue;
  out.push([path.join(be.dst, rename(rel)), rename(fs.readFileSync(path.join(be.src, rel), 'utf8'))]);
}
for (const rel of listFiles(fe.src)) {
  if (rel.endsWith('README.md')) continue;
  let text = fs.readFileSync(path.join(fe.src, rel), 'utf8');
  if (rel === `${from}Api.ts`) {
    // ไฟล์ api ย้ายไปอยู่ src/api/ (นอกโฟลเดอร์หน้า)
    text = text
      .replace("'../../api/client'", "'./client'")
      .replace(`examples/${from}/${from}Api.ts`, `api/${name}Api.ts`)
      .replace(`backend/src/examples/${from}/`, `backend/src/pages/${name}/`);
    out.push([apiDst, rename(text)]);
    continue;
  }
  // import ไฟล์ api: จากตัวอย่างอยู่ข้างๆ → ไปที่ src/api/
  text = text.replaceAll(`'./${from}Api'`, `'../../api/${name}Api'`).replaceAll(`'../${from}Api'`, `'../../../api/${name}Api'`);
  out.push([path.join(fe.dst, rename(rel)), rename(text)]);
}

// ---------- ต่อรายการลงทะเบียน (แทรกก่อนบรรทัดที่มี @new-page) ----------
const edits = [
  [path.join(ROOT, 'backend/src/pages/index.ts'), '// @new-page:import', `import { ${name}Page } from './${name}';`],
  [path.join(ROOT, 'backend/src/pages/index.ts'), '// @new-page:list', `  ${name}Page, // ${label}`],
  [path.join(ROOT, 'frontend/src/config/routes.tsx'), '// @new-page:import', `import ${Pascal}Page from '../pages/${name}/${Pascal}Page';`],
  [path.join(ROOT, 'frontend/src/config/routes.tsx'), '// @new-page:route', `  { path: '/${name}/*', element: <${Pascal}Page />, roles: ALL_STAFF }, // ${label}`],
  [path.join(ROOT, 'frontend/src/config/menu.ts'), '// @new-page:menu', `      { label: '${label}', path: '/${name}' },`],
];
const patched = new Map();
for (const [file, marker, line] of edits) {
  const cur = patched.get(file) ?? fs.readFileSync(file, 'utf8');
  const i = cur.indexOf(marker);
  if (i < 0) die(`ไม่พบเครื่องหมาย "${marker}" ใน ${path.relative(ROOT, file)} — ลงทะเบียนมือตาม docs/03 แทน (ยังไม่มีไฟล์ใดถูกสร้าง)`);
  const lineStart = cur.lastIndexOf('\n', i) + 1;
  patched.set(file, cur.slice(0, lineStart) + line + '\n' + cur.slice(lineStart));
}

// ---------- เขียนจริง ----------
for (const [file, text] of out) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
for (const [file, text] of patched) fs.writeFileSync(file, text);

console.log(`\nสร้างหน้า "${label}" (${name}) จากต้นแบบ ${from} แล้ว\n`);
for (const [file] of out) console.log('  + ' + path.relative(ROOT, file));
console.log('  ~ backend/src/pages/index.ts, frontend/src/config/routes.tsx, frontend/src/config/menu.ts (ต่อรายการให้แล้ว)');
console.log(`
ขั้นต่อไป (ไล่จากข้อมูลออกมาหน้าจอ):
  1. แก้ฟิลด์ให้ตรงกับข้อมูลจริง: ${Pascal}.ts, ${Pascal}Dto.ts, ${Pascal}Migration.ts, ${Pascal}Form.tsx, ${Pascal}Table.tsx, api/${name}Api.ts
  2. npm run check   (ตรวจ TypeScript)
  3. npm run dev     แล้วเปิดเมนู "${label}"
`);
