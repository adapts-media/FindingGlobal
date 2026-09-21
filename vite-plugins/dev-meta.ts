// Dev-only convenience: makes "View Source" on the Vite dev server show the same content
// you'd see in DevTools > Elements after React renders — both the title/description/robots/
// canonical tags, and now the actual page body — instead of the bare pre-JS shell.
//
// Why this exists: this app is a plain client-rendered SPA (see src/main.tsx —
// ReactDOM.createRoot(...).render(...), not hydrateRoot), so the server never renders
// anything route-specific on its own. In dev, index.html ships with no title/meta at all (see
// index.html's comment for why) and no body content either — both only exist once React
// mounts client-side. View Source always shows the pre-JS response, so both are normally
// missing in dev. This plugin backfills both for developer convenience, without changing
// production behavior at all (see `apply: "serve"` below — it never runs during `vite build`,
// so the real production prerender/on-demand-SEO pipeline in scripts/prerender.js and
// server/src/lib/seo.js is untouched).
//
// How the head tags work: for a request whose path matches a known route, it loads that
// route's actual module (via Vite's ssrLoadModule, so we're calling the *real* loader()/
// head() from the route file itself — no separate copy of titles/descriptions to keep in
// sync) and injects the resulting tags into the HTML response, each marked `data-dev-meta`.
//
// Why that marker matters: once React mounts, TanStack Router's <HeadContent /> adds its own
// title/meta/canonical for the same route — and React 19's built-in title/meta hoisting only
// dedupes tags *it* renders; it has no idea these server-injected ones exist. Left alone,
// that's the "two <title> tags" bug this project already fixed once, just relocated to dev
// mode. So src/routes/__root.tsx removes every `data-dev-meta` element in a dev-only effect
// right after the real ones land. View Source (which only ever reflects the initial server
// response, never later DOM mutations) still shows them; the live page you interact with does
// not carry a duplicate.
//
// How the body works: it launches one headless Chrome instance (via puppeteer, already a
// devDependency for scripts/prerender.js) and keeps it alive for the life of the dev server.
// For each matching real page load, it has that browser navigate to this *same* dev server
// and wait for the route to render — essentially running scripts/prerender.js's approach live,
// per request, tagging its own request with a marker query param so this plugin recognizes it
// and skips re-triggering itself (no meta injection, no second render — just serve the plain
// shell straight through, which is all that inner request needs). The rendered #root markup
// it captures gets spliced into the *outer* response before it reaches the real browser.
// This adds a real headless-render's worth of latency (typically a second or more) to every
// full page load/reload in dev, and reflects a snapshot rather than staying live — that's an
// accepted, known trade-off for getting real content into View Source during development.
import path from "node:path";
import type { Browser } from "puppeteer";
import type { HtmlTagDescriptor, Plugin, ViteDevServer } from "vite";

interface RouteMatch {
  file: string;
  params: Record<string, string>;
}

// Order matters: dynamic patterns are checked after static ones, and more specific dynamic
// patterns before less specific ones.
const ROUTES: Array<{ pattern: RegExp; file: string; paramNames?: string[] }> = [
  { pattern: /^\/$/, file: "index.tsx" },
  { pattern: /^\/about\/?$/, file: "about.tsx" },
  { pattern: /^\/contact\/?$/, file: "contact.tsx" },
  { pattern: /^\/for-agencies\/?$/, file: "for-agencies.tsx" },
  { pattern: /^\/enterprise\/?$/, file: "enterprise.tsx" },
  { pattern: /^\/submit-project\/?$/, file: "submit-project.tsx" },
  { pattern: /^\/portfolio\/?$/, file: "portfolio.tsx" },
  { pattern: /^\/blog\/?$/, file: "blog.tsx" },
  { pattern: /^\/login\/?$/, file: "login.tsx" },
  { pattern: /^\/upgrade\/?$/, file: "upgrade.tsx" },
  { pattern: /^\/confirm-service\/?$/, file: "confirm-service.tsx" },
  { pattern: /^\/payment-success\/?$/, file: "payment-success.tsx" },
  { pattern: /^\/dashboard\/?$/, file: "dashboard.tsx" },
  { pattern: /^\/admin\/?$/, file: "admin.tsx" },
  { pattern: /^\/agency-dashboard\/?$/, file: "agency-dashboard.tsx" },
  { pattern: /^\/agency-inbox\/?$/, file: "agency-inbox.tsx" },
  { pattern: /^\/agency-onboarding\/?$/, file: "agency-onboarding.tsx" },
  {
    pattern: /^\/portfolio\/([^/]+)\/([^/]+)\/?$/,
    file: "portfolio_.$agencySlug.$itemSlug.tsx",
    paramNames: ["agencySlug", "itemSlug"],
  },
  { pattern: /^\/blog\/([^/]+)\/?$/, file: "blog_.$slug.tsx", paramNames: ["slug"] },
  { pattern: /^\/agencies\/([^/]+)\/?$/, file: "agencies.$slug.tsx", paramNames: ["slug"] },
  { pattern: /^\/agencies\/?$/, file: "agencies.index.tsx" },
];

function matchRoute(url: string): RouteMatch | null {
  const cleanUrl = url.split("?")[0];
  for (const route of ROUTES) {
    const m = cleanUrl.match(route.pattern);
    if (!m) continue;
    const params: Record<string, string> = {};
    route.paramNames?.forEach((name, i) => {
      params[name] = decodeURIComponent(m[i + 1]);
    });
    return { file: route.file, params };
  }
  return null;
}

type HeadMeta = { title?: string; name?: string; property?: string; content?: string }[];
type HeadResult = { meta?: HeadMeta; links?: { rel?: string; href?: string }[] } | undefined;

// Mirrors TanStack Router's own head-merging (buildTagsFromMatches in headContentUtils.js):
// later entries win for title, and per-attribute (name/property) first-seen-from-the-end wins.
// Here we only ever merge two layers (root, then leaf), leaf last so leaf wins.
function mergeHeads(...heads: HeadResult[]) {
  let title: string | undefined;
  const byAttr = new Map<string, string>();
  let canonical: string | undefined;

  for (const head of heads) {
    for (const m of head?.meta ?? []) {
      if (m.title) title = m.title;
      else if (m.name && m.content) byAttr.set(m.name, m.content);
      else if (m.property && m.content) byAttr.set(m.property, m.content);
    }
    for (const l of head?.links ?? []) {
      if (l.rel === "canonical" && l.href) canonical = l.href;
    }
  }

  return { title, description: byAttr.get("description"), robots: byAttr.get("robots"), canonical };
}

async function loadRouteHead(
  server: ViteDevServer,
  routesDir: string,
  file: string,
  params: Record<string, string>
): Promise<HeadResult> {
  const mod = await server.ssrLoadModule(path.join(routesDir, file));
  const route = mod.Route;
  if (!route?.options) return undefined;

  let loaderData: unknown;
  if (route.options.loader) {
    try {
      loaderData = await route.options.loader({ params });
    } catch {
      // Loader threw (redirect/notFound/network error) — fall back to whatever a route
      // without loaderData would render; not worth failing the whole page load over.
      loaderData = undefined;
    }
  }

  try {
    return route.options.head?.({ loaderData, params });
  } catch {
    return undefined;
  }
}

// Query param that marks a request as this plugin's own internal Puppeteer navigation, so it
// knows not to recurse into rendering itself again — that inner request just needs the plain
// shell, fast, with no injection of any kind.
const INTERNAL_PARAM = "__devMetaInternal";

let browserPromise: Promise<Browser> | null = null;
async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const { default: puppeteer } = await import("puppeteer");
    browserPromise = puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  }
  return browserPromise;
}

// Renders `urlPath` (this same dev server, so relative fetches/assets all resolve normally)
// in a real headless browser and returns the #root element's rendered innerHTML, or null if
// anything about that failed or timed out — callers fall back to the plain shell either way.
async function renderRootHtml(devServerOrigin: string, urlPath: string): Promise<string | null> {
  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    const sep = urlPath.includes("?") ? "&" : "?";
    const targetUrl = `${devServerOrigin}${urlPath}${sep}${INTERNAL_PARAM}=1`;
    await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 8000 });
    await page.waitForSelector("#root > *", { timeout: 4000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 300));
    return await page.evaluate(() => document.getElementById("root")?.innerHTML ?? null);
  } catch (err) {
    console.warn("[dev-meta] Body prerender failed, serving the plain shell instead:", (err as Error).message);
    return null;
  } finally {
    await page?.close().catch(() => {});
  }
}

export function devMetaPlugin(): Plugin {
  const routesDir = path.resolve(process.cwd(), "src/routes");

  return {
    name: "dev-meta-inject",
    apply: "serve", // dev only — never runs during `vite build`
    configureServer(server) {
      // Release the headless browser when the dev server stops, rather than leaking a
      // detached Chrome process every time `vite dev` restarts.
      server.httpServer?.on("close", () => {
        browserPromise?.then((b) => b.close()).catch(() => {});
        browserPromise = null;
      });
    },
    async transformIndexHtml(html, ctx) {
      if (!ctx.server) return html;
      // ctx.path is the served file's own path (always "/index.html" for this SPA's
      // fallback), not the URL the browser actually requested — use originalUrl for that.
      const requestUrl = ctx.originalUrl ?? ctx.path;
      const urlObj = new URL(requestUrl, "http://internal");
      if (urlObj.searchParams.has(INTERNAL_PARAM)) return html; // our own inner request — plain shell, no recursion

      const match = matchRoute(requestUrl);
      if (!match) return html;

      const [rootHead, leafHead] = await Promise.all([
        loadRouteHead(ctx.server, routesDir, "__root.tsx", {}),
        loadRouteHead(ctx.server, routesDir, match.file, match.params),
      ]);
      const merged = mergeHeads(rootHead, leafHead);

      const tags: HtmlTagDescriptor[] = [];
      if (merged.title) {
        tags.push({ tag: "title", attrs: { "data-dev-meta": "" }, children: merged.title, injectTo: "head" });
      }
      if (merged.description) {
        tags.push({
          tag: "meta",
          attrs: { name: "description", content: merged.description, "data-dev-meta": "" },
          injectTo: "head",
        });
      }
      if (merged.robots) {
        tags.push({
          tag: "meta",
          attrs: { name: "robots", content: merged.robots, "data-dev-meta": "" },
          injectTo: "head",
        });
      }
      if (merged.canonical) {
        tags.push({
          tag: "link",
          attrs: { rel: "canonical", href: merged.canonical, "data-dev-meta": "" },
          injectTo: "head",
        });
      }

      // resolvedUrls is only populated once the server is actually listening, which it always
      // is by the time a real request comes in for transformIndexHtml to handle.
      const origin = ctx.server.resolvedUrls?.local?.[0]?.replace(/\/$/, "");
      let outHtml = html;
      if (origin) {
        const rootHtml = await renderRootHtml(origin, requestUrl);
        if (rootHtml !== null) {
          outHtml = outHtml.replace(
            /<div id="root">[\s\S]*?<\/div>/,
            `<div id="root">${rootHtml}</div>`
          );
        }
      }

      if (tags.length === 0) return outHtml;
      return { html: outHtml, tags };
    },
  };
}
