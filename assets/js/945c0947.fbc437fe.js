"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["2683"], {
2472(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_about_quick_start_mdx_945_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-about-quick-start-mdx-945.json
var site_docs_n_8_n_sync_about_quick_start_mdx_945_namespaceObject = JSON.parse('{"id":"n8n-sync/about/quick-start","title":"Quick Start","description":"n8n-sync is a deployment-style package: you build two CommonJS hook bundles, copy them to your n8n instances, and point n8n at the right file with EXTERNALHOOKFILES. There is no npm install step at runtime — the bundles are fully self-contained.","source":"@site/docs/n8n-sync/about/quick-start.mdx","sourceDirName":"n8n-sync/about","slug":"/n8n-sync/about/quick-start","permalink":"/n8n-sync/about/quick-start","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_label":"Quick Start","sidebar_position":1},"sidebar":"n8nSync","previous":{"title":"Overview","permalink":"/n8n-sync/about/overview"},"next":{"title":"Reference","permalink":"/n8n-sync/sync"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/about/quick-start.mdx


const frontMatter = {
	sidebar_label: 'Quick Start',
	sidebar_position: 1
};
const contentTitle = 'Quick Start';

const assets = {

};



const toc = [{
  "value": "1. Build the bundles",
  "id": "1-build-the-bundles",
  "level": 2
}, {
  "value": "2. Copy the bundles to your instances",
  "id": "2-copy-the-bundles-to-your-instances",
  "level": 2
}, {
  "value": "3. Configure the source instance (publisher)",
  "id": "3-configure-the-source-instance-publisher",
  "level": 2
}, {
  "value": "4. Configure each target instance (subscriber)",
  "id": "4-configure-each-target-instance-subscriber",
  "level": 2
}, {
  "value": "5. Verify",
  "id": "5-verify",
  "level": 2
}, {
  "value": "Next steps",
  "id": "next-steps",
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
    ul: "ul",
    ...(0,lib/* .useMDXComponents */.R)(),
    ...props.components
  };
  return (0,jsx_runtime.jsxs)(jsx_runtime.Fragment, {
    children: [(0,jsx_runtime.jsx)(_components.header, {
      children: (0,jsx_runtime.jsx)(_components.h1, {
        id: "quick-start",
        children: "Quick Start"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: [(0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " is a deployment-style package: you build two CommonJS hook bundles, copy them to your n8n instances, and point n8n at the right file with ", (0,jsx_runtime.jsx)(_components.code, {
        children: "EXTERNAL_HOOK_FILES"
      }), ". There is no ", (0,jsx_runtime.jsx)(_components.code, {
        children: "npm install"
      }), " step at runtime — the bundles are fully self-contained."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "1-build-the-bundles",
      children: "1. Build the bundles"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "From the monorepo root:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "pnpm --filter @egose/n8n-sync build\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["This produces ", (0,jsx_runtime.jsx)(_components.code, {
        children: "packages/n8n-sync/dist/publisher.cjs"
      }), " and ", (0,jsx_runtime.jsx)(_components.code, {
        children: "packages/n8n-sync/dist/subscriber.cjs"
      }), " via ", (0,jsx_runtime.jsx)(_components.code, {
        children: "tsup"
      }), ". Each bundle is a single self-contained CJS file with no runtime dependencies."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "2-copy-the-bundles-to-your-instances",
      children: "2. Copy the bundles to your instances"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# on the source instance\nscp packages/n8n-sync/dist/publisher.cjs  source-host:/opt/n8n-sync/publisher.cjs\n\n# on each target instance\nscp packages/n8n-sync/dist/subscriber.cjs target-host:/opt/n8n-sync/subscriber.cjs\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["The exact path is up to you — ", (0,jsx_runtime.jsx)(_components.code, {
        children: "n8n-sync"
      }), " does not care where the bundles live as long as ", (0,jsx_runtime.jsx)(_components.code, {
        children: "EXTERNAL_HOOK_FILES"
      }), " points at them."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "3-configure-the-source-instance-publisher",
      children: "3. Configure the source instance (publisher)"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "export EXTERNAL_HOOK_FILES=/opt/n8n-sync/publisher.cjs\nexport SYNC_SUBSCRIBER_URLS=https://n8n-target-a.example.com,https://n8n-target-b.example.com\nexport SYNC_SHARED_SECRET=<shared-secret>\n# optional:\nexport SYNC_AUTH_MODE=hmac     # default; or \"token\" for static bearer\nexport SYNC_SOURCE_ID=$(hostname)\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Restart n8n on the source. From this point on, every workflow/credential lifecycle hook fans an event out to every subscriber over HTTPS."
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "4-configure-each-target-instance-subscriber",
      children: "4. Configure each target instance (subscriber)"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "export EXTERNAL_HOOK_FILES=/opt/n8n-sync/subscriber.cjs\nexport SYNC_SHARED_SECRET=<shared-secret>\n# optional:\nexport SYNC_AUTH_MODE=hmac    # must match the publisher\nexport SYNC_TARGET_PROJECT_ID=<project-id>   # link synced entities to this project\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Restart n8n on the target. On startup the subscriber logs:"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        children: "info: n8n-sync subscriber routes active. {\"module\":\"subscriber\"}\n"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["and serves an unauthenticated health probe at ", (0,jsx_runtime.jsx)(_components.code, {
        children: "GET /rest/sync/v1/health"
      }), "."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "5-verify",
      children: "5. Verify"
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "Create or update a workflow on the source. Within seconds the same workflow should appear on the target under the same id."
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["The publisher writes structured JSON logs (", (0,jsx_runtime.jsx)(_components.code, {
          children: "SYNC_SOURCE_ID"
        }), ", target URL, event id, attempt count) for every delivery."]
      }), "\n", (0,jsx_runtime.jsx)(_components.li, {
        children: "The subscriber writes structured logs for every applied event (upsert / delete / archive, with the source id and target project assignment)."
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["Set ", (0,jsx_runtime.jsx)(_components.code, {
          children: "LOG_LEVEL=debug"
        }), " on either side to see hook payloads, raw-body bytes, and HMAC computations."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "next-steps",
      children: "Next steps"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — how events flow and how the subscriber applies them."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/authentication/",
          children: "Authentication"
        }), " — when to use HMAC vs. bearer token."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment Variables"
        }), " — every tunable knob."]
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