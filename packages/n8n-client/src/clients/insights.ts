import type { InsightsSummary, InsightsSummaryParams } from '../types.js';
import BaseClient from './base.js';
import { normalizeInsightsSummary } from '../response-mappers.js';

export default class InsightsClient extends BaseClient {
  async getSummary(params?: InsightsSummaryParams): Promise<InsightsSummary> {
    return normalizeInsightsSummary(await this.http.get<InsightsSummary>('/insights/summary', params));
  }
}
