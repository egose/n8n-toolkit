"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["8201"], {
176(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_api_data_table_mdx_040_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-api-data-table-mdx-040.json
var site_docs_n_8_n_client_api_data_table_mdx_040_namespaceObject = JSON.parse('{"id":"n8n-client/api/data-table","title":"Data Table API","description":"DataTableClient manages n8n data tables — tables, columns, and rows with filtering and upsert support.","source":"@site/docs/n8n-client/api/data-table.mdx","sourceDirName":"n8n-client/api","slug":"/n8n-client/api/data-table","permalink":"/n8n-client/api/data-table","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":8,"frontMatter":{"sidebar_label":"Data Table","sidebar_position":8},"sidebar":"n8nClient","previous":{"title":"Project","permalink":"/n8n-client/api/project"},"next":{"title":"Folder","permalink":"/n8n-client/api/folder"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-client/api/data-table.mdx


const frontMatter = {
	sidebar_label: 'Data Table',
	sidebar_position: 8
};
const contentTitle = 'Data Table API';

const assets = {

};



const toc = [{
  "value": "Access",
  "id": "access",
  "level": 2
}, {
  "value": "Methods",
  "id": "methods",
  "level": 2
}, {
  "value": "Common Tasks",
  "id": "common-tasks",
  "level": 2
}, {
  "value": "<code>list(params?)</code>",
  "id": "listparams",
  "level": 3
}, {
  "value": "<code>get(id)</code>",
  "id": "getid",
  "level": 3
}, {
  "value": "<code>create(data)</code>",
  "id": "createdata",
  "level": 3
}, {
  "value": "<code>update(id, data)</code>",
  "id": "updateid-data",
  "level": 3
}, {
  "value": "<code>delete(id)</code>",
  "id": "deleteid",
  "level": 3
}, {
  "value": "Row Operations",
  "id": "row-operations",
  "level": 2
}, {
  "value": "<code>listRows(dataTableId, params?)</code>",
  "id": "listrowsdatatableid-params",
  "level": 3
}, {
  "value": "<code>insertRows(dataTableId, data)</code>",
  "id": "insertrowsdatatableid-data",
  "level": 3
}, {
  "value": "<code>updateRows(dataTableId, data)</code>",
  "id": "updaterowsdatatableid-data",
  "level": 3
}, {
  "value": "<code>upsertRow(dataTableId, data)</code>",
  "id": "upsertrowdatatableid-data",
  "level": 3
}, {
  "value": "<code>deleteRows(dataTableId, params)</code>",
  "id": "deleterowsdatatableid-params",
  "level": 3
}, {
  "value": "Column Operations",
  "id": "column-operations",
  "level": 2
}, {
  "value": "<code>listColumns(dataTableId)</code>",
  "id": "listcolumnsdatatableid",
  "level": 3
}, {
  "value": "<code>createColumn(dataTableId, data)</code>",
  "id": "createcolumndatatableid-data",
  "level": 3
}, {
  "value": "<code>updateColumn(dataTableId, columnId, data)</code>",
  "id": "updatecolumndatatableid-columnid-data",
  "level": 3
}, {
  "value": "<code>deleteColumn(dataTableId, columnId)</code>",
  "id": "deletecolumndatatableid-columnid",
  "level": 3
}, {
  "value": "Return Type Narrowing",
  "id": "return-type-narrowing",
  "level": 2
}, {
  "value": "DataTableResource",
  "id": "datatableresource",
  "level": 2
}, {
  "value": "Properties",
  "id": "properties",
  "level": 3
}, {
  "value": "Table methods",
  "id": "table-methods",
  "level": 3
}, {
  "value": "Row methods",
  "id": "row-methods",
  "level": 3
}, {
  "value": "Column methods",
  "id": "column-methods",
  "level": 3
}, {
  "value": "Snapshot management",
  "id": "snapshot-management",
  "level": 3
}, {
  "value": "Example",
  "id": "example",
  "level": 3
}];
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    header: "header",
    li: "li",
    p: "p",
    pre: "pre",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "data-table-api",
        children: "Data Table API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "DataTableClient"
      }), " manages n8n data tables — tables, columns, and rows with filtering and upsert support."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This is one of the most flexible handles in the client. The row methods have typed overloads so the return type changes based on flags like ", (0,jsx_runtime.jsx)(_components.code, {
        children: "returnType"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "returnData"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const dataTable = client.dataTables();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "create tables for lightweight operational data"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "insert rows in batches"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "update rows with filters"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "upsert one logical record based on a filter"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "manage table columns separately from row data"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listparams",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "list(params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List data tables."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.dataTables().list({\n  limit: 10,\n  filter: 'name',\n  sortBy: 'createdAt:desc',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "get(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get a data table by ID."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const table = await client.dataTables().get('dt-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "create(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create a new data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const table = await client.dataTables().create({\n  name: 'User Events',\n  columns: [\n    { name: 'event', type: 'string' },\n    { name: 'createdAt', type: 'date' },\n  ],\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Column types supported at creation time: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "string"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "number"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "boolean"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "date"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "json"
      }), ". The ", (0,jsx_runtime.jsx)(_components.code, {
        children: "json"
      }), " type is available when creating columns but may not appear in read responses from the API."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(id, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.dataTables().update('dt-123', {\n  name: 'User Events v2',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.dataTables().delete('dt-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "row-operations",
      children: "Row Operations"
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listrowsdatatableid-params",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "listRows(dataTableId, params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List rows in a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.dataTables().listRows('dt-123', {\n  filter: 'event=login',\n  sortBy: 'timestamp:desc',\n  search: 'alice',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "insertrowsdatatableid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "insertRows(dataTableId, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Insert rows into a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const rowIds = await client.dataTables().insertRows('dt-123', {\n  data: [\n    { event: 'login', createdAt: '2024-01-01T00:00:00Z' },\n    { event: 'logout', createdAt: '2024-01-01T01:00:00Z' },\n  ],\n  returnType: 'id',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updaterowsdatatableid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "updateRows(dataTableId, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update rows matching a filter."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updatedRows = await client.dataTables().updateRows('dt-123', {\n  filter: {\n    filters: [{ columnName: 'event', condition: 'eq', value: 'login' }],\n  },\n  data: { event: 'sign_in' },\n  returnData: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "upsertrowdatatableid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "upsertRow(dataTableId, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Insert or update a single row."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const row = await client.dataTables().upsertRow('dt-123', {\n  filter: {\n    filters: [{ columnName: 'event', condition: 'eq', value: 'login' }],\n  },\n  data: { event: 'login', createdAt: '2024-01-01T00:00:00Z' },\n  returnData: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleterowsdatatableid-params",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "deleteRows(dataTableId, params)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete rows matching a filter."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const result = await client.dataTables().deleteRows('dt-123', {\n  filter: JSON.stringify({\n    type: 'and',\n    filters: [{ columnName: 'event', condition: 'eq', value: 'logout' }],\n  }),\n  returnData: true,\n  dryRun: false,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "column-operations",
      children: "Column Operations"
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listcolumnsdatatableid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "listColumns(dataTableId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List columns in a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const columns = await client.dataTables().listColumns('dt-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createcolumndatatableid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "createColumn(dataTableId, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Add a column to a data table."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const column = await client.dataTables().createColumn('dt-123', {\n  name: 'user_id',\n  type: 'string',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updatecolumndatatableid-columnid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "updateColumn(dataTableId, columnId, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a column."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.dataTables().updateColumn('dt-123', 'col-1', {\n  name: 'user_identifier',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deletecolumndatatableid-columnid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "deleteColumn(dataTableId, columnId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a column."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.dataTables().deleteColumn('dt-123', 'col-1');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "return-type-narrowing",
      children: "Return Type Narrowing"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Some row operations change their return type based on the request flags:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const count = await client.dataTables().insertRows('dt-123', {\n  data: [{ event: 'login' }],\n});\n// { count: number }\n\nconst ids = await client.dataTables().insertRows('dt-123', {\n  data: [{ event: 'login' }],\n  returnType: 'id',\n});\n// number[]\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "datatableresource",
      children: "DataTableResource"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources()"
      }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource()"
      }), " to get a bound ", (0,jsx_runtime.jsx)(_components.code, {
        children: "DataTableResource"
      }), " instance."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const resource = await client.dataTables().getResource('dt-123');\nconst created = await client.dataTables().createResource({\n  name: 'User Events',\n  columns: [\n    { name: 'event', type: 'string' },\n    { name: 'createdAt', type: 'date' },\n  ],\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "properties",
      children: "Properties"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Property"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Type"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "id"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Data table ID"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "name"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Data table name"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "table-methods",
      children: "Table methods"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Method"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Returns"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "refresh()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Re-fetch the table from the API"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "update(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Update the table — replaces snapshot with the API response"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "patch(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Convenience update — merges partial fields into the current table snapshot before updating"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "delete()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Delete the table"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "row-methods",
      children: "Row methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Row methods on the resource mirror the corresponding client methods but with the table ID pre-filled."
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Method"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Returns"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "listRows(params?)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableRowListResponse"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "List rows in the table"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "insertRows(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "overloads"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Insert rows — return type depends on ", (0,jsx_runtime.jsx)(_components.code, {
              children: "returnType"
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "updateRows(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "overloads"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Update rows matching a filter"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "upsertRow(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "overloads"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Insert or update a single row"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "deleteRows(params)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "overloads"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Delete rows matching a filter"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "column-methods",
      children: "Column methods"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Method"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Returns"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "listColumns()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableColumn[]"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "List columns in the table"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "createColumn(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableColumn"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Add a column — patches snapshot to include it"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "updateColumn(columnId, data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableColumn"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Update a column — replaces matching entry in snapshot"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "deleteColumn(columnId)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Delete a column — removes it from the snapshot"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "snapshot-management",
      children: "Snapshot management"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "refresh()"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update()"
      }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch()"
      }), " call ", (0,jsx_runtime.jsx)(_components.code, {
        children: "replaceSnapshot()"
      }), ". Column methods (", (0,jsx_runtime.jsx)(_components.code, {
        children: "createColumn"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateColumn"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "deleteColumn"
      }), ") call ", (0,jsx_runtime.jsx)(_components.code, {
        children: "mergeSnapshot()"
      }), " to patch the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "columns"
      }), " array locally without re-fetching the full table."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "example",
      children: "Example"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const table = await client.dataTables().createResource({\n  name: 'Events',\n  columns: [{ name: 'event', type: 'string' }],\n});\n\nawait table.createColumn({ name: 'timestamp', type: 'date' });\n\nconst rows = await table.insertRows({\n  data: [{ event: 'login' }],\n  returnType: 'all',\n});\n\nawait table.deleteColumn(table.data.columns[0].id);\n"
      })
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = {
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return MDXLayout ? (0,jsx_runtime.jsx)(MDXLayout, {
    ...props,
    children: (0,jsx_runtime.jsx)(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}



},
1137(__unused_rspack___webpack_module__, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  R: () => (useMDXComponents),
  x: () => (MDXProvider)
});
/* import */ var react__rspack_import_0 = __webpack_require__(2086);
/**
 * @import {MDXComponents} from 'mdx/types.js'
 * @import {Component, ReactElement, ReactNode} from 'react'
 */

/**
 * @callback MergeComponents
 *   Custom merge function.
 * @param {Readonly<MDXComponents>} currentComponents
 *   Current components from the context.
 * @returns {MDXComponents}
 *   Additional components.
 *
 * @typedef Props
 *   Configuration for `MDXProvider`.
 * @property {ReactNode | null | undefined} [children]
 *   Children (optional).
 * @property {Readonly<MDXComponents> | MergeComponents | null | undefined} [components]
 *   Additional components to use or a function that creates them (optional).
 * @property {boolean | null | undefined} [disableParentContext=false]
 *   Turn off outer component context (default: `false`).
 */



/** @type {Readonly<MDXComponents>} */
const emptyComponents = {}

const MDXContext = react__rspack_import_0.createContext(emptyComponents)

/**
 * Get current components from the MDX Context.
 *
 * @param {Readonly<MDXComponents> | MergeComponents | null | undefined} [components]
 *   Additional components to use or a function that creates them (optional).
 * @returns {MDXComponents}
 *   Current components.
 */
function useMDXComponents(components) {
  const contextComponents = react__rspack_import_0.useContext(MDXContext)

  // Memoize to avoid unnecessary top-level context changes
  return react__rspack_import_0.useMemo(
    function () {
      // Custom merge via a function prop
      if (typeof components === 'function') {
        return components(contextComponents)
      }

      return {...contextComponents, ...components}
    },
    [contextComponents, components]
  )
}

/**
 * Provider for MDX context.
 *
 * @param {Readonly<Props>} properties
 *   Properties.
 * @returns {ReactElement}
 *   Element.
 * @satisfies {Component}
 */
function MDXProvider(properties) {
  /** @type {Readonly<MDXComponents>} */
  let allComponents

  if (properties.disableParentContext) {
    allComponents =
      typeof properties.components === 'function'
        ? properties.components(emptyComponents)
        : properties.components || emptyComponents
  } else {
    allComponents = useMDXComponents(properties.components)
  }

  return react__rspack_import_0.createElement(
    MDXContext.Provider,
    {value: allComponents},
    properties.children
  )
}


},

}]);