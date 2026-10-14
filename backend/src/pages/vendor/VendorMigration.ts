/**
 * VendorMigration.ts — สร้างตารางของหน้านี้ (รันให้อัตโนมัติ — ดู core/migrate.ts)
 * สำคัญ: ใช้ knex schema builder เท่านั้น ห้าม ENUM / SQL ดิบ (เพื่อให้ใช้ได้ทุกฐานข้อมูล)
 */
import type { Migration } from '../../core/pages';

export const vendorMigrations: Migration[] = [
  {
    name: '20260105_vendor', // ต้องไม่ซ้ำ และเรียงตามวันที่
    async up(db) {
      await db.schema.createTable('vendor', (t) => {
        t.increments('id');
        t.string('code', 30).notNullable().unique();
        t.string('name', 150).notNullable();
        t.string('category', 20).notNullable();
        t.string('email', 150).notNullable().defaultTo('');
        t.string('is_active', 1).notNullable().defaultTo('Y');
        t.string('note', 500).notNullable().defaultTo('');
        t.string('created_at', 30).notNullable();
        t.string('updated_at', 30).notNullable();
      });
    },
    async down(db) {
      await db.schema.dropTableIfExists('vendor');
    },
  },
];
