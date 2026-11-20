// ESLint (flat config) — ขั้น "lint" ของ Quality check ใน Deploy Console รัน `npm run lint` จากที่นี่
// โปรเจกต์ที่เริ่มจาก App-Core ใช้ไฟล์นี้ต่อได้เลย (เพิ่มกฎของโปรเจกต์ที่ท้ายไฟล์)
import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', 'test-results/**', 'playwright-report/**', 'backups/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // ตัวแปร/พารามิเตอร์ที่ขึ้นต้นด้วย _ = ตั้งใจไม่ใช้ (เช่น _next ของ Express ที่ต้องมีครบ 4 ตัวถึงจะเป็นตัวจัดการ error)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      // any อนุญาตเมื่อจำเป็นจริง ๆ (ต้องมีคอมเมนต์เหตุผล ตาม AGENTS.md) — เตือนไว้ ไม่ให้ขั้น lint ล้ม
      '@typescript-eslint/no-explicit-any': 'warn',
      // กฎที่ SonarQube จับบ่อย — กันไว้ตั้งแต่ตอนเขียน (ดู AGENTS.md หัวข้อ "กฎโค้ดที่ Sonar จับบ่อย")
      'no-restricted-properties': ['error', { object: 'Math', property: 'random', message: 'Math.random() ไม่ปลอดภัยสำหรับค่าลับ/รหัส — ใช้ crypto.randomBytes / crypto.randomInt (ถ้าใช้สุ่มท่าทาง UI ล้วน ๆ ให้ห่อเป็นฟังก์ชันและใส่คอมเมนต์)' }],
    },
  },
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ['backend/**/*.ts', 'scripts/**/*.mjs', '*.ts', '*.js'],
    languageOptions: { globals: globals.node },
  },
);
