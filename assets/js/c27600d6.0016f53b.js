"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["322"], {
6721(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_community_package_mdx_c27_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-community-package-mdx-c27.json
var site_docs_api_community_package_mdx_c27_namespaceObject = JSON.parse('{"id":"api/community-package","title":"Community Package API","description":"CommunityPackageClient manages n8n community packages — install, update, and uninstall npm packages.","source":"@site/docs/api/community-package.mdx","sourceDirName":"api","slug":"/api/community-package","permalink":"/api/community-package","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":10,"frontMatter":{"sidebar_label":"Community Package","sidebar_position":10},"sidebar":"api","previous":{"title":"Folder","permalink":"/api/folder"},"next":{"title":"Audit","permalink":"/api/audit"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/community-package.mdx


const frontMatter = {
	sidebar_label: 'Community Package',
	sidebar_position: 10
};
const contentTitle = 'Community Package API';

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
  "value": "<code>list()</code>",
  "id": "list",
  "level": 3
}, {
  "value": "<code>install(data)</code>",
  "id": "installdata",
  "level": 3
}, {
  "value": "<code>update(name, data?)</code>",
  "id": "updatename-data",
  "level": 3
}, {
  "value": "<code>uninstall(name)</code>",
  "id": "uninstallname",
  "level": 3
}, {
  "value": "CommunityPackageResource",
  "id": "communitypackageresource",
  "level": 2
}, {
  "value": "Properties",
  "id": "properties",
  "level": 3
}, {
  "value": "Methods",
  "id": "methods-1",
  "level": 3
}, {
  "value": "Note",
  "id": "note",
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
        id: "community-package-api",
        children: "Community Package API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "CommunityPackageClient"
      }), " manages n8n community packages — install, update, and uninstall npm packages."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Use this handle for package lifecycle operations in n8n instances that allow community nodes."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const communityPackage = client.communityPackages();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "list installed community packages"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "install a package from npm"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "update a package to a specific version"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "uninstall packages that are no longer used"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "list",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "list()"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List all installed community packages."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const packages = await client.communityPackages().list();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "installdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "install(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Install a community package."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const pkg = await client.communityPackages().install({\n  name: 'n8n-nodes-test',\n  verify: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updatename-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(name, data?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a community package."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.communityPackages().update('n8n-nodes-test', {\n  version: '1.0.0',\n  verify: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "uninstallname",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "uninstall(name)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Uninstall a community package."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.communityPackages().uninstall('n8n-nodes-test');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "communitypackageresource",
      children: "CommunityPackageResource"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "installResource()"
      }), " to get a bound ", (0,jsx_runtime.jsx)(_components.code, {
        children: "CommunityPackageResource"
      }), " instance."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const resource = await client.communityPackages().getResource('n8n-nodes-test');\nconst installed = await client.communityPackages().installResource({\n  name: 'n8n-nodes-test',\n  verify: true,\n});\n"
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
              children: "packageName"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "npm package name"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "installedVersion"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Currently installed version"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "methods-1",
      children: "Methods"
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
            children: "Re-fetch the package from the API — resolves by name from list"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "update(data?)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Update the package — replaces snapshot with the API response"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "patch(data?)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Convenience update — uses the installed version as the base payload, then merges partial fields over it"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "uninstall()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Uninstall the package"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "note",
      children: "Note"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), " resolves by package name from the list endpoint — there is no direct ", (0,jsx_runtime.jsx)(_components.code, {
        children: "GET /community-packages/{name}"
      }), " in the n8n API. The name-based lookup ensures the package exists before returning a resource."]
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