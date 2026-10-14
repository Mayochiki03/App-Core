/**
 * VendorTable — หน้ารายการ (index ของ /vendor): แถบกรอง + ปุ่มเพิ่ม + ตาราง (แก้/ลบ) + แบ่งหน้า
 * ก๊อปไฟล์นี้ไปทำหน้ารายการใหม่: แก้ชื่อ api, คอลัมน์ใน columns, ช่องกรองใน "แถบกรอง"
 * ปุ่มแก้ไขส่ง id ผ่าน state ของ router  (ไม่ใส่ id ใน URL)
 */
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CATEGORY_OPTIONS, categoryLabel, vendorApi, type Vendor } from '../../api/vendorApi';
import { Button } from '../../components/Button';
import { DataTable, type Column } from '../../components/DataTable';
import { FilterInput, FilterSelect, PickerInput } from '../../components/Fields';
import { PageCard, PageTitle } from '../../components/PageCard';
import { Pagination } from '../../components/Pagination';
import { usePopup } from '../../components/Popup';
import { useTableData } from '../../hooks/useTableData';
import { MSG } from '../../lib/messages';
import VendorPickModal from './modal/VendorPickModal';

export default function VendorTable() {
  const navigate = useNavigate();
  const popup = usePopup();
  const table = useTableData(vendorApi.search, { q: '', category: '' });
  const [pickOpen, setPickOpen] = useState(false); // เปิด/ปิด modal เลือกคู่ค้า
  const [picked, setPicked] = useState<Vendor | null>(null);

  async function handleDelete(row: Vendor) {
    if (!(await popup.confirm({ title: MSG.delete, message: `${MSG.confirmDelete}\n(${row.code} ${row.name})`, danger: true, confirmText: MSG.delete }))) return;
    const res = await vendorApi.remove(row.id);
    if (res.ok) {
      popup.success(MSG.deleted);
      table.reload();
    } else {
      popup.error(res.message);
    }
  }

  const columns: Column<Vendor>[] = [
    { header: 'No', cell: (_r, i) => (table.paging.pageNo - 1) * table.paging.pageSize + i + 1, className: 'hidden w-14 sm:table-cell' },
    { header: 'รหัส', cell: (r) => r.code },
    { header: 'ชื่อ', cell: (r) => r.name, className: 'min-w-[8rem]' },
    { header: 'ประเภท', cell: (r) => categoryLabel(r.category), className: 'hidden md:table-cell' },
    { header: 'อีเมล', cell: (r) => r.email || '-', className: 'hidden md:table-cell' },
    {
      header: 'สถานะ',
      className: 'hidden sm:table-cell',
      cell: (r) => (
        <span className={r.is_active === 'Y' ? 'whitespace-nowrap rounded bg-success-soft px-2 py-0.5 text-xs text-success-ink' : 'whitespace-nowrap rounded bg-neutral-soft px-2 py-0.5 text-xs text-neutral-ink'}>
          {r.is_active === 'Y' ? 'ใช้งาน' : 'ปิด'}
        </span>
      ),
    },
    {
      header: 'จัดการ',
      align: 'center',
      cell: (r) => (
        <div className="flex justify-center gap-1">
          <Button variant="ghost" size="sm" aria-label={MSG.edit} onClick={() => navigate('/vendor/edit', { state: { id: r.id } })}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label={MSG.delete} className="text-danger" onClick={() => void handleDelete(r)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageTitle>คู่ค้า (Vendor)</PageTitle>

      {/* แถบกรอง */}
      <PageCard className="mb-4">
        <div className="grid gap-3 md:grid-cols-3">
          <FilterInput label="ค้นหา รหัส / ชื่อ" value={table.draft.q} onChange={(v) => table.setDraft('q', v)} onEnter={table.search} />
          <FilterSelect label="ประเภท" value={table.draft.category} onChange={(v) => table.setDraft('category', v)} options={CATEGORY_OPTIONS} />
          {/* ตัวอย่างช่อง "เลือกจากรายการ" (เปิด modal) — เลือกแล้วเติมรหัสลงช่องค้นหา */}
          <PickerInput
            label="เลือกจากรายการ"
            value={picked ? `${picked.code} ${picked.name}` : ''}
            onOpen={() => setPickOpen(true)}
            onClear={() => {
              setPicked(null);
              table.setDraft('q', '');
            }}
          />
        </div>
        <div className="mt-3 flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPicked(null);
              table.reset();
            }}
          >
            {MSG.reset}
          </Button>
          <Button onClick={table.search}>{MSG.search}</Button>
        </div>
      </PageCard>

      {/* ตาราง */}
      <PageCard
        title="รายการคู่ค้า"
        actions={
          <Button onClick={() => navigate('/vendor/add')}>
            <Plus className="size-4" />
            {MSG.add}
          </Button>
        }
      >
        <DataTable columns={columns} rows={table.rows} rowKey={(r) => r.id} loading={table.loading} />
        <Pagination paging={table.paging} onPage={table.goPage} onPageSize={table.changePageSize} />
      </PageCard>

      <VendorPickModal
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onConfirm={(v) => {
          setPicked(v);
          table.setDraft('q', v.code);
        }}
      />
    </>
  );
}
