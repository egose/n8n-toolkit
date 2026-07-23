"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["2108"], {
3814(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_example_workflow_management_mdx_541_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-example-workflow-management-mdx-541.json
var site_docs_n_8_n_client_example_workflow_management_mdx_541_namespaceObject = JSON.parse('{"id":"n8n-client/example/workflow-management","title":"Workflow Management","description":"This example covers creating, listing, activating, archiving, and versioning workflows using the WorkflowClient.","source":"@site/docs/n8n-client/example/workflow-management.mdx","sourceDirName":"n8n-client/example","slug":"/n8n-client/example/workflow-management","permalink":"/n8n-client/example/workflow-management","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Workflow Management","sidebar_position":1},"sidebar":"n8nClient","previous":{"title":"Overview","permalink":"/n8n-client/example/overview"},"next":{"title":"Execution Monitoring","permalink":"/n8n-client/example/execution-monitoring"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.99.9_@swc+core@1.15.41_/node_modules/raw-loader/dist/cjs.js!./.samples/workflow-management.ts
/* export default */ const workflow_management = ("import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n\n// ─── Create a Workflow ──────────────────────────────────────────────────────\n\nconst workflow = await client.workflow().create({\n  name: 'Data Processing Pipeline',\n  nodes: [\n    {\n      name: 'Start',\n      type: 'n8n-nodes-base.start',\n      position: [250, 300],\n      parameters: {},\n    },\n    {\n      name: 'HTTP Request',\n      type: 'n8n-nodes-base.httpRequest',\n      position: [450, 300],\n      parameters: {\n        url: 'https://api.example.com/data',\n        method: 'GET',\n      },\n    },\n  ],\n  connections: {\n    Start: { main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]] },\n  },\n  settings: { executionOrder: 'v1' },\n});\nconsole.log(`Created workflow: ${workflow.id}`);\n\n// ─── List Workflows with Filters ────────────────────────────────────────────\n\n// List only active workflows\nconst { data: active } = await client.workflow().list({ active: true });\nconsole.log(`Active workflows: ${active.length}`);\n\n// List workflows by name\nconst { data: named } = await client.workflow().list({ name: 'Data Processing' });\nconsole.log(`Matching workflows: ${named.length}`);\n\n// Paginate through results\nlet cursor: string | undefined;\nlet allWorkflows: typeof active = [];\ndo {\n  const page = await client.workflow().list({ limit: 25, cursor });\n  allWorkflows = allWorkflows.concat(page.data);\n  cursor = page.nextCursor;\n} while (cursor);\nconsole.log(`Total workflows: ${allWorkflows.length}`);\n\n// ─── Activate & Deactivate ─────────────────────────────────────────────────\n\nawait client.workflow().activate(workflow.id);\nconsole.log('Workflow activated');\n\nawait client.workflow().deactivate(workflow.id);\nconsole.log('Workflow deactivated');\n\n// ─── Archive & Unarchive ────────────────────────────────────────────────────\n\nawait client.workflow().archive(workflow.id);\nconsole.log('Workflow archived');\n\nawait client.workflow().unarchive(workflow.id);\nconsole.log('Workflow unarchived');\n\n// ─── Version History ────────────────────────────────────────────────────────\n\nconst updated = await client.workflow().update(workflow.id, {\n  name: 'Data Processing Pipeline v2',\n});\n\nconst version = await client.workflow().getVersion(workflow.id, updated.versionId);\nconsole.log(`Version: ${version.versionId}, Authors: ${version.authors}`);\n\n// ─── Tags ───────────────────────────────────────────────────────────────────\n\nconst prodTag = await client.tag().create({ name: 'production' });\nconst dataTag = await client.tag().create({ name: 'data-pipeline' });\n\nawait client.workflow().updateTags(workflow.id, [{ id: prodTag.id }, { id: dataTag.id }]);\n\nconst tags = await client.workflow().getTags(workflow.id);\nconsole.log(`Tags: ${tags.map((t) => t.name).join(', ')}`);\n\n// ─── Transfer to Another Project ────────────────────────────────────────────\n\nawait client.workflow().transfer(workflow.id, 'target-project-id');\nconsole.log('Workflow transferred');\n\n// ─── Delete ─────────────────────────────────────────────────────────────────\n\nconst deleted = await client.workflow().delete(workflow.id);\nconsole.log(`Deleted workflow: ${deleted.id}`);\n");
;// CONCATENATED MODULE: ./docs/n8n-client/example/workflow-management.mdx


const frontMatter = {
	sidebar_label: 'Workflow Management',
	sidebar_position: 1
};
const contentTitle = 'Workflow Management';

const assets = {

};





const toc = [];
function _createMdxContent(props) {
  const _components = {
    code: "code",
    h1: "h1",
    header: "header",
    hr: "hr",
    p: "p",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "workflow-management",
        children: "Workflow Management"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This example covers creating, listing, activating, archiving, and versioning workflows using the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "WorkflowClient"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.hr, {}), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "ts",
      children: workflow_management
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