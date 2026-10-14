/**
 * VendorEdit — หน้าแก้ไข (/vendor/edit): รับ id ผ่าน state ของ router (navigate('/vendor/edit', { state: { id } }))
 * แล้วโหลดข้อมูลจาก API มาเติมฟอร์ม — id ไม่อยู่ใน URL (รีเฟรชหน้ายังใช้ได้ เพราะ state อยู่กับประวัติของแท็บ)
 * ถ้าเปิดหน้านี้ตรง ๆ โดยไม่มี id จะเด้งกลับหน้ารายการ
 */
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { vendorApi, type VendorInput } from '../../api/vendorApi';
import { Button } from '../../components/Button';
import { PageCard, PageTitle } from '../../components/PageCard';
import { usePopup } from '../../components/Popup';
import { Spinner } from '../../components/Spinner';
import { applyFieldErrors, noEnterSubmit } from '../../lib/forms';
import { MSG } from '../../lib/messages';
import VendorForm from './VendorForm';

export default function VendorEdit() {
  const id = (useLocation().state as { id?: number } | null)?.id;
  const navigate = useNavigate();
  const popup = usePopup();
  const form = useForm<VendorInput>();
  const { isDirty } = form.formState;
  const [saving, setSaving] = useState(false); // หมุนที่ปุ่มบันทึกเฉพาะตอนส่งข้อมูลจริง (ไม่หมุนตอนรอกดยืนยัน)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void vendorApi.get(id).then((res) => {
      if (res.ok && res.data) {
        const { code, name, category, email, is_active, note } = res.data;
        form.reset({ code, name, category, email, is_active, note });
        setLoading(false);
      } else {
        popup.error(res.message);
        navigate('/vendor');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!id) return <Navigate to="/vendor" replace />;

  const handleSave = form.handleSubmit(async (values) => {
    // ตรวจฟอร์มผ่านแล้ว → ถามยืนยันก่อนบันทึกจริง (ปุ่มโฟกัสที่ "ยกเลิก" ไว้ก่อน กด Enter รัว ๆ ก็ไม่บันทึกโดยไม่ตั้งใจ)
    if (!(await popup.confirm({ title: MSG.confirmSaveTitle, message: MSG.confirmSave, confirmText: MSG.save }))) return;
    setSaving(true);
    const res = await vendorApi.update(id, values).finally(() => setSaving(false));
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
    if (isDirty && !(await popup.confirm({ message: MSG.confirmCancelEdit, danger: true }))) return;
    navigate('/vendor');
  }

  if (loading) return <Spinner />;

  return (
    <>
      <PageTitle>แก้ไขคู่ค้า</PageTitle>
      <PageCard>
        <FormProvider {...form}>
          <form onSubmit={handleSave} onKeyDown={noEnterSubmit} noValidate>
            <VendorForm mode="edit" />
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
