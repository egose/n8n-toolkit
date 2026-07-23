"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["7944"], {
9396(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_example_overview_mdx_2b8_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-example-overview-mdx-2b8.json
var site_docs_n_8_n_client_example_overview_mdx_2b8_namespaceObject = JSON.parse('{"id":"n8n-client/example/overview","title":"Examples Overview","description":"This example demonstrates a full end-to-end setup using n8n-client. It shows how to authenticate, manage workflows, credentials, projects, and users through the typed API.","source":"@site/docs/n8n-client/example/overview.mdx","sourceDirName":"n8n-client/example","slug":"/n8n-client/example/overview","permalink":"/n8n-client/example/overview","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Overview","sidebar_position":0},"sidebar":"n8nClient","previous":{"title":"Examples","permalink":"/category/examples"},"next":{"title":"Workflow Management","permalink":"/n8n-client/example/workflow-management"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.99.9_@swc+core@1.15.41_/node_modules/raw-loader/dist/cjs.js!./.samples/overview.ts
/* export default */ const overview = ("import N8nClient from '@egose/n8n-client';\n\n// Initialize the client\nconst client = new N8nClient({\n  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n\n// ─── Workflows ──────────────────────────────────────────────────────────────\n\n// List active workflows\nconst { data: activeWorkflows, nextCursor } = await client.workflow().list({\n  limit: 10,\n  active: true,\n});\nconsole.log(`Found ${activeWorkflows.length} active workflows`);\n\n// Create a new workflow\nconst workflow = await client.workflow().create({\n  name: 'My Automation',\n  nodes: [\n    {\n      name: 'Start',\n      type: 'n8n-nodes-base.start',\n      position: [250, 300],\n      parameters: {},\n    },\n  ],\n  connections: {},\n  settings: { executionOrder: 'v1' },\n});\nconsole.log(`Created workflow: ${workflow.id}`);\n\n// Activate it\nawait client.workflow().activate(workflow.id);\n\n// ─── Credentials ────────────────────────────────────────────────────────────\n\n// Create a credential\nconst credential = await client.credential().create({\n  name: 'My API Key',\n  type: 'httpHeaderAuth',\n  data: {\n    headerName: 'Authorization',\n    headerValue: 'Bearer secret-token',\n  },\n});\nconsole.log(`Created credential: ${credential.id}`);\n\n// Test the credential\nconst testResult = await client.credential().test(credential.id);\nconsole.log(`Credential test: ${testResult.success ? 'passed' : 'failed'}`);\n\n// ─── Projects ───────────────────────────────────────────────────────────────\n\n// Create a project\nawait client.project().create({ name: 'Production' });\n\n// List projects\nconst { data: projects } = await client.project().list();\nconst prod = projects.find((p) => p.name === 'Production');\n\nif (prod) {\n  // Add a member\n  await client.project().addMembers(prod.id, [{ userId: 'user-id-1', role: 'project:admin' }]);\n\n  // Move workflow to project\n  await client.workflow().transfer(workflow.id, prod.id);\n}\n\n// ─── Tags ───────────────────────────────────────────────────────────────────\n\n// Create and assign tags\nconst tag = await client.tag().create({ name: 'production' });\nawait client.workflow().updateTags(workflow.id, [{ id: tag.id }]);\n\n// ─── Users ──────────────────────────────────────────────────────────────────\n\n// List users\nconst { data: users } = await client.user().list({ limit: 5 });\nconsole.log(`Users: ${users.map((u) => u.email).join(', ')}`);\n\n// ─── Executions ─────────────────────────────────────────────────────────────\n\n// List recent error executions\nconst { data: errors } = await client.execution().list({\n  status: 'error',\n  limit: 5,\n});\nconsole.log(`Recent errors: ${errors.length}`);\n");
;// CONCATENATED MODULE: ./docs/n8n-client/example/overview.mdx


const frontMatter = {
	sidebar_label: 'Overview',
	sidebar_position: 0
};
const contentTitle = 'Examples Overview';

const assets = {

};





const toc = [{
  "value": "What This Example Covers",
  "id": "what-this-example-covers",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    header: "header",
    hr: "hr",
    li: "li",
    p: "p",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "examples-overview",
        children: "Examples Overview"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This example demonstrates a full end-to-end setup using ", (0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-client"
      }), ". It shows how to authenticate, manage workflows, credentials, projects, and users through the typed API."]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The snippet is intentionally comprehensive to illustrate how different building blocks fit together in a real-world scenario. In practice, you would typically split this logic across smaller scripts or services."
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Use this section when you want to see how multiple handles work together in one script. If you already know which resource you care about, jump directly to the focused pages below."
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "For focused walkthroughs, use the dedicated pages:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/example/workflow-management/",
          children: "Workflow Management"
        }), " for creating, activating, and versioning workflows."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/example/execution-monitoring/",
          children: "Execution Monitoring"
        }), " for listing, filtering, and stopping executions."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/example/credential-management/",
          children: "Credential Management"
        }), " for CRUD, testing, and transferring credentials."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-client/example/project-organization/",
          children: "Project Organization"
        }), " for projects, folders, and member management."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "what-this-example-covers",
      children: "What This Example Covers"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "creating the root client"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "reading paginated resources"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "creating and updating typed payloads"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "combining organization and automation operations in one flow"
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "using the same client instance across multiple handles"
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.hr, {}), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "ts",
      children: overview
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

}]);