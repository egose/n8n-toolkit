import DataTableClient from '../clients/data-table.js';
import type {
  CreateColumnRequest,
  DataTable,
  DataTableColumn,
  DataTableRow,
  DataTableRowListParams,
  DataTableRowListResponse,
  DeleteRowsBooleanParams,
  DeleteRowsDataParams,
  DeleteRowsParams,
  InsertRowsAllRequest,
  InsertRowsCountRequest,
  InsertRowsIdsRequest,
  InsertRowsRequest,
  UpdateColumnRequest,
  UpdateDataTableRequest,
  UpdateRowsBooleanRequest,
  UpdateRowsDataRequest,
  UpdateRowsRequest,
  UpsertRowBooleanRequest,
  UpsertRowDataRequest,
  UpsertRowRequest,
} from '../types.js';
import BaseResource from './base.js';

export default class DataTableResource extends BaseResource<DataTable> {
  constructor(
    private readonly dataTables: DataTableClient,
    dataTable: DataTable,
  ) {
    super(dataTable);
  }

  get id(): string {
    return this.data.id;
  }

  get name(): string {
    return this.data.name;
  }

  async refresh(): Promise<this> {
    return this.replaceSnapshot(await this.dataTables.get(this.id));
  }

  async update(data: UpdateDataTableRequest): Promise<this> {
    return this.replaceSnapshot(await this.dataTables.update(this.id, data));
  }

  async patch(data: Partial<UpdateDataTableRequest>): Promise<this> {
    return this.update({
      name: this.data.name,
      ...data,
    });
  }

  async delete(): Promise<void> {
    await this.dataTables.delete(this.id);
  }

  async listRows(params?: DataTableRowListParams): Promise<DataTableRowListResponse> {
    return this.dataTables.listRows(this.id, params);
  }

  async insertRows(data: InsertRowsCountRequest): Promise<{ count: number }>;
  async insertRows(data: InsertRowsIdsRequest): Promise<number[]>;
  async insertRows(data: InsertRowsAllRequest): Promise<DataTableRow[]>;
  async insertRows(data: InsertRowsRequest): Promise<{ count: number } | number[] | DataTableRow[]> {
    return this.dataTables.insertRows(
      this.id,
      data as InsertRowsCountRequest & InsertRowsIdsRequest & InsertRowsAllRequest,
    );
  }

  async updateRows(data: UpdateRowsBooleanRequest): Promise<boolean>;
  async updateRows(data: UpdateRowsDataRequest): Promise<DataTableRow[]>;
  async updateRows(data: UpdateRowsRequest): Promise<boolean | DataTableRow[]> {
    return this.dataTables.updateRows(this.id, data as UpdateRowsBooleanRequest & UpdateRowsDataRequest);
  }

  async upsertRow(data: UpsertRowBooleanRequest): Promise<boolean>;
  async upsertRow(data: UpsertRowDataRequest): Promise<DataTableRow>;
  async upsertRow(data: UpsertRowRequest): Promise<boolean | DataTableRow> {
    return this.dataTables.upsertRow(this.id, data as UpsertRowBooleanRequest & UpsertRowDataRequest);
  }

  async deleteRows(params: DeleteRowsBooleanParams): Promise<boolean>;
  async deleteRows(params: DeleteRowsDataParams): Promise<DataTableRow[]>;
  async deleteRows(params: DeleteRowsParams): Promise<boolean | DataTableRow[]> {
    return this.dataTables.deleteRows(this.id, params as DeleteRowsBooleanParams & DeleteRowsDataParams);
  }

  async listColumns(): Promise<DataTableColumn[]> {
    return this.dataTables.listColumns(this.id);
  }

  async createColumn(data: CreateColumnRequest): Promise<DataTableColumn> {
    const column = await this.dataTables.createColumn(this.id, data);
    this.mergeSnapshot({ columns: [...this.data.columns, column] });
    return column;
  }

  async updateColumn(columnId: string, data: UpdateColumnRequest): Promise<DataTableColumn> {
    const column = await this.dataTables.updateColumn(this.id, columnId, data);
    this.mergeSnapshot({ columns: this.data.columns.map((entry) => (entry.id === columnId ? column : entry)) });
    return column;
  }

  async deleteColumn(columnId: string): Promise<void> {
    await this.dataTables.deleteColumn(this.id, columnId);
    this.mergeSnapshot({ columns: this.data.columns.filter((entry) => entry.id !== columnId) });
  }
}
