"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["3137"], {
25(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_about_overview_mdx_545_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-about-overview-mdx-545.json
var site_docs_n_8_n_sync_about_overview_mdx_545_namespaceObject = JSON.parse('{"id":"n8n-sync/about/overview","title":"Overview","description":"@egose/n8n-sync syncs credentials and workflows between n8n instances using n8n external hooks. It builds two self-contained CommonJS hook bundles that you deploy alongside n8n and point at via EXTERNALHOOKFILES.","source":"@site/docs/n8n-sync/about/overview.mdx","sourceDirName":"n8n-sync/about","slug":"/n8n-sync/about/overview","permalink":"/n8n-sync/about/overview","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":0,"frontMatter":{"sidebar_label":"Overview","sidebar_position":0},"sidebar":"n8nSync","previous":{"title":"About","permalink":"/n8n-sync/about"},"next":{"title":"Quick Start","permalink":"/n8n-sync/about/quick-start"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/about/overview.mdx


const frontMatter = {
	sidebar_label: 'Overview',
	sidebar_position: 0
};
const contentTitle = 'Overview';

const assets = {

};



const toc = [{
  "value": "How it works",
  "id": "how-it-works",
  "level": 2
}, {
  "value": "Synced entities",
  "id": "synced-entities",
  "level": 2
}, {
  "value": "Where to go next",
  "id": "where-to-go-next",
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
        id: "overview",
        children: "Overview"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "@egose/n8n-sync"
      }), " syncs credentials and workflows between n8n instances using ", (0,jsx_runtime.jsx)(_components.a, {
        href: "https://docs.n8n.io/deploy/host-n8n/configure-n8n/external-hooks/",
        children: "n8n external hooks"
      }), ". It builds two self-contained CommonJS hook bundles that you deploy alongside n8n and point at via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "EXTERNAL_HOOK_FILES"
      }), "."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Bundle"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Role"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dist/publisher.cjs"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Runs on the ", (0,jsx_runtime.jsx)(_components.strong, {
              children: "source"
            }), " instance. Lifecycle hooks POST sync events to one or more subscribers over HTTPS."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "dist/subscriber.cjs"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Runs on each ", (0,jsx_runtime.jsx)(_components.strong, {
              children: "target"
            }), " instance. Mounts an endpoint on n8n's own server and applies events via n8n's internal repositories."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "how-it-works",
      children: "How it works"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "┌──────────────┐   credentials.create/update/delete      ┌──────────────┐\n│  source n8n  │   workflow.afterCreate/afterUpdate/…    │  target n8n  │\n│              │ ──────────────────────────────────────► │   (1..n)     │\n│ publisher.cjs│   POST /rest/sync/v1/events             │subscriber.cjs│\n│              │   HMAC-signed or bearer-token auth      │              │\n└──────────────┘                                         └──────────────┘\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Fan-out"
        }), ": the publisher delivers every event to every URL in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SUBSCRIBER_URLS"
        }), ". Each target has its own ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "serialized delivery queue"
        }), " — events reach a given target in hook order, and a slow or unreachable target never delays the others."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Fire-and-forget hooks"
        }), ": deliveries run in the background and failures are retried (1s, 2s, 4s, capped at 10s) then logged, so a sync outage cannot break n8n operations. The publisher never throws."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The subscriber applies events ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "idempotently with source IDs preserved"
        }), ", using the target instance's own TypeORM repositories (resolved from n8n's DI container at runtime)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Credential ", (0,jsx_runtime.jsx)(_components.code, {
          children: "data"
        }), " is passed through ", (0,jsx_runtime.jsx)(_components.strong, {
          children: "encrypted"
        }), " — all instances must share the same ", (0,jsx_runtime.jsx)(_components.code, {
          children: "N8N_ENCRYPTION_KEY"
        }), " so targets can decrypt secrets at runtime."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "synced-entities",
      children: "Synced entities"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["By default ", (0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " keeps workflows and credentials mirrored across instances. Execution sync is opt-in because it is high-volume."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Entity"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Wired by default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Opt-in env"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Workflows"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "yes"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ENTITIES"
            }), " (remove ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows"
            }), " to disable)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Credentials"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "yes"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ENTITIES"
            }), " (remove ", (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials"
            }), " to disable)"]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: "Executions ★"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ENTITIES=...,executions"
            })
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["★ ", (0,jsx_runtime.jsx)(_components.code, {
        children: "workflow.postExecute"
      }), " fires per execution (high volume) and the publisher handler is fire-and-forget so it never blocks n8n. Only scalar lifecycle columns are mirrored; per-step run data is dropped."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "where-to-go-next",
      children: "Where to go next"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/about/quick-start/",
          children: "Quick Start"
        }), " — build the bundles and wire up source + target in under a minute."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — publisher fan-out, subscriber mounted routes, and the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SyncEvent"
        }), " wire format."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/hooks/",
          children: "Wired Hooks"
        }), " — the full list of n8n hooks that trigger sync events."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment Variables"
        }), " — every ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_*"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "N8N_*"
        }), " knob."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/limitations/",
          children: "Limitations"
        }), " — what sync cannot and does not try to do."]
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