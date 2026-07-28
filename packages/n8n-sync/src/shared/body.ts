import type { IncomingMessage } from 'node:http';

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
  /** Exact request bytes (or best available reconstruction) — used for HMAC verification. */
  raw: string;
  /** Parsed JSON payload. */
  parsed: unknown;
}

/**
 * Read a JSON request body without any framework dependency, preserving the
 * raw bytes for signature verification.
 *
 * Resolution order:
 *   1. `req.rawBody` — set by n8n's global rawBodyReader middleware
 *   2. the raw request stream, collected with a size cap
 *   3. `JSON.stringify(req.body)` — last resort when only a pre-parsed body exists
 */
export async function readJsonBody(req: BodyCarrier, maxBytes: number): Promise<JsonBody> {
  if (req.rawBody !== undefined) {
    const raw = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
      throw new BodyParseError('Request body too large', 413);
    }
    return { raw, parsed: parse(raw) };
  }

  if (req.body !== undefined && req.body !== null) {
    const raw = JSON.stringify(req.body);
    if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
      throw new BodyParseError('Request body too large', 413);
    }
    return { raw, parsed: req.body };
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

  const raw = Buffer.concat(chunks).toString('utf8');
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
