"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["3450"], {
7613(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_api_n_8_n_package_mdx_ebb_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-api-n-8-n-package-mdx-ebb.json
var site_docs_n_8_n_client_api_n_8_n_package_mdx_ebb_namespaceObject = JSON.parse('{"id":"n8n-client/api/n8n-package","title":"n8n Package API","description":"N8nPackageClient manages workflow import and export packages.","source":"@site/docs/n8n-client/api/n8n-package.mdx","sourceDirName":"n8n-client/api","slug":"/n8n-client/api/n8n-package","permalink":"/n8n-client/api/n8n-package","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":15,"frontMatter":{"sidebar_label":"n8n Package","sidebar_position":15},"sidebar":"n8nClient","previous":{"title":"Discover","permalink":"/n8n-client/api/discover"},"next":{"title":"Security Policy","permalink":"/n8n-client/api/security-policy"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-client/api/n8n-package.mdx


const frontMatter = {
	sidebar_label: 'n8n Package',
	sidebar_position: 15
};
const contentTitle = 'n8n Package API';

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
  "value": "<code>exportWorkflows(data)</code>",
  "id": "exportworkflowsdata",
  "level": 3
}, {
  "value": "<code>importPackage(pkg, options)</code>",
  "id": "importpackagepkg-options",
  "level": 3
}, {
  "value": "Import Options",
  "id": "import-options",
  "level": 4
}];
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    header: "header",
    li: "li",
    p: "p",
    pre: "pre",
    strong: "strong",
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
        id: "n8n-package-api",
        children: "n8n Package API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "N8nPackageClient"
      }), " manages workflow import and export packages."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This handle is beta-aligned with the public API and is useful when you need to move groups of workflows between instances or environments."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const n8nPackage = client.n8nPackage();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "export one or more workflows as a gzipped package"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "import a package into a target project or folder"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "decide how workflow conflicts should be handled during import"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "exportworkflowsdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "exportWorkflows(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Export workflows, folders, or whole projects as a downloadable gzipped package."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const buffer = await client.n8nPackage().exportWorkflows({\n  workflowIds: ['wf-1', 'wf-2'],\n  includeVariableValues: true,\n  missingWorkflowDependencyPolicy: 'include-in-package',\n});\n// buffer is ArrayBuffer (gzipped package)\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Field"
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
              children: "workflowIds"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string[]"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Loose workflows to export. Mutually exclusive with whole-project exports."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "folderIds"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string[]"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Folders to export, including nested folders. Mutually exclusive with whole-project exports."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "projectIds"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string[]"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Whole projects to export. Mutually exclusive with loose workflow/folder exports."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "includeVariableValues"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "boolean"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Whether referenced variable values are bundled into the package. Defaults to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "missingWorkflowDependencyPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'fail' | 'reference-only' | 'include-in-package'"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Policy for missing static sub-workflow dependencies. Defaults to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "fail"
            }), "."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "importpackagepkg-options",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "importPackage(pkg, options)"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Import a workflow package (zip file). The ", (0,jsx_runtime.jsx)(_components.code, {
        children: "pkg"
      }), " parameter accepts a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "File"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "Blob"
      }), " object."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const result = await client.n8nPackage().importPackage(\n  fileBlob,\n  {\n    projectId: 'proj-123',\n    folderId: 'folder-456',\n    credentialMatchingMode: 'id-only',\n    credentialMissingMode: 'must-preexist',\n    workflowConflictPolicy: 'new-version',\n  },\n);\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "workflowConflictPolicy"
      }), " is required. Use it to make import behavior explicit instead of relying on defaults."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "import-options",
      children: "Import Options"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Option"
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
              children: "projectId"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Target project for imported workflows."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "folderId"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Target folder for imported workflows."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentialMatchingMode"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'id-only' | 'name-and-type' | 'type-only'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "How to match existing credentials."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentialMissingMode"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'must-preexist' | 'create-stub'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "What to do when referenced credentials are missing."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "bindings"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "{ credentials?: Record<string, string> }"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Optional explicit source→target id bindings, currently for credentials."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflowConflictPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'new-version' | 'fail' | 'skip'"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["How to handle workflow name conflicts. ", (0,jsx_runtime.jsx)(_components.strong, {
              children: "Required."
            })]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflowIdPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'new' | 'source'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls the id assigned to newly created workflows."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflowPublishingPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'preserve-published-state' | 'match-source' | 'publish-all' | 'unpublish-all'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls whether imported workflows are published after import."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "folderConflictPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'merge' | 'fail'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls how folder conflicts are handled."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dataTableMatchingMode"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'by-id'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls how data tables are matched."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dataTableMissingMode"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'create' | 'must-preexist' | 'do-nothing'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls what happens when referenced data tables are missing."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dataTableSchemaConflictPolicy"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "'keep-existing' | 'fail'"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Controls how strictly matched data-table schemas are compared."
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The response (", (0,jsx_runtime.jsx)(_components.code, {
        children: "ImportPackageResponse"
      }), ") includes the imported ", (0,jsx_runtime.jsx)(_components.code, {
        children: "package"
      }), " metadata, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflows"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "folders"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "projects"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "credentials"
      }), " (matched/stubbed), and explicit ", (0,jsx_runtime.jsx)(_components.code, {
        children: "bindings"
      }), "."]
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