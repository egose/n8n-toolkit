"use strict";
(self["webpackChunkwebsite"] = self["webpackChunkwebsite"] || []).push([["452"], {
5146(__unused_rspack_module, __webpack_exports__, __webpack_require__) {
__webpack_require__.r(__webpack_exports__);
__webpack_require__.d(__webpack_exports__, {
  "default": () => (Home)
});
/* import */ var react_jsx_runtime__rspack_import_0 = __webpack_require__(4934);
/* import */ var react__rspack_import_1 = __webpack_require__(2086);
/* import */ var _docusaurus_Link__rspack_import_2 = __webpack_require__(1041);
/* import */ var _docusaurus_useDocusaurusContext__rspack_import_3 = __webpack_require__(1645);
/* import */ var _theme_Layout__rspack_import_4 = __webpack_require__(3102);





const highlights = [
    {
        title: 'Fully Typed',
        description: 'Every handle, request payload, and response is typed. Filters autocomplete, return types stay explicit, and refactors fail fast instead of drifting quietly.'
    },
    {
        title: 'Automatic Retry',
        description: 'Rate limits, timeouts, and 5xx responses retry with exponential backoff. Good defaults are built in, so scripts do not need their own resilience wrapper.'
    },
    {
        title: 'Zero Dependencies',
        description: 'Built on Node.js 20+ native fetch. No axios, no node-fetch, and no runtime dependency pile to audit before shipping automation code.'
    }
];
const resourceGroups = [
    {
        label: 'Automation',
        items: [
            'workflows',
            'executions',
            'credentials',
            'tags',
            'variables'
        ]
    },
    {
        label: 'Organization',
        items: [
            'projects',
            'folders',
            'users',
            'data tables'
        ]
    },
    {
        label: 'Operations',
        items: [
            'audit',
            'insights',
            'source control',
            'community packages'
        ]
    },
    {
        label: 'System',
        items: [
            'discover',
            'n8n packages',
            'import / export'
        ]
    }
];
const proofPoints = [
    '15 resource handles covering the full n8n API surface',
    'Cursor-based pagination on every list endpoint',
    'API key or Bearer token auth — never both'
];
const gettingStartedSteps = [
    {
        title: 'Create the client',
        description: 'Point the client at your n8n base URL and authenticate with an API key or Bearer token.'
    },
    {
        title: 'Pick a handle',
        description: 'Use resource-scoped handles like workflow, execution, credential, or project instead of hand-writing endpoint paths.'
    },
    {
        title: 'Ship scripts safely',
        description: 'Lean on typed inputs, explicit outputs, and automatic retries for the parts of the API that fail transiently.'
    }
];
const codeSample = `import N8nClient from '@egose/n8n-client';

const client = new N8nClient({
  baseUrl: 'http://localhost:5678',
  apiKey: process.env.N8N_API_KEY,
});

// List active workflows
const { data } = await client.workflow().list({
  active: true,
  limit: 10,
});

// Get a workflow and inspect its nodes
const wf = await client.workflow().get('wf-123');
console.log(wf.nodes.length, 'nodes');

// Create a credential
await client.credential().create({
  name: 'Slack Bot Token',
  type: 'slackApi',
  data: { accessToken: 'xoxb-...' },
});

// Find error executions
const { data: errors } = await client.execution().list({
  status: 'error',
  workflowId: 'wf-123',
});

// Stop a stuck execution
await client.execution().stop(errors[0].id);`;
function Hero({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("section", {
        className: `relative overflow-hidden border-b ${isDarkTheme ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(249,115,22,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_52%,_#111827_100%)]' : 'border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(249,115,22,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_52%,_#ffffff_100%)]'}`,
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                className: `absolute inset-0 ${isDarkTheme ? 'bg-[linear-gradient(90deg,_rgba(2,6,23,0.78)_0%,_rgba(2,6,23,0.52)_38%,_rgba(2,6,23,0.16)_72%,_rgba(2,6,23,0.2)_100%)]' : 'bg-[linear-gradient(90deg,_rgba(248,250,252,0.9)_0%,_rgba(248,250,252,0.8)_38%,_rgba(255,255,255,0.42)_72%,_rgba(255,255,255,0.52)_100%)]'}`
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                        className: "relative max-w-3xl",
                        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                            className: `rounded-[2rem] p-8 backdrop-blur-md lg:p-10 ${isDarkTheme ? 'border border-white/10 bg-slate-950/42 shadow-[0_24px_80px_rgba(2,6,23,0.45)]' : 'border border-white/80 bg-white/78 shadow-[0_24px_80px_rgba(148,163,184,0.2)]'}`,
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                    className: `inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${isDarkTheme ? 'border border-blue-400/30 bg-blue-500/15 !text-blue-50 shadow-[0_0_0_1px_rgba(15,23,42,0.25)]' : 'border border-blue-200 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(191,219,254,0.9)]'}`,
                                    children: "TypeScript client for the n8n Public API"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h1", {
                                    className: `mt-6 text-5xl font-black tracking-tight sm:text-6xl ${isDarkTheme ? '!text-white drop-shadow-[0_2px_18px_rgba(2,6,23,0.85)]' : 'text-slate-950 drop-shadow-[0_2px_18px_rgba(255,255,255,0.3)]'}`,
                                    children: "The n8n API, typed and ready to automate."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                    className: `mt-6 max-w-2xl text-lg leading-8 ${isDarkTheme ? '!text-slate-100 drop-shadow-[0_1px_10px_rgba(2,6,23,0.7)]' : 'text-slate-700'}`,
                                    children: "Reach the n8n Public API through typed resource handles instead of handwritten HTTP calls. Build admin tooling, background jobs, CI integrations, and automation services with a client that stays close to the spec and out of your way."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: "mt-8 flex flex-wrap gap-3",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                                            className: "inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold !text-white no-underline shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-700",
                                            to: "/about/quick-start/",
                                            children: "Quick Start"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                                            className: `inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${isDarkTheme ? 'border border-slate-500 bg-slate-900/75 !text-slate-100 hover:border-slate-400 hover:bg-slate-800' : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'}`,
                                            to: "/api/n8n-client/",
                                            children: "API Reference"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                                            className: `inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${isDarkTheme ? 'border border-orange-400/40 bg-orange-500/12 !text-orange-100 hover:bg-orange-500/20' : 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'}`,
                                            to: "/example/overview/",
                                            children: "Examples"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: `mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm ${isDarkTheme ? '!text-slate-300' : 'text-slate-600'}`,
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            children: "Workflows, executions, credentials"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            children: "Projects, folders, users"
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                            children: "15 resource handles, fully typed"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                    className: "mt-10 grid gap-4 sm:grid-cols-3",
                                    children: proofPoints.map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                            className: `rounded-2xl p-4 text-sm shadow-sm backdrop-blur ${isDarkTheme ? 'border border-white/10 bg-slate-950/55 !text-slate-100' : 'border border-slate-200 bg-white/70 text-slate-700'}`,
                                            children: item
                                        }, item))
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                                className: `absolute -inset-4 rounded-[2rem] blur-2xl ${isDarkTheme ? 'bg-gradient-to-br from-blue-500/20 via-transparent to-orange-400/20' : 'bg-gradient-to-br from-blue-300/30 via-white/10 to-orange-300/25'}`
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                className: `relative overflow-hidden rounded-[1.75rem] border shadow-2xl ${isDarkTheme ? 'border-slate-700/80 bg-slate-950 shadow-blue-950/40' : 'border-slate-200 bg-white shadow-slate-300/35'}`,
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                        className: `flex items-center justify-between border-b px-5 py-3 text-xs ${isDarkTheme ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`,
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                        className: "h-2.5 w-2.5 rounded-full bg-rose-400"
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                        className: "h-2.5 w-2.5 rounded-full bg-amber-400"
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                        className: "h-2.5 w-2.5 rounded-full bg-emerald-400"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                children: "example.ts"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("pre", {
                                        className: `m-0 overflow-x-auto p-5 text-[13px] leading-7 ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`,
                                        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("code", {
                                            children: codeSample
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
function Highlights({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("section", {
        className: "mx-auto max-w-7xl px-6 py-18 lg:px-8",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "max-w-2xl",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                        className: `text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`,
                        children: "Why teams use it"
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
                        className: `mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                        children: "Why this client exists."
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                className: "mt-10 grid gap-6 lg:grid-cols-3",
                children: highlights.map((item, index)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("article", {
                        className: `rounded-3xl border p-7 shadow-sm ${isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`,
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                className: `text-sm font-semibold ${isDarkTheme ? 'text-orange-300' : 'text-orange-600'}`,
                                children: [
                                    "0",
                                    index + 1
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                                className: `mt-3 text-xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                                children: item.title
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                className: `mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                                children: item.description
                            })
                        ]
                    }, item.title))
            })
        ]
    });
}
function Coverage({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: `border-y ${isDarkTheme ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'}`,
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
            className: "mx-auto max-w-7xl px-6 py-18 lg:px-8",
            children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                className: `text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`,
                                children: "Full API coverage"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
                                className: `mt-3 text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                                children: "Every n8n API v1 resource, typed."
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                className: `mt-4 max-w-xl text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                                children: "Workflows, executions, credentials, tags, variables, projects, folders, users, data tables, audit, insights, source control, community packages, discovery, and n8n packages — all covered."
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                        className: "grid gap-4 sm:grid-cols-2",
                        children: resourceGroups.map((group)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                className: `rounded-3xl border p-6 shadow-sm ${isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`,
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                                        className: `text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`,
                                        children: group.label
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("ul", {
                                        className: `mt-4 space-y-2 text-sm leading-6 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`,
                                        children: group.items.map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("li", {
                                                className: "flex items-start gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                        className: "mt-2 h-2 w-2 rounded-full bg-blue-500"
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("span", {
                                                        children: item
                                                    })
                                                ]
                                            }, item))
                                    })
                                ]
                            }, group.label))
                    })
                ]
            })
        })
    });
}
function GettingStarted({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: `border-b ${isDarkTheme ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`,
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "mx-auto grid max-w-7xl gap-10 px-6 py-18 lg:grid-cols-[0.92fr_1.08fr] lg:px-8",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                            className: `text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-orange-300' : 'text-orange-700'}`,
                            children: "Practical flow"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
                            className: `mt-3 text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                            children: "Get productive without memorizing endpoints."
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                            className: `mt-4 max-w-xl text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                            children: "The docs are organized the same way the client is organized: start with the root client, move into resource handles, then use examples when you want complete flows instead of isolated methods."
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                    className: "grid gap-4",
                    children: gettingStartedSteps.map((step, index)=>/*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("article", {
                            className: `rounded-3xl border p-6 shadow-sm ${isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`,
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                                    className: `text-sm font-semibold ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`,
                                    children: [
                                        "0",
                                        index + 1
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                                    className: `mt-2 text-xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                                    children: step.title
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                    className: `mt-2 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                                    children: step.description
                                })
                            ]
                        }, step.title))
                })
            ]
        })
    });
}
function Pathways({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "mx-auto max-w-7xl px-6 py-18 lg:px-8",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
            className: "grid gap-6 lg:grid-cols-3",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                    className: `group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-slate-800 bg-slate-900 hover:border-blue-700' : 'border-slate-200 bg-white hover:border-blue-300'}`,
                    to: "/about/quick-start/",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                            className: `text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`,
                            children: "Start here"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                            className: `mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                            children: "Quick Start"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                            className: `mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                            children: "Install the package, authenticate with an API key, and make your first API call in under a minute."
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                    className: `group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-slate-800 bg-slate-900 hover:border-orange-700' : 'border-slate-200 bg-white hover:border-orange-300'}`,
                    to: "/api/n8n-client/",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                            className: `text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-orange-300' : 'text-orange-700'}`,
                            children: "Explore surface area"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                            className: `mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                            children: "API Reference"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                            className: `mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                            children: "Browse all 15 resource handles — from workflows and executions to data tables and community packages."
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                    className: `group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isDarkTheme ? 'border-slate-800 bg-slate-900 hover:border-emerald-700' : 'border-slate-200 bg-white hover:border-emerald-300'}`,
                    to: "/example/overview/",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
                            className: `text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`,
                            children: "See the flow"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h3", {
                            className: `mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`,
                            children: "Examples"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                            className: `mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`,
                            children: "End-to-end walkthroughs covering workflows, credentials, projects, and common automation patterns."
                        })
                    ]
                })
            ]
        })
    });
}
function ClosingCta({ isDarkTheme }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("section", {
        className: "px-6 pb-20 lg:px-8",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("div", {
            className: `mx-auto max-w-7xl overflow-hidden rounded-[2rem] border px-8 py-12 shadow-2xl ${isDarkTheme ? 'border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white' : 'border-slate-200 bg-gradient-to-br from-blue-50 via-white to-orange-50 text-slate-950 shadow-slate-300/30'}`,
            children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                className: "grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        className: "max-w-3xl",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                className: `text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-200' : 'text-blue-700'}`,
                                children: "Typed automation"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("h2", {
                                className: "mt-3 text-3xl font-bold tracking-tight sm:text-4xl",
                                children: "Start building with the n8n API today."
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)("p", {
                                className: `mt-4 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`,
                                children: "Install the package, authenticate, and call any n8n endpoint with full type safety. Drop down to the HTTP client when you need to — the typed surface stays out of your way."
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("div", {
                        className: "flex flex-wrap gap-3",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                                className: `inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${isDarkTheme ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-slate-950 text-white hover:bg-slate-800'}`,
                                to: "/about/philosophy/",
                                children: "Read Philosophy"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_docusaurus_Link__rspack_import_2/* ["default"] */.A, {
                                className: `inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold no-underline transition ${isDarkTheme ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-900 hover:bg-white/70'}`,
                                to: "https://github.com/egose/n8n-client",
                                children: "GitHub Repository"
                            })
                        ]
                    })
                ]
            })
        })
    });
}
function Home() {
    const { siteConfig } = (0,_docusaurus_useDocusaurusContext__rspack_import_3/* ["default"] */.A)();
    const [isDarkTheme, setIsDarkTheme] = (0,react__rspack_import_1.useState)(false);
    (0,react__rspack_import_1.useEffect)(()=>{
        const root = document.documentElement;
        const syncTheme = ()=>setIsDarkTheme(root.getAttribute('data-theme') === 'dark');
        syncTheme();
        const observer = new MutationObserver(syncTheme);
        observer.observe(root, {
            attributes: true,
            attributeFilter: [
                'data-theme'
            ]
        });
        return ()=>observer.disconnect();
    }, []);
    return /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(_theme_Layout__rspack_import_4/* ["default"] */.A, {
        title: siteConfig.title,
        description: "A typed TypeScript client for the n8n Public API. Manage workflows, executions, credentials, and projects with native fetch, zero dependencies.",
        children: /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsxs)("main", {
            className: isDarkTheme ? 'bg-slate-950' : 'bg-white',
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Hero, {
                    isDarkTheme: isDarkTheme
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Highlights, {
                    isDarkTheme: isDarkTheme
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Coverage, {
                    isDarkTheme: isDarkTheme
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(GettingStarted, {
                    isDarkTheme: isDarkTheme
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(Pathways, {
                    isDarkTheme: isDarkTheme
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__rspack_import_0.jsx)(ClosingCta, {
                    isDarkTheme: isDarkTheme
                })
            ]
        })
    });
}


},

}]);