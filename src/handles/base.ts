import type { HttpClient } from '../http-client.js';

export default abstract class BaseHandle {
  constructor(protected readonly http: HttpClient) {}
}
