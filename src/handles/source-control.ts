import type { HttpClient } from '../http-client.js';
import type { PullRequest, SourceControlledFile } from '../types.js';
import BaseHandle from './base.js';

export default class SourceControlHandle extends BaseHandle {
  async pull(data: PullRequest): Promise<SourceControlledFile[]> {
    return this.http.post<SourceControlledFile[]>('/source-control/pull', data);
  }
}
