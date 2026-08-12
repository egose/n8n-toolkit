import type { DiscoverParams, DiscoverResponse } from '../types.js';
import { SUPPORTED_DISCOVER_AUTH, SUPPORTED_PUBLIC_API_SPEC_VERSION } from '../public-api-contract.js';
import BaseClient from './base.js';
import { normalizeDiscoverResponse } from '../response-mappers.js';

export default class DiscoverClient extends BaseClient {
  constructor(
    http: ConstructorParameters<typeof BaseClient>[0],
    private readonly authMode: 'apiKey' | 'bearerToken' = SUPPORTED_DISCOVER_AUTH,
  ) {
    super(http);
  }

  async get(params?: DiscoverParams): Promise<DiscoverResponse> {
    if (this.authMode !== SUPPORTED_DISCOVER_AUTH) {
      throw new Error(
        `GET /discover is only supported with API key authentication for the reviewed n8n Public API ${SUPPORTED_PUBLIC_API_SPEC_VERSION} contract`,
      );
    }

    return normalizeDiscoverResponse(await this.http.get<DiscoverResponse>('/discover', params));
  }
}
