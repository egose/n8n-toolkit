import type { IncomingMessage } from 'node:http';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { assertJsonRequest, readJsonBody, readRawBody } from '../src/shared/body';

type TestReq = IncomingMessage & { body?: unknown; rawBody?: Buffer | string };

function streamReq(chunks: string[], extra?: { body?: unknown; rawBody?: Buffer | string }): TestReq {
  const req = Readable.from(chunks) as TestReq;
  if (extra?.body !== undefined) req.body = extra.body;
  if (extra?.rawBody !== undefined) req.rawBody = extra.rawBody;
  return req;
}

describe('readJsonBody', () => {
  it('prefers req.rawBody (n8n rawBodyReader) over everything else', async () => {
    const req = streamReq(['{"ignored":true}'], { body: { ignored: true }, rawBody: Buffer.from('{"a":1}') });
    await expect(readJsonBody(req, 1024)).resolves.toEqual({ raw: '{"a":1}', parsed: { a: 1 } });
  });

  it('accepts a string rawBody', async () => {
    const req = streamReq([], { rawBody: '{"b":2}' });
    await expect(readJsonBody(req, 1024)).resolves.toEqual({ raw: '{"b":2}', parsed: { b: 2 } });
  });

  it('falls back to re-serializing an already-parsed body', async () => {
    const parsed = { hello: 'world' };
    const result = await readJsonBody(streamReq([], { body: parsed }), 1024);
    expect(result.parsed).toBe(parsed);
    expect(result.raw).toBe('{"hello":"world"}');
  });

  it('rejects a cyclic pre-parsed body fallback with a controlled 400', async () => {
    const parsed: { self?: unknown } = {};
    parsed.self = parsed;

    await expect(readJsonBody(streamReq([], { body: parsed }), 1024)).rejects.toMatchObject({ statusCode: 400 });
  });

  it('enforces the size limit for an already-parsed body fallback', async () => {
    await expect(readJsonBody(streamReq([], { body: { payload: 'x'.repeat(2048) } }), 1024)).rejects.toMatchObject({
      statusCode: 413,
    });
  });

  it('collects the raw stream and parses JSON', async () => {
    await expect(readJsonBody(streamReq(['{"a":', '1, "b": [2, 3]}']), 1024)).resolves.toEqual({
      raw: '{"a":1, "b": [2, 3]}',
      parsed: { a: 1, b: [2, 3] },
    });
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

  it('rejects oversized stream bodies with status 413', async () => {
    await expect(readJsonBody(streamReq(['{"a":"', 'x'.repeat(2048), '"}']), 1024)).rejects.toMatchObject({
      name: 'BodyParseError',
      statusCode: 413,
    });
  });

  it('rejects oversized rawBody with status 413', async () => {
    const req = streamReq([], { rawBody: 'x'.repeat(2048) });
    await expect(readJsonBody(req, 1024)).rejects.toMatchObject({ statusCode: 413 });
  });
});

describe('readRawBody', () => {
  it('fails closed when exact raw bytes are required but only req.body exists', async () => {
    await expect(
      readRawBody(streamReq([], { body: { hello: 'world' } }), 1024, { allowParsedBodyFallback: false }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Exact raw request body unavailable for HMAC verification',
    });
  });
});

describe('assertJsonRequest', () => {
  it('accepts application/json with charset and identity encoding', () => {
    const req = streamReq([], {});
    req.headers = { 'content-type': 'application/json; charset=utf-8', 'content-encoding': 'identity' };

    expect(() => assertJsonRequest(req)).not.toThrow();
  });

  it('accepts vendor +json content types', () => {
    const req = streamReq([], {});
    req.headers = { 'content-type': 'application/cloudevents+json' };

    expect(() => assertJsonRequest(req)).not.toThrow();
  });

  it('rejects a missing or non-json content type', () => {
    const missing = streamReq([], {});
    missing.headers = {};
    const wrong = streamReq([], {});
    wrong.headers = { 'content-type': 'text/plain' };

    expect(() => assertJsonRequest(missing)).toThrow('Content-Type must be application/json');
    expect(() => assertJsonRequest(wrong)).toThrow('Content-Type must be application/json');
  });

  it('rejects unsupported content encodings', () => {
    const req = streamReq([], {});
    req.headers = { 'content-type': 'application/json', 'content-encoding': 'gzip' };

    expect(() => assertJsonRequest(req)).toThrow('Unsupported content encoding');
  });
});
