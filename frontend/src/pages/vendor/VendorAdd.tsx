/**
 * VendorAdd — หน้าเพิ่มข้อมูล (/vendor/add): ฟอร์ม + ปุ่ม ยกเลิก/บันทึก
 * ลำดับตอนกดบันทึก: ตรวจฟอร์ม → popup ถามยืนยัน → vendorApi.add → สำเร็จ = popup แล้วกลับหน้ารายการ
 *                   ซ้ำ/ข้อมูลผิด = ขีดแดงช่องที่ผิด / อย่างอื่น = popup error
 */
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { vendorApi, type VendorInput } from '../../api/vendorApi';
import { Button } from '../../components/Button';
import { PageCard, PageTitle } from '../../components/PageCard';
import { usePopup } from '../../components/Popup';
import { applyFieldErrors, noEnterSubmit } from '../../lib/forms';
import { MSG } from '../../lib/messages';
import VendorForm from './VendorForm';

const DEFAULTS: VendorInput = { code: '', name: '', category: 'BANK', email: '', is_active: 'Y', note: '' };

export default function VendorAdd() {
  const navigate = useNavigate();
  const popup = usePopup();
  const form = useForm<VendorInput>({ defaultValues: DEFAULTS });
  // อ่านจาก formState ตอน render (ไม่ใช่ใน handler) ไม่งั้น react-hook-form ไม่อัปเดตค่าให้
  const { isDirty } = form.formState;
  const [saving, setSaving] = useState(false); // หมุนที่ปุ่มบันทึกเฉพาะตอนส่งข้อมูลจริง (ไม่หมุนตอนรอกดยืนยัน)

  const handleSave = form.handleSubmit(async (values) => {
    // ตรวจฟอร์มผ่านแล้ว → ถามยืนยันก่อนบันทึกจริง (ปุ่มโฟกัสที่ "ยกเลิก" ไว้ก่อน กด Enter รัว ๆ ก็ไม่บันทึกโดยไม่ตั้งใจ)
    if (!(await popup.confirm({ title: MSG.confirmSaveTitle, message: MSG.confirmSave, confirmText: MSG.save }))) return;
    setSaving(true);
    const res = await vendorApi.add(values).finally(() => setSaving(false));
    if (res.ok) {
      popup.success(MSG.saved);
      navigate('/vendor');
    } else if (res.status === 'DUPLICATE' || res.status === 'VALIDATION') {
      applyFieldErrors(form.setError, res);
      popup.warn(res.message);
    } else {
      popup.error(res.message);
    }
  });

  async function handleCancel() {
    if (isDirty && !(await popup.confirm({ message: MSG.confirmCancelAdd, danger: true }))) return;
    navigate('/vendor');
  }

  return (
    <>
      <PageTitle>เพิ่มคู่ค้า</PageTitle>
      <PageCard>
        <FormProvider {...form}>
          <form onSubmit={handleSave} onKeyDown={noEnterSubmit} noValidate>
            <VendorForm mode="add" />
            <div className="mt-6 flex justify-center gap-3 border-t border-border pt-4">
              <Button variant="outline" onClick={() => void handleCancel()}>
                {MSG.cancel}
              </Button>
              <Button type="submit" loading={saving}>
                {MSG.save}
              </Button>
            </div>
          </form>
        </FormProvider>
      </PageCard>
    </>
  );
}
