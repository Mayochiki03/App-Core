/**
 * pages/vendor — หน้าตัวอย่าง "ตาราง + ฟอร์ม CRUD" (ตัวอย่างคือ ข้อมูลคู่ค้า)
 *
 * ไฟล์นี้ประกอบชั้นต่าง ๆ เข้าด้วยกันด้วยมือ (เทียบ Spring ที่ @Autowired ให้เอง แต่ที่นี่เห็นชัดทุกบรรทัด):
 *   Repository ← Service ← Controller  แล้วลงทะเบียนเป็นหน้า "vendor" (URL: /api/vendor/...)
 *
 * ไล่อ่านตามลำดับ: Vendor (entity) → VendorDto → VendorController → VendorService → VendorRepository → VendorMigration
 * ก๊อปทั้งโฟลเดอร์ไปทำหน้าใหม่ได้เลย (ดู docs/03-ทำหน้าใหม่.md)
 */
import { definePage } from '../../core/pages';
import { VendorController } from './VendorController';
import { vendorMigrations } from './VendorMigration';
import { VendorRepository } from './VendorRepository';
import { VendorService } from './VendorService';

const controller = new VendorController(new VendorService(new VendorRepository()));

export const vendorPage = definePage({
  name: 'vendor',
  roles: ['ADMIN', 'STAFF'],
  router: controller.router,
  migrations: vendorMigrations,
});
