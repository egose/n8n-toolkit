"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["1613"], {
7744(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_api_project_mdx_597_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-api-project-mdx-597.json
var site_docs_n_8_n_client_api_project_mdx_597_namespaceObject = JSON.parse('{"id":"n8n-client/api/project","title":"Project API","description":"ProjectClient manages n8n projects and their members.","source":"@site/docs/n8n-client/api/project.mdx","sourceDirName":"n8n-client/api","slug":"/n8n-client/api/project","permalink":"/n8n-client/api/project","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":7,"frontMatter":{"sidebar_label":"Project","sidebar_position":7},"sidebar":"n8nClient","previous":{"title":"Variable","permalink":"/n8n-client/api/variable"},"next":{"title":"Data Table","permalink":"/n8n-client/api/data-table"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-client/api/project.mdx


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
}, {
  "value": "ProjectResource",
  "id": "projectresource",
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
  "value": "Nested collections",
  "id": "nested-collections",
  "level": 3
}, {
  "value": "<code>workflows()</code>",
  "id": "workflows",
  "level": 4
}, {
  "value": "<code>folders()</code>",
  "id": "folders",
  "level": 4
}, {
  "value": "<code>variables()</code>",
  "id": "variables",
  "level": 4
}, {
  "value": "<code>dataTables()</code>",
  "id": "datatables",
  "level": 4
}, {
  "value": "<code>executions()</code>",
  "id": "executions",
  "level": 4
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
    h4: "h4",
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
        id: "project-api",
        children: "Project API"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "ProjectClient"
      }), " manages n8n projects and their members."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This handle is the entry point for organization-level operations: project creation, renaming, deletion, and project membership changes."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "access",
      children: "Access"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = client.projects();\n"
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
        children: "const { data, nextCursor } = await client.projects().list({ limit: 10 });\n"
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
        children: "await client.projects().create({ name: 'Production' });\n"
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
        children: "await client.projects().update('proj-123', { name: 'Production v2' });\n"
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
        children: "await client.projects().delete('proj-123');\n"
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
        children: "const { data } = await client.projects().listMembers('proj-123', { limit: 50 });\n"
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
        children: "await client.projects().addMembers('proj-123', [\n  { userId: 'user-1', role: 'project:admin' },\n  { userId: 'user-2', role: 'project:editor' },\n]);\n"
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
        children: "await client.projects().removeMember('proj-123', 'user-1');\n"
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
        children: "await client.projects().changeMemberRole('proj-123', 'user-1', 'project:viewer');\n"
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
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "projectresource",
      children: "ProjectResource"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Use ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource()"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources()"
      }), " to get a bound ", (0,jsx_runtime.jsx)(_components.code, {
        children: "ProjectResource"
      }), " instance."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const resource = await client.projects().getResource('proj-123');\n"
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
            children: "Project ID"
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
            children: "Project name"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "type"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "string | undefined"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Project type"
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
            children: "Update the project — merges into snapshot locally"
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
            children: "Convenience update — merges partial fields into the current project snapshot before updating"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "delete()"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Delete the project"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "listMembers(params?)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "ProjectMemberListResponse"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "List project members"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "addMembers(relations)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Add members to the project"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "removeMember(userId)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Remove a member"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "changeMemberRole(userId, role)"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "void"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Change a member's role"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "nested-collections",
      children: "Nested collections"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "ProjectResource"
      }), " exposes five nested collections. Each returns a collection object whose methods have ", (0,jsx_runtime.jsx)(_components.code, {
        children: "projectId"
      }), " pre-filled so you never pass it manually."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "workflows",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "workflows()"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Full workflow CRUD scoped to this project. Supports ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "create"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patchResource"
      }), ". Scope is verified via paginated list for ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateResource"
      }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patchResource"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = await client.projects().getResource('proj-1');\n\nconst workflows = await project.workflows().listResources({ active: true });\nconst workflow = await project.workflows().getResource('wf-1');\nconst created = await project.workflows().createResource({\n  name: 'New',\n  nodes: [],\n  connections: {},\n  settings: {},\n});\nconst patched = await project.workflows().patch('wf-1', { name: 'Renamed' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "folders",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "folders()"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Folder CRUD scoped to this project. Supports ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "create"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patchResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "delete"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const folder = await project.folders().createResource({ name: 'Archive' });\nconst updated = await project.folders().updateResource('folder-id', { name: 'Archived' });\nconst moved = await project.folders().patchResource('folder-id', { parentFolderId: 'parent-id' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "variables",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "variables()"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Variable CRUD scoped to this project. Supports ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "create"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patchResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "delete"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "await project.variables().create({ key: 'API_URL', value: 'https://example.com' });\nawait project.variables().patch('var-1', { value: 'https://api.example.com' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "datatables",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "dataTables()"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Data table CRUD scoped to this project. Supports ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "create"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "createResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "update"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patch"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "updateResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "patchResource"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "delete"
      }), ". There is no ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), "/", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources"
      }), " because the n8n API does not support a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "projectId"
      }), " filter on the list endpoint."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const table = await project.dataTables().createResource({\n  name: 'Users',\n  columns: [{ name: 'email', type: 'string' }],\n});\nawait table.createColumn({ name: 'active', type: 'boolean' });\nawait project.dataTables().patch('table-id', { name: 'Customers' });\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h4, {
      id: "executions",
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "executions()"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Execution listing scoped to this project. Supports ", (0,jsx_runtime.jsx)(_components.code, {
        children: "list"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "listResources"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), ", ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), ". Scope is verified via paginated list for ", (0,jsx_runtime.jsx)(_components.code, {
        children: "get"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "getResource"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const runs = await project.executions().listResources({ status: 'success', limit: 10 });\nawait runs.data[0]?.getTags();\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "typical-flow",
      children: "Typical Flow"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-ts",
        children: "const project = client.projects();\n\nconst { data } = await project.list({ limit: 10 });\nawait project.addMembers('proj-123', [\n  { userId: 'user-1', role: 'project:editor' },\n]);\n"
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