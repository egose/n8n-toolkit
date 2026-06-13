import type { DiscoverParams, DiscoverResponse } from '../types.js';
import BaseClient from './base.js';

export default class DiscoverClient extends BaseClient {
  async get(params?: DiscoverParams): Promise<DiscoverResponse> {
    return this.http.get<DiscoverResponse>('/discover', params);
  }
}
