import type { PaginatedResponse } from '../pagination.js';
import type {
  DataTable,
  DataTableColumn,
  DataTableListParams,
  DataTableListResponse,
  DataTableRow,
  DataTableRowListParams,
  DataTableRowListResponse,
  ClearRowsResponse,
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
} from '../types.js';
import BaseClient from './base.js';
import DataTableResource from '../resources/data-table.js';
import {
  normalizeDataTable,
  normalizeDataTableColumn,
  normalizeDataTableListResponse,
  normalizeDataTableRow,
  normalizeDataTableRowListResponse,
} from '../response-mappers.js';

export default class DataTableClient extends BaseClient {
  async list(params?: DataTableListParams): Promise<DataTableListResponse> {
    return normalizeDataTableListResponse(await this.http.get<DataTableListResponse>('/data-tables', params));
  }

  async get(id: string): Promise<DataTable> {
    return normalizeDataTable(await this.http.get<DataTable>(`/data-tables/${id}`));
  }

  async getResource(id: string): Promise<DataTableResource> {
    return new DataTableResource(this, await this.get(id));
  }

  async listResources(params?: DataTableListParams): Promise<PaginatedResponse<DataTableResource>> {
    const response = await this.list(params);

    return {
      data: response.data.map((dataTable) => new DataTableResource(this, dataTable)),
      nextCursor: response.nextCursor,
    };
  }

  async create(data: CreateDataTableRequest): Promise<DataTable> {
    return normalizeDataTable(await this.http.post<DataTable>('/data-tables', data));
  }

  async createResource(data: CreateDataTableRequest): Promise<DataTableResource> {
    return new DataTableResource(this, await this.create(data));
  }

  async update(id: string, data: UpdateDataTableRequest): Promise<DataTable> {
    return normalizeDataTable(await this.http.patch<DataTable>(`/data-tables/${id}`, data));
  }

  async updateResource(id: string, data: UpdateDataTableRequest): Promise<DataTableResource> {
    return new DataTableResource(this, await this.update(id, data));
  }

  async delete(id: string): Promise<void> {
    await this.http.delete<void>(`/data-tables/${id}`);
  }

  async listRows(dataTableId: string, params?: DataTableRowListParams): Promise<DataTableRowListResponse> {
    return normalizeDataTableRowListResponse(
      await this.http.get<DataTableRowListResponse>(`/data-tables/${dataTableId}/rows`, params),
    );
  }

  async insertRows(dataTableId: string, data: InsertRowsCountRequest): Promise<{ count: number }>;
  async insertRows(dataTableId: string, data: InsertRowsIdsRequest): Promise<number[]>;
  async insertRows(dataTableId: string, data: InsertRowsAllRequest): Promise<DataTableRow[]>;
  async insertRows(
    dataTableId: string,
    data: InsertRowsRequest,
  ): Promise<{ count: number } | number[] | DataTableRow[]> {
    const response = await this.http.post<{ count: number } | number[] | DataTableRow[]>(
      `/data-tables/${dataTableId}/rows`,
      data,
    );
    return Array.isArray(response) && response.every((row) => typeof row === 'object')
      ? response.map((row) => normalizeDataTableRow(row as DataTableRow))
      : response;
  }

  async updateRows(dataTableId: string, data: UpdateRowsBooleanRequest): Promise<boolean>;
  async updateRows(dataTableId: string, data: UpdateRowsDataRequest): Promise<DataTableRow[]>;
  async updateRows(dataTableId: string, data: UpdateRowsRequest): Promise<boolean | DataTableRow[]> {
    const response = await this.http.patch<boolean | DataTableRow[]>(`/data-tables/${dataTableId}/rows/update`, data);
    return Array.isArray(response) ? response.map(normalizeDataTableRow) : response;
  }

  async upsertRow(dataTableId: string, data: UpsertRowBooleanRequest): Promise<boolean>;
  async upsertRow(dataTableId: string, data: UpsertRowDataRequest): Promise<DataTableRow>;
  async upsertRow(dataTableId: string, data: UpsertRowRequest): Promise<boolean | DataTableRow> {
    const response = await this.http.post<boolean | DataTableRow>(`/data-tables/${dataTableId}/rows/upsert`, data);
    return typeof response === 'boolean' ? response : normalizeDataTableRow(response);
  }

  async clearRows(dataTableId: string): Promise<ClearRowsResponse> {
    return this.http.delete<ClearRowsResponse>(`/data-tables/${dataTableId}/rows/clear`);
  }

  async deleteRows(dataTableId: string, params: DeleteRowsBooleanParams): Promise<boolean>;
  async deleteRows(dataTableId: string, params: DeleteRowsDataParams): Promise<DataTableRow[]>;
  async deleteRows(dataTableId: string, params: DeleteRowsParams): Promise<boolean | DataTableRow[]> {
    const response = await this.http.delete<boolean | DataTableRow[]>(
      `/data-tables/${dataTableId}/rows/delete`,
      params,
    );
    return Array.isArray(response) ? response.map(normalizeDataTableRow) : response;
  }

  async listColumns(dataTableId: string): Promise<DataTableColumn[]> {
    return ((await this.http.get<DataTableColumn[]>(`/data-tables/${dataTableId}/columns`)) ?? []).map(
      normalizeDataTableColumn,
    );
  }

  async createColumn(dataTableId: string, data: CreateColumnRequest): Promise<DataTableColumn> {
    return normalizeDataTableColumn(await this.http.post<DataTableColumn>(`/data-tables/${dataTableId}/columns`, data));
  }

  async deleteColumn(dataTableId: string, columnId: string): Promise<void> {
    await this.http.delete<void>(`/data-tables/${dataTableId}/columns/${columnId}`);
  }

  async updateColumn(dataTableId: string, columnId: string, data: UpdateColumnRequest): Promise<DataTableColumn> {
    return normalizeDataTableColumn(
      await this.http.patch<DataTableColumn>(`/data-tables/${dataTableId}/columns/${columnId}`, data),
    );
  }
}
