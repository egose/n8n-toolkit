import { useEffect, useState, type ReactNode } from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

const highlights = [
  {
    title: 'Fully Typed',
    description:
      'Every handle, request payload, and response is typed. Filters autocomplete, return types stay explicit, and refactors fail fast instead of drifting quietly.',
  },
  {
    title: 'Automatic Retry',
    description:
      'Rate limits, timeouts, and 5xx responses retry with exponential backoff. Good defaults are built in, so scripts do not need their own resilience wrapper.',
  },
  {
    title: 'Zero Dependencies',
    description:
      'Built on Node.js 20+ native fetch. No axios, no node-fetch, and no runtime dependency pile to audit before shipping automation code.',
  },
];

const resourceGroups = [
  {
    label: 'Automation',
    items: ['workflows', 'executions', 'credentials', 'tags', 'variables'],
  },
  {
    label: 'Organization',
    items: ['projects', 'folders', 'users', 'data tables'],
  },
  {
    label: 'Operations',
    items: ['audit', 'insights', 'source control', 'community packages'],
  },
  {
    label: 'System',
    items: ['discover', 'n8n packages', 'import / export'],
  },
];

const proofPoints = [
  '15 resource handles covering the full n8n API surface',
  'Cursor-based pagination on every list endpoint',
  'API key or Bearer token auth — never both',
];

const gettingStartedSteps = [
  {
    title: 'Create the client',
    description: 'Point the client at your n8n base URL and authenticate with an API key or Bearer token.',
  },
  {
    title: 'Pick a handle',
    description:
      'Use resource-scoped handles like workflow, execution, credential, or project instead of hand-writing endpoint paths.',
  },
  {
    title: 'Ship scripts safely',
    description:
      'Lean on typed inputs, explicit outputs, and automatic retries for the parts of the API that fail transiently.',
  },
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

function Hero({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section
      className={`relative overflow-hidden border-b ${
        isDarkTheme
          ? 'border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.28),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(249,115,22,0.16),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_52%,_#111827_100%)]'
          : 'border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(249,115,22,0.14),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_52%,_#ffffff_100%)]'
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isDarkTheme
            ? 'bg-[linear-gradient(90deg,_rgba(2,6,23,0.78)_0%,_rgba(2,6,23,0.52)_38%,_rgba(2,6,23,0.16)_72%,_rgba(2,6,23,0.2)_100%)]'
            : 'bg-[linear-gradient(90deg,_rgba(248,250,252,0.9)_0%,_rgba(248,250,252,0.8)_38%,_rgba(255,255,255,0.42)_72%,_rgba(255,255,255,0.52)_100%)]'
        }`}
      />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div className="relative max-w-3xl">
          <div
            className={`rounded-[2rem] p-8 backdrop-blur-md lg:p-10 ${
              isDarkTheme
                ? 'border border-white/10 bg-slate-950/42 shadow-[0_24px_80px_rgba(2,6,23,0.45)]'
                : 'border border-white/80 bg-white/78 shadow-[0_24px_80px_rgba(148,163,184,0.2)]'
            }`}
          >
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                isDarkTheme
                  ? 'border border-blue-400/30 bg-blue-500/15 !text-blue-50 shadow-[0_0_0_1px_rgba(15,23,42,0.25)]'
                  : 'border border-blue-200 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(191,219,254,0.9)]'
              }`}
            >
              TypeScript client for the n8n Public API
            </div>
            <h1
              className={`mt-6 text-5xl font-black tracking-tight sm:text-6xl ${
                isDarkTheme
                  ? '!text-white drop-shadow-[0_2px_18px_rgba(2,6,23,0.85)]'
                  : 'text-slate-950 drop-shadow-[0_2px_18px_rgba(255,255,255,0.3)]'
              }`}
            >
              The n8n API, typed and ready to automate.
            </h1>
            <p
              className={`mt-6 max-w-2xl text-lg leading-8 ${
                isDarkTheme ? '!text-slate-100 drop-shadow-[0_1px_10px_rgba(2,6,23,0.7)]' : 'text-slate-700'
              }`}
            >
              Reach the n8n Public API through typed resource handles instead of handwritten HTTP calls. Build admin
              tooling, background jobs, CI integrations, and automation services with a client that stays close to the
              spec and out of your way.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold !text-white no-underline shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:bg-blue-700"
                to="/about/quick-start/"
              >
                Quick Start
              </Link>
              <Link
                className={`inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${
                  isDarkTheme
                    ? 'border border-slate-500 bg-slate-900/75 !text-slate-100 hover:border-slate-400 hover:bg-slate-800'
                    : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50'
                }`}
                to="/api/n8n-client/"
              >
                API Reference
              </Link>
              <Link
                className={`inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${
                  isDarkTheme
                    ? 'border border-orange-400/40 bg-orange-500/12 !text-orange-100 hover:bg-orange-500/20'
                    : 'border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
                to="/example/overview/"
              >
                Examples
              </Link>
            </div>
            <div
              className={`mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm ${isDarkTheme ? '!text-slate-300' : 'text-slate-600'}`}
            >
              <span>Workflows, executions, credentials</span>
              <span>Projects, folders, users</span>
              <span>15 resource handles, fully typed</span>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {proofPoints.map((item) => (
                <div
                  key={item}
                  className={`rounded-2xl p-4 text-sm shadow-sm backdrop-blur ${
                    isDarkTheme
                      ? 'border border-white/10 bg-slate-950/55 !text-slate-100'
                      : 'border border-slate-200 bg-white/70 text-slate-700'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          <div
            className={`absolute -inset-4 rounded-[2rem] blur-2xl ${
              isDarkTheme
                ? 'bg-gradient-to-br from-blue-500/20 via-transparent to-orange-400/20'
                : 'bg-gradient-to-br from-blue-300/30 via-white/10 to-orange-300/25'
            }`}
          />
          <div
            className={`relative overflow-hidden rounded-[1.75rem] border shadow-2xl ${
              isDarkTheme
                ? 'border-slate-700/80 bg-slate-950 shadow-blue-950/40'
                : 'border-slate-200 bg-white shadow-slate-300/35'
            }`}
          >
            <div
              className={`flex items-center justify-between border-b px-5 py-3 text-xs ${
                isDarkTheme ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span>example.ts</span>
            </div>
            <pre
              className={`m-0 overflow-x-auto p-5 text-[13px] leading-7 ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`}
            >
              <code>{codeSample}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

function Highlights({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="max-w-2xl">
        <p
          className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}
        >
          Why teams use it
        </p>
        <h2
          className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}
        >
          Why this client exists.
        </h2>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {highlights.map((item, index) => (
          <article
            key={item.title}
            className={`rounded-3xl border p-7 shadow-sm ${
              isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
            }`}
          >
            <div className={`text-sm font-semibold ${isDarkTheme ? 'text-orange-300' : 'text-orange-600'}`}>
              0{index + 1}
            </div>
            <h3 className={`mt-3 text-xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
              {item.title}
            </h3>
            <p className={`mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Coverage({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section
      className={`border-y ${isDarkTheme ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50/80'}`}
    >
      <div className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p
              className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}
            >
              Full API coverage
            </p>
            <h2
              className={`mt-3 text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}
            >
              Every n8n API v1 resource, typed.
            </h2>
            <p className={`mt-4 max-w-xl text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
              Workflows, executions, credentials, tags, variables, projects, folders, users, data tables, audit,
              insights, source control, community packages, discovery, and n8n packages — all covered.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {resourceGroups.map((group) => (
              <div
                key={group.label}
                className={`rounded-3xl border p-6 shadow-sm ${
                  isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                }`}
              >
                <h3
                  className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
                >
                  {group.label}
                </h3>
                <ul className={`mt-4 space-y-2 text-sm leading-6 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GettingStarted({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section className={`border-b ${isDarkTheme ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-18 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <div>
          <p
            className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-orange-300' : 'text-orange-700'}`}
          >
            Practical flow
          </p>
          <h2 className={`mt-3 text-3xl font-bold tracking-tight ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
            Get productive without memorizing endpoints.
          </h2>
          <p className={`mt-4 max-w-xl text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
            The docs are organized the same way the client is organized: start with the root client, move into resource
            handles, then use examples when you want complete flows instead of isolated methods.
          </p>
        </div>
        <div className="grid gap-4">
          {gettingStartedSteps.map((step, index) => (
            <article
              key={step.title}
              className={`rounded-3xl border p-6 shadow-sm ${
                isDarkTheme ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className={`text-sm font-semibold ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}>
                0{index + 1}
              </div>
              <h3 className={`mt-2 text-xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
                {step.title}
              </h3>
              <p className={`mt-2 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pathways({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Link
          className={`group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            isDarkTheme
              ? 'border-slate-800 bg-slate-900 hover:border-blue-700'
              : 'border-slate-200 bg-white hover:border-blue-300'
          }`}
          to="/about/quick-start/"
        >
          <div
            className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-blue-300' : 'text-blue-700'}`}
          >
            Start here
          </div>
          <h3 className={`mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
            Quick Start
          </h3>
          <p className={`mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
            Install the package, authenticate with an API key, and make your first API call in under a minute.
          </p>
        </Link>

        <Link
          className={`group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            isDarkTheme
              ? 'border-slate-800 bg-slate-900 hover:border-orange-700'
              : 'border-slate-200 bg-white hover:border-orange-300'
          }`}
          to="/api/n8n-client/"
        >
          <div
            className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-orange-300' : 'text-orange-700'}`}
          >
            Explore surface area
          </div>
          <h3 className={`mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
            API Reference
          </h3>
          <p className={`mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
            Browse all 15 resource handles — from workflows and executions to data tables and community packages.
          </p>
        </Link>

        <Link
          className={`group rounded-3xl border p-7 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            isDarkTheme
              ? 'border-slate-800 bg-slate-900 hover:border-emerald-700'
              : 'border-slate-200 bg-white hover:border-emerald-300'
          }`}
          to="/example/overview/"
        >
          <div
            className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDarkTheme ? 'text-emerald-300' : 'text-emerald-700'}`}
          >
            See the flow
          </div>
          <h3 className={`mt-3 text-2xl font-semibold ${isDarkTheme ? 'text-slate-50' : 'text-slate-950'}`}>
            Examples
          </h3>
          <p className={`mt-3 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
            End-to-end walkthroughs covering workflows, credentials, projects, and common automation patterns.
          </p>
        </Link>
      </div>
    </section>
  );
}

function ClosingCta({ isDarkTheme }: { isDarkTheme: boolean }): ReactNode {
  return (
    <section className="px-6 pb-20 lg:px-8">
      <div
        className={`mx-auto max-w-7xl overflow-hidden rounded-[2rem] border px-8 py-12 shadow-2xl ${
          isDarkTheme
            ? 'border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white'
            : 'border-slate-200 bg-gradient-to-br from-blue-50 via-white to-orange-50 text-slate-950 shadow-slate-300/30'
        }`}
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p
              className={`text-sm font-semibold uppercase tracking-[0.24em] ${isDarkTheme ? 'text-blue-200' : 'text-blue-700'}`}
            >
              Typed automation
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Start building with the n8n API today.
            </h2>
            <p className={`mt-4 text-base leading-7 ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
              Install the package, authenticate, and call any n8n endpoint with full type safety. Drop down to the HTTP
              client when you need to — the typed surface stays out of your way.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className={`inline-flex items-center rounded-lg px-5 py-3 text-sm font-semibold no-underline transition ${
                isDarkTheme
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-950 text-white hover:bg-slate-800'
              }`}
              to="/about/philosophy/"
            >
              Read Philosophy
            </Link>
            <Link
              className={`inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold no-underline transition ${
                isDarkTheme
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-slate-300 text-slate-900 hover:bg-white/70'
              }`}
              to="https://github.com/egose/n8n-client"
            >
              GitHub Repository
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.getAttribute('data-theme') === 'dark');

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  return (
    <Layout
      title={siteConfig.title}
      description="A typed TypeScript client for the n8n Public API. Manage workflows, executions, credentials, and projects with native fetch, zero dependencies."
    >
      <main className={isDarkTheme ? 'bg-slate-950' : 'bg-white'}>
        <Hero isDarkTheme={isDarkTheme} />
        <Highlights isDarkTheme={isDarkTheme} />
        <Coverage isDarkTheme={isDarkTheme} />
        <GettingStarted isDarkTheme={isDarkTheme} />
        <Pathways isDarkTheme={isDarkTheme} />
        <ClosingCta isDarkTheme={isDarkTheme} />
      </main>
    </Layout>
  );
}
