/**
 * Vendor.ts — Entity: หน้าตาของข้อมูล "คู่ค้า" หนึ่งแถวในฐานข้อมูล (เทียบ @Entity ของ Spring)
 */
export const CATEGORIES = ['BANK', 'HOSPITAL', 'OTHER'] as const;
export type VendorCategory = (typeof CATEGORIES)[number];

export type Vendor = {
  id: number;
  code: string;
  name: string;
  category: VendorCategory;
  email: string;
  is_active: 'Y' | 'N';
  note: string;
  created_at: string;
  updated_at: string;
};
