import { describe, expect, test } from 'vitest';
import SecurityPolicyClient from '../src/clients/security-policy';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: SecurityPolicy', () => {
  test('get calls GET /settings/security-policy', async () => {
    const policy = {
      personalSpacePublishing: true,
      personalSpaceSharing: false,
      publishedPersonalWorkflowsCount: 1,
      sharedPersonalWorkflowsCount: 2,
      sharedPersonalCredentialsCount: 3,
      redactionEnforcement: { floor: 'production' as const },
    };
    const http = createMockHttpClient([{ body: policy }]);
    const handle = new SecurityPolicyClient(http);

    const result = await handle.get();

    expect(http.get).toHaveBeenCalledWith('/settings/security-policy');
    expect(result).toEqual(policy);
  });

  test('update sends the full writable security policy body', async () => {
    const policy = {
      personalSpacePublishing: true,
      personalSpaceSharing: false,
      publishedPersonalWorkflowsCount: 1,
      sharedPersonalWorkflowsCount: 2,
      sharedPersonalCredentialsCount: 3,
      redactionEnforcement: { floor: 'production' as const },
    };
    const update = {
      personalSpacePublishing: true,
      personalSpaceSharing: false,
      redactionEnforcement: { floor: 'production' as const },
    };
    const http = createMockHttpClient([{ body: policy }]);
    const handle = new SecurityPolicyClient(http);

    const result = await handle.update(update);

    expect(http.put).toHaveBeenCalledWith('/settings/security-policy', update);
    expect(result).toEqual(policy);
  });

  test('get preserves ambiguous 404 responses without guessing the cause', async () => {
    const http = createMockHttpClient([{ status: 404, body: { message: 'Not Found' } }]);
    const handle = new SecurityPolicyClient(http);

    await expect(handle.get()).rejects.toMatchObject({
      status: 404,
      data: { message: 'Not Found' },
    });
  });
});
