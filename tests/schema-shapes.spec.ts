import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const OPENAPI_PATH = join(REPO_ROOT, '.public-api/v1.1.1.json');

interface SchemaDoc {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: SchemaDoc;
}

interface OpenApiDocument {
  components?: {
    schemas?: Record<string, SchemaDoc>;
  };
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

const OPENAPI = loadJson<OpenApiDocument>(OPENAPI_PATH);
const SCHEMAS = OPENAPI.components?.schemas ?? {};

function getSchema(schemaName: string): SchemaDoc {
  const schema = SCHEMAS[schemaName];
  if (!schema) {
    throw new Error(`Schema not found in ${OPENAPI_PATH}: ${schemaName}`);
  }
  return schema;
}

function resolveRef(ref: string): SchemaDoc {
  const prefix = '#/components/schemas/';
  if (!ref.startsWith(prefix)) {
    throw new Error(`Unsupported schema ref: ${ref}`);
  }

  return getSchema(ref.slice(prefix.length));
}

function resolveSchema(doc: SchemaDoc): SchemaDoc {
  let resolved = doc;

  while (resolved.$ref) {
    resolved = resolveRef(resolved.$ref);
  }

  return resolved;
}

function getTopLevelPropertyNames(schema: SchemaDoc): string[] {
  const resolved = resolveSchema(schema);
  if (!resolved.properties) return [];
  return Object.keys(resolved.properties);
}

function getRequiredProperties(schema: SchemaDoc): string[] {
  return resolveSchema(schema).required ?? [];
}

function getScalarType(schemaType: string | undefined, format?: string): string {
  if (format === 'date-time') return 'string';
  if (format === 'email') return 'string';

  switch (schemaType) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'array';
    case 'object':
      return 'object';
    default:
      return 'unknown';
  }
}

const EXPECTED_SCHEMAS: Array<{
  name: string;
  schemaName: string;
  requiredProps: string[];
  allProps: string[];
}> = [
  {
    name: 'Workflow',
    schemaName: 'workflow',
    requiredProps: ['name', 'nodes', 'connections', 'settings'],
    allProps: [
      'id',
      'name',
      'description',
      'active',
      'createdAt',
      'updatedAt',
      'isArchived',
      'versionId',
      'triggerCount',
      'nodes',
      'connections',
      'settings',
      'staticData',
      'pinData',
      'meta',
      'tags',
      'shared',
      'activeVersion',
    ],
  },
  {
    name: 'WorkflowNode',
    schemaName: 'node',
    requiredProps: [],
    allProps: [
      'id',
      'name',
      'webhookId',
      'disabled',
      'notesInFlow',
      'notes',
      'type',
      'typeVersion',
      'executeOnce',
      'alwaysOutputData',
      'retryOnFail',
      'maxTries',
      'waitBetweenTries',
      'continueOnFail',
      'onError',
      'position',
      'parameters',
      'credentials',
      'customTelemetryTags',
      'createdAt',
      'updatedAt',
    ],
  },
  {
    name: 'WorkflowSettings',
    schemaName: 'workflowSettings',
    requiredProps: [],
    allProps: [
      'saveExecutionProgress',
      'saveManualExecutions',
      'saveDataErrorExecution',
      'saveDataSuccessExecution',
      'executionTimeout',
      'errorWorkflow',
      'timezone',
      'executionOrder',
      'callerPolicy',
      'callerIds',
      'timeSavedPerExecution',
      'redactionPolicy',
      'availableInMCP',
      'customTelemetryTags',
    ],
  },
  {
    name: 'Execution',
    schemaName: 'execution',
    requiredProps: [],
    allProps: [
      'id',
      'data',
      'finished',
      'mode',
      'retryOf',
      'retrySuccessId',
      'startedAt',
      'stoppedAt',
      'workflowId',
      'waitTill',
      'customData',
      'status',
    ],
  },
  {
    name: 'Credential',
    schemaName: 'credential',
    requiredProps: ['name', 'type', 'data'],
    allProps: ['id', 'name', 'type', 'data', 'isResolvable', 'createdAt', 'updatedAt'],
  },
  {
    name: 'Tag',
    schemaName: 'tag',
    requiredProps: ['name'],
    allProps: ['id', 'name', 'createdAt', 'updatedAt'],
  },
  {
    name: 'User',
    schemaName: 'user',
    requiredProps: ['email'],
    allProps: ['id', 'email', 'firstName', 'lastName', 'isPending', 'createdAt', 'updatedAt', 'role', 'mfaEnabled'],
  },
  {
    name: 'Variable',
    schemaName: 'variable',
    requiredProps: ['key', 'value'],
    allProps: ['id', 'key', 'value', 'type', 'project'],
  },
  {
    name: 'Project',
    schemaName: 'project',
    requiredProps: ['name'],
    allProps: ['id', 'name', 'type'],
  },
  {
    name: 'ProjectMember',
    schemaName: 'projectMember',
    requiredProps: [],
    allProps: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'role'],
  },
  {
    name: 'DataTable',
    schemaName: 'dataTable',
    requiredProps: ['id', 'name', 'columns', 'projectId', 'createdAt', 'updatedAt'],
    allProps: ['id', 'name', 'columns', 'projectId', 'createdAt', 'updatedAt'],
  },
  {
    name: 'DataTableColumn',
    schemaName: 'dataTableColumn',
    requiredProps: ['id', 'name', 'dataTableId', 'type', 'index'],
    allProps: ['id', 'name', 'dataTableId', 'type', 'index'],
  },
  {
    name: 'DataTableRow',
    schemaName: 'dataTableRow',
    requiredProps: [],
    allProps: ['id', 'createdAt', 'updatedAt'],
  },
];

describe('Spec schema shape validation', () => {
  for (const expected of EXPECTED_SCHEMAS) {
    describe(expected.name, () => {
      const specSchema = getSchema(expected.schemaName);
      const specAllProps = getTopLevelPropertyNames(specSchema);
      const specRequired = getRequiredProperties(specSchema);

      test('spec has the properties we expect', () => {
        const missing = expected.allProps.filter((property) => !specAllProps.includes(property));
        expect(missing).toEqual([]);
      });

      test('our allProps list covers all spec properties', () => {
        const extra = specAllProps.filter((property) => !expected.allProps.includes(property));
        expect(extra).toEqual([]);
      });

      test('required properties match', () => {
        expect(specRequired.sort()).toEqual(expected.requiredProps.sort());
      });
    });
  }
});

describe('Spec property types vs TypeScript types', () => {
  test('Workflow has correct type for id field', () => {
    const schema = getSchema('workflow');
    const idProp = schema.properties!.id as SchemaDoc;
    expect(getScalarType(idProp.type, idProp.format as string)).toBe('string');
  });

  test('Execution has correct type for id field', () => {
    const schema = getSchema('execution');
    const idProp = schema.properties!.id as SchemaDoc;
    expect(getScalarType(idProp.type, idProp.format as string)).toBe('number');
  });

  test('Workflow has correct type for active field', () => {
    const schema = getSchema('workflow');
    const prop = schema.properties!.active as SchemaDoc;
    expect(getScalarType(prop.type, prop.format as string)).toBe('boolean');
  });

  test('Execution has correct type for workflowId field', () => {
    const schema = getSchema('execution');
    const prop = schema.properties!.workflowId as SchemaDoc;
    expect(getScalarType(prop.type, prop.format as string)).toBe('number');
  });

  test('Execution has correct type for status field (enum)', () => {
    const schema = getSchema('execution');
    const prop = schema.properties!.status as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('string');
    expect(prop.enum).toEqual(['canceled', 'crashed', 'error', 'new', 'running', 'success', 'unknown', 'waiting']);
  });

  test('Execution has correct type for mode field (enum)', () => {
    const schema = getSchema('execution');
    const prop = schema.properties!.mode as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('string');
    expect(prop.enum).toEqual([
      'cli',
      'error',
      'integrated',
      'internal',
      'manual',
      'retry',
      'trigger',
      'webhook',
      'evaluation',
      'chat',
    ]);
  });

  test('WorkflowSettings has correct type for saveDataErrorExecution', () => {
    const schema = getSchema('workflowSettings');
    const prop = schema.properties!.saveDataErrorExecution as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('string');
  });

  test('WorkflowSettings has correct type for executionTimeout', () => {
    const schema = getSchema('workflowSettings');
    const prop = schema.properties!.executionTimeout as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('number');
  });

  test('DataTable has correct type for columns (array)', () => {
    const schema = getSchema('dataTable');
    const prop = schema.properties!.columns as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('array');
  });

  test('DataTableColumn has correct enum for type field', () => {
    const schema = getSchema('dataTableColumn');
    const prop = schema.properties!.type as SchemaDoc;
    expect(prop.enum).toEqual(['string', 'number', 'boolean', 'date']);
  });

  test('Credential is required and has correct fields', () => {
    const schema = getSchema('credential');
    expect(schema.required?.slice().sort()).toEqual(['name', 'type', 'data'].sort());
  });

  test('Tag is required and has correct fields', () => {
    const schema = getSchema('tag');
    expect(schema.required?.slice().sort()).toEqual(['name'].sort());
  });

  test('User has correct required fields', () => {
    const schema = getSchema('user');
    expect(schema.required?.slice().sort()).toEqual(['email'].sort());
  });

  test('Variable has correct required fields', () => {
    const schema = getSchema('variable');
    expect(schema.required?.slice().sort()).toEqual(['key', 'value'].sort());
  });

  test('Project has correct required fields', () => {
    const schema = getSchema('project');
    expect(schema.required?.slice().sort()).toEqual(['name'].sort());
  });
});

describe('Spec enum values', () => {
  test('WorkflowNode.onError values', () => {
    const schema = getSchema('node');
    const onErrorProp = schema.properties!.onError as SchemaDoc;
    if (onErrorProp.enum) {
      expect(onErrorProp.enum).toContain('continueRegularOutput');
    }
  });

  test('WorkflowSettings.callerPolicy values', () => {
    const schema = getSchema('workflowSettings');
    const prop = schema.properties!.callerPolicy as SchemaDoc;
    if (prop.enum) {
      expect(prop.enum).toContain('any');
    }
  });
});

describe('Spec additionalProperties', () => {
  test('Workflow has additionalProperties: false', () => {
    const schema = getSchema('workflow');
    expect(schema.additionalProperties).toBe(false);
  });

  test('Tag has additionalProperties: false', () => {
    const schema = getSchema('tag');
    expect(schema.additionalProperties).toBe(false);
  });

  test('Variable has additionalProperties: false', () => {
    const schema = getSchema('variable');
    expect(schema.additionalProperties).toBe(false);
  });

  test('Project has additionalProperties: false', () => {
    const schema = getSchema('project');
    expect(schema.additionalProperties).toBe(false);
  });

  test('DataTableRow has additionalProperties: true (dynamic columns)', () => {
    const schema = getSchema('dataTableRow');
    expect(schema.additionalProperties).toBe(true);
  });
});
