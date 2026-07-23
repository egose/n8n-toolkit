"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["7027"], {
4716(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_environment_mdx_449_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-environment-mdx-449.json
var site_docs_n_8_n_sync_sync_environment_mdx_449_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/environment","title":"Environment Variables","description":"All process.env access in the package lives in src/shared/config.ts. Nowhere else in the bundles reads process.env — keep this invariant when extending the code.","source":"@site/docs/n8n-sync/sync/environment.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/environment","permalink":"/n8n-sync/sync/environment","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_label":"Environment Variables","sidebar_position":3},"sidebar":"n8nSync","previous":{"title":"Authentication","permalink":"/n8n-sync/sync/authentication"},"next":{"title":"Tag-based Filtering","permalink":"/n8n-sync/sync/tag-filtering"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/environment.mdx


const frontMatter = {
	sidebar_label: 'Environment Variables',
	sidebar_position: 3
};
const contentTitle = 'Environment Variables';

const assets = {

};



const toc = [{
  "value": "Both sides",
  "id": "both-sides",
  "level": 2
}, {
  "value": "Publisher",
  "id": "publisher",
  "level": 2
}, {
  "value": "Subscriber",
  "id": "subscriber",
  "level": 2
}, {
  "value": "Defaults at a glance",
  "id": "defaults-at-a-glance",
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
    pre: "pre",
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
        id: "environment-variables",
        children: "Environment Variables"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["All ", (0,jsx_runtime.jsx)(_components.code, {
        children: "process.env"
      }), " access in the package lives in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/config.ts"
      }), ". Nowhere else in the bundles reads ", (0,jsx_runtime.jsx)(_components.code, {
        children: "process.env"
      }), " — keep this invariant when extending the code."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "both-sides",
      children: "Both sides"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Variable"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Required"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SHARED_SECRET"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "yes"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Shared secret. HMAC key (hmac mode) or bearer token (token mode)."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_AUTH_MODE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "hmac"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "hmac"
            }), " | ", (0,jsx_runtime.jsx)(_components.code, {
              children: "token"
            }), " — must match on publisher and subscriber. See ", (0,jsx_runtime.jsx)(_components.a, {
              href: "/n8n-sync/sync/authentication/",
              children: "Authentication"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ENTITIES"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows,credentials"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Comma-separated subset of ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflows"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "credentials"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "executions"
            }), " to sync. Unknown names are dropped. When ", (0,jsx_runtime.jsx)(_components.code, {
              children: "executions"
            }), " is included, the publisher registers ", (0,jsx_runtime.jsx)(_components.code, {
              children: "workflow.postExecute"
            }), " and the subscriber resolves the ", (0,jsx_runtime.jsx)(_components.code, {
              children: "ExecutionRepository"
            }), ". See ", (0,jsx_runtime.jsx)(_components.a, {
              href: "/n8n-sync/sync/hooks/",
              children: "Wired Hooks"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "LOG_LEVEL"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "info"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "debug"
            }), " | ", (0,jsx_runtime.jsx)(_components.code, {
              children: "info"
            }), " | ", (0,jsx_runtime.jsx)(_components.code, {
              children: "warn"
            }), " | ", (0,jsx_runtime.jsx)(_components.code, {
              children: "error"
            }), ". Structured JSON logger."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "publisher",
      children: "Publisher"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Variable"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Required"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SUBSCRIBER_URLS"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "yes"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Comma-separated target base URLs (fan-out). Falls back to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SUBSCRIBER_URL"
            }), " if unset."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SUBSCRIBER_URL"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Legacy single-target form of ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SUBSCRIBER_URLS"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SOURCE_ID"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "hostname"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Identifier stamped on every event."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_EVENTS_PATH"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/rest/sync/v1/events"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Endpoint path on the subscriber."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_TIMEOUT_MS"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "10000"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Per-attempt HTTP timeout."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_MAX_RETRIES"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "3"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Total delivery attempts per event."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_FILTER_BY_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["When ", (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), ", sync only workflows that carry ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_WORKFLOW_TAG"
            }), ". See ", (0,jsx_runtime.jsx)(_components.a, {
              href: "/n8n-sync/sync/tag-filtering/",
              children: "Tag-based Filtering"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_WORKFLOW_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "sync"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Workflow tag name that gates syncing. Effective only when ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_FILTER_BY_TAG=true"
            }), "."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ACTIVE_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "active"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Tag name that rewrites the DTO ", (0,jsx_runtime.jsx)(_components.code, {
              children: "active"
            }), " to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), " (real value preserved in ", (0,jsx_runtime.jsx)(_components.code, {
              children: "meta.active_real"
            }), "). Effective only when ", (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_FILTER_BY_TAG=true"
            }), "."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "subscriber",
      children: "Subscriber"
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Variable"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Required"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Description"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ROUTE_BASE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/rest/sync/v1"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Base path for the mounted routes."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_TARGET_PROJECT_ID"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "—"
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Link newly synced workflows/credentials to this project (", (0,jsx_runtime.jsx)(_components.code, {
              children: "*:owner"
            }), " role)."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_APPLY_ACTIVE_STATE"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Also write ", (0,jsx_runtime.jsx)(_components.code, {
              children: "active"
            }), "/", (0,jsx_runtime.jsx)(_components.code, {
              children: "activeVersionId"
            }), " (see ", (0,jsx_runtime.jsx)(_components.a, {
              href: "/n8n-sync/sync/limitations/",
              children: "Limitations"
            }), ")."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_MAX_BODY_BYTES"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "16777216"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Request body size cap."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_SIGNATURE_TOLERANCE_MS"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "300000"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Max signature age/skew accepted in hmac mode."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "N8N_DI_PATH"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/usr/local/lib/node_modules/n8n/node_modules/@n8n/di"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Path to n8n's ", (0,jsx_runtime.jsx)(_components.code, {
              children: "@n8n/di"
            }), " module."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "N8N_DB_PATH"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "no"
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "/usr/local/lib/node_modules/n8n/node_modules/@n8n/db"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Path to n8n's ", (0,jsx_runtime.jsx)(_components.code, {
              children: "@n8n/db"
            }), " module."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "defaults-at-a-glance",
      children: "Defaults at a glance"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# Minimal publisher\nexport EXTERNAL_HOOK_FILES=/opt/n8n-sync/publisher.cjs\nexport SYNC_SUBSCRIBER_URLS=https://target.example.com\nexport SYNC_SHARED_SECRET=<secret>\n\n# Minimal subscriber\nexport EXTERNAL_HOOK_FILES=/opt/n8n-sync/subscriber.cjs\nexport SYNC_SHARED_SECRET=<secret>\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Every other setting has a sensible default and only needs to be set when you want non-default behavior. See the ", (0,jsx_runtime.jsx)(_components.a, {
        href: "/n8n-sync/about/quick-start/",
        children: "Quick Start"
      }), " for a complete walkthrough."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/authentication/",
          children: "Authentication"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_AUTH_MODE"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SHARED_SECRET"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SIGNATURE_TOLERANCE_MS"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/tag-filtering/",
          children: "Tag-based Filtering"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_FILTER_BY_TAG"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_WORKFLOW_TAG"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_ACTIVE_TAG"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/hooks/",
          children: "Wired Hooks"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
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