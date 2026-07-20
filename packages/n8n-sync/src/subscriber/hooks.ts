import type { IExternalHooksFileData, N8nServer } from '../shared/types';

export interface SubscriberDeps {
  /** Runs inside the `n8n.ready` hook, where n8n's DI container is available. */
  ready: (server: N8nServer) => Promise<void>;
}

/**
 * Build the n8n external-hook map for the subscriber side: mount the sync
 * endpoints on n8n's own Express server once the instance is ready.
 */
export function createSubscriberHooks(deps: SubscriberDeps): IExternalHooksFileData {
  return {
    n8n: {
      ready: [
        async function (server: N8nServer) {
          await deps.ready(server);
        },
      ],
    },
  };
}
