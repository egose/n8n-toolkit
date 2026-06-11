import type { HttpClient } from '../http-client.js';
import type { InsightsSummary } from '../types.js';

export default class InsightsHandle {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async getSummary(params?: { startDate?: string; endDate?: string; projectId?: string }): Promise<InsightsSummary> {
    return this.http.get<InsightsSummary>('/insights/summary', params);
  }
}
