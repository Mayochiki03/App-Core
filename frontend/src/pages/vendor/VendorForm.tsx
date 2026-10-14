/**
 * VendorForm — ช่องกรอกของฟอร์ม (ใช้ร่วมกันทั้งหน้าเพิ่มและหน้าแก้ไข)
 * ต้องอยู่ภายใน <FormProvider> — VendorAdd / VendorEdit เป็นคนครอบให้
 * mode="edit" ใช้ล็อกช่องที่ห้ามแก้ตอนแก้ไข (ตัวอย่าง: ล็อกรหัส)
 */
import { CATEGORY_OPTIONS } from '../../api/vendorApi';
import { RadioField, SelectField, TextAreaField, TextField } from '../../components/Fields';

type Props = { mode: 'add' | 'edit' };

export default function VendorForm({ mode }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField name="code" label="รหัส" required maxLength={30} readOnly={mode === 'edit'} hint={mode === 'edit' ? 'รหัสแก้ไขไม่ได้' : undefined} />
      <TextField name="name" label="ชื่อ" required maxLength={150} />
      <SelectField name="category" label="ประเภท" required options={CATEGORY_OPTIONS} />
      <TextField name="email" label="อีเมล" type="email" maxLength={150} />
      <RadioField
        name="is_active"
        label="สถานะ"
        required
        options={[
          { value: 'Y', label: 'ใช้งาน' },
          { value: 'N', label: 'ปิดใช้งาน' },
        ]}
      />
      <TextAreaField name="note" label="หมายเหตุ" maxLength={500} className="md:col-span-2" />
    </div>
  );
}
