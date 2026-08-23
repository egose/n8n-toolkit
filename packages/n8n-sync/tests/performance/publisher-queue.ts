import { hrtime } from 'node:process';

import { createEventSender } from '../../src/publisher/sender';
import type { Logger } from '../../src/shared/logger';
import type { SyncEvent } from '../../src/shared/types';

const LOW_EVENT_COUNT = 20_000;
const HIGH_EVENT_COUNT = 100_000;
const MAX_ALLOWED_RATIO = 7;

const log: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => log,
};

function makeEvent(index: number): SyncEvent {
  return {
    type: 'workflow.delete',
    at: '2026-01-01T00:00:00.000Z',
    sourceId: 'src',
    eventId: `src:delete:wf-${index}`,
    entityRevision: String(index + 1),
    workflowId: `wf-${index}`,
  };
}

async function measure(eventCount: number): Promise<number> {
  const fetchImpl = (() => Promise.resolve({ ok: true, status: 200, body: null } as Response)) as typeof fetch;
  const sender = createEventSender({
    baseUrl: 'https://target.example.com',
    eventsPath: '/rest/sync/v1/events',
    auth: { mode: 'hmac', secret: 's3cret' }, // pragma: allowlist secret
    timeoutMs: 10_000,
    maxAttempts: 1,
    maxQueueSize: eventCount + 1,
    log,
    fetchImpl,
    sleep: () => Promise.resolve(),
  });

  const started = hrtime.bigint();
  for (let index = 0; index < eventCount; index += 1) {
    sender.send(makeEvent(index));
  }
  await sender.drain();
  return Number(hrtime.bigint() - started) / 1_000_000;
}

async function main(): Promise<void> {
  await measure(5_000);
  const lowDurationMs = await measure(LOW_EVENT_COUNT);
  const highDurationMs = await measure(HIGH_EVENT_COUNT);
  const ratio = highDurationMs / lowDurationMs;

  console.log(
    JSON.stringify({
      benchmark: 'publisher-queue-enqueue-and-drain',
      lowEventCount: LOW_EVENT_COUNT,
      highEventCount: HIGH_EVENT_COUNT,
      lowDurationMs: Number(lowDurationMs.toFixed(3)),
      highDurationMs: Number(highDurationMs.toFixed(3)),
      ratio: Number(ratio.toFixed(3)),
      maxAllowedRatio: MAX_ALLOWED_RATIO,
    }),
  );

  if (ratio > MAX_ALLOWED_RATIO) {
    throw new Error(
      `publisher queue enqueue-and-drain for ${HIGH_EVENT_COUNT} events exceeded ${MAX_ALLOWED_RATIO}x ` +
        `the ${LOW_EVENT_COUNT}-event duration: ${ratio.toFixed(3)}x`,
    );
  }
}

void main();
