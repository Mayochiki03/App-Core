/** log_service.ts — หน้านี้อ่านอย่างเดียว ไม่มี Business Logic ส่งต่อไปที่ Repository ตรง ๆ */
import type { LogSearchDto } from '../../dto/log/log_dto';
import type { LogRepository } from '../../repository/log/log_repository';

export class LogService {
  constructor(private repo: LogRepository) {}

  search({ q, page, action, pageNo, pageSize }: LogSearchDto) {
    return this.repo.search({ q, page, action }, { pageNo, pageSize });
  }
}
