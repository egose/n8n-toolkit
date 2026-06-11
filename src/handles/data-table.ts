import type { HttpClient } from '../http-client.js';
import type {
  DataTable,
  DataTableColumn,
  DataTableListResponse,
  DataTableRow,
  DataTableRowListResponse,
  CreateColumnRequest,
  CreateDataTableRequest,
  DeleteRowsBooleanParams,
  DeleteRowsDataParams,
  DeleteRowsParams,
  InsertRowsAllRequest,
  InsertRowsCountRequest,
  InsertRowsIdsRequest,
  InsertRowsRequest,
  UpdateRowsBooleanRequest,
  UpdateRowsDataRequest,
  UpdateColumnRequest,
  UpdateDataTableRequest,
  UpdateRowsRequest,
  UpsertRowBooleanRequest,
  UpsertRowDataRequest,
  UpsertRowRequest,
  PaginationParams,
} from '../types.js';

export default class DataTableHandle {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async list(params?: PaginationParams & { filter?: string; sortBy?: string }): Promise<DataTableListResponse> {
    return this.http.get<DataTableListResponse>('/data-tables', params);
  }

  async get(id: string): Promise<DataTable> {
    return this.http.get<DataTable>(`/data-tables/${id}`);
  }

  async create(data: CreateDataTableRequest): Promise<DataTable> {
    return this.http.post<DataTable>('/data-tables', data);
  }

  async update(id: string, data: UpdateDataTableRequest): Promise<DataTable> {
    return this.http.patch<DataTable>(`/data-tables/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/data-tables/${id}`);
  }

  async listRows(
    dataTableId: string,
    params?: PaginationParams & { filter?: string; sortBy?: string; search?: string },
  ): Promise<DataTableRowListResponse> {
    return this.http.get<DataTableRowListResponse>(`/data-tables/${dataTableId}/rows`, params);
  }

  async insertRows(dataTableId: string, data: InsertRowsCountRequest): Promise<{ count: number }>;
  async insertRows(dataTableId: string, data: InsertRowsIdsRequest): Promise<number[]>;
  async insertRows(dataTableId: string, data: InsertRowsAllRequest): Promise<DataTableRow[]>;
  async insertRows(
    dataTableId: string,
    data: InsertRowsRequest,
  ): Promise<{ count: number } | number[] | DataTableRow[]> {
    return this.http.post<{ count: number } | number[] | DataTableRow[]>(`/data-tables/${dataTableId}/rows`, data);
  }

  async updateRows(dataTableId: string, data: UpdateRowsBooleanRequest): Promise<boolean>;
  async updateRows(dataTableId: string, data: UpdateRowsDataRequest): Promise<DataTableRow[]>;
  async updateRows(dataTableId: string, data: UpdateRowsRequest): Promise<boolean | DataTableRow[]> {
    return this.http.patch<boolean | DataTableRow[]>(`/data-tables/${dataTableId}/rows/update`, data);
  }

  async upsertRow(dataTableId: string, data: UpsertRowBooleanRequest): Promise<boolean>;
  async upsertRow(dataTableId: string, data: UpsertRowDataRequest): Promise<DataTableRow>;
  async upsertRow(dataTableId: string, data: UpsertRowRequest): Promise<boolean | DataTableRow> {
    return this.http.post<boolean | DataTableRow>(`/data-tables/${dataTableId}/rows/upsert`, data);
  }

  async deleteRows(dataTableId: string, params: DeleteRowsBooleanParams): Promise<boolean>;
  async deleteRows(dataTableId: string, params: DeleteRowsDataParams): Promise<DataTableRow[]>;
  async deleteRows(dataTableId: string, params: DeleteRowsParams): Promise<boolean | DataTableRow[]> {
    return this.http.delete<boolean | DataTableRow[]>(`/data-tables/${dataTableId}/rows/delete`, params);
  }

  async listColumns(dataTableId: string): Promise<DataTableColumn[]> {
    return this.http.get<DataTableColumn[]>(`/data-tables/${dataTableId}/columns`);
  }

  async createColumn(dataTableId: string, data: CreateColumnRequest): Promise<DataTableColumn> {
    return this.http.post<DataTableColumn>(`/data-tables/${dataTableId}/columns`, data);
  }

  async deleteColumn(dataTableId: string, columnId: string): Promise<void> {
    await this.http.delete<void>(`/data-tables/${dataTableId}/columns/${columnId}`);
  }

  async updateColumn(dataTableId: string, columnId: string, data: UpdateColumnRequest): Promise<DataTableColumn> {
    return this.http.patch<DataTableColumn>(`/data-tables/${dataTableId}/columns/${columnId}`, data);
  }
}
