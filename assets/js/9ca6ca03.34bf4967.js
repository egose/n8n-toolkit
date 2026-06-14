"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["806"], {
2374(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_credential_mdx_9ca_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-credential-mdx-9ca.json
var site_docs_api_credential_mdx_9ca_namespaceObject = JSON.parse('{"id":"api/credential","title":"Credential API","description":"CredentialClient manages n8n credentials — create, read, update, delete, test, and transfer between projects.","source":"@site/docs/api/credential.mdx","sourceDirName":"api","slug":"/api/credential","permalink":"/api/credential","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Credential","sidebar_position":3},"sidebar":"api","previous":{"title":"Execution","permalink":"/api/execution"},"next":{"title":"Tag","permalink":"/api/tag"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/credential.mdx


const frontMatter = {
	sidebar_label: 'Credential',
	sidebar_position: 3
};
const contentTitle = 'Credential API';

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
  "value": "<code>test(id)</code>",
  "id": "testid",
  "level": 3
}, {
  "value": "<code>transfer(id, destinationProjectId)</code>",
  "id": "transferid-destinationprojectid",
  "level": 3
}, {
  "value": "<code>getSchema(credentialTypeName)</code>",
  "id": "getschemacredentialtypename",
  "level": 3
}, {
  "value": "CredentialResource",
  "id": "credentialresource",
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
  "value": "Snapshot management",
  "id": "snapshot-management",
  "level": 3
}, {
  "value": "Typical Flow",
  "id": "typical-flow",
  "level": 2
}, {
  "value": "Typical Flow with Resource",
  "id": "typical-flow-with-resource",
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
        id: "credential-api",
        children: "Credential API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "CredentialClient"
      }), " manages n8n credentials — create, read, update, delete, test, and transfer between projects."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Credential payloads are intentionally flexible because the exact ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), " shape depends on the credential type you are working with."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const credential = client.credentials();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "methods",
      children: "Methods"
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "common-tasks",
      children: "Common Tasks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "list credentials for audit or cleanup work"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "create credentials in a target project"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "update secret material or display names"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "test a credential before attaching it to workflows"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "move credentials between projects"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "listparams",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "list(params?)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "List credentials."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data, nextCursor } = await client.credentials().list({\n  limit: 10,\n  cursor: 'abc123',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "get(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get a credential by ID."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const credential = await client.credentials().get('cred-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "createdata",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "create(data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create a new credential."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const created = await client.credentials().create({\n  name: 'AWS Credentials',\n  type: 'aws',\n  data: { accessKey: 'AKIA123', secretKey: 'secret456' }, // pragma: allowlist secret\n  projectId: 'proj-1',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "updateid-data",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "update(id, data)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Update a credential."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const updated = await client.credentials().update('cred-123', {\n  name: 'Updated AWS Credentials',\n  data: { accessKey: 'AKIA789', secretKey: 'newsecret' }, // pragma: allowlist secret\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "deleteid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "delete(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Delete a credential."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const deleted = await client.credentials().delete('cred-123');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "testid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "test(id)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Test a credential's connection."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const result = await client.credentials().test('cred-123');\n// result.status, result.message\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "transferid-destinationprojectid",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "transfer(id, destinationProjectId)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Move a credential to another project."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.credentials().transfer('cred-123', 'proj-456');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "getschemacredentialtypename",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "getSchema(credentialTypeName)"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Get the schema for a credential type."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const schema = await client.credentials().getSchema('httpHeaderAuth');\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "credentialresource",
      children: "CredentialResource"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources()"
      }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource()"
      }), " to get a bound ", (0,jsx_runtime.jsx)(_components.code, {
        children: "CredentialResource"
      }), " instance."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const resource = await client.credentials().getResource('cred-123');\nconst created = await client.credentials().createResource({\n  name: 'AWS Credentials',\n  type: 'aws',\n  data: { accessKey: 'AKIA123', secretKey: 'secret456' }, // pragma: allowlist secret\n  projectId: 'proj-1',\n});\n"
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
            children: "Credential ID"
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
            children: "Credential name"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "type"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Credential type identifier"
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
              children: "update(data)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "this"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Update the credential — replaces snapshot with the API response"
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
            children: "Convenience update — merges partial fields with the current writable credential snapshot"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "delete()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "Credential"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Delete the credential"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "test()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "CredentialTestResponse"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Test the credential connection"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "transfer(destinationProjectId)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Move to another project"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "getSchema()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "JsonObject"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Get the schema for this credential type"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "snapshot-management",
      children: "Snapshot management"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "update()"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch()"
      }), " call ", (0,jsx_runtime.jsx)(_components.code, {
        children: "replaceSnapshot()"
      }), " with the API response."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "typical-flow",
      children: "Typical Flow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const credential = client.credentials();\n\nconst created = await credential.create({\n  name: 'Internal API Token',\n  type: 'httpHeaderAuth',\n  data: {\n    name: 'Authorization',\n    value: 'Bearer token',\n  },\n});\n\nawait credential.test(created.id);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "typical-flow-with-resource",
      children: "Typical Flow with Resource"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const resource = await client.credentials().createResource({\n  name: 'Internal API Token',\n  type: 'httpHeaderAuth',\n  data: { name: 'Authorization', value: 'Bearer token' },\n});\n\nconst testResult = await resource.test();\n\nif (testResult.status === 'success') {\n  await resource.transfer('proj-456');\n}\n"
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