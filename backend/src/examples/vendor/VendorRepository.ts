/**
 * VendorRepository.ts — ชั้นที่ "คุยกับฐานข้อมูล" เท่านั้น (เทียบ @Repository / JpaRepository)
 * มีแต่ query ไม่มีกติกาธุรกิจ (กติกาอยู่ที่ VendorService)
 */
import { db, insertGetId, nowIso, whereContains } from '../../core/db';
import { paginate, type Paging, type PageResult } from '../../core/http';
import type { Vendor } from './Vendor';
import type { VendorSaveDto } from './VendorDto';

export class VendorRepository {
  /** รายการแบ่งหน้า + กรอง (q = ค้นจากรหัส/ชื่อ) */
  search(filters: { q: string; category: string }, paging: Paging): Promise<PageResult<Vendor>> {
    const base = db('vendor');
    if (filters.q) {
      base.where((w) => {
        whereContains(w, 'code', filters.q);
        w.orWhere((o) => whereContains(o, 'name', filters.q));
      });
    }
    if (filters.category) base.where('category', filters.category);
    return paginate<Vendor>(paging, base, (q) => q.select('*').orderBy('id', 'desc'));
  }

  findById(id: number): Promise<Vendor | undefined> {
    return db('vendor').where({ id }).first();
  }

  /** หาจากรหัส (exceptId = ไม่นับแถวของตัวเอง ใช้ตอนแก้ไข) */
  findByCode(code: string, exceptId?: number): Promise<Vendor | undefined> {
    const q = db('vendor').where({ code });
    if (exceptId) q.whereNot({ id: exceptId });
    return q.first();
  }

  insert(data: VendorSaveDto): Promise<number> {
    const now = nowIso();
    return insertGetId(db, 'vendor', { ...data, created_at: now, updated_at: now });
  }

  async update(id: number, data: VendorSaveDto): Promise<void> {
    await db('vendor').where({ id }).update({ ...data, updated_at: nowIso() });
  }

  async delete(id: number): Promise<boolean> {
    return (await db('vendor').where({ id }).delete()) > 0;
  }
}
