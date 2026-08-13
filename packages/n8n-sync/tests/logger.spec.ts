import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger, logRequest, logResponse } from '../src/shared/logger';

describe('logger sanitization', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts sync auth headers, sanitizes URLs, preserves arrays, and reserves core fields', () => {
    const output: string[] = [];
    vi.spyOn(console, 'info').mockImplementation((message?: unknown) => {
      output.push(String(message));
    });

    const log = createLogger('TestLogger', { minLevel: 'info' });
    log.info('safe message', {
      timestamp: 'attacker-timestamp',
      level: 'attacker-level',
      module: 'attacker-module',
      msg: 'attacker-message',
      headers: {
        Authorization: 'auth-secret',
        'X-Sync-Token': 'sync-token-secret',
        'x-SYNC-signature': ['sig-secret-1', 'sig-secret-2'],
        'X-SYNC-TIMESTAMP': 'ts-secret',
        'x-custom': ['one', 'two'],
      },
      url: 'https://user-secret:pass-secret@example.com/rest?token=query-secret&safe=ok&x-sync-signature=query-sig&list=1&list=2', // pragma: allowlist secret
      target: 'https://sync-user:sync-pass@example.com/rest/sync/v1/events?api_key=key-secret&mode=ok', // pragma: allowlist secret
    });

    expect(output).toHaveLength(1);
    const payload = JSON.parse(output[0]) as Record<string, unknown>;

    expect(payload.timestamp).not.toBe('attacker-timestamp');
    expect(payload.level).toBe('info');
    expect(payload.module).toBe('TestLogger');
    expect(payload.msg).toBe('safe message');
    expect(payload.headers).toEqual({
      Authorization: '[REDACTED]',
      'X-Sync-Token': '[REDACTED]',
      'x-SYNC-signature': '[REDACTED]',
      'X-SYNC-TIMESTAMP': '[REDACTED]',
      'x-custom': 'one,two',
    });
    expect(payload.url).toBe(
      'https://%5BREDACTED%5D:%5BREDACTED%5D@example.com/rest?token=%5BREDACTED%5D&safe=ok&x-sync-signature=%5BREDACTED%5D&list=1&list=2', // pragma: allowlist secret
    );
    expect(payload.target).toBe(
      'https://%5BREDACTED%5D:%5BREDACTED%5D@example.com/rest/sync/v1/events?api_key=%5BREDACTED%5D&mode=ok', // pragma: allowlist secret
    );

    expect(output[0]).not.toContain('auth-secret');
    expect(output[0]).not.toContain('sync-token-secret');
    expect(output[0]).not.toContain('sig-secret-1');
    expect(output[0]).not.toContain('sig-secret-2');
    expect(output[0]).not.toContain('ts-secret');
    expect(output[0]).not.toContain('user-secret');
    expect(output[0]).not.toContain('pass-secret');
    expect(output[0]).not.toContain('query-secret');
    expect(output[0]).not.toContain('query-sig');
    expect(output[0]).not.toContain('sync-user');
    expect(output[0]).not.toContain('sync-pass');
    expect(output[0]).not.toContain('key-secret');
  });

  it('omits request and response bodies from helper logs', () => {
    const debugOutput: string[] = [];
    const warnOutput: string[] = [];
    vi.spyOn(console, 'debug').mockImplementation((message?: unknown) => {
      debugOutput.push(String(message));
    });
    vi.spyOn(console, 'warn').mockImplementation((message?: unknown) => {
      warnOutput.push(String(message));
    });

    const log = createLogger('BodyLogger', { minLevel: 'debug' });
    logRequest(log, {
      method: 'POST',
      url: '/rest/sync/v1/events?secret=req-secret',
      headers: { 'x-sync-token': 'header-secret' },
      body: { token: 'body-secret' },
    });
    logResponse(
      log,
      {
        statusCode: 503,
        headers: { 'x-sync-signature': 'response-secret' },
        body: { credential: 'credential-secret' },
      },
      { target: 'https://name:password@example.com/rest?password=query-password' }, // pragma: allowlist secret
    );

    expect(debugOutput).toHaveLength(1);
    expect(warnOutput).toHaveLength(1);

    const requestPayload = JSON.parse(debugOutput[0]) as Record<string, unknown>;
    const responsePayload = JSON.parse(warnOutput[0]) as Record<string, unknown>;

    expect(requestPayload).not.toHaveProperty('body');
    expect(responsePayload).not.toHaveProperty('body');
    expect(debugOutput[0]).not.toContain('body-secret');
    expect(debugOutput[0]).not.toContain('req-secret');
    expect(debugOutput[0]).not.toContain('header-secret');
    expect(warnOutput[0]).not.toContain('credential-secret');
    expect(warnOutput[0]).not.toContain('response-secret');
    expect(warnOutput[0]).not.toContain('query-password');
    expect(warnOutput[0]).not.toContain('https://name:password@example.com'); // pragma: allowlist secret
    expect(requestPayload.url).toBe('/rest/sync/v1/events?secret=%5BREDACTED%5D');
    expect(responsePayload.target).toBe(
      'https://%5BREDACTED%5D:%5BREDACTED%5D@example.com/rest?password=%5BREDACTED%5D', // pragma: allowlist secret
    );
  });
});
