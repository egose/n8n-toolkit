"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["8"], {
2924(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_execution_mdx_39f_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-execution-mdx-39f.json
var site_docs_api_execution_mdx_39f_namespaceObject = JSON.parse('{"id":"api/execution","title":"Execution API","description":"ExecutionClient monitors and controls workflow executions — list, get, stop, retry, and manage tags.","source":"@site/docs/api/execution.mdx","sourceDirName":"api","slug":"/api/execution","permalink":"/api/execution","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Execution","sidebar_position":2},"sidebar":"api","previous":{"title":"Workflow","permalink":"/api/workflow"},"next":{"title":"Credential","permalink":"/api/credential"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/execution.mdx


const frontMatter = {
	sidebar_label: 'Execution',
	sidebar_position: 2
};
const contentTitle = 'Execution API';

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
  "value": "<code>get(id, params?)</code>",
  "id": "getid-params",
  "level": 3
}, {
  "value": "<code>delete(id)</code>",
  "id": "deleteid",
  "level": 3
}, {
  "value": "<code>retry(id, data?)</code>",
  "id": "retryid-data",
  "level": 3
}, {
  "value": "<code>stop(id)</code>",
  "id": "stopid",
  "level": 3
}, {
  "value": "<code>stopMany(data)</code>",
  "id": "stopmanydata",
  "level": 3
}, {
  "value": "<code>getTags(id)</code> / <code>updateTags(id, tags)</code>",
  "id": "gettagsid--updatetagsid-tags",
  "level": 3
}, {
  "value": "Typical Flow",
  "id": "typical-flow",
  "level": 2
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
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "execution-api",
        children: "Execution API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "ExecutionClient"
      }), " monitors and controls workflow executions — list, get, stop, retry, and manage tags."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This client is for run history and operational control, not workflow definition changes. Pair it with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "WorkflowClient"
      }), " when you need both deployment and runtime visibility."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const execution = client.executions();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "inspect recent failures"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "fetch a single execution with payload data included"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "stop running executions in bulk"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "retry failed executions after updating the related workflow"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listparams",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "list(params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List executions with optional filters."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.executions().list({\n  limit: 25,\n  status: 'error',\n  workflowId: 'wf-123',\n  projectId: 'proj-1',\n  includeData: true,\n  redactExecutionData: false,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getid-params",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "get(id, params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get an execution by ID."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const execution = await client.executions().get(123, {\n  includeData: true,\n  redactExecutionData: false,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete an execution."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const deleted = await client.executions().delete(123);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "retryid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "retry(id, data?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Retry a failed execution."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const retried = await client.executions().retry(123, {\n  loadWorkflow: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "stopid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "stop(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Stop a running execution."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const stopped = await client.executions().stop(123);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "stopmanydata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "stopMany(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Stop multiple executions matching filters."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { stopped } = await client.executions().stopMany({\n  status: ['running', 'queued', 'waiting'],\n  workflowId: 'wf-123',\n  startedAfter: '2024-01-01T00:00:00Z',\n  startedBefore: '2024-01-02T00:00:00Z',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.h3, {
      id: "gettagsid--updatetagsid-tags",
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "getTags(id)"
      }), " / ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateTags(id, tags)"
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get or update tags on an execution."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const tags = await client.executions().getTags(123);\nconst updatedTags = await client.executions().updateTags(123, [\n  { id: 'tag-1' },\n]);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "typical-flow",
      children: "Typical Flow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const execution = client.executions();\n\nconst { data: failed } = await execution.list({ status: 'error', limit: 20 });\n\nfor (const run of failed) {\n  await execution.retry(run.id, { loadWorkflow: true });\n}\n"
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