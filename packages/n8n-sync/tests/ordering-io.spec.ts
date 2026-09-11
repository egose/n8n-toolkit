import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { readJsonFile, writeJsonFileAtomic } from '../src/shared/ordering';

interface MarkerPayload {
  seq: number;
  echo: number;
  filler: string;
}

function makePayload(seq: number): MarkerPayload {
  return { seq, echo: seq, filler: `${'x'.repeat(4096)}${seq}` };
}

function expectConsistentPayload(parsed: unknown, validSeqs: Set<number>): void {
  expect(parsed).toBeTypeOf('object');
  const record = parsed as MarkerPayload;
  expect(record.echo).toBe(record.seq);
  expect(record.filler).toBe(`${'x'.repeat(4096)}${record.seq}`);
  expect(validSeqs.has(record.seq)).toBe(true);
}

describe('writeJsonFileAtomic crash durability', () => {
  it('leaves valid, internally consistent JSON under parallel writers to one path', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-ordering-io-'));
    try {
      const statePath = join(tempDir, 'shared-state.json');
      const writerCount = 8;
      const iterations = 25;
      const validSeqs = new Set<number>();
      const payloadBySeq = new Map<number, MarkerPayload>();
      let nextSeq = 0;
      const planned: MarkerPayload[] = [];
      for (let i = 0; i < writerCount * iterations; i += 1) {
        const payload = makePayload(nextSeq);
        nextSeq += 1;
        planned.push(payload);
        validSeqs.add(payload.seq);
        payloadBySeq.set(payload.seq, payload);
      }

      // Interleaved readers must never observe a torn (unparseable or mixed) file.
      const reader = async (): Promise<void> => {
        for (let i = 0; i < 50; i += 1) {
          let raw: string;
          try {
            raw = await readFile(statePath, 'utf8');
          } catch (error) {
            if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') continue;
            throw error;
          }
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw) as unknown;
          } catch {
            throw new Error(`torn read: unparseable JSON at ${statePath}: ${raw.slice(0, 120)}`);
          }
          expectConsistentPayload(parsed, validSeqs);
        }
      };

      const writers = planned.map((payload) => writeJsonFileAtomic(statePath, payload));
      const readers = Array.from({ length: 4 }, () => reader());
      await Promise.all([...writers, ...readers]);

      const final = await readJsonFile<MarkerPayload>(statePath);
      expect(final).toBeDefined();
      expectConsistentPayload(final, validSeqs);
      expect(payloadBySeq.get((final as MarkerPayload).seq)).toEqual(final);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
