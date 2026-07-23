"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["4126"], {
1892(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_authentication_mdx_9cd_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-authentication-mdx-9cd.json
var site_docs_n_8_n_sync_sync_authentication_mdx_9cd_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/authentication","title":"Authentication","description":"The publisher and subscriber must agree on the same auth mode. SYNCAUTHMODE (hmac or token) is read by both bundles from src/shared/config.ts, and the modes do not cross-accept: a token-mode subscriber rejects HMAC-signed requests and vice-versa.","source":"@site/docs/n8n-sync/sync/authentication.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/authentication","permalink":"/n8n-sync/sync/authentication","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_label":"Authentication","sidebar_position":2},"sidebar":"n8nSync","previous":{"title":"Wired Hooks","permalink":"/n8n-sync/sync/hooks"},"next":{"title":"Environment Variables","permalink":"/n8n-sync/sync/environment"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/authentication.mdx


const frontMatter = {
	sidebar_label: 'Authentication',
	sidebar_position: 2
};
const contentTitle = 'Authentication';

const assets = {

};



const toc = [{
  "value": "HMAC mode (recommended)",
  "id": "hmac-mode-recommended",
  "level": 2
}, {
  "value": "Why raw bytes matter",
  "id": "why-raw-bytes-matter",
  "level": 3
}, {
  "value": "Token mode",
  "id": "token-mode",
  "level": 2
}, {
  "value": "Gotchas",
  "id": "gotchas",
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
        id: "authentication",
        children: "Authentication"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The publisher and subscriber must agree on the same auth mode. ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_AUTH_MODE"
      }), " (", (0,jsx_runtime.jsx)(_components.code, {
        children: "hmac"
      }), " or ", (0,jsx_runtime.jsx)(_components.code, {
        children: "token"
      }), ") is read by both bundles from ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/config.ts"
      }), ", and the modes do ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " cross-accept: a token-mode subscriber rejects HMAC-signed requests and vice-versa."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Mode"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Headers"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Notes"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "hmac"
            }), " (default)"]
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: [(0,jsx_runtime.jsx)(_components.code, {
              children: "x-sync-timestamp"
            }), ", ", (0,jsx_runtime.jsx)(_components.code, {
              children: "x-sync-signature"
            })]
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["Per-request HMAC-SHA256 of ", (0,jsx_runtime.jsx)(_components.code, {
              children: "<timestamp>.<rawBody>"
            }), " keyed with the shared secret. Replay-protected: the subscriber rejects timestamps outside a 5-minute tolerance. Every retry re-signs with a fresh timestamp."]
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "token"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "x-sync-token"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Static shared-secret bearer token. Simpler; use only over TLS."
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "hmac-mode-recommended",
      children: "HMAC mode (recommended)"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The signature is ", (0,jsx_runtime.jsx)(_components.code, {
        children: "HMAC_SHA256(sharedSecret, \"<timestamp>.<rawBody>\")"
      }), ", hex-encoded."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "<timestamp>"
          })
        }), " is a Unix-millisecond integer sent in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "x-sync-timestamp"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: (0,jsx_runtime.jsx)(_components.code, {
            children: "<rawBody>"
          })
        }), " is the exact bytes sent on the wire. The publisher uses the JSON it serialized; the subscriber reads from n8n's global ", (0,jsx_runtime.jsx)(_components.code, {
          children: "rawBodyReader"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "req.rawBody"
        }), ") when available, falling back to a zero-dep stream read, and finally to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "JSON.stringify(req.body)"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Replay protection"
        }), " — the subscriber rejects a request when the timestamp is older than ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SIGNATURE_TOLERANCE_MS"
        }), " (default ", (0,jsx_runtime.jsx)(_components.code, {
          children: "300000"
        }), " ms = 5 minutes) or in the future beyond a small skew. Because the timestamp is part of the signed message, replaying an old signed payload at a later time fails the freshness check."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Re-signing on retry"
        }), " — every delivery attempt (including retries inside ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sendSyncEvent"
        }), ") generates a fresh ", (0,jsx_runtime.jsx)(_components.code, {
          children: "<timestamp>.<rawBody>"
        }), " pair and re-signs it. A retried request never reuses a previous signature."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# publisher\nexport SYNC_AUTH_MODE=hmac\nexport SYNC_SHARED_SECRET=<32+-char-random-string>\n\n# subscriber — must be identical\nexport SYNC_AUTH_MODE=hmac\nexport SYNC_SHARED_SECRET=<32+-char-random-string>\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.h3, {
      id: "why-raw-bytes-matter",
      children: "Why raw bytes matter"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["A JSON body that round-trips through ", (0,jsx_runtime.jsx)(_components.code, {
        children: "JSON.parse(req.body)"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "JSON.stringify(...)"
      }), " is ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "not"
      }), " byte-identical to the original in general (key reordering, whitespace). HMAC over a re-serialized body would mismatch the publisher's signature. The subscriber therefore verifies against ", (0,jsx_runtime.jsx)(_components.code, {
        children: "req.rawBody"
      }), " as set by n8n's global middleware. See ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/body.ts"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/auth.ts"
      }), " for the implementation."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "token-mode",
      children: "Token mode"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Static shared-secret bearer. There is no signing, no replay protection, no timestamp. Use it only when the publisher → subscriber hop is over mTLS or another protected transport."
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# publisher\nexport SYNC_AUTH_MODE=token\nexport SYNC_SHARED_SECRET=<any-shared-string>\n\n# subscriber — must be identical\nexport SYNC_AUTH_MODE=token\nexport SYNC_SHARED_SECRET=<any-shared-string>\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The subscriber compares ", (0,jsx_runtime.jsx)(_components.code, {
        children: "x-sync-token"
      }), " against the shared secret using a constant-time equality to avoid timing side-channels."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "gotchas",
      children: "Gotchas"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Modes do not cross-accept."
        }), " A token-mode subscriber rejects hmac-signed requests, and an hmac-mode subscriber rejects token-bearing requests. Both sides must agree on ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_AUTH_MODE"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: [(0,jsx_runtime.jsx)(_components.code, {
            children: "SYNC_SHARED_SECRET"
          }), " is required"]
        }), " in both modes — it is the HMAC key in hmac mode and the bearer token in token mode."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "The subscriber still reads raw bytes in token mode."
        }), " The same body reader powers both paths; this is harmless in token mode and required for hmac mode."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — where authentication sits in the request pipeline."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment variables"
        }), " — ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_AUTH_MODE"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SHARED_SECRET"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SIGNATURE_TOLERANCE_MS"
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