import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import helmet from "helmet";
import { rateLimit } from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import agencyRoutes from "./routes/agencies.js";
import projectRoutes from "./routes/projects.js";
import leadRoutes from "./routes/leads.js";
import portfolioRoutes from "./routes/portfolio.js";
import adminRoutes from "./routes/admin.js";
import notificationRoutes from "./routes/notifications.js";
import contactRoutes from "./routes/contact.js";
import meetingRoutes from "./routes/meetings.js";
import { renderBlogMeta, renderAgencyMeta } from "./lib/seo.js";
import { getSitemapXml } from "./lib/sitemap.js";
import { safeFetch } from "./lib/safe-fetch.js";
import { legacyRedirects } from "./lib/redirects.js";

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

// Security & Rate Limiting
// Trust proxy is required when deployed behind a load balancer (like Vercel) to get real client IPs
app.set("trust proxy", 1);

// Force HTTPS 301 Redirect in production
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const host = req.headers.host || "findingglobal.com";
    if (proto !== "https" && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return res.redirect(301, `https://${host}${req.url}`);
    }
    next();
  });
}

// For development, allow all origins. For production, restrict to allowed origins.
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : [];

app.use(cors({ 
  origin: (origin, callback) => {
    // Treat missing or "null" origins (often sent by privacy-focused browsers/extensions/private tabs) as allowed
    if (!origin || origin === "null") {
      return callback(null, true);
    }
    
    if (process.env.NODE_ENV === "production") {
      // 1. Direct match in allowedOrigins environment variable list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // 2. Safe regex check for findingglobal.com and any of its subdomains
      const isFindingGlobal = /^https?:\/\/(?:[a-z0-9-]+\.)*findingglobal\.com$/i.test(origin);
      if (isFindingGlobal) {
        return callback(null, true);
      }
      
      // Log blocked origin to stdout/stderr for easier server-side debugging
      console.warn(`[CORS] Blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    }
    // Allow all origins in development
    callback(null, true);
  }, 
  credentials: true 
}));
// Helmet's default Content-Security-Policy is off: since Express started serving the site's HTML
// (not just the API), its "self only" defaults blocked every external image (WordPress media,
// agency logos from arbitrary hosts, avatars), Google Tag Manager/Analytics, Google Sign-In, and
// in-browser WordPress fetches. The site ran without a CSP on its previous host. Helmet's other
// protections (HSTS, nosniff, frameguard, referrer policy, ...) stay on.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" }, contentSecurityPolicy: false }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Raised limit to prevent normal users from hitting it
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Tighter limit on the image proxy specifically — it's the one route that makes an outbound
// request per hit, so it's worth capping harder than the general API limit (abuse as a relay
// or for internal-network probing, not just normal traffic volume).
const proxyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(morgan("dev"));

// Old-site URLs -> their new pages (301). Runs before everything else that serves pages.
app.use(legacyRedirects);

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Image proxy — lets the client load a third-party image (e.g. a Google profile photo, or a
// URL an agency owner pasted in) through our own origin for CORS-safe <canvas> cropping. This
// used to hand a caller-supplied URL straight to fetch(), which is a textbook SSRF: anyone
// could point it at cloud metadata endpoints, internal/loopback services, or use it as an
// open proxy. safeFetch() confirms the URL (and every redirect hop) resolves to a public
// address over http/https before ever connecting; on top of that, only image responses under
// a sane size are relayed, since that's the only thing this endpoint is actually for.
const PROXY_MAX_BYTES = 15 * 1024 * 1024; // 15MB — generous for a logo/cover photo, not for abuse as a file host

app.get("/api/proxy", proxyLimiter, async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL parameter is required" });
    }

    let response;
    try {
      response = await safeFetch(url);
    } catch (err) {
      return res.status(400).json({ error: err.message || "Invalid or disallowed URL" });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch remote image: ${response.statusText}` });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(415).json({ error: "Only image responses may be proxied" });
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > PROXY_MAX_BYTES) {
      return res.status(413).json({ error: "Remote file is too large" });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > PROXY_MAX_BYTES) {
      return res.status(413).json({ error: "Remote file is too large" });
    }

    res.setHeader("Content-Type", contentType);
    // Wildcard is safe here specifically because the response is now guaranteed to be an
    // image, from a validated public host, of bounded size — this is what lets the client's
    // <canvas>-based cropper read the pixels without a tainted-canvas error.
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    next(err);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/meetings", meetingRoutes);

// Served dynamically (cached a few minutes) instead of the static public/sitemap.xml copy —
// that one is only regenerated at build/deploy time, so it went stale between deploys and never
// picked up agencies or blog posts published in between. This route is mounted ahead of
// express.static below so it always wins over the stale committed file with the same path.
app.get("/sitemap.xml", async (_req, res, next) => {
  try {
    const xml = await getSitemapXml();
    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=600");
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

if (process.env.NODE_ENV === "production") {
  const DIST_DIR = path.join(__dirname, "../../dist");
  // scripts/prerender.js saves a generic, un-route-specific copy of the app shell here before
  // it overwrites dist/index.html with the fully-baked homepage HTML. Fall back to
  // dist/index.html itself if it's missing (e.g. an older deploy) rather than 404ing.
  const SHELL_PATH = fs.existsSync(path.join(DIST_DIR, "app-shell.html"))
    ? path.join(DIST_DIR, "app-shell.html")
    : path.join(DIST_DIR, "index.html");
  let SHELL_HTML = null;
  try {
    SHELL_HTML = fs.readFileSync(SHELL_PATH, "utf8");
  } catch (err) {
    console.warn(`[SEO] Could not read app shell at ${SHELL_PATH} — on-demand meta injection disabled:`, err.message);
  }

  // Blog pages are prerendered at build time, so their <head> is frozen at whatever WordPress
  // held then — an SEO title/description edited in WordPress would never show up until the next
  // deploy. This route sits ahead of express.static so it always runs: it takes the prerendered
  // page (body content included) — or the generic shell for a post published since the last
  // build — and swaps in the current title/description/canonical from WordPress. Results are
  // cached for a few minutes in renderBlogMeta, so a WordPress edit is live within that window.
  app.get(/^\/blog\/([^/]+)\/?$/, async (req, res, next) => {
    const slug = req.params[0];
    // WordPress slugs are lowercase alphanumerics and hyphens — reject anything else before it
    // gets anywhere near a filesystem path.
    if (!/^[a-z0-9-]+$/i.test(slug)) return next();
    try {
      const prerenderedPath = path.join(DIST_DIR, "blog", slug, "index.html");
      const baseHtml = fs.existsSync(prerenderedPath) ? fs.readFileSync(prerenderedPath, "utf8") : SHELL_HTML;
      if (!baseHtml) return next();
      const rendered = await renderBlogMeta(baseHtml, slug);
      if (rendered) return res.send(rendered);
    } catch (err) {
      console.error("[SEO] Failed to render blog meta:", err);
    }
    next();
  });

  app.use(express.static(DIST_DIR));

  // Blog posts and agency profiles published after the last build/deploy don't have a
  // statically prerendered file yet, so express.static falls through for them. Rather than
  // serving the generic shell (which carries no page-specific canonical/meta), fetch that one
  // post/agency now and inject its real meta tags before responding.
  app.get(/^\/agencies\/([^/]+)\/?$/, async (req, res, next) => {
    if (!SHELL_HTML) return next();
    try {
      const rendered = await renderAgencyMeta(SHELL_HTML, req.params[0]);
      if (rendered) return res.send(rendered);
    } catch (err) {
      console.error("[SEO] Failed to render on-demand agency meta:", err);
    }
    next();
  });

  app.get("*", (req, res) => {
    res.sendFile(SHELL_PATH);
  });
} else {
  app.use((req, res) => res.status(404).json({ error: "Not found" }));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

if (!process.env.JWT_SECRET) {
  console.warn("[auth] WARNING: JWT_SECRET is not set. Using insecure default.");
}

if (!process.env.MONGODB_URI) {
  console.warn("[db] WARNING: MONGODB_URI is not set. Using local fallback.");
}

// Start the HTTP server immediately so cPanel Passenger doesn't time out.
app.listen(PORT, () => console.log(`[api] listening on port ${PORT}`));

// Connect to MongoDB in the background — a slow DB won't block startup.
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    const obscuredUri = MONGODB_URI.replace(/\/\/.*@/, "//****:****@");
    console.log(`[db] connected to: ${obscuredUri}`);
  })
  .catch((err) => {
    console.error("[db] connection failed! Check MONGODB_URI and Atlas IP whitelist.");
    console.error(`[db] error details: ${err.message}`);
  });
