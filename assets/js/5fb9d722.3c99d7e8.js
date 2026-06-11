"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["259"], {
1214(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_workflow_mdx_5fb_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-workflow-mdx-5fb.json
var site_docs_api_workflow_mdx_5fb_namespaceObject = JSON.parse('{"id":"api/workflow","title":"Workflow API","description":"WorkflowHandle manages n8n workflows — create, list, activate, deactivate, archive, transfer, and manage tags and versions.","source":"@site/docs/api/workflow.mdx","sourceDirName":"api","slug":"/api/workflow","permalink":"/api/workflow","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Workflow","sidebar_position":1},"sidebar":"api","previous":{"title":"N8nClient","permalink":"/api/n8n-client"},"next":{"title":"Execution","permalink":"/api/execution"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/workflow.mdx


const frontMatter = {
	sidebar_label: 'Workflow',
	sidebar_position: 1
};
const contentTitle = 'Workflow API';

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
  "value": "<code>get(id, params?)</code>",
  "id": "getid-params",
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
  "value": "<code>activate(id, data?)</code>",
  "id": "activateid-data",
  "level": 3
}, {
  "value": "<code>deactivate(id)</code>",
  "id": "deactivateid",
  "level": 3
}, {
  "value": "<code>archive(id)</code> / <code>unarchive(id)</code>",
  "id": "archiveid--unarchiveid",
  "level": 3
}, {
  "value": "<code>transfer(id, destinationProjectId)</code>",
  "id": "transferid-destinationprojectid",
  "level": 3
}, {
  "value": "<code>getTags(id)</code> / <code>updateTags(id, tags)</code>",
  "id": "gettagsid--updatetagsid-tags",
  "level": 3
}, {
  "value": "<code>getVersion(id, versionId)</code>",
  "id": "getversionid-versionid",
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
        id: "workflow-api",
        children: "Workflow API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "WorkflowHandle"
      }), " manages n8n workflows — create, list, activate, deactivate, archive, transfer, and manage tags and versions."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const workflow = client.workflow();\n"
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
      children: "List workflows with optional filters."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.workflow().list({\n  limit: 10,\n  active: true,\n  tags: 'production',\n  name: 'deploy',\n  projectId: 'proj-1',\n  excludePinnedData: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getid-params",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "get(id, params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get a workflow by ID."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const workflow = await client.workflow().get('wf-123', {\n  excludePinnedData: false,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "create(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create a new workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const workflow = await client.workflow().create({\n  name: 'My Workflow',\n  nodes: [{ name: 'Start', type: 'n8n-nodes-base.start', position: [0, 0], parameters: {} }],\n  connections: {},\n  settings: { executionOrder: 'v1' },\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(id, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.workflow().update('wf-123', {\n  name: 'Updated Name',\n  active: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const deleted = await client.workflow().delete('wf-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "activateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "activate(id, data?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Activate a workflow. Optionally provide version metadata."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const activated = await client.workflow().activate('wf-123', {\n  versionId: 'v-2',\n  name: 'Production version',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deactivateid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "deactivate(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Deactivate a workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const deactivated = await client.workflow().deactivate('wf-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.h3, {
      id: "archiveid--unarchiveid",
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "archive(id)"
      }), " / ", (0,jsx_runtime.jsx)(_components.code, {
        children: "unarchive(id)"
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Archive or unarchive a workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.workflow().archive('wf-123');\nawait client.workflow().unarchive('wf-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "transferid-destinationprojectid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "transfer(id, destinationProjectId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Move a workflow to another project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.workflow().transfer('wf-123', 'proj-456');\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.h3, {
      id: "gettagsid--updatetagsid-tags",
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "getTags(id)"
      }), " / ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateTags(id, tags)"
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get or update tags on a workflow."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const tags = await client.workflow().getTags('wf-123');\nconst updatedTags = await client.workflow().updateTags('wf-123', [\n  { id: 'tag-1' },\n  { id: 'tag-2' },\n]);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getversionid-versionid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "getVersion(id, versionId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get a specific workflow version."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const version = await client.workflow().getVersion('wf-123', 'v-1');\n"
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