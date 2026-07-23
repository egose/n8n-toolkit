"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["4568"], {
4436(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_architecture_mdx_b9e_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-architecture-mdx-b9e.json
var site_docs_n_8_n_sync_sync_architecture_mdx_b9e_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/architecture","title":"Architecture","description":"n8n-sync is two hook bundles wired into n8n\'s external-hooks system. There is no server process of its own and no shared database; the publisher pushes events over HTTP and the subscriber applies them through n8n\'s own repositories.","source":"@site/docs/n8n-sync/sync/architecture.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/architecture","permalink":"/n8n-sync/sync/architecture","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Architecture","sidebar_position":0},"sidebar":"n8nSync","previous":{"title":"Reference","permalink":"/n8n-sync/sync"},"next":{"title":"Wired Hooks","permalink":"/n8n-sync/sync/hooks"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/Tabs/index.js + 1 modules
var Tabs = __webpack_require__(1908);
// EXTERNAL MODULE: ./node_modules/.pnpm/@docusaurus+theme-classic@3.10.0_@docusaurus+faster@3.10.1_@docusaurus+types@3.10.0_@sw_394189f9b7b376bd4c9679ac349d548b/node_modules/@docusaurus/theme-classic/lib/theme/TabItem/index.js + 1 modules
var TabItem = __webpack_require__(3579);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/architecture.mdx


const frontMatter = {
	sidebar_label: 'Architecture',
	sidebar_position: 0
};
const contentTitle = 'Architecture';

const assets = {

};





const toc = [{
  "value": "Publisher side",
  "id": "publisher-side",
  "level": 2
}, {
  "value": "Wired hooks → events",
  "id": "wired-hooks--events",
  "level": 3
}, {
  "value": "<code>SYNC_ENTITIES</code> gating",
  "id": "sync_entities-gating",
  "level": 3
}, {
  "value": "Subscriber side",
  "id": "subscriber-side",
  "level": 2
}, {
  "value": "Wire format",
  "id": "wire-format",
  "level": 3
}, {
  "value": "Idempotency and ordering",
  "id": "idempotency-and-ordering",
  "level": 3
}, {
  "value": "Conventions",
  "id": "conventions",
  "level": 2
}, {
  "value": "Before and after",
  "id": "before-and-after",
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
        id: "architecture",
        children: "Architecture"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " is two hook bundles wired into n8n's external-hooks system. There is no server process of its own and no shared database; the publisher pushes events over HTTP and the subscriber applies them through n8n's own repositories."]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "publisher/index.ts  ── export = createPublisherHooks({ emit })\n                      emit = fan out to one createEventSender per SYNC_SUBSCRIBER_URLS entry\n                      each sender = serialized in-memory queue → sendSyncEvent\n                      (fetch POST + retry + HMAC/bearer auth, never throws)\nsubscriber/index.ts ── export = createSubscriberHooks({ ready })\n                      ready: buildN8nSyncRepositories() → createApplier()\n                             → createSyncRouteHandler() → mountSyncRoutes()\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "publisher-side",
      children: "Publisher side"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Entry file"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisher/index.ts"
        }), ") ends with ", (0,jsx_runtime.jsx)(_components.code, {
          children: "export = createPublisherHooks(...)"
        }), ". n8n loads hook files via ", (0,jsx_runtime.jsx)(_components.code, {
          children: "require()"
        }), " and expects the hook map directly (", (0,jsx_runtime.jsx)(_components.code, {
          children: "IExternalHooksFileData"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "emit"
          })
        }), " is a fan-out function that enqueues one event per target URL into one ", (0,jsx_runtime.jsx)(_components.code, {
          children: "createEventSender"
        }), " per entry in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SUBSCRIBER_URLS"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "createEventSender"
          })
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "publisher/sender.ts"
        }), ") maintains a per-target ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "serialized in-memory queue"
        }), ". Events for a given target are delivered one at a time in hook order; a slow target never delays others. Hooks themselves only enqueue (fire-and-forget) so n8n stays responsive."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "sendSyncEvent"
          })
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "shared/http.ts"
        }), ") performs a ", (0,jsx_runtime.jsx)(_components.code, {
          children: "fetch"
        }), " POST with timeout and exponential-backoff retry (1s, 2s, 4s, capped at 10s). Every attempt re-signs the request (HMAC mode) so a retried request gets a fresh timestamp."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "wired-hooks--events",
      children: "Wired hooks → events"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "n8n hook"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Event"
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
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["★ ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.postExecute"
      }), " is opt-in via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), ". See ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/n8n-sync/sync/hooks/",
        children: "Wired Hooks"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Deliberately ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " wired: ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.preExecute"
      }), " (fires per execution with no execution-summary counterpart on the subscriber), ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.create/update/delete"
      }), " pre-hooks (redundant with the after-hooks)."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h3, {
      id: "sync_entities-gating",
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), " gating"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["All ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), " access lives in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/config.ts"
      }), " as a ", (0,jsx_runtime.jsx)(_components.code, {
        children: "ReadonlySet<'workflows' | 'credentials' | 'executions'>"
      }), ". Unknown names are dropped; when the env var is empty it defaults to ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflows,credentials"
      }), " (executions are off)."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["When an entity is disabled, the corresponding hook handler is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not wired at all"
      }), " — the key is absent from the returned hook map. n8n pays zero fan-out overhead for it. For example, with the default value the publisher emits no execution events; ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.postExecute"
      }), " is re-registered only when ", (0,jsx_runtime.jsx)(_components.code, {
        children: "executions"
      }), " is in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_ENTITIES"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "subscriber-side",
      children: "Subscriber side"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The subscriber mounts ", (0,jsx_runtime.jsx)(_components.code, {
        children: "POST /rest/sync/v1/events"
      }), " (+ ", (0,jsx_runtime.jsx)(_components.code, {
        children: "GET …/health"
      }), ") on n8n's own server inside the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "n8n.ready"
      }), " hook, and applies events via n8n's internal repositories."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "n8n.ready"
          })
        }), " is the only hook the subscriber wires. It resolves n8n's DI ", (0,jsx_runtime.jsx)(_components.code, {
          children: "Container"
        }), " and from it pulls the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "WorkflowRepository"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "CredentialsRepository"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ProjectRepository"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "UserRepository"
        }), ", and — only when ", (0,jsx_runtime.jsx)(_components.code, {
          children: "executions"
        }), " is in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ENTITIES"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ExecutionRepository"
        }), ". Resolving DI earlier crashes; nothing in the bundle touches the container before ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ready"
        }), " fires."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "createApplier(repos, opts)"
          })
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "subscriber/applier.ts"
        }), ") is the heart of the subscriber. It is idempotent and last-write-wins on a monotonic timestamp."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "createSyncRouteHandler"
          })
        }), " + ", (0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "mountSyncRoutes"
          })
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "subscriber/routes.ts"
        }), ") wire the HTTP entry point. The flow per request is: authenticate → validate → apply → 204 No Content."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "wire-format",
      children: "Wire format"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The wire payload is the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SyncEvent"
      }), " discriminated union in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/types.ts"
      }), ". Inbound payloads are validated with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "parseSyncEvent"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/validate.ts"
      }), "); anything that does not match the contract is rejected with a 400 before any repository write happens."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "idempotency-and-ordering",
      children: "Idempotency and ordering"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Upserts are ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "last-write-wins on a monotonic timestamp"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "isStaleEvent"
      }), " in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "applier.ts"
      }), "):"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Entity"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Invariant column"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Note"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Workflows"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "updatedAt"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Stored row is skipped when its ", (0,jsx_runtime.jsx)(_components.code, {
              children: "updatedAt"
            }), " ≥ incoming."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Credentials"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "updatedAt"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Same guard."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Executions"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "stoppedAt"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["In-flight executions (", (0,jsx_runtime.jsx)(_components.code, {
              children: "stoppedAt: null"
            }), ") skip the guard so a later delivery can still converge state."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "This guards out-of-order delivery and makes retry re-deliveries no-ops. Deletes and archives are applied unconditionally; a delete for an unknown id is a no-op."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "conventions",
      children: "Conventions"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["All ", (0,jsx_runtime.jsx)(_components.code, {
          children: "process.env"
        }), " access lives in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "src/shared/config.ts"
        }), " — nowhere else in the bundle."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["n8n payload types (", (0,jsx_runtime.jsx)(_components.code, {
          children: "IWorkflowBase"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "ICredentialsDb"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "N8nServer"
        }), ") are local minimal copies in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "src/shared/types.ts"
        }), ". The package must stay free of n8n dependencies."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The logger is the zero-dep structured JSON logger in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "src/shared/logger.ts"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "createLogger(module)"
        }), ")."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The subscriber uses n8n's global ", (0,jsx_runtime.jsx)(_components.code, {
          children: "rawBodyReader"
        }), " middleware, reading request bodies from ", (0,jsx_runtime.jsx)(_components.code, {
          children: "req.rawBody"
        }), " when available, with a zero-dep stream read and a ", (0,jsx_runtime.jsx)(_components.code, {
          children: "JSON.stringify"
        }), " body fallback. HMAC verification uses the exact raw bytes — never a re-serialized body when rawBody is available."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "before-and-after",
      children: "Before and after"
    }), "\n", (0,jsx_runtime.jsxs)(Tabs/* ["default"] */.A, {
      children: [(0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "before",
        label: "Manual script (signal)",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-ts",
            children: "// polling script on the target, runs every minute\nconst workflows = await fetch('https://source.example.com/api/v1/workflows', {\n  headers: { 'X-N8N-API-KEY': process.env.SOURCE_API_KEY },\n}).then(r => r.json());\n\nfor (const wf of workflows.data) {\n  const existing = await localDb.workflow.findOne({ where: { id: wf.id } });\n  if (!existing || new Date(wf.updatedAt) > new Date(existing.updatedAt)) {\n    await localDb.workflow.save(wf);\n  }\n}\n"
          })
        })
      }), (0,jsx_runtime.jsx)(TabItem/* ["default"] */.A, {
        value: "after",
        label: "With n8n-sync",
        children: (0,jsx_runtime.jsx)(_components.pre, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            className: "language-bash",
            children: "# source instance\nexport EXTERNAL_HOOK_FILES=/opt/n8n-sync/publisher.cjs\nexport SYNC_SUBSCRIBER_URLS=https://target.example.com\nexport SYNC_SHARED_SECRET=<secret>\n\n# target instance\nexport EXTERNAL_HOOK_FILES=/opt/n8n-sync/subscriber.cjs\nexport SYNC_SHARED_SECRET=<secret>\n"
          })
        })
      })]
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