import N8nClient, { WorkflowClient, type N8nClientConfig, type Workflow } from '@egose/n8n-client';

const config: N8nClientConfig = {
  baseUrl: 'http://localhost:5678',
  apiKey: 'test-api-key', // pragma: allowlist secret
};

const client = new N8nClient(config);

async function verifyDeclarationContracts(): Promise<void> {
  const workflowPage = await client.workflows().list({ limit: 1 });
  const workflowClient: WorkflowClient = client.workflows();
  const workflowCursor: string | null = workflowPage.nextCursor;
  const workflowSample: Workflow | undefined = workflowPage.data[0];

  void workflowClient;
  void workflowCursor;
  void workflowSample;
}

void verifyDeclarationContracts();
