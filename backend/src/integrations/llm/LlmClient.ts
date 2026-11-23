/**
 * LlmClient.ts — ตัวเชื่อมต่อ LLM ที่คุยแบบ OpenAI-compatible (/v1/chat/completions)
 * ใช้ได้กับ Ollama, LM Studio, vLLM และบริการที่พูดมาตรฐานเดียวกัน — เปลี่ยนโมเดล/เครื่องด้วยการแก้ .env
 *
 * ตั้งค่าใน .env:
 *   LLM_BASE_URL=http://127.0.0.1:11434   (Ollama)  หรือ  http://127.0.0.1:1234  (LM Studio)
 *   LLM_MODEL=ชื่อโมเดล   LLM_API_KEY=(ถ้าบริการต้องการ)   LLM_TIMEOUT_SEC=120 (โมเดลในเครื่องตอบช้า จึงตั้งนานกว่าปกติ)
 *   LLM_MODE=real | fake | off
 */
import { env } from '../../core/config';
import { badRequest, HttpError } from '../../core/http';
import type { IntegrationStatus } from '../Integration';
import { fakeLog, integrationMode } from '../mode';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** ตัด / ที่ท้าย URL (ไม่ใช้ regex เพื่อเลี่ยง backtracking ที่ Sonar เตือน) */
const baseUrl = () => {
  const url = env('LLM_BASE_URL', '');
  let end = url.length;
  while (end > 0 && url.charAt(end - 1) === '/') end--;
  return url.slice(0, end);
};

export class LlmClient {
  private get mode() {
    return integrationMode('llm', baseUrl() !== '');
  }

  /** ส่งบทสนทนาแล้วรับคำตอบเป็นข้อความ */
  async chat(messages: ChatMessage[], opts: { model?: string; temperature?: number } = {}): Promise<string> {
    if (this.mode === 'off') throw badRequest('ยังไม่ได้ตั้งค่า LLM — ใส่ LLM_BASE_URL ใน .env');
    if (this.mode === 'fake') {
      const last = messages[messages.length - 1]?.content ?? '';
      fakeLog('llm', `จะถามโมเดล: ${last.slice(0, 120)}`);
      return `[ตอบจำลอง] ${last.slice(0, 60)}`;
    }
    const timeoutMs = Math.max(1, Number(env('LLM_TIMEOUT_SEC', '120')) || 120) * 1000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${baseUrl()}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(env('LLM_API_KEY', '') ? { Authorization: `Bearer ${env('LLM_API_KEY', '')}` } : {}) },
        body: JSON.stringify({ model: opts.model ?? env('LLM_MODEL', ''), messages, temperature: opts.temperature ?? 0.2, stream: false }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new HttpError(502, 'ERROR', `LLM ตอบกลับผิดพลาด (HTTP ${res.status}) — ตรวจ LLM_MODEL และว่าโมเดลถูกโหลดแล้ว`);
      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = json.choices?.[0]?.message?.content;
      if (typeof text !== 'string') throw new HttpError(502, 'ERROR', 'LLM ตอบกลับรูปแบบที่ไม่รู้จัก');
      return text;
    } catch (err) {
      if (err instanceof HttpError) throw err;
      if ((err as { name?: string }).name === 'AbortError') throw new HttpError(504, 'ERROR', `LLM ไม่ตอบภายใน ${timeoutMs / 1000} วินาที (ปรับ LLM_TIMEOUT_SEC ได้)`);
      throw new HttpError(502, 'ERROR', `ต่อ LLM ไม่ได้ (${baseUrl()}) — ตรวจว่าเปิดโปรแกรมโมเดลอยู่ และ LLM_BASE_URL ถูกต้อง`);
    } finally {
      clearTimeout(timer);
    }
  }

  /** ตรวจการเชื่อมต่อ: เรียกรายชื่อโมเดล (ไม่รันโมเดล ไม่เปลืองเวลา) */
  async status(): Promise<IntegrationStatus> {
    const mode = this.mode;
    if (mode === 'off') return { ok: true, mode, detail: 'ปิดอยู่ (ไม่ได้ตั้ง LLM_BASE_URL)' };
    if (mode === 'fake') return { ok: true, mode, detail: 'โหมดจำลอง — ไม่ได้เรียกโมเดลจริง' };
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(`${baseUrl()}/v1/models`, { signal: ctrl.signal, headers: env('LLM_API_KEY', '') ? { Authorization: `Bearer ${env('LLM_API_KEY', '')}` } : {} });
      if (!res.ok) return { ok: false, mode, detail: `ต่อได้แต่ตอบ HTTP ${res.status} — ตรวจ LLM_API_KEY` };
      const json = (await res.json().catch(() => null)) as { data?: { id: string }[] } | null;
      const wanted = env('LLM_MODEL', '');
      const ids = json?.data?.map((m) => m.id) ?? [];
      if (wanted && ids.length && !ids.includes(wanted)) return { ok: false, mode, detail: `ต่อได้ แต่ไม่พบโมเดล "${wanted}" บนเครื่องนั้น (มี: ${ids.slice(0, 5).join(', ')})` };
      return { ok: true, mode, detail: `ต่อได้ (${baseUrl()})${wanted ? ` โมเดล ${wanted}` : ''}` };
    } catch {
      return { ok: false, mode, detail: `ต่อไม่ได้ (${baseUrl()}) — ตรวจว่าเปิดโปรแกรมโมเดลอยู่` };
    } finally {
      clearTimeout(timer);
    }
  }
}
