import { describe, expect, it } from 'vitest';

type EntityKind = 'workflow' | 'credential';

type ApplyOutcome =
  | { status: 'applied'; targetEntityId: string }
  | { status: 'forbidden'; code: 'SYNC_SOURCE_FORBIDDEN' }
  | { status: 'retired'; code: 'SYNC_SOURCE_RETIRED' };

type AppliedOutcome = Extract<ApplyOutcome, { status: 'applied' }>;

interface OwnershipRecord {
  sourceId: string;
  kind: EntityKind;
  sourceEntityId: string;
  targetEntityId: string;
  deleted: boolean;
}

class PocIdentityContractStore {
  private readonly authBindings = new Map<string, { sourceId: string; retired?: boolean }>();
  private readonly rows = new Map<string, { id: string; native: boolean; deleted: boolean }>();
  private readonly ownership = new Map<string, OwnershipRecord>();
  private sequence = 0;

  bindCredential(authKeyId: string, sourceId: string): void {
    this.authBindings.set(authKeyId, { sourceId });
  }

  retireSource(sourceId: string): void {
    for (const [authKeyId, binding] of this.authBindings.entries()) {
      if (binding.sourceId === sourceId) {
        this.authBindings.set(authKeyId, { ...binding, retired: true });
      }
    }
  }

  createNative(kind: EntityKind, id: string): void {
    this.rows.set(this.rowKey(kind, id), { id, native: true, deleted: false });
  }

  hasLiveRow(kind: EntityKind, id: string): boolean {
    return this.rows.get(this.rowKey(kind, id))?.deleted === false;
  }

  isNativeRow(kind: EntityKind, id: string): boolean {
    const row = this.rows.get(this.rowKey(kind, id));
    return row?.native === true && row.deleted === false;
  }

  getOwnership(sourceId: string, kind: EntityKind, sourceEntityId: string): OwnershipRecord | undefined {
    return this.ownership.get(this.ownershipKey(sourceId, kind, sourceEntityId));
  }

  upsert(authKeyId: string, sourceId: string, kind: EntityKind, sourceEntityId: string): ApplyOutcome {
    const auth = this.authBindings.get(authKeyId);
    if (!auth || auth.sourceId !== sourceId) {
      return { status: 'forbidden', code: 'SYNC_SOURCE_FORBIDDEN' };
    }
    if (auth.retired) {
      return { status: 'retired', code: 'SYNC_SOURCE_RETIRED' };
    }

    const ownershipKey = this.ownershipKey(sourceId, kind, sourceEntityId);
    const existing = this.ownership.get(ownershipKey);
    if (existing) {
      this.rows.set(this.rowKey(kind, existing.targetEntityId), {
        id: existing.targetEntityId,
        native: false,
        deleted: false,
      });
      this.ownership.set(ownershipKey, { ...existing, deleted: false });
      return { status: 'applied', targetEntityId: existing.targetEntityId };
    }

    const targetEntityId = this.generateTargetId(kind);
    const record: OwnershipRecord = { sourceId, kind, sourceEntityId, targetEntityId, deleted: false };
    this.ownership.set(ownershipKey, record);
    this.rows.set(this.rowKey(kind, targetEntityId), { id: targetEntityId, native: false, deleted: false });
    return { status: 'applied', targetEntityId };
  }

  delete(authKeyId: string, sourceId: string, kind: EntityKind, sourceEntityId: string): ApplyOutcome {
    const auth = this.authBindings.get(authKeyId);
    if (!auth || auth.sourceId !== sourceId) {
      return { status: 'forbidden', code: 'SYNC_SOURCE_FORBIDDEN' };
    }
    if (auth.retired) {
      return { status: 'retired', code: 'SYNC_SOURCE_RETIRED' };
    }

    const ownershipKey = this.ownershipKey(sourceId, kind, sourceEntityId);
    const existing = this.ownership.get(ownershipKey);
    if (!existing) {
      return { status: 'applied', targetEntityId: '' };
    }

    this.rows.set(this.rowKey(kind, existing.targetEntityId), {
      id: existing.targetEntityId,
      native: false,
      deleted: true,
    });
    this.ownership.set(ownershipKey, { ...existing, deleted: true });
    return { status: 'applied', targetEntityId: existing.targetEntityId };
  }

  private generateTargetId(kind: EntityKind): string {
    let id: string;
    do {
      this.sequence += 1;
      id = `sync-${kind}-${this.sequence}`;
    } while (this.rows.has(this.rowKey(kind, id)));
    return id;
  }

  private ownershipKey(sourceId: string, kind: EntityKind, sourceEntityId: string): string {
    return JSON.stringify([sourceId, kind, sourceEntityId]);
  }

  private rowKey(kind: EntityKind, id: string): string {
    return JSON.stringify([kind, id]);
  }
}

function expectApplied(outcome: ApplyOutcome): AppliedOutcome {
  expect(outcome.status).toBe('applied');
  if (outcome.status !== 'applied') {
    throw new Error(`Expected applied outcome, got ${outcome.status}`);
  }
  return outcome;
}

describe('source ownership contract POC', () => {
  it.each<EntityKind>(['workflow', 'credential'])(
    'keeps a native %s row independent when a source-local id collides',
    (kind) => {
      const store = new PocIdentityContractStore();
      store.bindCredential('source-a-key', 'source-a');
      store.createNative(kind, 'shared-id');

      const upsert = expectApplied(store.upsert('source-a-key', 'source-a', kind, 'shared-id'));

      expect(upsert.targetEntityId).not.toBe('shared-id');
      expect(store.isNativeRow(kind, 'shared-id')).toBe(true);
      expect(store.hasLiveRow(kind, upsert.targetEntityId)).toBe(true);

      const deletion = store.delete('source-a-key', 'source-a', kind, 'shared-id');

      expect(deletion).toEqual({ status: 'applied', targetEntityId: upsert.targetEntityId });
      expect(store.isNativeRow(kind, 'shared-id')).toBe(true);
      expect(store.hasLiveRow(kind, upsert.targetEntityId)).toBe(false);
    },
  );

  it.each<EntityKind>(['workflow', 'credential'])(
    'maps two sources with the same source-local %s id to separate target rows',
    (kind) => {
      const store = new PocIdentityContractStore();
      store.bindCredential('source-a-key', 'source-a');
      store.bindCredential('source-b-key', 'source-b');

      const sourceA = expectApplied(store.upsert('source-a-key', 'source-a', kind, 'same-source-local-id'));
      const sourceB = expectApplied(store.upsert('source-b-key', 'source-b', kind, 'same-source-local-id'));

      expect(sourceA.targetEntityId).not.toBe(sourceB.targetEntityId);
      expect(store.getOwnership('source-a', kind, 'same-source-local-id')).toMatchObject({
        sourceId: 'source-a',
        targetEntityId: sourceA.targetEntityId,
      });
      expect(store.getOwnership('source-b', kind, 'same-source-local-id')).toMatchObject({
        sourceId: 'source-b',
        targetEntityId: sourceB.targetEntityId,
      });
    },
  );

  it('rejects a valid credential when the body claims a different sourceId', () => {
    const store = new PocIdentityContractStore();
    store.bindCredential('source-a-key', 'source-a');

    expect(store.upsert('source-a-key', 'source-b', 'workflow', 'wf-1')).toEqual({
      status: 'forbidden',
      code: 'SYNC_SOURCE_FORBIDDEN',
    });
    expect(store.getOwnership('source-b', 'workflow', 'wf-1')).toBeUndefined();
  });

  it('rejects events for a retired source without deleting existing mappings', () => {
    const store = new PocIdentityContractStore();
    store.bindCredential('source-a-key', 'source-a');
    const initial = expectApplied(store.upsert('source-a-key', 'source-a', 'credential', 'cred-1'));

    store.retireSource('source-a');

    expect(store.delete('source-a-key', 'source-a', 'credential', 'cred-1')).toEqual({
      status: 'retired',
      code: 'SYNC_SOURCE_RETIRED',
    });
    expect(store.getOwnership('source-a', 'credential', 'cred-1')).toMatchObject({
      targetEntityId: initial.targetEntityId,
      deleted: false,
    });
  });
});
