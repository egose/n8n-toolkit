import type { HttpClient } from '../http-client.js';
import type { Audit, AuditRequest } from '../types.js';
import BaseHandle from './base.js';

export default class AuditHandle extends BaseHandle {
  async generate(data?: AuditRequest): Promise<Audit> {
    return this.http.post<Audit>('/audit', data);
  }
}
