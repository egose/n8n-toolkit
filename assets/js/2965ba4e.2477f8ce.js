"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["954"], {
164(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_example_project_organization_mdx_296_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-example-project-organization-mdx-296.json
var site_docs_example_project_organization_mdx_296_namespaceObject = JSON.parse('{"id":"example/project-organization","title":"Project Organization","description":"This example covers creating projects, managing folders, adding and removing members, and organizing workflows using ProjectClient and FolderClient.","source":"@site/docs/example/project-organization.mdx","sourceDirName":"example","slug":"/example/project-organization","permalink":"/example/project-organization","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_label":"Project Organization","sidebar_position":4},"sidebar":"example","previous":{"title":"Credential Management","permalink":"/example/credential-management"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/CodeBlock/index.js + 27 modules
var CodeBlock = __webpack_require__(1152);
;// CONCATENATED MODULE: ./node_modules/.pnpm/raw-loader@4.0.2_webpack@5.99.9_@swc+core@1.15.41_/node_modules/raw-loader/dist/cjs.js!./.samples/project-organization.ts
/* export default */ const project_organization = ("import N8nClient from '@egose/n8n-client';\n\nconst client = new N8nClient({\n  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',\n  apiKey: process.env.N8N_API_KEY,\n});\n\n// ─── Create Projects ────────────────────────────────────────────────────────\n\nawait client.project().create({ name: 'Engineering' });\nawait client.project().create({ name: 'Marketing' });\nconsole.log('Created projects');\n\n// ─── List Projects ──────────────────────────────────────────────────────────\n\nconst { data: projects } = await client.project().list();\nconsole.log(`Projects: ${projects.map((p) => p.name).join(', ')}`);\n\nconst engineering = projects.find((p) => p.name === 'Engineering');\n\n// ─── Manage Members ─────────────────────────────────────────────────────────\n\nif (engineering) {\n  // Add members\n  await client.project().addMembers(engineering.id, [\n    { userId: 'user-alice', role: 'project:admin' },\n    { userId: 'user-bob', role: 'project:editor' },\n  ]);\n  console.log('Added members to Engineering');\n\n  // List members\n  const { data: members } = await client.project().listMembers(engineering.id);\n  console.log(`Members: ${members.length}`);\n\n  // Change a member's role\n  await client.project().changeMemberRole(engineering.id, 'user-bob', 'project:admin');\n  console.log('Updated Bob to admin');\n\n  // Remove a member\n  await client.project().removeMember(engineering.id, 'user-bob');\n  console.log('Removed Bob from project');\n}\n\n// ─── Manage Folders ─────────────────────────────────────────────────────────\n\nif (engineering) {\n  const folderHandle = client.folder(engineering.id);\n\n  // Create folders\n  const prodFolder = await folderHandle.create({ name: 'Production Workflows' });\n  const stagingFolder = await folderHandle.create({ name: 'Staging Workflows' });\n  console.log(`Created folders: ${prodFolder.id}, ${stagingFolder.id}`);\n\n  // List folders\n  const { data: folders } = await folderHandle.list();\n  console.log(`Folders: ${folders.map((f) => f.name).join(', ')}`);\n\n  // Update a folder\n  await folderHandle.update(prodFolder.id, { name: 'Prod Workflows' });\n\n  // Move a workflow into the folder\n  await client.workflow().transfer('workflow-id', engineering.id);\n\n  // Delete a folder (transfer contents first)\n  await folderHandle.delete(stagingFolder.id, prodFolder.id);\n  console.log('Deleted staging folder, contents transferred');\n}\n\n// ─── Update Project ─────────────────────────────────────────────────────────\n\nif (engineering) {\n  await client.project().update(engineering.id, { name: 'Engineering Team' });\n  console.log('Updated project name');\n}\n\n// ─── Delete Project ─────────────────────────────────────────────────────────\n\nconst marketing = projects.find((p) => p.name === 'Marketing');\nif (marketing) {\n  await client.project().delete(marketing.id);\n  console.log('Deleted Marketing project');\n}\n");
;// CONCATENATED MODULE: ./docs/example/project-organization.mdx


const frontMatter = {
	sidebar_label: 'Project Organization',
	sidebar_position: 4
};
const contentTitle = 'Project Organization';

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
        id: "project-organization",
        children: "Project Organization"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This example covers creating projects, managing folders, adding and removing members, and organizing workflows using ", (0,jsx_runtime.jsx)(_components.code, {
        children: "ProjectClient"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "FolderClient"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.hr, {}), "\n", "\n", (0,jsx_runtime.jsx)(CodeBlock/* ["default"] */.A, {
      language: "ts",
      children: project_organization
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