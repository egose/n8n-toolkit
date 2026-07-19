import type { InsightsSummary, InsightsSummaryParams } from '../types.js';
import BaseClient from './base.js';

export default class InsightsClient extends BaseClient {
  async getSummary(params?: InsightsSummaryParams): Promise<InsightsSummary> {
    return this.http.get<InsightsSummary>('/insights/summary', params);
  }
}
