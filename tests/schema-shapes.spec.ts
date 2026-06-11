import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SCHEMAS_BASE = join(REPO_ROOT, '.public-api/v1');

interface SchemaDoc {
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  items?: SchemaDoc;
}

function loadYaml(filePath: string): SchemaDoc {
  const content = readFileSync(filePath, 'utf8');
  return YAML.parse(content);
}

function resolveRef(ref: string, fromFile: string): SchemaDoc {
  const refPath = ref.startsWith('.') ? join(dirname(fromFile), ref) : join(SCHEMAS_BASE, ref);
  return loadYaml(refPath);
}

function resolveSchema(doc: SchemaDoc, fromFile: string): SchemaDoc {
  if (doc.$ref) {
    return resolveRef(doc.$ref, fromFile);
  }
  return doc;
}

function collectAllSchemas(): Array<{ name: string; filePath: string; schema: SchemaDoc }> {
  const schemas: Array<{ name: string; filePath: string; schema: SchemaDoc }> = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.name.endsWith('.yml') &&
        !entry.name.endsWith('.parameters.yml') &&
        !entry.name.includes('paths')
      ) {
        const schema = loadYaml(fullPath);
        if (schema && schema.type === 'object' && schema.properties) {
          schemas.push({
            name: entry.name.replace('.yml', ''),
            filePath: fullPath,
            schema,
          });
        }
      }
    }
  }

  walk(SCHEMAS_BASE);
  return schemas;
}

function getTopLevelPropertyNames(schema: SchemaDoc, filePath: string): string[] {
  const resolved = resolveSchema(schema, filePath);
  if (!resolved.properties) return [];
  return Object.keys(resolved.properties);
}

function getRequiredProperties(schema: SchemaDoc): string[] {
  const resolved = schema;
  return resolved.required ?? [];
}

function getScalarType(yamlType: string | undefined, format?: string): string {
  if (format === 'date-time') return 'string';
  if (format === 'email') return 'string';
  switch (yamlType) {
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

function inferType(schema: SchemaDoc, filePath: string): string {
  const resolved = resolveSchema(schema, filePath);
  if (resolved.$ref) {
    const refName = resolved.$ref.split('/').pop()!;
    return refName.replace('.yml', '');
  }
  if (resolved.type === 'array') {
    return 'array';
  }
  if (resolved.type === 'object' && resolved.properties) {
    return 'object';
  }
  return getScalarType(resolved.type, resolved.format as string | undefined);
}

const EXPECTED_SCHEMAS: Array<{
  name: string;
  specPath: string;
  requiredProps: string[];
  allProps: string[];
}> = [
  {
    name: 'Workflow',
    specPath: 'handlers/workflows/spec/schemas/workflow.yml',
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
    specPath: 'handlers/workflows/spec/schemas/node.yml',
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
    specPath: 'handlers/workflows/spec/schemas/workflowSettings.yml',
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
    specPath: 'handlers/executions/spec/schemas/execution.yml',
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
    specPath: 'handlers/credentials/spec/schemas/credential.yml',
    requiredProps: ['name', 'type', 'data'],
    allProps: ['id', 'name', 'type', 'data', 'isResolvable', 'createdAt', 'updatedAt'],
  },
  {
    name: 'Tag',
    specPath: 'handlers/tags/spec/schemas/tag.yml',
    requiredProps: ['name'],
    allProps: ['id', 'name', 'createdAt', 'updatedAt'],
  },
  {
    name: 'User',
    specPath: 'handlers/users/spec/schemas/user.yml',
    requiredProps: ['email'],
    allProps: ['id', 'email', 'firstName', 'lastName', 'isPending', 'createdAt', 'updatedAt', 'role', 'mfaEnabled'],
  },
  {
    name: 'Variable',
    specPath: 'handlers/variables/spec/schemas/variable.yml',
    requiredProps: ['key', 'value'],
    allProps: ['id', 'key', 'value', 'type', 'project'],
  },
  {
    name: 'Project',
    specPath: 'handlers/projects/spec/schemas/project.yml',
    requiredProps: ['name'],
    allProps: ['id', 'name', 'type'],
  },
  {
    name: 'ProjectMember',
    specPath: 'handlers/projects/spec/schemas/projectMember.yml',
    requiredProps: [],
    allProps: ['id', 'email', 'firstName', 'lastName', 'createdAt', 'updatedAt', 'role'],
  },
  {
    name: 'DataTable',
    specPath: 'handlers/data-tables/spec/schemas/dataTable.yml',
    requiredProps: ['id', 'name', 'columns', 'projectId', 'createdAt', 'updatedAt'],
    allProps: ['id', 'name', 'columns', 'projectId', 'createdAt', 'updatedAt'],
  },
  {
    name: 'DataTableColumn',
    specPath: 'handlers/data-tables/spec/schemas/dataTableColumn.yml',
    requiredProps: ['id', 'name', 'dataTableId', 'type', 'index'],
    allProps: ['id', 'name', 'dataTableId', 'type', 'index'],
  },
  {
    name: 'DataTableRow',
    specPath: 'handlers/data-tables/spec/schemas/dataTableRow.yml',
    requiredProps: [],
    allProps: ['id', 'createdAt', 'updatedAt'],
  },
];

describe('Spec schema shape validation', () => {
  for (const expected of EXPECTED_SCHEMAS) {
    describe(expected.name, () => {
      const fullPath = join(SCHEMAS_BASE, expected.specPath);
      const specSchema = loadYaml(fullPath);
      const specAllProps = getTopLevelPropertyNames(specSchema, fullPath);
      const specRequired = getRequiredProperties(specSchema);

      test(`spec has the properties we expect`, () => {
        const missing = expected.allProps.filter((p) => !specAllProps.some((sp) => sp === p));
        expect(missing).toEqual([]);
      });

      test(`our allProps list covers all spec properties`, () => {
        const extra = specAllProps.filter((p) => !expected.allProps.includes(p));
        expect(extra).toEqual([]);
      });

      test(`required properties match`, () => {
        expect(specRequired.sort()).toEqual(expected.requiredProps.sort());
      });
    });
  }
});

describe('Spec property types vs TypeScript types', () => {
  test('Workflow has correct type for id field', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflow.yml'));
    const idProp = schema.properties!.id as SchemaDoc;
    expect(getScalarType(idProp.type, idProp.format as string)).toBe('string');
  });

  test('Execution has correct type for id field', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/executions/spec/schemas/execution.yml'));
    const idProp = schema.properties!.id as SchemaDoc;
    expect(getScalarType(idProp.type, idProp.format as string)).toBe('number');
  });

  test('Workflow has correct type for active field', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflow.yml'));
    const prop = schema.properties!.active as SchemaDoc;
    expect(getScalarType(prop.type, prop.format as string)).toBe('boolean');
  });

  test('Execution has correct type for workflowId field', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/executions/spec/schemas/execution.yml'));
    const prop = schema.properties!.workflowId as SchemaDoc;
    expect(getScalarType(prop.type, prop.format as string)).toBe('number');
  });

  test('Execution has correct type for status field (enum)', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/executions/spec/schemas/execution.yml'));
    const prop = schema.properties!.status as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('string');
    expect(prop.enum).toEqual(['canceled', 'crashed', 'error', 'new', 'running', 'success', 'unknown', 'waiting']);
  });

  test('Execution has correct type for mode field (enum)', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/executions/spec/schemas/execution.yml'));
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
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflowSettings.yml'));
    const prop = schema.properties!.saveDataErrorExecution as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('string');
  });

  test('WorkflowSettings has correct type for executionTimeout', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflowSettings.yml'));
    const prop = schema.properties!.executionTimeout as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('number');
  });

  test('DataTable has correct type for columns (array)', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/data-tables/spec/schemas/dataTable.yml'));
    const prop = schema.properties!.columns as SchemaDoc;
    expect(getScalarType(prop.type)).toBe('array');
  });

  test('DataTableColumn has correct enum for type field', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/data-tables/spec/schemas/dataTableColumn.yml'));
    const prop = schema.properties!.type as SchemaDoc;
    expect(prop.enum).toEqual(['string', 'number', 'boolean', 'date']);
  });

  test('Credential is required and has correct fields', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/credentials/spec/schemas/credential.yml'));
    expect(schema.required).toEqual(['name', 'type', 'data']);
  });

  test('Tag is required and has correct fields', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/tags/spec/schemas/tag.yml'));
    expect(schema.required).toEqual(['name']);
  });

  test('User has correct required fields', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/users/spec/schemas/user.yml'));
    expect(schema.required).toEqual(['email']);
  });

  test('Variable has correct required fields', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/variables/spec/schemas/variable.yml'));
    expect(schema.required).toEqual(['key', 'value']);
  });

  test('Project has correct required fields', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/projects/spec/schemas/project.yml'));
    expect(schema.required).toEqual(['name']);
  });
});

describe('Spec enum values', () => {
  test('WorkflowNode.onError values', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/node.yml'));
    const onErrorProp = schema.properties!.onError as SchemaDoc;
    if (onErrorProp.enum) {
      expect(onErrorProp.enum).toContain('continueRegularOutput');
    }
  });

  test('WorkflowSettings.callerPolicy values', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflowSettings.yml'));
    const prop = schema.properties!.callerPolicy as SchemaDoc;
    if (prop.enum) {
      expect(prop.enum).toContain('any');
    }
  });
});

describe('Spec additionalProperties', () => {
  test('Workflow has additionalProperties: false', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/workflows/spec/schemas/workflow.yml'));
    expect(schema.additionalProperties).toBe(false);
  });

  test('Tag has additionalProperties: false', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/tags/spec/schemas/tag.yml'));
    expect(schema.additionalProperties).toBe(false);
  });

  test('Variable has additionalProperties: false', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/variables/spec/schemas/variable.yml'));
    expect(schema.additionalProperties).toBe(false);
  });

  test('Project has additionalProperties: false', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/projects/spec/schemas/project.yml'));
    expect(schema.additionalProperties).toBe(false);
  });

  test('DataTableRow has additionalProperties: true (dynamic columns)', () => {
    const schema = loadYaml(join(SCHEMAS_BASE, 'handlers/data-tables/spec/schemas/dataTableRow.yml'));
    expect(schema.additionalProperties).toBe(true);
  });
});
