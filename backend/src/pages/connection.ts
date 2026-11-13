/**
 * pages/connection — หน้าของระบบ: ดูว่าตัวเชื่อมต่อ (LLM, LINE, ฐานข้อมูลภายนอก ...) ต่อได้ไหม — ไม่มี migration
 * เก็บไว้ทุกโปรเจกต์เหมือนหน้า log (ถ้ายังไม่มีตัวเชื่อมต่อจะแสดงว่าว่าง)
 */
import { definePage } from '../core/pages';
import { ConnectionController } from '../controller/connection/connection_controller';
import { ConnectionService } from '../service/connection/connection_service';

const controller = new ConnectionController(new ConnectionService());

export const connectionPage = definePage({
  name: 'connection',
  roles: ['ADMIN'],
  router: controller.router,
});
