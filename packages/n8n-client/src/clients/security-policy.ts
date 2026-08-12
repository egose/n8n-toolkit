import type { SecurityPolicy, SecurityPolicyUpdate } from '../types.js';
import BaseClient from './base.js';

export default class SecurityPolicyClient extends BaseClient {
  /**
   * 404 on this optional endpoint is ambiguous in supported n8n versions.
   * It can mean the route is unavailable for the deployed version, feature set,
   * license state, or caller privileges.
   */
  async get(): Promise<SecurityPolicy> {
    return this.http.get<SecurityPolicy>('/settings/security-policy');
  }

  /**
   * n8n expects the full writable policy body here, not a partial patch.
   * A 404 remains ambiguous for the same reasons as `get()`.
   */
  async update(data: SecurityPolicyUpdate): Promise<SecurityPolicy> {
    return this.http.put<SecurityPolicy>('/settings/security-policy', data);
  }
}
