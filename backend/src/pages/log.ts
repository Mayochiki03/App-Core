/**
 * pages/log — หน้าตัวอย่าง "อ่านอย่างเดียว" (ใช้เป็นต้นแบบหน้ารายงาน / log): ไม่มี migration ของตัวเอง
 */
import { definePage } from '../core/pages';
import { LogController } from '../controller/log/log_controller';
import { LogRepository } from '../repository/log/log_repository';
import { LogService } from '../service/log/log_service';

const controller = new LogController(new LogService(new LogRepository()));

export const logPage = definePage({
  name: 'log',
  roles: ['ADMIN'], // เฉพาะผู้ดูแลระบบ
  router: controller.router,
});
