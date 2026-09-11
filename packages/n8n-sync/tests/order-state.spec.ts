import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createEventOrderingAllocator } from '../src/publisher/order-state';
import { encodeOrderingTupleKey, getSourceEntityStateKey } from '../src/shared/ordering';
import type { SyncEvent } from '../src/shared/types';
import { createSyncOrderingStore } from '../src/subscriber/order-state';

const baseWorkflow = {
  id: 'wf-1',
  name: 'Workflow',
  active: false,
  isArchived: false,
  nodes: [],
  connections: {},
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function workflowEvent(overrides: Partial<SyncEvent> = {}): SyncEvent {
  return {
    type: 'workflow.upsert',
    at: '2026-01-01T00:00:00.000Z',
    sourceId: 'source-1',
    eventId: 'source-1:1',
    entityRevision: '1',
    workflow: baseWorkflow,
    ...overrides,
  } as SyncEvent;
}

describe('ordering tuple keys', () => {
  it('keeps the documented subscriber collision pair independent', () => {
    const left = workflowEvent({ sourceId: 'a', workflow: { ...baseWorkflow, id: 'workflow:x' } });
    const right = workflowEvent({ sourceId: 'a:workflow', workflow: { ...baseWorkflow, id: 'x' } });

    expect(getSourceEntityStateKey(left)).toBe('["a","workflow","workflow:x"]');
    expect(getSourceEntityStateKey(right)).toBe('["a:workflow","workflow","x"]');
    expect(getSourceEntityStateKey(left)).not.toBe(getSourceEntityStateKey(right));
  });

  it('generates no tuple-key collisions for distinct source/entity tuples', () => {
    const values = ['', 'a', 'a:b', 'workflow', 'workflow:x', '["a"]', 'comma,value', 'quote"value', 'slash\\value'];
    const keys = new Map<string, string>();

    for (const sourceId of values) {
      for (const kind of ['workflow', 'credential', 'execution'] as const) {
        for (const id of values) {
          const tuple = JSON.stringify([sourceId, kind, id]);
          const key = encodeOrderingTupleKey([sourceId, kind, id]);
          expect(keys.get(key)).toBeUndefined();
          keys.set(key, tuple);
        }
      }
    }
  });
});

describe('subscriber ordering state store', () => {
  it('persists version 2 tuple-keyed state and reloads it after restart', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-order-state-'));

    try {
      const statePath = join(tempDir, 'subscriber-ordering.json');
      const event = workflowEvent({ sourceId: 'source:with:colon', eventId: 'source:with:colon:1' });
      await createSyncOrderingStore({ statePath }).recordApplied(event);

      const raw = JSON.parse(await readFile(statePath, 'utf8')) as {
        version: number;
        entities: Record<string, unknown>;
      };
      expect(raw.version).toBe(2);
      expect(Object.keys(raw.entities)).toEqual(['["source:with:colon","workflow","wf-1"]']);

      const restarted = createSyncOrderingStore({ statePath });
      await expect(restarted.inspect(event)).resolves.toMatchObject({ decision: 'duplicate' });
      await expect(
        restarted.inspect(
          workflowEvent({ sourceId: 'source:with:colon', eventId: 'source:with:colon:0', entityRevision: '0' }),
        ),
      ).resolves.toMatchObject({ decision: 'stale' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('refuses legacy version 1 state with explicit backup/reset/resync guidance', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-order-state-'));

    try {
      const statePath = join(tempDir, 'subscriber-ordering.json');
      await writeFile(
        statePath,
        JSON.stringify({
          version: 1,
          entities: {
            'a:workflow:workflow:x': {
              entityRevision: '2',
              eventId: 'a:2',
              type: 'workflow.delete',
              at: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
      );

      const store = createSyncOrderingStore({ statePath });
      await expect(store.inspect(workflowEvent())).rejects.toThrow(
        /Version 1 used ambiguous colon-separated source\/entity keys.*Back up.*reset subscriber sync state.*full source resync/s,
      );
      await expect(store.inspect(workflowEvent())).rejects.toThrow(/Unsupported sync subscriber order state version 1/);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe('publisher ordering state store', () => {
  it('migrates legacy version 1 publisher keys to version 3 source-bound tuple keys and preserves revisions', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      await writeFile(
        statePath,
        JSON.stringify({
          version: 1,
          nextEventSequence: '7',
          entityRevisions: {
            'workflow:workflow:x': '4',
          },
        }),
      );

      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      await expect(allocator.allocate({ type: 'workflow.delete', workflowId: 'workflow:x' })).resolves.toEqual({
        eventId: 'source-1:8',
        entityRevision: '5',
      });

      const raw = JSON.parse(await readFile(statePath, 'utf8')) as {
        version: number;
        sourceId: string;
        entityRevisions: Record<string, string>;
      };
      expect(raw.version).toBe(3);
      expect(raw.sourceId).toBe('source-1');
      expect(raw.entityRevisions).toEqual({ '["workflow","workflow:x"]': '5' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('quarantines foreign-shape state and throws diagnostics with the parsed version', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const fixture = JSON.stringify({ version: 99 });
      await writeFile(statePath, fixture);

      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      const error = await allocator.initialize().then(
        () => {
          throw new Error('expected initialize to throw');
        },
        (e: unknown) => e as Error,
      );

      expect(error.message).toContain(`Invalid sync publisher order state at ${statePath}`);
      expect(error.message).toContain('Parsed version: 99');
      expect(error.message).toContain('stored sourceId');
      expect(error.message).toContain('entity-key count');
      expect(error.message).toContain('supports publisher state versions 1, 2, 3');
      expect(error.message).toMatch(/recover|resync|restore/i);
      expect(allocator.getStatus()).toMatchObject({ ready: false, reason: 'invalid_state' });

      const entries = await readdir(tempDir);
      const backups = entries.filter(
        (name) => name.startsWith('publisher-ordering.json.corrupt.') && name.endsWith('.bak'),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(tempDir, backups[0]), 'utf8')).resolves.toBe(fixture);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('quarantines empty-shape state and reports the missing version JSON type', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const fixture = JSON.stringify({});
      await writeFile(statePath, fixture);

      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      const error = await allocator.initialize().then(
        () => {
          throw new Error('expected initialize to throw');
        },
        (e: unknown) => e as Error,
      );
      expect(error.message).toMatch(/Parsed version: missing \(JSON type object\)/);
      expect(error.message).toContain('supports publisher state versions 1, 2, 3');

      const entries = await readdir(tempDir);
      const backups = entries.filter(
        (name) => name.startsWith('publisher-ordering.json.corrupt.') && name.endsWith('.bak'),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(tempDir, backups[0]), 'utf8')).resolves.toBe(fixture);
      expect(allocator.getStatus()).toMatchObject({ ready: false, reason: 'invalid_state' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('quarantine-resets unknown-shape state on epoch rotation with fresh counters, backup, and reset signal', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const fixture = JSON.stringify({ version: 99, sourceId: 'old-source' });
      await writeFile(statePath, fixture);

      const allocator = createEventOrderingAllocator({
        sourceId: 'new-source',
        statePath,
        invalidState: 'quarantine-reset',
      });
      await allocator.initialize();

      expect(allocator.getStatus()).toEqual({ ready: true });
      const reset = allocator.getInvalidStateReset?.();
      expect(reset).toMatchObject({ previousSourceId: 'old-source', newSourceId: 'new-source' });
      expect(typeof reset?.backupPath).toBe('string');

      const entries = await readdir(tempDir);
      const backups = entries.filter(
        (name) => name.startsWith('publisher-ordering.json.corrupt.') && name.endsWith('.bak'),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(tempDir, backups[0]), 'utf8')).resolves.toBe(fixture);
      expect(reset?.backupPath).toBe(join(tempDir, backups[0]));

      await expect(allocator.allocate({ type: 'workflow.delete', workflowId: 'wf-1' })).resolves.toEqual({
        eventId: 'new-source:1',
        entityRevision: '1',
      });

      const raw = JSON.parse(await readFile(statePath, 'utf8')) as {
        version: number;
        sourceId: string;
        nextEventSequence: string;
        entityRevisions: Record<string, string>;
      };
      expect(raw).toMatchObject({ version: 3, sourceId: 'new-source', nextEventSequence: '1' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('refuses quarantine-reset under the same source identity', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const fixture = JSON.stringify({ version: 99, sourceId: 'source-1' });
      await writeFile(statePath, fixture);

      const allocator = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath,
        invalidState: 'quarantine-reset',
      });
      const error = await allocator.initialize().then(
        () => {
          throw new Error('expected initialize to throw');
        },
        (e: unknown) => e as Error,
      );

      expect(error.message).toMatch(/same SYNC_SOURCE_ID/);
      expect(error.message).toContain('409 SYNC_REVISION_CONFLICT');
      expect(error.message).toContain('silent divergence');
      expect(allocator.getStatus()).toMatchObject({ ready: false, reason: 'invalid_state' });
      expect(allocator.getInvalidStateReset?.()).toBeUndefined();

      const entries = await readdir(tempDir);
      const backups = entries.filter(
        (name) => name.startsWith('publisher-ordering.json.corrupt.') && name.endsWith('.bak'),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(tempDir, backups[0]), 'utf8')).resolves.toBe(fixture);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it.each([
    ['missing stored identity', JSON.stringify({ version: 99 })],
    ['non-string stored identity', JSON.stringify({ version: 99, sourceId: 42 })],
    ['blank stored identity', JSON.stringify({ version: 99, sourceId: '   ' })],
  ])('refuses quarantine-reset with %s', async (_label, fixture) => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publisher-state-'));

    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      await writeFile(statePath, fixture);

      const allocator = createEventOrderingAllocator({
        sourceId: 'new-source',
        statePath,
        invalidState: 'quarantine-reset',
      });
      const error = await allocator.initialize().then(
        () => {
          throw new Error('expected initialize to throw');
        },
        (e: unknown) => e as Error,
      );

      expect(error.message).toContain(`Invalid sync publisher order state at ${statePath}`);
      expect(error.message).toMatch(/no usable stored publisher source identity/);
      expect(allocator.getStatus()).toMatchObject({ ready: false, reason: 'invalid_state' });
      expect(allocator.getInvalidStateReset?.()).toBeUndefined();

      const entries = await readdir(tempDir);
      const backups = entries.filter(
        (name) => name.startsWith('publisher-ordering.json.corrupt.') && name.endsWith('.bak'),
      );
      expect(backups).toHaveLength(1);
      await expect(readFile(join(tempDir, backups[0]), 'utf8')).resolves.toBe(fixture);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
