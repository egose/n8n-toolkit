import type { IncomingMessage } from 'node:http';

const JSON_CONTENT_TYPE_REGEX = /^application\/(?:json|[a-z0-9.+-]+\+json)\s*(?:;|$)/i;

export class BodyParseError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BodyParseError';
    this.statusCode = statusCode;
  }
}

type BodyCarrier = IncomingMessage & {
  /** Set when an upstream middleware already parsed the body (n8n's bodyParser). */
  body?: unknown;
  /** Set by n8n's global rawBodyReader middleware — the exact request bytes. */
  rawBody?: Buffer | string;
};

export interface JsonBody {
  /** Exact request bytes, or a token-mode re-serialization fallback when only `req.body` exists. */
  raw: string;
  /** Parsed JSON payload. */
  parsed: unknown;
}

function headerValue(req: IncomingMessage, name: string): string | undefined {
  const header = req.headers[name];
  const value = Array.isArray(header) ? header[0] : header;
  return value ? String(value) : undefined;
}

function assertWithinSizeLimit(raw: string, maxBytes: number): void {
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    throw new BodyParseError('Request body too large', 413);
  }
}

function stringifyParsedBody(body: unknown): string {
  try {
    const raw = JSON.stringify(body);
    if (typeof raw !== 'string') {
      throw new BodyParseError('Pre-parsed request body is not valid JSON', 400);
    }
    return raw;
  } catch (error) {
    if (error instanceof BodyParseError) throw error;
    throw new BodyParseError('Pre-parsed request body is not valid JSON', 400);
  }
}

export function assertJsonRequest(req: IncomingMessage): void {
  const contentType = headerValue(req, 'content-type');
  if (!contentType || !JSON_CONTENT_TYPE_REGEX.test(contentType)) {
    throw new BodyParseError('Content-Type must be application/json', 415);
  }

  const contentEncoding = headerValue(req, 'content-encoding');
  if (!contentEncoding) return;

  const encodings = contentEncoding
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (encodings.some((value) => value !== 'identity')) {
    throw new BodyParseError('Unsupported content encoding', 415);
  }
}

export async function readRawBody(
  req: BodyCarrier,
  maxBytes: number,
  options: { allowParsedBodyFallback?: boolean } = {},
): Promise<string> {
  if (req.rawBody !== undefined) {
    const raw = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
    assertWithinSizeLimit(raw, maxBytes);
    return raw;
  }

  if (req.body !== undefined && req.body !== null) {
    if (options.allowParsedBodyFallback === false) {
      throw new BodyParseError('Exact raw request body unavailable for HMAC verification', 400);
    }
    const raw = stringifyParsedBody(req.body);
    assertWithinSizeLimit(raw, maxBytes);
    return raw;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > maxBytes) {
      throw new BodyParseError('Request body too large', 413);
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString('utf8');
}

export function parseJsonBody(raw: string): unknown {
  return parse(raw);
}

/**
 * Read a JSON request body without any framework dependency, preserving the
 * raw bytes for signature verification.
 *
 * Resolution order:
 *   1. `req.rawBody` — set by n8n's global rawBodyReader middleware
 *   2. the raw request stream, collected with a size cap
 *   3. `JSON.stringify(req.body)` — token-mode fallback when only a pre-parsed body exists
 */
export async function readJsonBody(req: BodyCarrier, maxBytes: number): Promise<JsonBody> {
  const raw = await readRawBody(req, maxBytes);
  if (req.body !== undefined && req.body !== null && req.rawBody === undefined) {
    return { raw, parsed: req.body };
  }
  return { raw, parsed: parse(raw) };
}

function parse(raw: string): unknown {
  if (!raw) {
    throw new BodyParseError('Request body is empty', 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new BodyParseError('Request body is not valid JSON', 400);
  }
}
