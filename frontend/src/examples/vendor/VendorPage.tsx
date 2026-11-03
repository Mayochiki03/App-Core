/**
 * VendorPage — "หน้าหลักของฟีเจอร์ vendor": ถือ route ย่อยของตัวเองทั้งหมด
 * ไฟล์กลาง (config/routes.tsx) ลงทะเบียนแค่บรรทัดเดียว  { path: '/vendor/*', element: <VendorPage /> }
 * เพิ่มหน้าย่อยใหม่ (เช่น /vendor/detail) = เพิ่ม <Route> ที่นี่ ไม่ต้องแตะไฟล์กลาง
 *
 *   /vendor        → VendorTable  (กรอง + ตาราง + ปุ่มเพิ่ม)
 *   /vendor/add    → VendorAdd
 *   /vendor/edit   → VendorEdit   (รับ id ผ่าน state ของ router — ไม่ใส่ id ใน URL)
 */
import { Navigate, Route, Routes } from 'react-router';
import VendorAdd from './VendorAdd';
import VendorEdit from './VendorEdit';
import VendorTable from './VendorTable';

export default function VendorPage() {
  return (
    <Routes>
      <Route index element={<VendorTable />} />
      <Route path="add" element={<VendorAdd />} />
      <Route path="edit" element={<VendorEdit />} />
      <Route path="*" element={<Navigate to="/vendor" replace />} />
    </Routes>
  );
}
