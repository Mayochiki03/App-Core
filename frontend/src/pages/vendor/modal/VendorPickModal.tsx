/**
 * VendorPickModal — modal "เลือกคู่ค้าจากรายการ" ของหน้า vendor (ตัวอย่างการใช้ SelectModal)
 * modal ของหน้านี้ทั้งหมดอยู่ในโฟลเดอร์ modal/ — หน้าอื่นที่อยากได้ modal แบบนี้ให้ก๊อปไฟล์นี้ไปแก้
 */
import { vendorApi, categoryLabel, type Vendor } from '../../../api/vendorApi';
import type { Column } from '../../../components/DataTable';
import { SelectModal } from '../../../components/SelectModal';

const columns: Column<Vendor>[] = [
  { header: 'รหัส', cell: (r) => r.code },
  { header: 'ชื่อ', cell: (r) => r.name },
  { header: 'ประเภท', cell: (r) => categoryLabel(r.category) },
];

type Props = { open: boolean; onClose: () => void; onConfirm: (vendor: Vendor) => void };

export default function VendorPickModal({ open, onClose, onConfirm }: Props) {
  return (
    <SelectModal<Vendor>
      open={open}
      onClose={onClose}
      title="เลือกคู่ค้า"
      searchLabel="ค้นหา รหัส / ชื่อ"
      columns={columns}
      rowKey={(r) => r.id}
      fetcher={(p) => vendorApi.search({ ...p, category: '' })}
      onConfirm={(rows) => rows[0] && onConfirm(rows[0])}
    />
  );
}
