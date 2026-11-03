/**
 * VendorDto.ts — DTO: ข้อมูลที่ "รับเข้า" จากหน้าจอ พร้อมกติกาตรวจ (เทียบ DTO + @Valid ของ Spring)
 * ตรวจไม่ผ่านจะตอบ 400 พร้อมข้อความรายช่อง (หน้าจอขีดแดงช่องนั้นให้เอง)
 */
import { z } from 'zod';
import { idField, pagingShape } from '../../core/http';
import { CATEGORIES } from './Vendor';

/** ช่องข้อมูลของฟอร์ม (ใช้ร่วมกันทั้งเพิ่มและแก้ไข) */
const fields = {
  code: z.string().trim().min(1, 'กรุณากรอกรหัส').max(30, 'รหัสยาวเกิน 30 ตัวอักษร'),
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(150, 'ชื่อยาวเกิน 150 ตัวอักษร'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'กรุณาเลือกประเภท' }) }),
  email: z.union([z.literal(''), z.string().trim().email('อีเมลไม่ถูกต้อง')]).default(''),
  is_active: z.enum(['Y', 'N']).default('Y'),
  note: z.string().trim().max(500, 'หมายเหตุยาวเกิน 500 ตัวอักษร').default(''),
};

export const vendorSaveDto = z.object(fields); // POST /api/vendor/add
export const vendorUpdateDto = z.object({ id: idField, ...fields }); // POST /api/vendor/update
export const vendorIdDto = z.object({ id: idField }); // POST /api/vendor/get  และ /delete
export const vendorSearchDto = z.object({ q: z.string().trim().default(''), category: z.string().default(''), ...pagingShape }); // POST /api/vendor/search

export type VendorSaveDto = z.infer<typeof vendorSaveDto>;
export type VendorUpdateDto = z.infer<typeof vendorUpdateDto>;
export type VendorSearchDto = z.infer<typeof vendorSearchDto>;
