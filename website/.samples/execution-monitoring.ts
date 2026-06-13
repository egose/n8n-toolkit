import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
});

// ─── List Executions ────────────────────────────────────────────────────────

// List recent executions
const { data: recent } = await client.executions().list({ limit: 10 });
console.log(`Recent executions: ${recent.length}`);

// List error executions
const { data: errors } = await client.executions().list({
  status: 'error',
  limit: 10,
});
console.log(`Error executions: ${errors.length}`);

// Filter by workflow
const { data: workflowRuns } = await client.executions().list({
  workflowId: 'wf-123',
  limit: 20,
});
console.log(`Workflow runs: ${workflowRuns.length}`);

// ─── Get Execution Details ──────────────────────────────────────────────────

if (recent.length > 0) {
  const execution = await client.executions().get(recent[0].id, {
    includeData: true,
  });
  console.log(`Execution ${execution.id}: ${execution.status}`);
  console.log(`Started: ${execution.startedAt}, Finished: ${execution.finishedAt}`);
}

// ─── Stop a Running Execution ───────────────────────────────────────────────

const { data: running } = await client.executions().list({
  status: 'running',
  limit: 1,
});

if (running.length > 0) {
  await client.executions().stop(running[0].id);
  console.log(`Stopped execution: ${running[0].id}`);
}

// ─── Stop Many Executions ───────────────────────────────────────────────────

const { stopped } = await client.executions().stopMany({
  status: ['running', 'queued', 'waiting'],
  workflowId: 'wf-123',
});
console.log(`Stopped ${stopped} executions`);

// ─── Retry Failed Execution ─────────────────────────────────────────────────

if (errors.length > 0) {
  const retried = await client.executions().retry(errors[0].id, {
    loadWorkflow: true,
  });
  console.log(`Retried execution: ${retried.id}`);
}

// ─── Execution Tags ─────────────────────────────────────────────────────────

if (recent.length > 0) {
  const execId = recent[0].id;

  // Add tags to execution
  const tag = await client.tags().create({ name: 'reviewed' });
  await client.executions().updateTags(execId, [{ id: tag.id }]);

  // Get execution tags
  const tags = await client.executions().getTags(execId);
  console.log(`Execution tags: ${tags.map((t) => t.name).join(', ')}`);
}

// ─── Delete Execution ───────────────────────────────────────────────────────

if (recent.length > 0) {
  await client.executions().delete(recent[recent.length - 1].id);
  console.log('Deleted old execution');
}
