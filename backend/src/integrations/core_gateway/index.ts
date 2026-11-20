/** integrations/core_gateway — ตัวเชื่อมต่อ Backend Core ใช้ใน Service ด้วย  import { core } from '../../integrations/core_gateway' (คู่มือ: docs/07-ต่อกับ-backend-core.md) */
import type { Integration } from '../Integration';
import { CoreGatewayClient } from './CoreGatewayClient';

export const core = new CoreGatewayClient();
export { CoreGatewayClient, CoreGatewayError } from './CoreGatewayClient';
export type { CoreQuery, CoreQueryResult } from './CoreGatewayClient';

export const coreGatewayIntegration: Integration = { name: 'core', title: 'Backend Core (ตัวกลางข้อมูลโรงพยาบาล)', status: () => core.status() };
