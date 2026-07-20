import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { BodyParseError, readJsonBody } from '../src/shared/body';

function streamReq(chunks: string[], body?: unknown): IncomingMessage & { body?: unknown } {
  const req = Readable.from(chunks) as IncomingMessage & { body?: unknown };
  if (body !== undefined) req.body = body;
  return req;
}

describe('readJsonBody', () => {
  it('returns an already-parsed body as-is', async () => {
    const parsed = { hello: 'world' };
    await expect(readJsonBody(streamReq([], parsed), 1024)).resolves.toBe(parsed);
  });

  it('collects a raw stream and parses JSON', async () => {
    await expect(readJsonBody(streamReq(['{"a":', '1, "b": [2, 3]}']), 1024)).resolves.toEqual({ a: 1, b: [2, 3] });
  });

  it('rejects invalid JSON with status 400', async () => {
    await expect(readJsonBody(streamReq(['not json']), 1024)).rejects.toMatchObject({
      name: 'BodyParseError',
      statusCode: 400,
    });
  });

  it('rejects an empty body with status 400', async () => {
    await expect(readJsonBody(streamReq([]), 1024)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('rejects oversized bodies with status 413', async () => {
    await expect(readJsonBody(streamReq(['{"a":"', 'x'.repeat(2048), '"}']), 1024)).rejects.toMatchObject({
      name: 'BodyParseError',
      statusCode: 413,
    });
  });
});
