"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["3766"], {
219(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_client_example_execution_monitoring_mdx_8e0_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-client-example-execution-monitoring-mdx-8e0.json
var site_docs_n_8_n_client_example_execution_monitoring_mdx_8e0_namespaceObject = JSON.parse('{"id":"n8n-client/example/execution-monitoring","title":"Execution Monitoring","description":"This example covers listing, filtering, inspecting, stopping, and retrying executions using the ExecutionClient.","source":"@site/docs/n8n-client/example/execution-monitoring.mdx","sourceDirName":"n8n-client/example","slug":"/n8n-client/example/execution-monitoring","permalink":"/n8n-client/example/execution-monitoring","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Execution Monitoring","sidebar_position":2},"sidebar":"n8nClient","previous":{"title":"Workflow Management","permalink":"/n8n-client/example/workflow-management"},"next":{"title":"Credential Management","permalink":"/n8n-client/example/credential-management"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.99.9_@swc+core@1.15.41_/node_modules/raw-loader/dist/cjs.js!./.samples/execution-monitoring.ts
/* export default */ const execution_monitoring = ("import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n\n// ─── List Executions ────────────────────────────────────────────────────────\n\n// List recent executions\nconst { data: recent } = await client.executions().list({ limit: 10 });\nconsole.log(`Recent executions: ${recent.length}`);\n\n// List error executions\nconst { data: errors } = await client.executions().list({\n  status: 'error',\n  limit: 10,\n});\nconsole.log(`Error executions: ${errors.length}`);\n\n// Filter by workflow\nconst { data: workflowRuns } = await client.executions().list({\n  workflowId: 'wf-123',\n  limit: 20,\n});\nconsole.log(`Workflow runs: ${workflowRuns.length}`);\n\n// ─── Get Execution Details ──────────────────────────────────────────────────\n\nif (recent.length > 0) {\n  const execution = await client.executions().get(recent[0].id, {\n    includeData: true,\n  });\n  console.log(`Execution ${execution.id}: ${execution.status}`);\n  console.log(`Started: ${execution.startedAt}, Finished: ${execution.finishedAt}`);\n}\n\n// ─── Stop a Running Execution ───────────────────────────────────────────────\n\nconst { data: running } = await client.executions().list({\n  status: 'running',\n  limit: 1,\n});\n\nif (running.length > 0) {\n  await client.executions().stop(running[0].id);\n  console.log(`Stopped execution: ${running[0].id}`);\n}\n\n// ─── Stop Many Executions ───────────────────────────────────────────────────\n\nconst { stopped } = await client.executions().stopMany({\n  status: ['running', 'queued', 'waiting'],\n  workflowId: 'wf-123',\n});\nconsole.log(`Stopped ${stopped} executions`);\n\n// ─── Retry Failed Execution ─────────────────────────────────────────────────\n\nif (errors.length > 0) {\n  const retried = await client.executions().retry(errors[0].id, {\n    loadWorkflow: true,\n  });\n  console.log(`Retried execution: ${retried.id}`);\n}\n\n// ─── Execution Tags ─────────────────────────────────────────────────────────\n\nif (recent.length > 0) {\n  const execId = recent[0].id;\n\n  // Add tags to execution\n  const tag = await client.tags().create({ name: 'reviewed' });\n  await client.executions().updateTags(execId, [{ id: tag.id }]);\n\n  // Get execution tags\n  const tags = await client.executions().getTags(execId);\n  console.log(`Execution tags: ${tags.map((t) => t.name).join(', ')}`);\n}\n\n// ─── Delete Execution ───────────────────────────────────────────────────────\n\nif (recent.length > 0) {\n  await client.executions().delete(recent[recent.length - 1].id);\n  console.log('Deleted old execution');\n}\n");
;// CONCATENATED MODULE: ./docs/n8n-client/example/execution-monitoring.mdx


const frontMatter = {
	sidebar_label: 'Execution Monitoring',
	sidebar_position: 2
};
const contentTitle = 'Execution Monitoring';

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
        id: "execution-monitoring",
        children: "Execution Monitoring"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This example covers listing, filtering, inspecting, stopping, and retrying executions using the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "ExecutionClient"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.hr, {}), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "ts",
      children: execution_monitoring
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