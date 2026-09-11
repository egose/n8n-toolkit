"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["6766"], {
6290(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_hooks_mdx_0cd_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-hooks-mdx-0cd.json
var site_docs_n_8_n_sync_sync_hooks_mdx_0cd_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/hooks","title":"Wired Hooks","description":"n8n-sync only fires on a deliberately small set of n8n external hooks. Each maps to one SyncEvent on the wire.","source":"@site/docs/n8n-sync/sync/hooks.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/hooks","permalink":"/n8n-sync/sync/hooks","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Wired Hooks","sidebar_position":1},"sidebar":"n8nSync","previous":{"title":"Architecture","permalink":"/n8n-sync/sync/architecture"},"next":{"title":"Authentication","permalink":"/n8n-sync/sync/authentication"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/hooks.mdx


const frontMatter = {
	sidebar_label: 'Wired Hooks',
	sidebar_position: 1
};
const contentTitle = 'Wired Hooks';

const assets = {

};



const toc = [{
  "value": "Hook selection rationale",
  "id": "hook-selection-rationale",
  "level": 2
}, {
  "value": "Publisher never throws",
  "id": "publisher-never-throws",
  "level": 2
}, {
  "value": "<code>SYNC_ENTITIES</code> gating",
  "id": "sync_entities-gating",
  "level": 2
}, {
  "value": "Credential hook contract",
  "id": "credential-hook-contract",
  "level": 2
}, {
  "value": "Credential backfill on workflow sync",
  "id": "credential-backfill-on-workflow-sync",
  "level": 2
}, {
  "value": "Filtering by tag",
  "id": "filtering-by-tag",
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
    ol: "ol",
    p: "p",
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
        id: "wired-hooks",
        children: "Wired Hooks"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " only fires on a deliberately small set of n8n external hooks. Each maps to one ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SyncEvent"
      }), " on the wire."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Source hook"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Event"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Entity"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "credentials.create"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials.update"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials.upsert"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "credentials"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials.delete"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials.delete"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "credentials"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.afterCreate"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.afterUpdate"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.upsert"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "workflows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.activate"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.activate"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "workflows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.afterDelete"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.delete"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "workflows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.afterArchive"
            }), " / ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.afterUnarchive"
            })]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.archive"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "workflows"
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.postExecute"
            }), " ★"]
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "execution.upsert"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "executions ★"
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["★ ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.postExecute"
      }), " is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "opt-in"
      }), " — see the ", (0,jsx_runtime.jsxs)(_components.a, {
        href: "/n8n-sync/sync/environment/",
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ENTITIES"
        }), " setting"]
      }), " below. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "executions"
      }), " requires ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflows"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "hook-selection-rationale",
      children: "Hook selection rationale"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "The goal is to mirror lifecycle state without duplicating traffic. The publisher selects hooks with these rules:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "after*"
          }), " over ", (0,jsx_runtime.jsx)(_components.code, {
            children: "pre*"
          })]
        }), " — pre-hooks like ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.create"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.update"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.delete"
        }), " fire before commit, before the new state is durable. The subscriber would have nothing better than a guess about what actually got written. The corresponding ", (0,jsx_runtime.jsx)(_components.code, {
          children: "after*"
        }), " hooks fire once the DB write has succeeded, and the payload reflects the committed row."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "postExecute"
          }), " only when ", (0,jsx_runtime.jsx)(_components.code, {
            children: "executions"
          }), " is in ", (0,jsx_runtime.jsx)(_components.code, {
            children: "SYNC_ENTITIES"
          })]
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.preExecute"
        }), " fires for every single run with no execution-summary counterpart on the subscriber, so wiring it would create a fan-out storm with nothing useful to apply. ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.postExecute"
        }), " fires once the run reaches a terminal state and carries the scalar lifecycle columns, making it the right hook for execution sync."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: ["No ", (0,jsx_runtime.jsx)(_components.code, {
            children: "workflow.activate"
          }), " deactivate path"]
        }), " — n8n emits an internal-only event on deactivation and no external hook. There is nothing to sync from. The target converges state on the next update or activate event. See ", (0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/limitations/",
          children: "Limitations"
        }), " for the full set of n8n-platform quirks."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "publisher-never-throws",
      children: "Publisher never throws"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Every hook handler is wrapped so the publisher ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "never throws"
      }), ". A rejecting hook propagates up to n8n — for example it can cancel a workflow activation. Sync failures are logged and swallowed; enqueue failures are logged and dropped."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "sync_entities-gating",
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), " gating"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["When an entity is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), ", the corresponding hook handler is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not wired at all"
      }), " — the key is absent from the returned hook map, so n8n pays zero fan-out overhead."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.th, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ENTITIES"
            }), " value"]
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Wired publisher hooks"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "workflows,credentials"
            }), " (default)"]
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["All workflow hooks except ", (0,jsx_runtime.jsx)(_components.code, {
              children: "postExecute"
            }), ", plus all credentials hooks."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows,credentials,executions"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Above, plus ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.postExecute"
            }), ". The subscriber resolves ", (0,jsx_runtime.jsx)(_components.code, {
              children: "ExecutionRepository"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Workflow hooks only; credentials hooks are absent."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Credentials hooks only; workflow hooks are entirely absent."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "executions"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Invalid. Startup fails because execution sync requires workflow sync."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows,executions"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Workflow hooks plus ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.postExecute"
            }), "; credentials hooks are absent."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Explicit invalid names fail startup instead of being ignored. An absent or blank ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), " falls back to the default (", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflows,credentials"
      }), "), but an explicit comma-only empty value is rejected after parsing."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["On the subscriber, a valid event for a disabled family returns non-retryable ", (0,jsx_runtime.jsx)(_components.code, {
        children: "422"
      }), " with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITY_DISABLED"
      }), " before repository access, ordering inspection, or execution identity access."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "credential-hook-contract",
      children: "Credential hook contract"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Credential sync only publishes when the hook payload or resolved repository row includes both a stable credential ", (0,jsx_runtime.jsx)(_components.code, {
        children: "id"
      }), " and encrypted string ", (0,jsx_runtime.jsx)(_components.code, {
        children: "data"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "credentials.create"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "credentials.update"
        }), " drop object-form credential payloads instead of relying on repository-side encryption."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["When ", (0,jsx_runtime.jsx)(_components.code, {
          children: "credentials.create"
        }), " includes an ", (0,jsx_runtime.jsx)(_components.code, {
          children: "id"
        }), " but the row is not yet queryable, the publisher briefly retries ", (0,jsx_runtime.jsx)(_components.code, {
          children: "dbCollections.Credentials.findOne({ where: { id } })"
        }), " and emits only that exact row."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Payloads without a stable credential ", (0,jsx_runtime.jsx)(_components.code, {
          children: "id"
        }), " are logged and dropped. The publisher never guesses by mutable fields like ", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ name, type }"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Known platform gap:"
        }), " n8n fires ", (0,jsx_runtime.jsx)(_components.code, {
          children: "credentials.create"
        }), " pre-commit with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "id: null"
        }), ", so creates never sync on their own. See credential backfill below."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "credential-backfill-on-workflow-sync",
      children: "Credential backfill on workflow sync"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Because creates don't sync, a synced workflow can reference credentials the target has never seen. To close that gap without fetching every credential on every update:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.upsert"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.activate"
        }), " carry an id-only ", (0,jsx_runtime.jsx)(_components.code, {
          children: "credentialIds"
        }), " list collected from the workflow's nodes."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The subscriber checks those ids with a single query and reports the missing ones back inside the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "200"
        }), " delivery response (", (0,jsx_runtime.jsx)(_components.code, {
          children: "{ ok: true, missingCredentialIds }"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The publisher resolves each reported id by stable id and emits a ", (0,jsx_runtime.jsx)(_components.code, {
          children: "credentials.upsert"
        }), " backfill for exactly those blobs."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The round-trip stays inside the existing publisher→subscriber channel (response body) — no separate subscriber→publisher path. Backfill lookups are id-anchored; credential upserts carry no references, so the loop terminates. Applies only when the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "credentials"
      }), " entity is enabled on both sides."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "filtering-by-tag",
      children: "Filtering by tag"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The publisher can also restrict propagation by inspecting n8n workflow tags. See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/n8n-sync/sync/tag-filtering/",
        children: "Tag-based Filtering"
      }), " — the subscriber side is tag-agnostic."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment variables"
        }), " — every ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_*"
        }), " setting, including ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ENTITIES"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — the publisher / subscriber pipeline that consumes these hooks."]
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