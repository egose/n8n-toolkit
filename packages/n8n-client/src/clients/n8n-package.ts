import type { ExportWorkflowsRequest, ImportPackageOptions, ImportPackageResponse } from '../types.js';
import BaseClient from './base.js';

export default class N8nPackageClient extends BaseClient {
  async exportWorkflows(data: ExportWorkflowsRequest): Promise<ArrayBuffer> {
    return this.http.post<ArrayBuffer>('/n8n-packages/export', data, undefined, { Accept: 'application/gzip' });
  }

  async importPackage(pkg: File | Blob, options: ImportPackageOptions): Promise<ImportPackageResponse> {
    const formData = new FormData();
    formData.append('package', pkg);

    if (options?.projectId) formData.append('projectId', options.projectId);
    if (options?.folderId) formData.append('folderId', options.folderId);
    if (options?.credentialMatchingMode) formData.append('credentialMatchingMode', options.credentialMatchingMode);
    if (options?.credentialMissingMode) formData.append('credentialMissingMode', options.credentialMissingMode);
    if (options?.bindings) formData.append('bindings', JSON.stringify(options.bindings));
    formData.append('workflowConflictPolicy', options.workflowConflictPolicy);
    if (options?.workflowPublishingPolicy) {
      formData.append('workflowPublishingPolicy', options.workflowPublishingPolicy);
    }
    if (options?.workflowIdPolicy) formData.append('workflowIdPolicy', options.workflowIdPolicy);
    if (options?.folderConflictPolicy) formData.append('folderConflictPolicy', options.folderConflictPolicy);
    if (options?.dataTableMatchingMode) {
      formData.append('dataTableMatchingMode', options.dataTableMatchingMode);
    }
    if (options?.dataTableMissingMode) formData.append('dataTableMissingMode', options.dataTableMissingMode);
    if (options?.dataTableSchemaConflictPolicy) {
      formData.append('dataTableSchemaConflictPolicy', options.dataTableSchemaConflictPolicy);
    }

    return this.http.request<ImportPackageResponse>({
      method: 'POST',
      path: '/n8n-packages/import',
      body: formData,
    });
  }
}
