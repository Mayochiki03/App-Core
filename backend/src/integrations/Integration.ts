/**
 * integrations/Integration.ts — รูปแบบกลางของ "ตัวเชื่อมต่อ" (LINE, MOPH Notify, LLM, Core Backend ...)
 * ตัวเชื่อมต่อ 1 ตัว = 1 โฟลเดอร์ใน src/integrations/<ชื่อ>/ แล้วประกาศตัวเองใน integrations/index.ts (ดู README.md)
 */
export type IntegrationMode = 'real' | 'fake' | 'off';

export type IntegrationStatus = {
  /** ใช้งานได้ตอนนี้ไหม (off ที่ตั้งใจปิด = ok:true แต่ mode:'off') */
  ok: boolean;
  mode: IntegrationMode;
  /** ข้อความภาษาไทยที่คนอ่านแล้วรู้ว่าติดอะไร */
  detail: string;
};

export type Integration = {
  /** ชื่อสั้น ใช้เป็นคำนำหน้าตัวแปรใน .env ด้วย เช่น llm → LLM_BASE_URL */
  name: string;
  /** ชื่อที่แสดงบนหน้าสถานะ */
  title: string;
  /** ตรวจว่าเชื่อมต่อได้ไหม (ต้องไม่ส่งข้อความหาคนจริง ไม่เปลี่ยนข้อมูลของระบบปลายทาง) */
  status: () => Promise<IntegrationStatus>;
};
