"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["2778"], {
6257(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_persistence_readiness_mdx_b3b_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-persistence-readiness-mdx-b3b.json
var site_docs_n_8_n_sync_sync_persistence_readiness_mdx_b3b_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/persistence-readiness","title":"Persistence & Readiness","description":"n8n-sync is event-driven, but its ordering guarantees depend on small file-backed state stores. Treat these files as sync state, not cache.","source":"@site/docs/n8n-sync/sync/persistence-readiness.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/persistence-readiness","permalink":"/n8n-sync/sync/persistence-readiness","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":5,"frontMatter":{"sidebar_label":"Persistence & Readiness","sidebar_position":5},"sidebar":"n8nSync","previous":{"title":"Tag-based Filtering","permalink":"/n8n-sync/sync/tag-filtering"},"next":{"title":"Limitations","permalink":"/n8n-sync/sync/limitations"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/persistence-readiness.mdx


const frontMatter = {
	sidebar_label: 'Persistence & Readiness',
	sidebar_position: 5
};
const contentTitle = 'Persistence & Readiness';

const assets = {

};



const toc = [{
  "value": "State Files",
  "id": "state-files",
  "level": 2
}, {
  "value": "Readiness",
  "id": "readiness",
  "level": 2
}, {
  "value": "Crash Windows",
  "id": "crash-windows",
  "level": 2
}, {
  "value": "Recovery Notes",
  "id": "recovery-notes",
  "level": 2
}, {
  "value": "Topology (Kubernetes)",
  "id": "topology-kubernetes",
  "level": 2
}, {
  "value": "Related Docs",
  "id": "related-docs",
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
        id: "persistence--readiness",
        children: "Persistence & Readiness"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " is event-driven, but its ordering guarantees depend on small file-backed state stores. Treat these files as sync state, not cache."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "state-files",
      children: "State Files"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Side"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Path"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Publisher"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_PUBLISHER_STATE_PATH"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Stores the configured ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SOURCE_ID"
            }), ", the source-scoped event sequence, and per-entity revision counters."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Publisher"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "<SYNC_PUBLISHER_STATE_PATH>.lock"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Best-effort local lock that rejects another live publisher process using the same path."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Subscriber"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SUBSCRIBER_STATE_PATH"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Stores the last applied revision for each ", (0,jsx_runtime.jsx)(_components.code, {
              children: "[sourceId, entityKind, entityId]"
            }), ", including delete tombstones."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Subscriber"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "<subscriber-state-basename>.executions.json"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Stores source-execution to target-execution mappings when execution sync is enabled."
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Put these files on persistent storage. If the publisher state is lost, the publisher may reuse old revisions. If subscriber state is lost, the target can forget tombstones and stale-event protection until a newer event arrives."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "readiness",
      children: "Readiness"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The subscriber mounts three routes under ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ROUTE_BASE"
      }), " (default ", (0,jsx_runtime.jsx)(_components.code, {
        children: "/rest/sync/v1"
      }), "):"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Route"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Auth"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Response"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "GET /health"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "none"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "200 { \"ok\": true }"
            }), " once routes are mounted."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "GET /ready"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "none"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "200 { \"ok\": true, \"ready\": true }"
            }), " while required file-backed state is loaded and writable; otherwise ", (0,jsx_runtime.jsx)(_components.code, {
              children: "503"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "POST /events"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "HMAC or token"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Applies one sync event. Returns ", (0,jsx_runtime.jsx)(_components.code, {
              children: "503 { \"ok\": false, \"ready\": false }"
            }), " while readiness is false."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "/ready"
      }), " checks current sync state load/write capability. It does not prove that n8n database writes and JSON checkpoints can commit atomically."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "crash-windows",
      children: "Crash Windows"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Current persistence is file-backed. JSON state writes are atomic per file, but they are not atomic with n8n database mutations or other JSON files."
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "A crash after a database write but before recording the subscriber checkpoint can cause a redelivery to hit row timestamp guards or revision conflicts."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "A crash after an execution row write but before updating the execution identity file can require operator repair."
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "A publisher restart loses events that were still queued in memory and not yet delivered."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Exceeding ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_MAX_QUEUE_SIZE"
        }), " drops the oldest queued event for that target and logs a warning before enqueueing the new event."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Supported production topology is one publisher process for a given ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_SOURCE_ID"
      }), " / ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_PUBLISHER_STATE_PATH"
      }), " and one subscriber process for a given route/state path. The publisher lock is best-effort and local to the state path/PID namespace; it is not a distributed lock."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "recovery-notes",
      children: "Recovery Notes"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.code, {
          children: "409 SYNC_REVISION_CONFLICT"
        }), " means the target already committed that source/entity revision under a different ", (0,jsx_runtime.jsx)(_components.code, {
          children: "eventId"
        }), ". This usually indicates duplicate publishers for the same ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), " or a publisher restored with stale state."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Stop duplicate publishers before removing a stale ", (0,jsx_runtime.jsx)(_components.code, {
          children: ".lock"
        }), " file. Remove only the lock file after verifying the original process is gone."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["To intentionally change ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), ", stop the publisher, back up and move aside the old publisher state file, configure the new source ID, and run a full subscriber resync or source-retirement procedure."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Subscriber state format ", (0,jsx_runtime.jsx)(_components.code, {
          children: "1"
        }), " is refused instead of migrated because its colon-separated keys are ambiguous. Back it up, then restore from unambiguous metadata if available or reset subscriber sync state and perform a full source resync."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Do not delete subscriber tombstone state unless you accept that stale source events can be applied again."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Invalid publisher order state (parsed JSON matches no known shape; supported publisher state versions ", (0,jsx_runtime.jsx)(_components.code, {
          children: "1"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "2"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "3"
        }), ") is quarantined via atomic rename to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<statePath>.corrupt.<UTC-timestamp>.bak"
        }), " — the original path is renamed, never overwritten or deleted in place. With the default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_PUBLISHER_INVALID_STATE=fail"
        }), ", the publisher stays degraded (", (0,jsx_runtime.jsx)(_components.code, {
          children: "invalid_state"
        }), ") without reiniting counters. With ", (0,jsx_runtime.jsx)(_components.code, {
          children: "quarantine-reset"
        }), ", counters reinit from zero only as an epoch rotation: the configured ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), " must differ from the quarantined file's stored ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sourceId"
        }), ", and a full subscriber resync is mandatory before trusting convergence. A same-identity reset — or a reset when the quarantined file carries no usable stored identity — is refused at startup, because reused ", (0,jsx_runtime.jsx)(_components.code, {
          children: "eventId"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "entityRevision"
        }), " values under one source identity are rejected by the subscriber as stale/conflict (", (0,jsx_runtime.jsx)(_components.code, {
          children: "409 SYNC_REVISION_CONFLICT"
        }), "), causing silent divergence."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Publisher invalid-state runbook: back up the live file and any ", (0,jsx_runtime.jsx)(_components.code, {
          children: ".corrupt.*.bak"
        }), " backup first; inspect the error's parsed ", (0,jsx_runtime.jsx)(_components.code, {
          children: "version"
        }), ", stored ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sourceId"
        }), " preview, and entity-key count (a version outside ", (0,jsx_runtime.jsx)(_components.code, {
          children: "1, 2, 3"
        }), " against an older bundle usually means bundle skew, not corruption); on skew, rebuild/redeploy current bundles so the valid file loads untouched; on genuine corruption, restore the quarantined backup after upgrading or start a new epoch and resync."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Successful publisher boot logs ", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisherStateVersion"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisherStateSourceId"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisherNextEventSequence"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisherEntityKeyCount"
        }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "invalidStateMode"
        }), " at info; the epoch-reset warn carries ", (0,jsx_runtime.jsx)(_components.code, {
          children: "previousSourceId"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "newSourceId"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "quarantinedBackupPath"
        }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "invalidStateMode"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "topology-kubernetes",
      children: "Topology (Kubernetes)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Prefer a dedicated ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ReadWriteOnce"
        }), " (RWO) PVC for sync state over a shared ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ReadWriteMany"
        }), " (RWX) volume. A shared RWX volume preserves the state file across pod generations, so a redeployed older bundle can boot against a newer on-disk format and halt sync on the first hook."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Run a single publisher replica with the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Recreate"
        }), " strategy so two publisher processes never share one ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), " / ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_PUBLISHER_STATE_PATH"
        }), "."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "Deploy digest-pinned images so every pod generation runs the bundle that matches the on-disk state format."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Keep ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), " stable for the lifetime of the state file; rotate it only deliberately alongside a quarantined backup and a full subscriber resync."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "related-docs",
      children: "Related Docs"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment Variables"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_PUBLISHER_STATE_PATH"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_PUBLISHER_INVALID_STATE"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SUBSCRIBER_STATE_PATH"
        }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_MAX_QUEUE_SIZE"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — how event revisions and row timestamp guards fit together."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/limitations/",
          children: "Limitations"
        }), " — residual constraints and unsupported topologies."]
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