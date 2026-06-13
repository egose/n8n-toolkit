import type { HttpClient } from '../http-client.js';

export default abstract class BaseClient {
  constructor(protected readonly http: HttpClient) {}
}
