/**
 * examples/vendor — หน้าตัวอย่าง "ตาราง + ฟอร์ม CRUD" (ตัวอย่างคือ ข้อมูลคู่ค้า)
 *
 * ไฟล์นี้ประกอบชั้นต่าง ๆ เข้าด้วยกันด้วยมือ (เทียบ Spring ที่ @Autowired ให้เอง แต่ที่นี่เห็นชัดทุกบรรทัด):
 *   Repository ← Service ← Controller  แล้วลงทะเบียนเป็นหน้า "vendor" (URL: /api/vendor/...)
 *
 * ไล่อ่านตามลำดับ: entity/vendor → dto/vendor → controller/vendor → service/vendor → repository/vendor → migration/vendor_migration
 * โครงโฟลเดอร์: แยกตามชั้น (entity, dto, controller, service, repository) แล้วข้างในแยกตามชื่อหน้า ไฟล์ชื่อ <หน้า>_<layer>.ts
 * สร้างหน้าใหม่จากต้นแบบนี้ด้วย npm run new:page (ดู docs/03-ทำหน้าใหม่.md)
 */
import { definePage } from '../../core/pages';
import { VendorController } from '../controller/vendor/vendor_controller';
import { vendorMigrations } from '../migration/vendor_migration';
import { VendorRepository } from '../repository/vendor/vendor_repository';
import { VendorService } from '../service/vendor/vendor_service';

const controller = new VendorController(new VendorService(new VendorRepository()));

export const vendorPage = definePage({
  name: 'vendor',
  roles: ['ADMIN', 'STAFF'],
  router: controller.router,
  migrations: vendorMigrations,
});
