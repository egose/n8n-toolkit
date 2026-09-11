import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { hostname, tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createEventOrderingAllocator, tryRemovePublisherLockSync } from '../src/publisher/order-state';

function lockPathFor(statePath: string): string {
  return `${statePath}.lock`;
}

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException | undefined)?.code === 'EPERM';
  }
}

function findDeadPid(): number {
  for (let pid = 4_194_303; pid > 4_194_000; pid -= 1) {
    if (!isPidAlive(pid)) return pid;
  }
  throw new Error('could not find a dead PID for lock tests');
}

describe('publisher lock host-awareness and startup wait (PUBLOCK-01)', () => {
  it('cross-host lock with live-PID-number + fresh heartbeat waits, then proceeds once stale', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publock-'));
    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const now = new Date().toISOString();
      // Simulate the previous pod generation: a foreign host whose recycled
      // PID aliases this process's own PID (separate PID namespaces).
      await writeFile(
        lockPathFor(statePath),
        JSON.stringify({
          pid: process.pid,
          owner: 'old-pod-owner',
          host: 'old-pod-host-xyz',
          sourceId: 'source-1',
          statePath,
          acquiredAt: now,
          heartbeatAt: now,
        }),
      );

      let waits = 0;
      let sawDegraded = false;
      const allocator = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath,
        lock: { staleMs: 200, waitTimeoutMs: 5_000, pollMs: 20 },
        onLockWait: () => {
          waits += 1;
          const status = allocator.getStatus();
          if (status.ready === false && status.reason === 'storage_error') sawDegraded = true;
        },
      });

      const start = Date.now();
      await allocator.initialize();
      const elapsedMs = Date.now() - start;

      // Waited (not an instant PID-aliasing failure, not an instant steal),
      // then stole the lock once the foreign heartbeat went stale.
      expect(elapsedMs).toBeGreaterThanOrEqual(150);
      expect(waits).toBeGreaterThan(0);
      expect(sawDegraded).toBe(true);
      expect(allocator.getStatus()).toEqual({ ready: true });

      const raw = JSON.parse(await readFile(lockPathFor(statePath), 'utf8')) as {
        owner: string;
        host: string;
      };
      expect(raw.owner).not.toBe('old-pod-owner');
      expect(raw.host).toBe(hostname());
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('same-host live PID + fresh heartbeat waits out the timeout, then fails loud without stealing', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publock-'));
    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const now = new Date().toISOString();
      await writeFile(
        lockPathFor(statePath),
        JSON.stringify({
          pid: process.pid,
          owner: 'other-owner',
          host: hostname(),
          sourceId: 'source-1',
          statePath,
          acquiredAt: now,
          heartbeatAt: now,
        }),
      );

      let waits = 0;
      const allocator = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath,
        // Staleness window far beyond the wait timeout: the lock stays live
        // for the whole wait, so acquisition must time out, not steal.
        lock: { staleMs: 60_000, waitTimeoutMs: 400, pollMs: 20 },
        onLockWait: () => {
          waits += 1;
        },
      });

      const start = Date.now();
      await expect(allocator.initialize()).rejects.toThrow(/atomic shared allocator/);
      const elapsedMs = Date.now() - start;

      // Waited for the bounded timeout instead of failing/stealing instantly.
      expect(elapsedMs).toBeGreaterThanOrEqual(350);
      expect(waits).toBeGreaterThan(0);
      expect(allocator.getStatus()).toMatchObject({ ready: false, reason: 'storage_error' });

      // Genuinely live lock was not stolen.
      const raw = JSON.parse(await readFile(lockPathFor(statePath), 'utf8')) as { owner: string };
      expect(raw.owner).toBe('other-owner');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('sync lock removal deletes an owned lock, preserves foreign locks, and never throws', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publock-'));
    try {
      const lockPath = join(tempDir, 'publisher-ordering.json.lock');

      await writeFile(lockPath, JSON.stringify({ owner: 'owner-a' }));
      expect(() => tryRemovePublisherLockSync(lockPath, 'owner-a')).not.toThrow();
      await expect(readFile(lockPath, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });

      await writeFile(lockPath, JSON.stringify({ owner: 'owner-a' }));
      expect(() => tryRemovePublisherLockSync(lockPath, 'owner-b')).not.toThrow();
      await expect(readFile(lockPath, 'utf8')).resolves.toContain('owner-a');

      expect(() => tryRemovePublisherLockSync(join(tempDir, 'missing.lock'), 'owner-a')).not.toThrow();

      await writeFile(lockPath, 'not-json{{{');
      expect(() => tryRemovePublisherLockSync(lockPath, 'owner-a')).not.toThrow();
      await expect(readFile(lockPath, 'utf8')).resolves.toBe('not-json{{{');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('SIGTERM handler path leaves no lock file behind', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publock-'));
    try {
      const statePath = join(tempDir, 'publisher-ordering.json');
      const allocator = createEventOrderingAllocator({ sourceId: 'source-1', statePath });
      await allocator.allocate({ type: 'workflow.delete', workflowId: 'wf-1' });
      await expect(readFile(lockPathFor(statePath), 'utf8')).resolves.toContain('owner');

      process.emit('SIGTERM');
      await expect(readFile(lockPathFor(statePath), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('pre-heartbeat lock shape (no host/heartbeatAt) keeps legacy PID behavior', async () => {
    const tempDir = await mkdtemp(join(tmpdir(), 'n8n-sync-publock-'));
    try {
      // Dead PID without host metadata: stolen immediately, no waiting.
      const stalePath = join(tempDir, 'stale-ordering.json');
      await writeFile(
        lockPathFor(stalePath),
        JSON.stringify({
          pid: findDeadPid(),
          owner: 'crashed-owner',
          sourceId: 'source-1',
          statePath: stalePath,
          acquiredAt: new Date().toISOString(),
        }),
      );
      let staleWaits = 0;
      const staleAllocator = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath: stalePath,
        lock: { staleMs: 60_000, waitTimeoutMs: 2_000, pollMs: 20 },
        onLockWait: () => {
          staleWaits += 1;
        },
      });
      await staleAllocator.initialize();
      expect(staleAllocator.getStatus()).toEqual({ ready: true });
      expect(staleWaits).toBe(0);
      const stolen = JSON.parse(await readFile(lockPathFor(stalePath), 'utf8')) as { owner: string };
      expect(stolen.owner).not.toBe('crashed-owner');

      // Live PID without host metadata: still treated as live (legacy PID
      // logic) — waits, then fails loud instead of stealing.
      const livePath = join(tempDir, 'live-ordering.json');
      await writeFile(
        lockPathFor(livePath),
        JSON.stringify({
          pid: process.pid,
          owner: 'live-owner',
          sourceId: 'source-1',
          statePath: livePath,
          acquiredAt: new Date().toISOString(),
        }),
      );
      let liveWaits = 0;
      const liveAllocator = createEventOrderingAllocator({
        sourceId: 'source-1',
        statePath: livePath,
        lock: { staleMs: 60_000, waitTimeoutMs: 400, pollMs: 20 },
        onLockWait: () => {
          liveWaits += 1;
        },
      });
      const start = Date.now();
      await expect(liveAllocator.initialize()).rejects.toThrow(/atomic shared allocator/);
      expect(Date.now() - start).toBeGreaterThanOrEqual(350);
      expect(liveWaits).toBeGreaterThan(0);
      const kept = JSON.parse(await readFile(lockPathFor(livePath), 'utf8')) as { owner: string };
      expect(kept.owner).toBe('live-owner');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
