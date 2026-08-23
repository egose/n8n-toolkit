import type { IncomingMessage } from 'node:http';
import { hrtime } from 'node:process';

import { createRequestReplayGuard, signPayload } from '../../src/shared/auth';

const SECRET = 's3cret'; // pragma: allowlist secret
const BODY = '{"type":"workflow.delete","workflowId":"wf-1"}';
const TTL_MS = 60 * 60 * 1000;
const LOW_LIVE_ENTRIES = 1_000;
const HIGH_LIVE_ENTRIES = 100_000;
const SAMPLES = 240;
const BATCH_SIZE = 100;
const MAX_ALLOWED_RATIO = 2;

function req(timestamp: number): IncomingMessage {
  const timestampValue = String(timestamp);
  return {
    headers: {
      'x-sync-timestamp': timestampValue,
      'x-sync-signature': signPayload(SECRET, timestampValue, BODY),
    },
  } as unknown as IncomingMessage;
}

function percentile(values: number[], percentileValue: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * percentileValue))] ?? 0;
}

function measure(liveEntries: number): number {
  let now = 1_800_000_000_000;
  let nextTimestamp = now;
  const guard = createRequestReplayGuard({
    ttlMs: TTL_MS,
    maxEntries: liveEntries + SAMPLES * BATCH_SIZE + 1,
    nowMs: () => now,
  });

  for (let index = 0; index < liveEntries; index += 1) {
    const reservation = guard.reserve(req(nextTimestamp));
    if (reservation.status !== 'accepted') throw new Error('failed to seed replay cache');
    reservation.complete();
    nextTimestamp += 1;
  }

  const samples: number[] = [];
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    const started = hrtime.bigint();
    for (let index = 0; index < BATCH_SIZE; index += 1) {
      const reservation = guard.reserve(req(nextTimestamp));
      if (reservation.status !== 'accepted') throw new Error('unexpected replay while measuring');
      reservation.complete();
      nextTimestamp += 1;
    }
    const elapsedNs = Number(hrtime.bigint() - started);
    samples.push(elapsedNs / BATCH_SIZE);
    now += 1;
  }

  return percentile(samples.slice(Math.floor(SAMPLES / 4)), 0.95);
}

const lowP95Ns = measure(LOW_LIVE_ENTRIES);
const highP95Ns = measure(HIGH_LIVE_ENTRIES);
const ratio = highP95Ns / lowP95Ns;

console.log(
  JSON.stringify({
    benchmark: 'replay-cache-reserve-complete',
    lowLiveEntries: LOW_LIVE_ENTRIES,
    highLiveEntries: HIGH_LIVE_ENTRIES,
    lowP95Ns: Math.round(lowP95Ns),
    highP95Ns: Math.round(highP95Ns),
    ratio: Number(ratio.toFixed(3)),
    maxAllowedRatio: MAX_ALLOWED_RATIO,
  }),
);

if (ratio > MAX_ALLOWED_RATIO) {
  throw new Error(
    `replay cache p95 at ${HIGH_LIVE_ENTRIES} live entries exceeded ${MAX_ALLOWED_RATIO}x ` +
      `the ${LOW_LIVE_ENTRIES}-entry p95: ${ratio.toFixed(3)}x`,
  );
}
