/**
 * VendorController.ts — ชั้นที่ "รับ request / ส่ง response" (เทียบ @RestController)
 * ทำแค่: ตรวจข้อมูลด้วย DTO → เรียก Service → ห่อผลด้วย ok()
 *
 * ทุก API เป็น POST และส่งข้อมูลใน body — ไม่ส่ง id หรือข้อมูลใด ๆ ทาง URL (ปลอดภัยกว่า และไม่ติด log ของเซิร์ฟเวอร์)
 *   POST /api/vendor/search   { q, category, pageNo, pageSize }
 *   POST /api/vendor/get      { id }
 *   POST /api/vendor/add      { code, name, ... }
 *   POST /api/vendor/update   { id, code, name, ... }
 *   POST /api/vendor/delete   { id }
 */
import { Router, type Request, type Response } from 'express';
import { ok, parse } from '../../core/http';
import { vendorIdDto, vendorSaveDto, vendorSearchDto, vendorUpdateDto } from './VendorDto';
import type { VendorService } from './VendorService';

export class VendorController {
  readonly router = Router();

  constructor(private service: VendorService) {
    this.router.post('/search', this.search);
    this.router.post('/get', this.get);
    this.router.post('/add', this.add);
    this.router.post('/update', this.update);
    this.router.post('/delete', this.remove);
  }

  private search = async (req: Request, res: Response) => {
    res.json(ok(await this.service.search(parse(vendorSearchDto, req.body))));
  };

  private get = async (req: Request, res: Response) => {
    const { id } = parse(vendorIdDto, req.body);
    res.json(ok(await this.service.get(id)));
  };

  private add = async (req: Request, res: Response) => {
    const result = await this.service.create(parse(vendorSaveDto, req.body));
    res.status(201).json(ok(result, 'บันทึกข้อมูลสำเร็จ'));
  };

  private update = async (req: Request, res: Response) => {
    res.json(ok(await this.service.update(parse(vendorUpdateDto, req.body)), 'แก้ไขข้อมูลสำเร็จ'));
  };

  private remove = async (req: Request, res: Response) => {
    const { id } = parse(vendorIdDto, req.body);
    await this.service.remove(id);
    res.json(ok(null, 'ลบข้อมูลสำเร็จ'));
  };
}
