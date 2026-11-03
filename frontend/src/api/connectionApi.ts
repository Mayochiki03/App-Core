/** api/connectionApi.ts — เรียก API หน้า "สถานะการเชื่อมต่อ" (อ่านอย่างเดียว) */
import { api } from './client';

export type ConnectionRow = { name: string; title: string; ok: boolean; mode: 'real' | 'fake' | 'off'; detail: string };

export const connectionApi = {
  status: () => api.post<ConnectionRow[]>('/connection/status', {}),
};
