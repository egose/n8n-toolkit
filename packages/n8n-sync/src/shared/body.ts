import type { IncomingMessage } from 'node:http';

export class BodyParseError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'BodyParseError';
    this.statusCode = statusCode;
  }
}

type BodyCarrier = IncomingMessage & { body?: unknown };

/**
 * Read and parse a JSON request body without any framework dependency.
 *
 * If an upstream middleware (e.g. n8n's own body parser) already parsed the
 * body, the parsed value is returned as-is. Otherwise the raw request stream
 * is collected with a size cap and parsed.
 */
export async function readJsonBody(req: BodyCarrier, maxBytes: number): Promise<unknown> {
  if (req.body !== undefined && req.body !== null) return req.body;

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
  if (!raw) {
    throw new BodyParseError('Request body is empty', 400);
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new BodyParseError('Request body is not valid JSON', 400);
  }
}
