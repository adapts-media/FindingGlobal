import fs from "fs";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "..", "dist");

const STATIC_ROUTES = [
  "/",
  "/about/",
  "/contact/",
  "/for-agencies/",
  "/agencies/",
  "/blog/",
  "/submit-project/",
  "/enterprise/",
  "/portfolio/",
  "/login/",
  "/upgrade/",
  "/confirm-service/",
  "/agency-onboarding/",
  "/agency-dashboard/",
  "/agency-inbox/",
  "/admin/",
  "/dashboard/",
  "/payment-success/",
];

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function getAgencies() {
  // PRERENDER_API_ORIGIN (optional) wins; otherwise a local backend, then the live site.
  const envUrl = process.env.PRERENDER_API_ORIGIN ? `${process.env.PRERENDER_API_ORIGIN}/api/agencies` : null;
  const localUrl = "http://localhost:4000/api/agencies";
  const prodUrl = "https://findingglobal.com/api/agencies";

  if (envUrl) {
    try {
      const res = await fetch(envUrl);
      if (res.ok) return (await res.json()).agencies || [];
    } catch (err) {}
  }

  try {
    const res = await fetch(localUrl);
    if (res.ok) {
      const data = await res.json();
      return data.agencies || [];
    }
  } catch (err) {}

  try {
    const res = await fetch(prodUrl);
    if (res.ok) {
      const data = await res.json();
      return data.agencies || [];
    }
  } catch (err) {}

  return [];
}

// Removes all but the last match of a (global) regex from html — used to collapse accidental
// duplicate <title>/meta-description tags down to one.
function dedupeKeepLast(html, globalRegex) {
  const matches = html.match(globalRegex);
  if (!matches || matches.length < 2) return html;
  let i = 0;
  return html.replace(globalRegex, () => (++i === matches.length ? matches[matches.length - 1] : ""));
}

async function getBlogPosts() {
  const wpUrl = "https://cms.findingglobal.com/wp-json/wp/v2/posts?per_page=100";
  try {
    const res = await fetch(wpUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}
  return [];
}

// The client bundle is built with a relative API base ("/api", see .env.production), so while
// this script's headless browser renders each page from the local static server below, every
// data fetch (agency profile, portfolio, ...) lands on *this* server. It has no /api routes,
// so those calls used to get the app shell's HTML back instead of JSON — every agency page was
// prerendered as "Agency not found" with the generic site title, and /portfolio/ with no
// results. Proxying /api/* through to a real backend fixes that at the source.
let apiOrigin = null;
async function resolveApiOrigin() {
  const candidates = [process.env.PRERENDER_API_ORIGIN, "http://localhost:4000", "https://findingglobal.com"].filter(Boolean);
  for (const origin of candidates) {
    try {
      const res = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) return origin;
    } catch {}
  }
  return null;
}

async function proxyApi(req, res) {
  if (!apiOrigin) {
    res.writeHead(502, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "No API backend reachable during prerender" }));
  }
  try {
    const upstream = await fetch(apiOrigin + req.url, { method: req.method === "GET" ? "GET" : "HEAD" });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json" });
    res.end(body);
  } catch (err) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message }));
  }
}

function startStaticServer(port, shellPath) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url.startsWith("/api/")) return proxyApi(req, res);
      let reqPath = req.url.split("?")[0];
      let filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, "index.html");
      }

      if (!fs.existsSync(filePath)) {
        // Fall back to the pristine, generic shell — not dist/index.html, which by this point
        // in the crawl has already been overwritten with the fully-rendered homepage (see the
        // "/" route below). Serving that mutated file for a route that hasn't been rendered
        // yet would seed this route's page with the homepage's title/meta/etc. still in the
        // DOM, which the client-side render then only adds to rather than replaces — hence
        // pages ending up with multiple <title>/meta description tags baked into their
        // prerendered file.
        filePath = shellPath;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end("Server Error");
        } else {
          res.writeHead(200, { "Content-Type": contentType });
          res.end(content);
        }
      });
    });

    server.listen(port, () => {
      console.log(`[Prerender] Static server running on port ${port}`);
      resolve(server);
    });
  });
}

async function prerender() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error("[Prerender] Error: dist directory does not exist. Run 'vite build' first.");
    process.exit(1);
  }

  // Preserve the pristine, generic vite-built shell before the "/" route below overwrites
  // dist/index.html with the fully-baked homepage HTML. The server's catch-all fallback (for
  // any URL that has no dedicated prerendered folder — e.g. a blog post published after this
  // build ran) serves this generic shell instead, so those pages no longer inherit the
  // homepage's canonical URL, title, and meta tags.
  const shellSrc = path.join(DIST_DIR, "index.html");
  const shellDest = path.join(DIST_DIR, "app-shell.html");
  fs.copyFileSync(shellSrc, shellDest);
  console.log("[Prerender] Saved generic app shell to dist/app-shell.html");

  console.log("[Prerender] Collecting routes...");
  const agencies = await getAgencies();
  const blogPosts = await getBlogPosts();

  const servicesJsonPath = path.join(__dirname, "..", "src", "lib", "services.json");
  const services = JSON.parse(fs.readFileSync(servicesJsonPath, "utf8"));
  const serviceSlugs = Object.keys(services);

  const routes = [...STATIC_ROUTES];

  for (const slug of serviceSlugs) {
    routes.push(`/agencies/${slug}/`);
  }

  for (const agency of agencies) {
    if (agency.slug) {
      routes.push(`/agencies/${agency.slug}/`);
    }
  }

  for (const post of blogPosts) {
    if (post.slug) {
      routes.push(`/blog/${post.slug}/`);
    }
  }

  console.log(`[Prerender] Total routes to pre-render: ${routes.length}`);

  const PORT = 4173;
  apiOrigin = await resolveApiOrigin();
  console.log(apiOrigin ? `[Prerender] Proxying /api to ${apiOrigin}` : "[Prerender] WARNING: no API backend reachable — data-driven pages will prerender empty");
  const server = await startStaticServer(PORT, shellDest);

  console.log("[Prerender] Launching headless browser...");
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } catch (launchErr) {
    console.warn("[Prerender] Puppeteer default browser not found in cache. Attempting to fallback to system Chrome/Edge...");
    const possiblePaths = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      process.env.CHROME_PATH,
    ].filter(Boolean);

    let launched = false;
    for (const executablePath of possiblePaths) {
      if (fs.existsSync(executablePath)) {
        try {
          console.log(`[Prerender] Found system browser at: ${executablePath}`);
          browser = await puppeteer.launch({
            executablePath,
            headless: "new",
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          });
          launched = true;
          break;
        } catch (e) {
          // ignore and try next path
        }
      }
    }

    if (!launched) {
      throw launchErr;
    }
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const targetUrl = `http://localhost:${PORT}${route}`;
    console.log(`[Prerender] (${i + 1}/${routes.length}) Pre-rendering ${route}...`);

    try {
      await page.goto(targetUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await page.waitForSelector("#root > *", { timeout: 5000 }).catch(() => {});
      // Every route sets its own title via head(); until it does, document.title is still the
      // site-wide fallback from __root.tsx. Waiting for that to change means a route whose
      // loader is still fetching (agency profiles, blog posts) isn't snapshotted half-loaded.
      await page
        .waitForFunction(() => !document.title.startsWith("Finding GLOBAL - The agency procurement network"), { timeout: 8000 })
        .catch(() => {});
      await new Promise((r) => setTimeout(r, 500));

      let html = await page.content();
      
      // Defense-in-depth: collapse to a single <title> / meta description if more than one
      // ended up in the captured DOM (shouldn't happen now that the shell ships with neither
      // and the static server fallback above stopped cross-contaminating routes — see
      // src/routes/__root.tsx — but keep this as a backstop). Keep the last of each, since
      // that's the one the actually-matched route rendered.
      html = dedupeKeepLast(html, /<title>.*?<\/title>/gis);
      html = dedupeKeepLast(html, /<meta\s+name=["']description["'][^>]*\/?>/gi);

      // Ensure exact https canonical tag and robots index tag per route
      const expectedCanonical = route === "/" ? "https://findingglobal.com/" : `https://findingglobal.com${route}`;
      html = html.replace(/<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/gi, "");
      html = html.replace(/<meta\s+name=["']robots["']\s+content=["'][^"']*["']\s*\/?>/gi, "");
      
      const isPrivate = ["/login/", "/upgrade/", "/dashboard/", "/admin/", "/agency-dashboard/", "/agency-inbox/", "/agency-onboarding/"].includes(route);
      const robotsContent = isPrivate ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

      html = html.replace(/<\/head>/i, `  <meta name="robots" content="${robotsContent}" />\n  <link rel="canonical" href="${expectedCanonical}" />\n</head>`);

      let outputDir = DIST_DIR;
      if (route !== "/") {
        outputDir = path.join(DIST_DIR, route.slice(1));
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outputFile = path.join(outputDir, "index.html");
      fs.writeFileSync(outputFile, html, "utf8");
    } catch (err) {
      console.error(`[Prerender] Failed to pre-render ${route}: ${err.message}`);
    }
  }

  console.log("[Prerender] Pre-rendering complete!");
  await browser.close();
  server.close();
}

prerender().catch((err) => {
  console.error("[Prerender] Fatal error during pre-rendering:", err);
  process.exit(1);
});
