/**
 * api/vendorApi.ts — เรียก API ของหน้า vendor ทั้งหมดไว้ที่เดียว (ชนิดข้อมูล + ฟังก์ชัน)
 * เปลี่ยน endpoint / ชื่อฟิลด์ที่ไฟล์นี้ + ฝั่ง backend (backend/src/pages/vendor/)
 * ส่งข้อมูลทุกอย่างใน body — ไม่ใส่ id ใน URL
 */
import { api, type PageResult } from './client';

export type Vendor = {
  id: number;
  code: string;
  name: string;
  category: 'BANK' | 'HOSPITAL' | 'OTHER';
  email: string;
  is_active: 'Y' | 'N';
  note: string;
  created_at: string;
  updated_at: string;
};

/** ข้อมูลที่กรอกในฟอร์ม (ไม่รวม id / เวลา) */
export type VendorInput = Omit<Vendor, 'id' | 'created_at' | 'updated_at'>;

export type VendorSearch = { q: string; category: string; pageNo: number; pageSize: number };

export const CATEGORY_OPTIONS = [
  { value: 'BANK', label: 'ธนาคาร' },
  { value: 'HOSPITAL', label: 'โรงพยาบาล' },
  { value: 'OTHER', label: 'อื่น ๆ' },
];

export const categoryLabel = (v: string) => CATEGORY_OPTIONS.find((o) => o.value === v)?.label ?? v;

export const vendorApi = {
  search: (p: VendorSearch) => api.post<PageResult<Vendor>>('/vendor/search', p),
  get: (id: number) => api.post<Vendor>('/vendor/get', { id }),
  add: (body: VendorInput) => api.post<{ id: number }>('/vendor/add', body),
  update: (id: number, body: VendorInput) => api.post<{ id: number }>('/vendor/update', { id, ...body }),
  remove: (id: number) => api.post<null>('/vendor/delete', { id }),
};
