import type { DiscoverParams, DiscoverResponse } from '../types.js';
import BaseHandle from './base.js';

export default class DiscoverHandle extends BaseHandle {
  async get(params?: DiscoverParams): Promise<DiscoverResponse> {
    return this.http.get<DiscoverResponse>('/discover', params);
  }
}
