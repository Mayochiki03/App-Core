/**
 * connection_controller.ts — หน้า "สถานะการเชื่อมต่อ" (อ่านอย่างเดียว) มี API เดียว
 *   POST /api/connection/status   (ไม่มีข้อมูลใน body)
 */
import { Router, type Request, type Response } from 'express';
import { ok } from '../../core/http';
import type { ConnectionService } from '../../service/connection/connection_service';

export class ConnectionController {
  readonly router = Router();

  constructor(private service: ConnectionService) {
    this.router.post('/status', this.status);
  }

  private status = async (_req: Request, res: Response) => {
    res.json(ok(await this.service.status()));
  };
}
