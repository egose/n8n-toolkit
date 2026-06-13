"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["595"], {
387(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_api_n_8_n_client_mdx_924_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-api-n-8-n-client-mdx-924.json
var site_docs_api_n_8_n_client_mdx_924_namespaceObject = JSON.parse('{"id":"api/n8n-client","title":"N8nClient API","description":"N8nClient is the root entry point. It creates an HTTP client and provides access to all 15 resource clients.","source":"@site/docs/api/n8n-client.mdx","sourceDirName":"api","slug":"/api/n8n-client","permalink":"/api/n8n-client","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"N8nClient","sidebar_position":0},"sidebar":"api","next":{"title":"Workflow","permalink":"/api/workflow"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/api/n8n-client.mdx


const frontMatter = {
	sidebar_label: 'N8nClient',
	sidebar_position: 0
};
const contentTitle = 'N8nClient API';

const assets = {

};



const toc = [{
  "value": "Constructor",
  "id": "constructor",
  "level": 2
}, {
  "value": "Config Options",
  "id": "config-options",
  "level": 3
}, {
  "value": "Minimal Example",
  "id": "minimal-example",
  "level": 2
}, {
  "value": "Resource Clients",
  "id": "resource-clients",
  "level": 2
}, {
  "value": "Choosing Between Handles And Low-Level Requests",
  "id": "choosing-between-handles-and-low-level-requests",
  "level": 2
}, {
  "value": "Plain Objects Vs Resources",
  "id": "plain-objects-vs-resources",
  "level": 2
}, {
  "value": "Nested Collections",
  "id": "nested-collections",
  "level": 2
}, {
  "value": "Low-Level Requests",
  "id": "low-level-requests",
  "level": 2
}, {
  "value": "Error Handling",
  "id": "error-handling",
  "level": 2
}, {
  "value": "Retry Behavior",
  "id": "retry-behavior",
  "level": 2
}, {
  "value": "Client Scope",
  "id": "client-scope",
  "level": 2
}, {
  "value": "Exports",
  "id": "exports",
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
        id: "n8nclient-api",
        children: "N8nClient API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "N8nClient"
      }), " is the root entry point. It creates an HTTP client and provides access to all 15 resource clients."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Use this page when you want to understand the shape of the client itself: configuration, collection client access, low-level request helpers, and error behavior."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "constructor",
      children: "Constructor"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "config-options",
      children: "Config Options"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Property"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Type"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Required"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "baseUrl"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Yes"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["n8n instance URL (e.g. ", (0,jsx_runtime.jsx)(_components.code, {
              children: "http://localhost:5678"
            }), ")"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "apiKey"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "No*"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["n8n API key (sent as ", (0,jsx_runtime.jsx)(_components.code, {
              children: "X-N8N-API-KEY"
            }), " header)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "bearerToken"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "No*"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["JWT token (sent as ", (0,jsx_runtime.jsx)(_components.code, {
              children: "Authorization: Bearer"
            }), " header)"]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["*Either ", (0,jsx_runtime.jsx)(_components.code, {
        children: "apiKey"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "bearerToken"
      }), " must be provided."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "minimal-example",
      children: "Minimal Example"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY!,\n});\n\nconst { data: workflows } = await client.workflows().list({ limit: 10 });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "resource-clients",
      children: "Resource Clients"
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
              children: "workflows()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "WorkflowClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Workflow management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "executions()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ExecutionClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Execution monitoring"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "CredentialClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Credential management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "tags()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "TagClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Tag management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "users()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "UserClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "User management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "variables()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "VariableClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Variable management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "projects()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ProjectClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Project management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dataTables()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Data table management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "folders(projectId)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "FolderClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Folder management (project-scoped)"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "communityPackages()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "CommunityPackageClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Community package management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "audit()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "AuditClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Audit report generation"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "insights()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "InsightsClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Execution insights"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "sourceControl()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SourceControlClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Source control operations"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "discover()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DiscoverClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Resource discovery"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "n8nPackage()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "N8nPackageClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Package import/export"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "choosing-between-handles-and-low-level-requests",
      children: "Choosing Between Handles And Low-Level Requests"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Prefer a resource client when the library already exposes the endpoint you need:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.workflows().archive('wf-123');\nawait client.executions().retry(42, { loadWorkflow: true });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Use the low-level helpers when:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "you need to experiment against a newly added endpoint before the library wraps it"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "you want to attach custom headers for a one-off request"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "you are intentionally working at the HTTP layer"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "plain-objects-vs-resources",
      children: "Plain Objects Vs Resources"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Collection client methods like ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list()"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get()"
      }), " return plain API DTOs."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "When you want an instance with bound methods, use the opt-in resource methods:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = await client.projects().getResource('proj-1');\nawait project.update({ name: 'Ops' });\n\nconst workflow = await client.workflows().getResource('wf-1');\nawait workflow.activate();\n\nconst folders = await project.folders().listResources({ take: '10' });\nawait folders.data[0]?.update({ name: 'Archived Workflows' });\n\nconst renamedFolder = await project.folders().updateResource('folder-id', { name: 'Archived Workflows' });\n\nawait project.variables().create({ key: 'API_URL', value: 'https://example.com' });\n\nconst createdWorkflow = await project.workflows().create({\n  name: 'Sync',\n  nodes: [],\n  connections: {},\n  settings: {},\n});\n\nconst createdFolder = await project.folders().create({ name: 'Operations' });\n\nconst table = await project.dataTables().createResource({\n  name: 'Users',\n  columns: [{ name: 'email', type: 'string' }],\n});\n\nawait table.createColumn({ name: 'active', type: 'boolean' });\n\nconst recentRuns = await project.executions().listResources({ limit: 10, status: 'success' });\nawait recentRuns.data[0]?.getTags();\n\nconst workflowResource = await client.workflows().getResource('wf-1');\nconst workflowRuns = await workflowResource.executions().listResources({ limit: 10 });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The current resource layer covers:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "CommunityPackageResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "ProjectResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "WorkflowResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "CredentialResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "DataTableResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "ExecutionResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "FolderResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "TagResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "UserResource"
        })
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: (0,jsx_runtime.jsx)(_components.code, {
          children: "VariableResource"
        })
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "nested-collections",
      children: "Nested Collections"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Some bound resources expose nested collections for related resources:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = await client.projects().getResource('proj-1');\n\nconst workflow = await project.workflows().get('wf-1');\nconst workflowResource = await project.workflows().getResource('wf-1');\n\nconst updatedFolder = await project.folders().update('folder-id', { name: 'Archive' });\nconst updatedFolderResource = await project.folders().updateResource('folder-id', { name: 'Archive' });\n\nconst run = await workflowResource.executions().get(123);\nconst runResource = await workflowResource.executions().getResource(123);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Rule of thumb:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "raw nested methods mirror the underlying client/API return type"
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "getResource()"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "createResource()"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "updateResource()"
        }), " return bound resource instances"]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "nested collections only expose the pairs the API can support honestly"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Some nested collections are true scoped relationships, while others are filtered or verified convenience relationships:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "project.folders()"
        }), " is truly project-scoped by endpoint path"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "project.workflows()"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "project.variables()"
        }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "project.executions()"
        }), " use project filters and explicit membership checks where needed"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "project.dataTables()"
        }), " currently supports project-scoped creation plus guarded single-resource access"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["When a create endpoint returns the created entity, the matching client also exposes ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource()"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const workflow = await client.workflows().createResource({\n  name: 'Sync',\n  nodes: [],\n  connections: {},\n  settings: {},\n});\n\nconst folder = await client.folders('proj-1').createResource({\n  name: 'Operations',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Rule of thumb:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "create()"
        }), " mirrors the underlying API/client return type"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "createResource()"
        }), " returns a bound resource instance when the API returns the created entity"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "updateResource()"
        }), " follows the same rule for update endpoints that return the updated entity"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "projects().createResource()"
      }), " is intentionally not available because the n8n public API returns no project ID or entity body from ", (0,jsx_runtime.jsx)(_components.code, {
        children: "POST /projects"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["For community packages, the equivalent opt-in method is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "installResource()"
      }), " because the public API uses install/uninstall verbs."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "low-level-requests",
      children: "Low-Level Requests"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["If you need an endpoint or option that is not covered by a resource client yet, ", (0,jsx_runtime.jsx)(_components.code, {
        children: "N8nClient"
      }), " exposes thin request helpers without exposing the transport object itself:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "// Direct GET request\nconst data = await client.get('/workflows', { limit: 5 });\n\n// Direct POST request\nawait client.post('/workflows', { name: 'New Workflow', nodes: [], connections: {}, settings: {} });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "These helpers still use the same authentication, retry, and response parsing rules as the typed clients."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "error-handling",
      children: "Error Handling"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The client throws ", (0,jsx_runtime.jsx)(_components.code, {
        children: "HttpError"
      }), " for non-2xx responses:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import { HttpError } from '@egose/n8n-client';\n\ntry {\n  await client.workflows().get('nonexistent');\n} catch (error) {\n  if (error instanceof HttpError) {\n    console.log(error.status);  // 404\n    console.log(error.message); // \"Workflow not found\"\n    console.log(error.data);    // Full error response body\n  }\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "retry-behavior",
      children: "Retry Behavior"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Transient errors are retried automatically with exponential backoff:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "408"
        }), " Request Timeout"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "429"
        }), " Too Many Requests"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "500"
        }), " Internal Server Error"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "502"
        }), " Bad Gateway"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "503"
        }), " Service Unavailable"]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "504"
        }), " Gateway Timeout"]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Non-transient failures are surfaced immediately as ", (0,jsx_runtime.jsx)(_components.code, {
        children: "HttpError"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "client-scope",
      children: "Client Scope"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Most resource clients are unscoped:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "client.workflows()\nclient.executions()\nclient.projects()\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "folders()"
      }), " is the exception because folder endpoints are project-scoped in the n8n API:"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const folder = client.folders('project-id');\nawait folder.list();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "exports",
      children: "Exports"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import N8nClient, { HttpClient, HttpError } from '@egose/n8n-client';\nimport type { RequestOptions, Workflow, Execution, ... } from '@egose/n8n-client';\n"
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