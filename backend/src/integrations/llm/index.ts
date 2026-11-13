/** integrations/llm — ตัวเชื่อมต่อ LLM (OpenAI-compatible: Ollama / LM Studio / vLLM) ใช้ใน Service ด้วย  import { llm } from '.' */
import type { Integration } from '../Integration';
import { LlmClient } from './LlmClient';

export const llm = new LlmClient();
export type { ChatMessage } from './LlmClient';

export const llmIntegration: Integration = { name: 'llm', title: 'LLM (โมเดลภาษา)', status: () => llm.status() };
