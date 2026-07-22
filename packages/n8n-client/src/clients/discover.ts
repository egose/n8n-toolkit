import type { DiscoverParams, DiscoverResponse } from '../types.js';
import BaseClient from './base.js';
import { normalizeDiscoverResponse } from '../response-mappers.js';

export default class DiscoverClient extends BaseClient {
  async get(params?: DiscoverParams): Promise<DiscoverResponse> {
    return normalizeDiscoverResponse(await this.http.get<DiscoverResponse>('/discover', params));
  }
}
