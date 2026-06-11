"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["758"], {
7626(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_tag_mdx_e9a_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-tag-mdx-e9a.json
var site_docs_api_tag_mdx_e9a_namespaceObject = JSON.parse('{"id":"api/tag","title":"Tag API","description":"TagHandle manages tags for workflows and executions.","source":"@site/docs/api/tag.mdx","sourceDirName":"api","slug":"/api/tag","permalink":"/api/tag","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_label":"Tag","sidebar_position":4},"sidebar":"api","previous":{"title":"Credential","permalink":"/api/credential"},"next":{"title":"User","permalink":"/api/user"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/tag.mdx


const frontMatter = {
	sidebar_label: 'Tag',
	sidebar_position: 4
};
const contentTitle = 'Tag API';

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
        id: "tag-api",
        children: "Tag API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "TagHandle"
      }), " manages tags for workflows and executions."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const tag = client.tag();\n"
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
      children: "List all tags."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.tag().list({ limit: 20 });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "get(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get a tag by ID."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const tag = await client.tag().get('tag-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "create(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create a new tag."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const tag = await client.tag().create({ name: 'production' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(id, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a tag."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.tag().update('tag-123', { name: 'prod' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a tag."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const deleted = await client.tag().delete('tag-123');\n"
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