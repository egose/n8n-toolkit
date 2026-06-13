"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["889"], {
9416(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_project_mdx_925_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-project-mdx-925.json
var site_docs_api_project_mdx_925_namespaceObject = JSON.parse('{"id":"api/project","title":"Project API","description":"ProjectHandle manages n8n projects and their members.","source":"@site/docs/api/project.mdx","sourceDirName":"api","slug":"/api/project","permalink":"/api/project","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":7,"frontMatter":{"sidebar_label":"Project","sidebar_position":7},"sidebar":"api","previous":{"title":"Variable","permalink":"/api/variable"},"next":{"title":"Data Table","permalink":"/api/data-table"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/project.mdx


const frontMatter = {
	sidebar_label: 'Project',
	sidebar_position: 7
};
const contentTitle = 'Project API';

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
  "value": "<code>listMembers(projectId, params?)</code>",
  "id": "listmembersprojectid-params",
  "level": 3
}, {
  "value": "<code>addMembers(projectId, relations)</code>",
  "id": "addmembersprojectid-relations",
  "level": 3
}, {
  "value": "<code>removeMember(projectId, userId)</code>",
  "id": "removememberprojectid-userid",
  "level": 3
}, {
  "value": "<code>changeMemberRole(projectId, userId, role)</code>",
  "id": "changememberroleprojectid-userid-role",
  "level": 3
}, {
  "value": "Important Note",
  "id": "important-note",
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
        id: "project-api",
        children: "Project API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "ProjectHandle"
      }), " manages n8n projects and their members."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This handle is the entry point for organization-level operations: project creation, renaming, deletion, and project membership changes."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = client.project();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "create projects for teams or environments"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "list and audit project membership"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "grant or revoke access for specific users"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "move users between viewer, editor, and admin roles"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listparams",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "list(params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List all projects visible to the authenticated caller."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.project().list({ limit: 10 });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "create(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create a new project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().create({ name: 'Production' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(id, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().update('proj-123', { name: 'Production v2' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().delete('proj-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listmembersprojectid-params",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "listMembers(projectId, params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List members of a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data } = await client.project().listMembers('proj-123', { limit: 50 });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "addmembersprojectid-relations",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "addMembers(projectId, relations)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Add members to a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().addMembers('proj-123', [\n  { userId: 'user-1', role: 'project:admin' },\n  { userId: 'user-2', role: 'project:editor' },\n]);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "removememberprojectid-userid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "removeMember(projectId, userId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Remove a member from a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().removeMember('proj-123', 'user-1');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "changememberroleprojectid-userid-role",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "changeMemberRole(projectId, userId, role)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Change a member's role in a project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.project().changeMemberRole('proj-123', 'user-1', 'project:viewer');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "important-note",
      children: "Important Note"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The public API does not expose ", (0,jsx_runtime.jsx)(_components.code, {
        children: "project().get(id)"
      }), ". Use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list()"
      }), " and then select the project you want, or work from IDs you already have."]
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