import type { InsightsSummary, InsightsSummaryParams } from '../types.js';
import BaseHandle from './base.js';

export default class InsightsHandle extends BaseHandle {
  async getSummary(params?: InsightsSummaryParams): Promise<InsightsSummary> {
    return this.http.get<InsightsSummary>('/insights/summary', params);
  }
}
