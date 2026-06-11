"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["313"], {
751(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_data_table_mdx_448_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-data-table-mdx-448.json
var site_docs_api_data_table_mdx_448_namespaceObject = JSON.parse('{"id":"api/data-table","title":"Data Table API","description":"DataTableHandle manages n8n data tables — tables, columns, and rows with filtering and upsert support.","source":"@site/docs/api/data-table.mdx","sourceDirName":"api","slug":"/api/data-table","permalink":"/api/data-table","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":8,"frontMatter":{"sidebar_label":"Data Table","sidebar_position":8},"sidebar":"api","previous":{"title":"Project","permalink":"/api/project"},"next":{"title":"Folder","permalink":"/api/folder"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/data-table.mdx


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
}];
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    header: "header",
    p: "p",
    pre: "pre",
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
        children: "DataTableHandle"
      }), " manages n8n data tables — tables, columns, and rows with filtering and upsert support."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const dataTable = client.dataTable();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
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
        children: "const { data, nextCursor } = await client.dataTable().list({\n  limit: 10,\n  filter: 'name',\n  sortBy: 'createdAt:desc',\n});\n"
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
        children: "const table = await client.dataTable().get('dt-123');\n"
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
        children: "const table = await client.dataTable().create({\n  name: 'User Events',\n  columns: [\n    { name: 'event', type: 'string' },\n    { name: 'timestamp', type: 'datetime' },\n  ],\n});\n"
      })
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
        children: "const updated = await client.dataTable().update('dt-123', {\n  name: 'User Events v2',\n});\n"
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
        children: "await client.dataTable().delete('dt-123');\n"
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
        children: "const { data, nextCursor } = await client.dataTable().listRows('dt-123', {\n  filter: 'event=login',\n  sortBy: 'timestamp:desc',\n  search: 'alice',\n});\n"
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
        children: "const result = await client.dataTable().insertRows('dt-123', {\n  rows: [\n    { event: 'login', timestamp: '2024-01-01T00:00:00Z' },\n    { event: 'logout', timestamp: '2024-01-01T01:00:00Z' },\n  ],\n});\n"
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
        children: "const result = await client.dataTable().updateRows('dt-123', {\n  filter: 'event=login',\n  updates: { event: 'sign_in' },\n});\n"
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
        children: "const row = await client.dataTable().upsertRow('dt-123', {\n  filter: 'event=login',\n  row: { event: 'login', timestamp: '2024-01-01T00:00:00Z' },\n});\n"
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
        children: "const result = await client.dataTable().deleteRows('dt-123', {\n  filter: 'event=logout',\n  returnData: true,\n  dryRun: false,\n});\n"
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
        children: "const columns = await client.dataTable().listColumns('dt-123');\n"
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
        children: "const column = await client.dataTable().createColumn('dt-123', {\n  name: 'user_id',\n  type: 'string',\n});\n"
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
        children: "const updated = await client.dataTable().updateColumn('dt-123', 'col-1', {\n  name: 'user_identifier',\n});\n"
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
        children: "await client.dataTable().deleteColumn('dt-123', 'col-1');\n"
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