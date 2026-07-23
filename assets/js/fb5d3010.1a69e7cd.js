"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["6027"], {
9821(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_about_quick_start_mdx_fb5_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-about-quick-start-mdx-fb5.json
var site_docs_n_8_n_client_about_quick_start_mdx_fb5_namespaceObject = JSON.parse('{"id":"n8n-client/about/quick-start","title":"Quick Start","description":"n8n-client is easiest to understand if you think in three steps:","source":"@site/docs/n8n-client/about/quick-start.mdx","sourceDirName":"n8n-client/about","slug":"/n8n-client/about/quick-start","permalink":"/n8n-client/about/quick-start","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Quick Start","sidebar_position":1},"sidebar":"n8nClient","previous":{"title":"Philosophy","permalink":"/n8n-client/about/philosophy"},"next":{"title":"API Reference","permalink":"/n8n-client/api"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Tabs/index.js + 1 modules
var Tabs = __webpack_require__(1908);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/TabItem/index.js + 1 modules
var TabItem = __webpack_require__(3579);
;// CONCATENATED MODULE: ./docs/n8n-client/about/quick-start.mdx


const frontMatter = {
	sidebar_label: 'Quick Start',
	sidebar_position: 1
};
const contentTitle = 'Quick Start';

const assets = {

};





const toc = [{
  "value": "Installation",
  "id": "installation",
  "level": 2
}, {
  "value": "Authentication",
  "id": "authentication",
  "level": 2
}, {
  "value": "API Key (recommended)",
  "id": "api-key-recommended",
  "level": 3
}, {
  "value": "Bearer Token (JWT)",
  "id": "bearer-token-jwt",
  "level": 3
}, {
  "value": "First Script",
  "id": "first-script",
  "level": 2
}, {
  "value": "Basic Usage",
  "id": "basic-usage",
  "level": 2
}, {
  "value": "List Workflows",
  "id": "list-workflows",
  "level": 3
}, {
  "value": "Get a Workflow",
  "id": "get-a-workflow",
  "level": 3
}, {
  "value": "Create a Credential",
  "id": "create-a-credential",
  "level": 3
}, {
  "value": "Manage Executions",
  "id": "manage-executions",
  "level": 3
}, {
  "value": "How The API Surface Is Organized",
  "id": "how-the-api-surface-is-organized",
  "level": 2
}, {
  "value": "Organize with Projects",
  "id": "organize-with-projects",
  "level": 3
}, {
  "value": "Resource Clients",
  "id": "resource-clients",
  "level": 2
}, {
  "value": "Next Steps",
  "id": "next-steps",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    header: "header",
    li: "li",
    ol: "ol",
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
        id: "quick-start",
        children: "Quick Start"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-client"
      }), " is easiest to understand if you think in three steps:"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Create ", (0,jsx_runtime.jsx)(_components.code, {
          children: "N8nClient"
        }), " with your n8n base URL and one authentication method."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Pick a typed resource client such as ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflows()"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "executions()"
        }), ", or ", (0,jsx_runtime.jsx)(_components.code, {
          children: "projects()"
        }), "."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Call methods that map directly to the public API without hand-writing HTTP requests."
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "installation",
      children: "Installation"
    }), "\n", (0,jsx_runtime.jsxs)(Tabs/* ["default"] */.A, {
      groupId: "npm2yarn",
      children: [(0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "npm",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-bash",
            children: "npm install @egose/n8n-client --save\n"
          })
        })
      }), (0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "yarn",
        label: "Yarn",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-bash",
            children: "yarn add @egose/n8n-client\n"
          })
        })
      }), (0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "pnpm",
        label: "pnpm",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-bash",
            children: "pnpm add @egose/n8n-client\n"
          })
        })
      }), (0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "bun",
        label: "Bun",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-bash",
            children: "bun add @egose/n8n-client\n"
          })
        })
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "authentication",
      children: "Authentication"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The n8n Public API supports two authentication methods: ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "API key"
      }), " and ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "Bearer token"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Use exactly one of them. The client rejects configurations that provide both or neither."
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "api-key-recommended",
      children: "API Key (recommended)"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: 'http://localhost:5678',\n  apiKey: 'your-n8n-api-key', // pragma: allowlist secret\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "bearer-token-jwt",
      children: "Bearer Token (JWT)"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const client = new N8nClient({\n  baseUrl: 'http://localhost:5678',\n  bearerToken: 'your-jwt-token',\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "first-script",
      children: "First Script"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This is the smallest useful script for checking that your instance URL, credentials, and client setup are correct:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY!,\n});\n\nconst { data: workflows } = await client.workflows().list({ limit: 5 });\n\nfor (const workflow of workflows) {\n  console.log(`${workflow.id} ${workflow.name}`);\n}\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "basic-usage",
      children: "Basic Usage"
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "list-workflows",
      children: "List Workflows"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const { data: workflows, nextCursor } = await client.workflows().list({\n  limit: 10,\n  active: true,\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "get-a-workflow",
      children: "Get a Workflow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const workflow = await client.workflows().get('workflow-id');\nconsole.log(workflow.name, workflow.active);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "create-a-credential",
      children: "Create a Credential"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const credential = await client.credentials().create({\n  name: 'My API Key',\n  type: 'httpHeaderAuth',\n  data: {\n    headerName: 'Authorization',\n    headerValue: 'Bearer secret-token',\n  },\n});\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "manage-executions",
      children: "Manage Executions"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "// List error executions\nconst { data: errors } = await client.executions().list({\n  status: 'error',\n  workflowId: 'workflow-id',\n});\n\n// Stop a running execution\nawait client.executions().stop(executionId);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-the-api-surface-is-organized",
      children: "How The API Surface Is Organized"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.workflows()"
        }), " for workflow lifecycle and tagging."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.executions()"
        }), " for monitoring, retrying, and stopping runs."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.projects()"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.folders(projectId)"
        }), " for structure and access control."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.get()"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "client.post()"
        }), ", and the other low-level helpers only when you intentionally need to drop below a typed resource client."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "organize-with-projects",
      children: "Organize with Projects"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await client.projects().create({ name: 'Production' });\n\nawait client.projects().addMembers('project-id', [\n  { userId: 'user-id', role: 'project:admin' },\n]);\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "resource-clients",
      children: "Resource Clients"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Every n8n API resource has a typed client:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Client"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Access"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "WorkflowClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.workflows()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Create, list, activate, archive workflows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ExecutionClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.executions()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "List, get, stop, retry executions"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "CredentialClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.credentials()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "CRUD, test, transfer credentials"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "TagClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.tags()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Manage workflow/execution tags"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "UserClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.users()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "List, create, delete users"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "VariableClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.variables()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Manage environment variables"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ProjectClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.projects()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "CRUD projects and members"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DataTableClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.dataTables()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Tables, columns, and rows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "FolderClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.folders(projectId)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Project-scoped folder management"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "CommunityPackageClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.communityPackages()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Install, update, uninstall packages"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "AuditClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.audit()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Generate audit reports"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "InsightsClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.insights()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Execution insights summary"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SourceControlClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.sourceControl()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Git-based source control"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SecurityPolicyClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.securityPolicy()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Instance security policy settings"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "DiscoverClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.discover()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Discover available resources"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "N8nPackageClient"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "client.n8nPackage()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Import/export workflow packages"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["When you want bound instance methods instead of plain API objects, use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources()"
      }), ". The full model is documented on the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/n8n-client/api/n8n-client/",
        children: "N8nClient API"
      }), " page."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "next-steps",
      children: "Next Steps"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Browse the ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/api/n8n-client/",
          children: "API Reference"
        }), " for the full method surface."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Read ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/about/philosophy/",
          children: "Philosophy"
        }), " if you want the design rationale behind resource clients, retries, and low-level request helpers."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Check out ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/example/overview/",
          children: "Examples"
        }), " for end-to-end walkthroughs."]
      }), "\n"]
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
3579(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ TabItem)
});

// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/index.js
var react = __webpack_require__(2086);
// EXTERNAL MODULE: ./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
var clsx = __webpack_require__(3526);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/tabsUtils.js
var tabsUtils = __webpack_require__(2847);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/TabItem/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const styles_module = ({"tabItem":"tabItem_Cosm"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/TabItem/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 



function TabItemPanel({ children, className, hidden }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
        role: "tabpanel",
        className: (0,clsx/* ["default"] */.A)(styles_module.tabItem, className),
        hidden,
        children: children
    });
}
function TabItem({ children, className, value }) {
    const { selectedValue, lazy } = (0,tabsUtils/* .useTabs */.uc)();
    const isSelected = value === selectedValue;
    // TODO Docusaurus v4: use <Activity> ?
    if (!isSelected && lazy) {
        return null;
    }
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(TabItemPanel, {
        className: className,
        hidden: !isSelected,
        children: children
    });
}


},
1908(__unused_rspack_module, __webpack_exports__, __webpack_require__) {

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  A: () => (/* binding */ Tabs)
});

// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/index.js
var react = __webpack_require__(2086);
// EXTERNAL MODULE: ./node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
var clsx = __webpack_require__(3526);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/ThemeClassNames.js
var ThemeClassNames = __webpack_require__(9967);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/tabsUtils.js
var tabsUtils = __webpack_require__(2847);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-common@3.10.0_@docusaurus+plugin-content-docs@3.10.0_@docusaurus+fast_2c7af3544eee2ad1196d844307749877/node_modules/@docusaurus/theme-common/lib/utils/scrollUtils.js
var scrollUtils = __webpack_require__(888);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+core@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@swc+core@1._c9fc87af6c6a9eba42ca6d26121f471f/node_modules/@docusaurus/core/lib/client/exports/useIsBrowser.js
var useIsBrowser = __webpack_require__(5408);
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Tabs/styles.module.css
// extracted by css-extract-rspack-plugin
/* export default */ const styles_module = ({"tabList":"tabList_OUun","tabItem":"tabItem_bq6p"});
;// CONCATENATED MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Tabs/index.js

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 





function TabList({ className }) {
    const { selectedValue, selectValue, tabValues, block } = (0,tabsUtils/* .useTabs */.uc)();
    const tabRefs = [];
    const { blockElementScrollPositionUntilNextRender } = (0,scrollUtils/* .useScrollPositionBlocker */.a_)();
    const handleTabChange = (event)=>{
        const newTab = event.currentTarget;
        const newTabIndex = tabRefs.indexOf(newTab);
        const newTabValue = tabValues[newTabIndex].value;
        if (newTabValue !== selectedValue) {
            blockElementScrollPositionUntilNextRender(newTab);
            selectValue(newTabValue);
        }
    };
    const handleKeydown = (event)=>{
        let focusElement = null;
        switch(event.key){
            case 'Enter':
                {
                    handleTabChange(event);
                    break;
                }
            case 'ArrowRight':
                {
                    const nextTab = tabRefs.indexOf(event.currentTarget) + 1;
                    focusElement = tabRefs[nextTab] ?? tabRefs[0];
                    break;
                }
            case 'ArrowLeft':
                {
                    const prevTab = tabRefs.indexOf(event.currentTarget) - 1;
                    focusElement = tabRefs[prevTab] ?? tabRefs[tabRefs.length - 1];
                    break;
                }
            default:
                break;
        }
        focusElement?.focus();
    };
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("ul", {
        role: "tablist",
        "aria-orientation": "horizontal",
        className: (0,clsx/* ["default"] */.A)('tabs', {
            'tabs--block': block
        }, className),
        children: tabValues.map(({ value, label, attributes })=>/*#__PURE__*/ (0,jsx_runtime.jsx)("li", {
                // TODO extract TabListItem
                role: "tab",
                tabIndex: selectedValue === value ? 0 : -1,
                "aria-selected": selectedValue === value,
                ref: (ref)=>{
                    tabRefs.push(ref);
                },
                onKeyDown: handleKeydown,
                onClick: handleTabChange,
                ...attributes,
                className: (0,clsx/* ["default"] */.A)('tabs__item', styles_module.tabItem, attributes?.className, {
                    'tabs__item--active': selectedValue === value
                }),
                children: label ?? value
            }, value))
    });
}
function TabContent({ children }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsx)("div", {
        className: "margin-top--md",
        children: children
    });
}
function TabsContainer({ className, children }) {
    return /*#__PURE__*/ (0,jsx_runtime.jsxs)("div", {
        className: (0,clsx/* ["default"] */.A)(ThemeClassNames/* .ThemeClassNames.tabs.container */.G.tabs.container, // former name kept for backward compatibility
        // see https://github.com/facebook/docusaurus/pull/4086
        'tabs-container', styles_module.tabList),
        children: [
            /*#__PURE__*/ (0,jsx_runtime.jsx)(TabList, {
                // Surprising but historical
                // className is applied on TabList, not on TabsContainer
                className: className
            }),
            /*#__PURE__*/ (0,jsx_runtime.jsx)(TabContent, {
                children: children
            })
        ]
    });
}
function Tabs(props) {
    const isBrowser = (0,useIsBrowser/* ["default"] */.A)();
    const value = (0,tabsUtils/* .useTabsContextValue */.OC)(props);
    return /*#__PURE__*/ (0,jsx_runtime.jsx)(tabsUtils/* .TabsProvider */.O_, {
        value: value,
        children: /*#__PURE__*/ (0,jsx_runtime.jsx)(TabsContainer, {
            className: props.className,
            children: (0,tabsUtils/* .sanitizeTabsChildren */.vT)(props.children)
        })
    }, String(isBrowser));
}


},
2847(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.d(__webpack_exports__, {
  OC: () => (useTabsContextValue),
  O_: () => (TabsProvider),
  uc: () => (useTabs),
  vT: () => (sanitizeTabsChildren)
});
/* import */ var react_jsx_runtime__rspack_import_0 = __webpack_require__(4934);
/* import */ var react__rspack_import_1 = __webpack_require__(2086);
/* import */ var _docusaurus_router__rspack_import_4 = __webpack_require__(7725);
/* import */ var _docusaurus_useIsomorphicLayoutEffect__rspack_import_2 = __webpack_require__(3348);
/* import */ var _docusaurus_theme_common_internal__rspack_import_5 = __webpack_require__(6325);
/* import */ var _index__rspack_import_3 = __webpack_require__(4458);
/* import */ var _index__rspack_import_6 = __webpack_require__(921);

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 




function sanitizeTabsChildren(children) {
    return react__rspack_import_1.Children.toArray(children).filter((child)=>child !== '\n');
}
function extractChildrenTabValues(children) {
    // ✅ <TabItem value="red"/> => true
    // ✅ <CustomTabItem value="red"/> => true
    // ❌ <RedTabItem value="tab-value"/> => requires <Tabs values> prop
    function isTabItemWithValueProp(comp) {
        const { props } = comp;
        return !!props && typeof props === 'object' && 'value' in props;
    }
    const elements = react__rspack_import_1.Children.toArray(children).flatMap((child)=>{
        // Historical case, not sure when it happens, do we really need this?
        if (!child) {
            return [];
        }
        if (/*#__PURE__*/ (0,react__rspack_import_1.isValidElement)(child) && isTabItemWithValueProp(child)) {
            return [
                child
            ];
        }
        // child.type.name will give non-sensical values in prod because of
        // minification, but we assume it won't throw in prod.
        const badChildTypeName = // @ts-expect-error: guarding against unexpected cases
        typeof child.type === 'string' ? child.type : child.type.name;
        throw new Error(`Docusaurus error: Bad <Tabs> child <${badChildTypeName}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.
If you do not want to pass on a "value" prop to the direct children of <Tabs>, you can also pass an explicit <Tabs values={...}> prop.`);
    });
    return elements.map(({ props: { value, label, attributes, default: isDefault } })=>({
            value,
            label,
            attributes,
            default: isDefault
        }));
}
function ensureNoDuplicateValue(values) {
    const dup = (0,_index__rspack_import_3/* .duplicates */.XI)(values, (a, b)=>a.value === b.value);
    if (dup.length > 0) {
        throw new Error(`Docusaurus error: Duplicate values "${dup.map((a)=>`'${a.value}'`).join(', ')}" found in <Tabs>. Every value needs to be unique.`);
    }
}
function useTabValues(props) {
    const { values: valuesProp, children } = props;
    return (0,react__rspack_import_1.useMemo)(()=>{
        const values = valuesProp ?? extractChildrenTabValues(children);
        ensureNoDuplicateValue(values);
        return values;
    }, [
        valuesProp,
        children
    ]);
}
function isValidValue({ value, tabValues }) {
    return tabValues.some((a)=>a.value === value);
}
function getInitialStateValue({ defaultValue, tabValues }) {
    if (tabValues.length === 0) {
        throw new Error('Docusaurus error: the <Tabs> component requires at least one <TabItem> children component');
    }
    if (defaultValue) {
        // Warn user about passing incorrect defaultValue as prop.
        if (!isValidValue({
            value: defaultValue,
            tabValues
        })) {
            throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${defaultValue}" but none of its children has the corresponding value. Available values are: ${tabValues.map((a)=>a.value).join(', ')}. If you intend to show no default tab, use defaultValue={null} instead.`);
        }
        return defaultValue;
    }
    const defaultTabValue = tabValues.find((tabValue)=>tabValue.default) ?? tabValues[0];
    if (!defaultTabValue) {
        throw new Error('Unexpected error: 0 tabValues');
    }
    return defaultTabValue.value;
}
function getStorageKey(groupId) {
    if (!groupId) {
        return null;
    }
    return `docusaurus.tab.${groupId}`;
}
function getQueryStringKey({ queryString = false, groupId }) {
    if (typeof queryString === 'string') {
        return queryString;
    }
    if (queryString === false) {
        return null;
    }
    if (queryString === true && !groupId) {
        throw new Error(`Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".`);
    }
    return groupId ?? null;
}
function useTabQueryString({ queryString = false, groupId }) {
    const history = (0,_docusaurus_router__rspack_import_4/* .useHistory */.W6)();
    const key = getQueryStringKey({
        queryString,
        groupId
    });
    const value = (0,_docusaurus_theme_common_internal__rspack_import_5/* .useQueryStringValue */.aZ)(key);
    const setValue = (0,react__rspack_import_1.useCallback)((newValue)=>{
        if (!key) {
            return; // no-op
        }
        const searchParams = new URLSearchParams(history.location.search);
        searchParams.set(key, newValue);
        history.replace({
            ...history.location,
            search: searchParams.toString()
        });
    }, [
        key,
        history
    ]);
    return [
        value,
        setValue
    ];
}
function useTabStorage({ groupId }) {
    const key = getStorageKey(groupId);
    const [value, storageSlot] = (0,_index__rspack_import_6/* .useStorageSlot */.Dv)(key);
    const setValue = (0,react__rspack_import_1.useCallback)((newValue)=>{
        if (!key) {
            return; // no-op
        }
        storageSlot.set(newValue);
    }, [
        key,
        storageSlot
    ]);
    return [
        value,
        setValue
    ];
}
function useTabsContextValue(props) {
    const { defaultValue, queryString = false, groupId } = props;
    const tabValues = useTabValues(props);
    const [selectedValue, setSelectedValue] = (0,react__rspack_import_1.useState)(()=>getInitialStateValue({
            defaultValue,
            tabValues
        }));
    const [queryStringValue, setQueryString] = useTabQueryString({
        queryString,
        groupId
    });
    const [storageValue, setStorageValue] = useTabStorage({
        groupId
    });
    // We sync valid querystring/storage value to state on change + hydration
    const valueToSync = (()=>{
        const value = queryStringValue ?? storageValue;
        if (!isValidValue({
            value,
            tabValues
        })) {
            return null;
        }
        return value;
    })();
    // Sync in a layout/sync effect is important, for useScrollPositionBlocker
    // See https://github.com/facebook/docusaurus/issues/8625
    (0,_docusaurus_useIsomorphicLayoutEffect__rspack_import_2/* ["default"] */.A)(()=>{
        if (valueToSync) {
            setSelectedValue(valueToSync);
        }
    }, [
        valueToSync
    ]);
    const selectValue = (0,react__rspack_import_1.useCallback)((newValue)=>{
        if (!isValidValue({
            value: newValue,
            tabValues
        })) {
            throw new Error(`Can't select invalid tab value=${newValue}`);
        }
        setSelectedValue(newValue);
        setQueryString(newValue);
        setStorageValue(newValue);
    }, [
        setQueryString,
        setStorageValue,
        tabValues
    ]);
    return {
        selectedValue,
        selectValue,
        tabValues,
        lazy: props.lazy ?? false,
        block: props.block ?? false
    };
}
const TabsContext = /*#__PURE__*/ (0,react__rspack_import_1.createContext)(null);
function useTabs() {
    const contextValue = react__rspack_import_1.useContext(TabsContext);
    if (!contextValue) {
        throw new Error('useTabsContext() must be used within a Tabs component');
    }
    return contextValue;
}
function TabsProvider(props) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(TabsContext.Provider, {
        value: props.value,
        children: props.children
    });
} //# sourceMappingURL=tabsUtils.js.map


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