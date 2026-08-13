import { getSyncEventEntityRef, incrementDecimalString, readJsonFile, writeJsonFileAtomic } from '../shared/ordering';

type EventOrderingInput = Parameters<typeof getSyncEventEntityRef>[0];

interface PublisherOrderingState {
  version: 1;
  nextEventSequence: string;
  entityRevisions: Record<string, string>;
}

export interface EventOrderingAllocator {
  allocate(event: EventOrderingInput): Promise<{ eventId: string; entityRevision: string }>;
}

function defaultPublisherOrderingState(): PublisherOrderingState {
  return {
    version: 1,
    nextEventSequence: '0',
    entityRevisions: {},
  };
}

function isPublisherOrderingState(value: unknown): value is PublisherOrderingState {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    record.version === 1 && typeof record.nextEventSequence === 'string' && typeof record.entityRevisions === 'object'
  );
}

function createMemoryAllocator(sourceId: string): EventOrderingAllocator {
  const state = defaultPublisherOrderingState();

  return {
    async allocate(event) {
      const entity = getSyncEventEntityRef(event);
      state.nextEventSequence = incrementDecimalString(state.nextEventSequence);
      state.entityRevisions[entity.key] = incrementDecimalString(state.entityRevisions[entity.key]);
      return {
        eventId: `${sourceId}:${state.nextEventSequence}`,
        entityRevision: state.entityRevisions[entity.key],
      };
    },
  };
}

export function createEventOrderingAllocator(options: {
  sourceId: string;
  statePath?: string;
}): EventOrderingAllocator {
  const { sourceId, statePath } = options;
  if (!statePath) {
    return createMemoryAllocator(sourceId);
  }

  let loadedState: PublisherOrderingState | undefined;
  let mutationChain = Promise.resolve();

  const loadState = async (): Promise<PublisherOrderingState> => {
    if (loadedState) return loadedState;
    const persisted = await readJsonFile<PublisherOrderingState>(statePath);
    if (persisted === undefined) {
      loadedState = defaultPublisherOrderingState();
      return loadedState;
    }
    if (!isPublisherOrderingState(persisted)) {
      throw new Error(`Invalid sync publisher order state at ${statePath}`);
    }
    loadedState = persisted;
    return loadedState;
  };

  return {
    allocate(event) {
      const run = mutationChain.then(async () => {
        const state = await loadState();
        const entity = getSyncEventEntityRef(event);
        state.nextEventSequence = incrementDecimalString(state.nextEventSequence);
        state.entityRevisions[entity.key] = incrementDecimalString(state.entityRevisions[entity.key]);
        await writeJsonFileAtomic(statePath, state);
        return {
          eventId: `${sourceId}:${state.nextEventSequence}`,
          entityRevision: state.entityRevisions[entity.key],
        };
      });

      mutationChain = run.then(
        () => undefined,
        () => undefined,
      );

      return run;
    },
  };
}
