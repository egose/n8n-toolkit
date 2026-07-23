"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["2405"], {
4777(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  metadata: () => (/* reexport */ site_docs_n_8_n_sync_sync_tag_filtering_mdx_60a_namespaceObject),
  "default": () => (/* binding */ MDXContent),
  frontMatter: () => (/* binding */ frontMatter),
  contentTitle: () => (/* binding */ contentTitle),
  toc: () => (/* binding */ toc),
  assets: () => (/* binding */ assets)
});

;// CONCATENATED MODULE: ./.docusaurus/docusaurus-plugin-content-docs/default/site-docs-n-8-n-sync-sync-tag-filtering-mdx-60a.json
var site_docs_n_8_n_sync_sync_tag_filtering_mdx_60a_namespaceObject = JSON.parse('{"id":"n8n-sync/sync/tag-filtering","title":"Tag-based Filtering","description":"Source-side opt-in: only the publisher inspects tags, the subscriber remains tag-agnostic.","source":"@site/docs/n8n-sync/sync/tag-filtering.mdx","sourceDirName":"n8n-sync/sync","slug":"/n8n-sync/sync/tag-filtering","permalink":"/n8n-sync/sync/tag-filtering","draft":false,"unlisted":false,"tags":[],"version":"current","sidebarPosition":4,"frontMatter":{"sidebar_label":"Tag-based Filtering","sidebar_position":4},"sidebar":"n8nSync","previous":{"title":"Environment Variables","permalink":"/n8n-sync/sync/environment"},"next":{"title":"Limitations","permalink":"/n8n-sync/sync/limitations"}}')
// EXTERNAL MODULE: ./node_modules/.pnpm/react@19.2.5/node_modules/react/jsx-runtime.js
var jsx_runtime = __webpack_require__(4934);
// EXTERNAL MODULE: ./node_modules/.pnpm/@mdx-js+react@3.1.1_@types+react@19.2.14_react@19.2.5/node_modules/@mdx-js/react/lib/index.js
var lib = __webpack_require__(1137);
;// CONCATENATED MODULE: ./docs/n8n-sync/sync/tag-filtering.mdx


const frontMatter = {
	sidebar_label: 'Tag-based Filtering',
	sidebar_position: 4
};
const contentTitle = 'Tag-based Filtering';

const assets = {

};



const toc = [{
  "value": "Behavior when <code>SYNC_FILTER_BY_TAG=true</code>",
  "id": "behavior-when-sync_filter_by_tagtrue",
  "level": 2
}, {
  "value": "When <code>SYNC_FILTER_BY_TAG=false</code> (default)",
  "id": "when-sync_filter_by_tagfalse-default",
  "level": 2
}, {
  "value": "Asymmetry",
  "id": "asymmetry",
  "level": 2
}, {
  "value": "Example setup",
  "id": "example-setup",
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
        id: "tag-based-filtering",
        children: "Tag-based Filtering"
      })
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Source-side opt-in: only the ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "publisher"
      }), " inspects tags, the subscriber remains tag-agnostic."]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Three env vars live in ", (0,jsx_runtime.jsx)(_components.code, {
        children: "src/shared/config.ts"
      }), ":"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.table, {
      children: [(0,jsx_runtime.jsx)(_components.thead, {
        children: (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.th, {
            children: "Env var"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Default"
          }), (0,jsx_runtime.jsx)(_components.th, {
            children: "Purpose"
          })]
        })
      }), (0,jsx_runtime.jsxs)(_components.tbody, {
        children: [(0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_FILTER_BY_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Master switch. When false (default), all workflows/credentials pass through unchanged with no tag inspection."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_WORKFLOW_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "sync"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: "Name of the tag a workflow must carry to be eligible for syncing."
          })]
        }), (0,jsx_runtime.jsxs)(_components.tr, {
          children: [(0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "SYNC_ACTIVE_TAG"
            })
          }), (0,jsx_runtime.jsx)(_components.td, {
            children: (0,jsx_runtime.jsx)(_components.code, {
              children: "active"
            })
          }), (0,jsx_runtime.jsxs)(_components.td, {
            children: ["When the sync tag is present, presence of this tag rewrites the DTO ", (0,jsx_runtime.jsx)(_components.code, {
              children: "active"
            }), " to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "true"
            }), "; absence rewrites to ", (0,jsx_runtime.jsx)(_components.code, {
              children: "false"
            }), "."]
          })]
        })]
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "behavior-when-sync_filter_by_tagtrue",
      children: ["Behavior when ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_FILTER_BY_TAG=true"
      })]
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Sync tag missing"
        }), " → the publisher emits ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.delete"
        }), " for that workflowId (so the target removes it) instead of ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.upsert"
        }), "/", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.activate"
        }), ". This applies to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.afterCreate"
        }), ", ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.afterUpdate"
        }), ", and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.activate"
        }), " hooks."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: ["Sync tag present, ", (0,jsx_runtime.jsx)(_components.code, {
            children: "active"
          }), " tag missing"]
        }), " → DTO ", (0,jsx_runtime.jsx)(_components.code, {
          children: "active"
        }), " is rewritten to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "false"
        }), "; the real source value is preserved in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "meta.active_real"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsxs)(_components.strong, {
          children: ["Sync tag present, ", (0,jsx_runtime.jsx)(_components.code, {
            children: "active"
          }), " tag present"]
        }), " → DTO ", (0,jsx_runtime.jsx)(_components.code, {
          children: "active"
        }), " is rewritten to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "true"
        }), "; the real source value is preserved in ", (0,jsx_runtime.jsx)(_components.code, {
          children: "meta.active_real"
        }), "."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Execution events"
        }), " (", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.postExecute"
        }), ") are also gated by the sync tag — events for workflows that lack the sync tag are dropped (no ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.delete"
        }), " is emitted for executions, the event is simply suppressed)."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.strong, {
          children: "Tag resolution"
        }), " — the publisher prefers inline ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflowData.tags"
        }), " from the hook payload; when n8n passes only a workflow id, it falls back to ", (0,jsx_runtime.jsx)(_components.code, {
          children: "dbCollections.Workflow.findOne({ where: { id }, relations: ['tags'] })"
        }), "."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.h2, {
      id: "when-sync_filter_by_tagfalse-default",
      children: ["When ", (0,jsx_runtime.jsx)(_components.code, {
        children: "SYNC_FILTER_BY_TAG=false"
      }), " (default)"]
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Workflows pass through unmodified, the ", (0,jsx_runtime.jsx)(_components.code, {
        children: "tags"
      }), " field is omitted from the DTO, no ", (0,jsx_runtime.jsx)(_components.code, {
        children: "meta.active_real"
      }), " is set, and no tag-resolution queries run. There is no overhead."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "asymmetry",
      children: "Asymmetry"
    }), "\n", (0,jsx_runtime.jsxs)(_components.p, {
      children: ["Tag filtering is a ", (0,jsx_runtime.jsx)(_components.strong, {
        children: "publisher-side rewrite"
      }), ", not a field that crosses the wire. The subscriber never sees or honors tag fields — it sees the post-rewrite DTO. Tagging a workflow on the source does not propagate the tag itself to the target. Preserve this asymmetry when modifying either side."]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "example-setup",
      children: "Example setup"
    }), "\n", (0,jsx_runtime.jsx)(_components.pre, {
      children: (0,jsx_runtime.jsx)(_components.code, {
        className: "language-bash",
        children: "# publisher\nexport SYNC_FILTER_BY_TAG=true\nexport SYNC_WORKFLOW_TAG=sync\nexport SYNC_ACTIVE_TAG=active\n"
      })
    }), "\n", (0,jsx_runtime.jsx)(_components.p, {
      children: "With this configuration:"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ol, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["A workflow tagged ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sync"
        }), " and ", (0,jsx_runtime.jsx)(_components.code, {
          children: "active"
        }), " → synced as active on the target."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["A workflow tagged ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sync"
        }), " but not ", (0,jsx_runtime.jsx)(_components.code, {
          children: "active"
        }), " → synced as inactive on the target. The DTO carries ", (0,jsx_runtime.jsx)(_components.code, {
          children: "meta.active_real"
        }), " so the real source value is recoverable."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: ["A workflow without the ", (0,jsx_runtime.jsx)(_components.code, {
          children: "sync"
        }), " tag → a ", (0,jsx_runtime.jsx)(_components.code, {
          children: "workflow.delete"
        }), " event is sent for that id on the target (no-op if the workflow does not exist there yet)."]
      }), "\n"]
    }), "\n", (0,jsx_runtime.jsx)(_components.h2, {
      id: "reference",
      children: "Reference"
    }), "\n", (0,jsx_runtime.jsxs)(_components.ul, {
      children: ["\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/architecture/",
          children: "Architecture"
        }), " — the publisher pipeline that consumes tags."]
      }), "\n", (0,jsx_runtime.jsxs)(_components.li, {
        children: [(0,jsx_runtime.jsx)(_components.a, {
          href: "/n8n-sync/sync/environment/",
          children: "Environment variables"
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
        }), " — the hooks at which tag resolution runs."]
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