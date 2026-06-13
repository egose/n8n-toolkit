import { describe, expect, test } from 'vitest';
import AuditClient from '../src/clients/audit';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: Audit', () => {
  test('generate calls POST /audit', async () => {
    const auditResult = {
      'Credentials Risk Report': { risk: 'low', sections: [] },
      'Database Risk Report': { risk: 'medium', sections: [] },
    };
    const http = createMockHttpClient([{ body: auditResult }]);
    const handle = new AuditClient(http);

    const result = await handle.generate({ additionalOptions: { daysAbandonedWorkflow: 30 } });

    expect(http.post).toHaveBeenCalledWith('/audit', { additionalOptions: { daysAbandonedWorkflow: 30 } });
    expect(result).toEqual(auditResult);
  });

  test('generate without params calls POST /audit with undefined body', async () => {
    const http = createMockHttpClient([{ body: {} }]);
    const handle = new AuditClient(http);

    await handle.generate();

    expect(http.post).toHaveBeenCalledWith('/audit', undefined);
  });
});
