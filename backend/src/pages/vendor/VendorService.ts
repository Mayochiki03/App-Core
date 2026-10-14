/**
 * VendorService.ts — ชั้น "กติกาธุรกิจ" (เทียบ @Service)
 * ตัดสินใจว่าทำได้ไหม (เช่น รหัสซ้ำไม่ได้) แล้วค่อยสั่ง Repository — ไม่รู้จัก request/response
 */
import { conflict, notFound } from '../../core/http';
import type { VendorRepository } from './VendorRepository';
import type { VendorSaveDto, VendorSearchDto, VendorUpdateDto } from './VendorDto';

const DUPLICATE_CODE = { code: 'รหัสนี้มีอยู่แล้ว' };

export class VendorService {
  constructor(private repo: VendorRepository) {}

  search({ q, category, pageNo, pageSize }: VendorSearchDto) {
    return this.repo.search({ q, category }, { pageNo, pageSize });
  }

  async get(id: number) {
    const vendor = await this.repo.findById(id);
    if (!vendor) throw notFound('ไม่พบข้อมูลคู่ค้า');
    return vendor;
  }

  async create(dto: VendorSaveDto) {
    if (await this.repo.findByCode(dto.code)) throw conflict('รหัสนี้มีอยู่แล้ว', DUPLICATE_CODE);
    return { id: await this.repo.insert(dto) };
  }

  async update({ id, ...dto }: VendorUpdateDto) {
    await this.get(id); // ไม่พบ = โยน 404
    if (await this.repo.findByCode(dto.code, id)) throw conflict('รหัสนี้มีอยู่แล้ว', DUPLICATE_CODE);
    await this.repo.update(id, dto);
    return { id };
  }

  async remove(id: number) {
    if (!(await this.repo.delete(id))) throw notFound('ไม่พบข้อมูลคู่ค้า');
  }
}
