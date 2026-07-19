import { describe, expect, test } from 'vitest';
import DataTableClient from '../src/clients/data-table';
import DataTableResource from '../src/resources/data-table';
import { createMockHttpClient } from './test-utils';

describe('Implementation Consistency: DataTable', () => {
  test('list calls GET /data-tables', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new DataTableClient(http);

    const result = await handle.list({ limit: 10 });

    expect(http.get).toHaveBeenCalledWith('/data-tables', { limit: 10 });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('get calls GET /data-tables/:id', async () => {
    const table = { id: 'dt-1', name: 'Users', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: table }]);
    const handle = new DataTableClient(http);

    const result = await handle.get('dt-1');

    expect(http.get).toHaveBeenCalledWith('/data-tables/dt-1');
    expect(result).toEqual(table);
  });

  test('create calls POST /data-tables', async () => {
    const created = { id: 'dt-2', name: 'Logs', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new DataTableClient(http);

    const result = await handle.create({ name: 'Logs', columns: [{ name: 'message', type: 'string' }] });

    expect(http.post).toHaveBeenCalledWith('/data-tables', {
      name: 'Logs',
      columns: [{ name: 'message', type: 'string' }],
    });
    expect(result).toEqual(created);
  });

  test('getResource returns a bound data table resource', async () => {
    const table = { id: 'dt-1', name: 'Users', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: table }]);
    const handle = new DataTableClient(http);

    const result = await handle.getResource('dt-1');

    expect(result).toBeInstanceOf(DataTableResource);
    expect(result.data).toEqual(table);
  });

  test('listResources wraps data tables as resources', async () => {
    const http = createMockHttpClient([
      {
        body: {
          data: [{ id: 'dt-1', name: 'Users', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' }],
          nextCursor: 'next',
        },
      },
    ]);
    const handle = new DataTableClient(http);

    const result = await handle.listResources({ limit: 1 });

    expect(result.data[0]).toBeInstanceOf(DataTableResource);
    expect(result.nextCursor).toBe('next');
  });

  test('createResource wraps created data table as a resource', async () => {
    const table = { id: 'dt-1', name: 'Users', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: table }]);
    const handle = new DataTableClient(http);

    const result = await handle.createResource({ name: 'Users', columns: [] });

    expect(result).toBeInstanceOf(DataTableResource);
    expect(result.data).toEqual(table);
  });

  test('update calls PATCH /data-tables/:id', async () => {
    const updated = { id: 'dt-1', name: 'Updated', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new DataTableClient(http);

    const result = await handle.update('dt-1', { name: 'Updated' });

    expect(http.patch).toHaveBeenCalledWith('/data-tables/dt-1', { name: 'Updated' });
    expect(result).toEqual(updated);
  });

  test('updateResource wraps updated data table as a resource', async () => {
    const updated = { id: 'dt-1', name: 'Updated', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new DataTableClient(http);

    const result = await handle.updateResource('dt-1', { name: 'Updated' });

    expect(result).toBeInstanceOf(DataTableResource);
    expect(result.data).toEqual(updated);
  });

  test('delete calls DELETE /data-tables/:id', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new DataTableClient(http);

    await handle.delete('dt-1');

    expect(http.delete).toHaveBeenCalledWith('/data-tables/dt-1');
  });

  test('listRows calls GET /data-tables/:id/rows', async () => {
    const http = createMockHttpClient([{ body: { data: [], nextCursor: undefined } }]);
    const handle = new DataTableClient(http);

    const result = await handle.listRows('dt-1', { limit: 25 });

    expect(http.get).toHaveBeenCalledWith('/data-tables/dt-1/rows', { limit: 25 });
    expect(result).toEqual({ data: [], nextCursor: undefined });
  });

  test('insertRows calls POST /data-tables/:id/rows', async () => {
    const http = createMockHttpClient([{ body: { count: 3 } }]);
    const handle = new DataTableClient(http);

    const result = await handle.insertRows('dt-1', { data: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }] });

    expect(http.post).toHaveBeenCalledWith('/data-tables/dt-1/rows', {
      data: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }],
    });
    expect(result).toEqual({ count: 3 });
  });

  test('insertRows returns ids when requested', async () => {
    const http = createMockHttpClient([{ body: [1, 2, 3] }]);
    const handle = new DataTableClient(http);

    const result = await handle.insertRows('dt-1', {
      data: [{ name: 'Alice' }],
      returnType: 'id',
    });

    expect(http.post).toHaveBeenCalledWith('/data-tables/dt-1/rows', {
      data: [{ name: 'Alice' }],
      returnType: 'id',
    });
    expect(result).toEqual([1, 2, 3]);
  });

  test('updateRows returns rows when returnData is true', async () => {
    const rows = [{ id: 1, name: 'Alice' }];
    const http = createMockHttpClient([{ body: rows }]);
    const handle = new DataTableClient(http);

    const result = await handle.updateRows('dt-1', {
      filter: { filters: [{ columnName: 'name', condition: 'eq', value: 'Alice' }] },
      data: { name: 'Alice Updated' },
      returnData: true,
    });

    expect(http.patch).toHaveBeenCalledWith('/data-tables/dt-1/rows/update', {
      filter: { filters: [{ columnName: 'name', condition: 'eq', value: 'Alice' }] },
      data: { name: 'Alice Updated' },
      returnData: true,
    });
    expect(result).toEqual(rows);
  });

  test('upsertRow returns boolean when returnData is false', async () => {
    const http = createMockHttpClient([{ body: true }]);
    const handle = new DataTableClient(http);

    const result = await handle.upsertRow('dt-1', {
      filter: { filters: [{ columnName: 'email', condition: 'eq', value: 'alice@example.com' }] },
      data: { email: 'alice@example.com' },
    });

    expect(http.post).toHaveBeenCalledWith('/data-tables/dt-1/rows/upsert', {
      filter: { filters: [{ columnName: 'email', condition: 'eq', value: 'alice@example.com' }] },
      data: { email: 'alice@example.com' },
    });
    expect(result).toBe(true);
  });

  test('deleteRows returns deleted rows when returnData is true', async () => {
    const rows = [{ id: 1, name: 'Alice' }];
    const http = createMockHttpClient([{ body: rows }]);
    const handle = new DataTableClient(http);

    const result = await handle.deleteRows('dt-1', {
      filter: '{"filters":[{"columnName":"name","condition":"eq","value":"Alice"}]}',
      returnData: true,
    });

    expect(http.delete).toHaveBeenCalledWith('/data-tables/dt-1/rows/delete', {
      filter: '{"filters":[{"columnName":"name","condition":"eq","value":"Alice"}]}',
      returnData: true,
    });
    expect(result).toEqual(rows);
  });

  test('listColumns calls GET /data-tables/:id/columns', async () => {
    const columns = [{ id: 'col-1', name: 'email', type: 'string', index: 0 }];
    const http = createMockHttpClient([{ body: columns }]);
    const handle = new DataTableClient(http);

    const result = await handle.listColumns('dt-1');

    expect(http.get).toHaveBeenCalledWith('/data-tables/dt-1/columns');
    expect(result).toEqual(columns);
  });

  test('createColumn calls POST /data-tables/:id/columns', async () => {
    const created = { id: 'col-2', name: 'age', type: 'number', index: 1 };
    const http = createMockHttpClient([{ body: created }]);
    const handle = new DataTableClient(http);

    const result = await handle.createColumn('dt-1', { name: 'age', type: 'number' });

    expect(http.post).toHaveBeenCalledWith('/data-tables/dt-1/columns', { name: 'age', type: 'number' });
    expect(result).toEqual(created);
  });

  test('deleteColumn calls DELETE /data-tables/:id/columns/:colId', async () => {
    const http = createMockHttpClient([{ body: undefined }]);
    const handle = new DataTableClient(http);

    await handle.deleteColumn('dt-1', 'col-1');

    expect(http.delete).toHaveBeenCalledWith('/data-tables/dt-1/columns/col-1');
  });

  test('updateColumn calls PATCH /data-tables/:id/columns/:colId', async () => {
    const updated = { id: 'col-1', name: 'email_address', type: 'string', index: 0 };
    const http = createMockHttpClient([{ body: updated }]);
    const handle = new DataTableClient(http);

    const result = await handle.updateColumn('dt-1', 'col-1', { name: 'email_address' });

    expect(http.patch).toHaveBeenCalledWith('/data-tables/dt-1/columns/col-1', { name: 'email_address' });
    expect(result).toEqual(updated);
  });

  test('data table resource methods use bound dataTable id', async () => {
    const updated = { id: 'dt-1', name: 'Users Updated', columns: [], projectId: 'p-1', createdAt: '', updatedAt: '' };
    const column = { id: 'col-1', name: 'active', dataTableId: 'dt-1', type: 'boolean', index: 0 };
    const updatedColumn = { id: 'col-1', name: 'is_active', dataTableId: 'dt-1', type: 'boolean', index: 0 };
    const rows = { data: [], nextCursor: undefined };
    const http = createMockHttpClient([
      { body: updated },
      { body: rows },
      { body: { count: 1 } },
      { body: false },
      { body: false },
      { body: false },
      { body: [] },
      { body: column },
      { body: updatedColumn },
      { body: undefined },
      { body: undefined },
    ]);
    const handle = new DataTableClient(http);
    const resource = new DataTableResource(handle, {
      id: 'dt-1',
      name: 'Users',
      columns: [],
      projectId: 'p-1',
      createdAt: '',
      updatedAt: '',
    });

    await resource.update({ name: 'Users Updated' });
    await resource.listRows({ limit: 10 });
    await resource.insertRows({ data: [{ email: 'alice@example.com' }] });
    await resource.updateRows({ filter: { filters: [] }, data: {} });
    await resource.upsertRow({ filter: { filters: [] }, data: {} });
    await resource.deleteRows({ filter: '{}' });
    await resource.listColumns();
    await resource.createColumn({ name: 'active', type: 'boolean' });
    await resource.updateColumn('col-1', { name: 'is_active' });
    await resource.deleteColumn('col-1');
    await resource.delete();

    expect(resource.name).toBe('Users Updated');
    expect(http.post).toHaveBeenCalledWith('/data-tables/dt-1/columns', { name: 'active', type: 'boolean' });
    expect(http.delete).toHaveBeenCalledWith('/data-tables/dt-1');
  });

  test('data table resource patch uses current table name as the base payload', async () => {
    const patched = {
      id: 'dt-1',
      name: 'Users',
      columns: [],
      projectId: 'p-1',
      createdAt: '',
      updatedAt: '',
    };
    const http = createMockHttpClient([{ body: patched }]);
    const handle = new DataTableClient(http);
    const resource = new DataTableResource(handle, patched);

    await resource.patch({});

    expect(http.patch).toHaveBeenCalledWith('/data-tables/dt-1', { name: 'Users' });
    expect(resource.name).toBe('Users');
  });
});
