"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["711"], {
953(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_example_credential_management_mdx_e39_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-example-credential-management-mdx-e39.json
var site_docs_example_credential_management_mdx_e39_namespaceObject = JSON.parse('{"id":"example/credential-management","title":"Credential Management","description":"This example covers creating, testing, updating, transferring, and deleting credentials using the CredentialClient.","source":"@site/docs/example/credential-management.mdx","sourceDirName":"example","slug":"/example/credential-management","permalink":"/example/credential-management","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Credential Management","sidebar_position":3},"sidebar":"example","previous":{"title":"Execution Monitoring","permalink":"/example/execution-monitoring"},"next":{"title":"Project Organization","permalink":"/example/project-organization"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.99.9_@swc+core@1.15.41_/node_modules/raw-loader/dist/cjs.js!./.samples/credential-management.ts
/* export default */ const credential_management = ("import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n\n// ─── Create Credentials ─────────────────────────────────────────────────────\n\nconst apiKeyCred = await client.credentials().create({\n  name: 'Service API Key',\n  type: 'httpHeaderAuth',\n  data: {\n    headerName: 'X-API-Key',\n    headerValue: 'my-secret-key',\n  },\n});\nconsole.log(`Created API key credential: ${apiKeyCred.id}`);\n\nconst dbCred = await client.credentials().create({\n  name: 'PostgreSQL Connection',\n  type: 'postgresDb',\n  data: {\n    host: 'localhost',\n    port: 5432,\n    database: 'mydb',\n    user: 'admin',\n    password: 'secret', // pragma: allowlist secret\n  },\n  projectId: 'proj-123',\n});\nconsole.log(`Created DB credential: ${dbCred.id}`);\n\n// ─── List Credentials ───────────────────────────────────────────────────────\n\nconst { data: credentials } = await client.credentials().list({ limit: 20 });\nconsole.log(`Total credentials: ${credentials.length}`);\n\n// ─── Test Credentials ───────────────────────────────────────────────────────\n\nconst testResult = await client.credentials().test(apiKeyCred.id);\nif (testResult.success) {\n  console.log('API key credential is valid');\n} else {\n  console.log(`Credential test failed: ${testResult.message}`);\n}\n\n// ─── Update Credentials ─────────────────────────────────────────────────────\n\nconst updated = await client.credentials().update(apiKeyCred.id, {\n  name: 'Production API Key',\n  data: {\n    headerName: 'X-API-Key',\n    headerValue: 'production-secret-key',\n  },\n});\nconsole.log(`Updated credential: ${updated.name}`);\n\n// ─── Get Credential Schema ──────────────────────────────────────────────────\n\nconst schema = await client.credentials().getSchema('httpHeaderAuth');\nconsole.log('HTTP Header Auth schema:', Object.keys(schema));\n\n// ─── Transfer Credential ────────────────────────────────────────────────────\n\nawait client.credentials().transfer(dbCred.id, 'target-project-id');\nconsole.log('Credential transferred to another project');\n\n// ─── Delete Credential ──────────────────────────────────────────────────────\n\nconst deleted = await client.credentials().delete(apiKeyCred.id);\nconsole.log(`Deleted credential: ${deleted.id}`);\n");
;// CONCATENATED MODULE: ./docs/example/credential-management.mdx


const frontMatter = {
	sidebar_label: 'Credential Management',
	sidebar_position: 3
};
const contentTitle = 'Credential Management';

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
        id: "credential-management",
        children: "Credential Management"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This example covers creating, testing, updating, transferring, and deleting credentials using the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "CredentialClient"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.hr, {}), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "ts",
      children: credential_management
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