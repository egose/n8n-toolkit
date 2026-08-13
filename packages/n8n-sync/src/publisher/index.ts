import { createPublisherEntryHooks } from './entry';

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createPublisherEntryHooks(process.env);
