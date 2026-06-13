import type { HttpClient } from '../http-client.js';
import type { Audit, AuditRequest } from '../types.js';
import BaseClient from './base.js';

export default class AuditClient extends BaseClient {
  async generate(data?: AuditRequest): Promise<Audit> {
    return this.http.post<Audit>('/audit', data);
  }
}
