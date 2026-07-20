import type { IncomingMessage } from 'node:http';

import { describe, expect, it } from 'vitest';

import { isAuthorized } from '../src/shared/auth';

function reqWithToken(token: string | string[] | undefined): IncomingMessage {
  return { headers: { 'x-sync-token': token } } as unknown as IncomingMessage;
}

describe('isAuthorized', () => {
  it('accepts a matching token', () => {
    expect(isAuthorized(reqWithToken('s3cret'), 's3cret')).toBe(true);
  });

  it('rejects a wrong token', () => {
    expect(isAuthorized(reqWithToken('wrong!'), 's3cret')).toBe(false);
  });

  it('rejects a missing token', () => {
    expect(isAuthorized(reqWithToken(undefined), 's3cret')).toBe(false);
  });

  it('rejects when no secret is configured', () => {
    expect(isAuthorized(reqWithToken('s3cret'), '')).toBe(false);
  });

  it('rejects tokens of different length without throwing', () => {
    expect(isAuthorized(reqWithToken('a-much-longer-token-than-the-secret'), 's3cret')).toBe(false);
  });

  it('uses the first value of a multi-value header', () => {
    expect(isAuthorized(reqWithToken(['s3cret', 'other']), 's3cret')).toBe(true);
  });
});
