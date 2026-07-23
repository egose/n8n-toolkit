"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["5913"], {
6131(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_limitations_mdx_c57_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-limitations-mdx-c57.json
var site_docs_n_8_n_sync_sync_limitations_mdx_c57_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/limitations","title":"Limitations","description":"n8n-sync is intentionally narrow: it is a one-way, eventually-consistent mirror of workflow, credential, and (opt-in) execution state across n8n instances. These are the things it explicitly does not do, and the platform reasons why.","source":"@site/docs/n8n-sync/sync/limitations.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/limitations","permalink":"/n8n-sync/sync/limitations","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_label":"Limitations","sidebar_position":5},"sidebar":"n8nSync","previous":{"title":"Tag-based Filtering","permalink":"/n8n-sync/sync/tag-filtering"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/limitations.mdx


const frontMatter = {
	sidebar_label: 'Limitations',
	sidebar_position: 5
};
const contentTitle = 'Limitations';

const assets = {

};



const toc = [{
  "value": "n8n-platform quirks",
  "id": "n8n-platform-quirks",
  "level": 2
}, {
  "value": "Wire / delivery semantics",
  "id": "wire--delivery-semantics",
  "level": 2
}, {
  "value": "Credentials",
  "id": "credentials",
  "level": 2
}, {
  "value": "Executions",
  "id": "executions",
  "level": 2
}, {
  "value": "Auth",
  "id": "auth",
  "level": 2
}, {
  "value": "Project assignment",
  "id": "project-assignment",
  "level": 2
}, {
  "value": "Filtering",
  "id": "filtering",
  "level": 2
}, {
  "value": "Reference",
  "id": "reference",
  "level": 2
}];
function _createMdxContent(props) {
  const _components = {
    a: "a",
    code: "code",
    h1: "h1",
    h2: "h2",
    header: "header",
    li: "li",
    p: "p",
    strong: "strong",
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "limitations",
        children: "Limitations"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " is intentionally narrow: it is a one-way, eventually-consistent mirror of workflow, credential, and (opt-in) execution state across n8n instances. These are the things it explicitly does not do, and the platform reasons why."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "n8n-platform-quirks",
      children: "n8n-platform quirks"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Deactivation does not sync."
        }), " n8n fires no external hook on workflow deactivation; ", (0,jsx_runtime.jsx)(_components.code, {
          children: "deactivateWorkflow"
        }), " only emits an internal event. The target corrects state on the next update or activate event, or stays active until then. Do not try to work around this with polling."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "workflow.activate"
          }), " fires pre-commit."]
        }), " If a later hook rejects the activation, the subscriber may briefly hold an uncommitted state; the next event converges it. The applier treats ", (0,jsx_runtime.jsx)(_components.code, {
          children: "activate"
        }), " as an upsert so state converges."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Repository access"
        }), " happens only inside the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "n8n.ready"
        }), " hook, where n8n's DI ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Container"
        }), " is initialized. Resolving it earlier crashes the subscriber."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "wire--delivery-semantics",
      children: "Wire / delivery semantics"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "One-way, last-write-wins."
        }), " Sync is directional. Upserts carry the source monotonic timestamp (", (0,jsx_runtime.jsx)(_components.code, {
          children: "updatedAt"
        }), " for workflows/credentials, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stoppedAt"
        }), " for executions) and are skipped when the target row is already at or beyond it, so out-of-order or duplicate deliveries cannot regress state. Deletes and archives are applied unconditionally."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "The delivery queue is in-memory."
        }), " Events queued but not yet delivered when the source instance restarts are lost; state converges on the next event for that entity (or stays divergent until then)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Active state is DB-only."
        }), " With ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_APPLY_ACTIVE_STATE=true"
        }), ", the target's ", (0,jsx_runtime.jsx)(_components.code, {
          children: "active"
        }), " flag is written to the database, but triggers/webhooks are not registered with the target's active workflow manager until restart or manual toggle. Keep it ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), " (the default) for passive-standby targets."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Deletes and archives for unknown IDs are no-ops."
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "update"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "delete"
        }), " on missing rows return early; sync is eventually consistent by design."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "credentials",
      children: "Credentials"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: ["Credential sync requires a shared ", (0,jsx_runtime.jsx)(_components.code, {
            children: "N8N_ENCRYPTION_KEY"
          })]
        }), " on all instances. Credential ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " is an encrypted blob passthrough — the publisher never decrypts it and the subscriber stores it as-is, so the target instance's key must match the source's for the credential to remain usable at runtime."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "executions",
      children: "Executions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Execution sync is summary-only."
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ENTITIES=…,executions"
        }), " upserts a row in the target's ", (0,jsx_runtime.jsx)(_components.code, {
          children: "execution_entity"
        }), " table with the source ID and scalar lifecycle columns (", (0,jsx_runtime.jsx)(_components.code, {
          children: "id"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflowId"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "status"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "mode"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "finished"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "startedAt"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stoppedAt"
        }), ", retry ids, ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflowVersionId"
        }), ") plus a best-effort workflow snapshot. The ", (0,jsx_runtime.jsx)(_components.code, {
          children: "execution_data"
        }), " blob (per-step ", (0,jsx_runtime.jsx)(_components.code, {
          children: "fullRunData"
        }), ") is ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "not"
        }), " written to keep payloads small; target-side reads via the Public API will see the execution summary but not its run detail."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: ["Execution staleness is based on ", (0,jsx_runtime.jsx)(_components.code, {
            children: "stoppedAt"
          }), "."]
        }), " In-flight executions (", (0,jsx_runtime.jsx)(_components.code, {
          children: "running"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "waiting"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "new"
        }), ") carry ", (0,jsx_runtime.jsx)(_components.code, {
          children: "stoppedAt: null"
        }), "; for them the last-write-wins guard is skipped so a later delivery can still converge state. Re-deliveries of the same event are no-ops."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "startedAt"
          }), " / ", (0,jsx_runtime.jsx)(_components.code, {
            children: "createdAt"
          }), " are immutable post-insert"]
        }), " on ", (0,jsx_runtime.jsx)(_components.code, {
          children: "execution_entity"
        }), " — the applier mirrors n8n's own ", (0,jsx_runtime.jsx)(_components.code, {
          children: "updateExistingExecution"
        }), " semantics and drops them from update payloads."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "auth",
      children: "Auth"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Auth modes do not cross-accept."
        }), " A token-mode subscriber rejects hmac-signed requests and vice versa. Both sides must use the same ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_AUTH_MODE"
        }), ". See ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/authentication/",
          children: "Authentication"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "project-assignment",
      children: "Project assignment"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "SYNC_TARGET_PROJECT_ID"
          }), " (default empty)"]
        }), " — when set, newly created workflows/credentials are linked to that project. When empty, the applier falls back to the target instance owner's ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "personal project"
        }), " (resolved lazily via ", (0,jsx_runtime.jsx)(_components.code, {
          children: "UserRepository"
        }), " + ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ProjectRepository.getPersonalProjectForUser"
        }), ", cached for the process lifetime including the negative case). The fallback makes synced entities visible through the target's Public API without explicit configuration. An explicit ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_TARGET_PROJECT_ID"
        }), " always wins."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "filtering",
      children: "Filtering"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Tag filtering is source-side only."
        }), " ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_FILTER_BY_TAG"
        }), " rewrites the publisher's DTOs and may turn an upsert into a delete; the subscriber never sees or honors tag fields. Tagging a workflow on the source does not propagate the tag itself to the target. See ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/tag-filtering/",
          children: "Tag-based Filtering"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — the design that produces these behaviors."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/hooks/",
          children: "Wired Hooks"
        }), " — the hook surface selection rationale."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment variables"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_APPLY_ACTIVE_STATE"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_TARGET_PROJECT_ID"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ENTITIES"
        }), "."]
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