import type { HttpClient } from '../http-client.js';
import type { PullRequest, SourceControlledFile } from '../types.js';
import BaseClient from './base.js';

export default class SourceControlClient extends BaseClient {
  async pull(data: PullRequest): Promise<SourceControlledFile[]> {
    return this.http.post<SourceControlledFile[]>('/source-control/pull', data);
  }
}
