import { describe, expect, test } from 'vitest';
import InsightsClient from '../src/clients/insights';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Insights', () => {
  test('getSummary calls GET /insights/summary with params', async () => {
    const summary = {
      total: { value: 100, deviation: null, unit: 'count' },
      failed: { value: 5, deviation: null, unit: 'count' },
      failureRate: { value: 0.05, deviation: null, unit: 'ratio' },
      timeSaved: { value: 120, deviation: null, unit: 'minute' },
      averageRunTime: { value: 3000, deviation: null, unit: 'millisecond' },
    };
    const http = createMockHttpClient([{ body: summary }]);
    const handle = new InsightsClient(http);

    const result = await handle.getSummary({
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      projectId: 'proj-1',
    });

    expect(http.get).toHaveBeenCalledWith('/insights/summary', {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      projectId: 'proj-1',
    });
    expect(result).toEqual(summary);
  });
});
