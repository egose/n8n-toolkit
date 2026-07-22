export interface PaginationParams {
  limit?: number;
  cursor?: string;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
}
