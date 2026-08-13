import { createSubscriberEntryHooks } from './entry';

/** n8n external-hooks entry: CommonJS export for the hook runtime. */
export = createSubscriberEntryHooks(process.env);
