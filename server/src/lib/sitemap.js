// Builds sitemap.xml on demand instead of relying solely on the copy scripts/generate-sitemap.js
// writes to public/sitemap.xml at build time. That static file only ever reflects whatever
// agencies/blog posts existed at the last deploy — anything published in between never showed
// up until the next build. This regenerates it from the live DB + WordPress on every request
// (behind a short cache), so new content appears automatically without a redeploy.
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Agency from "../models/Agency.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://findingglobal.com";
const WP_BASE = "https://cms.findingglobal.com/wp-json/wp/v2";

const STATIC_ROUTES = [
  "/",
  "/about/",
  "/contact/",
  "/for-agencies/",
  "/agencies/",
  "/blog/",
  "/portfolio/",
  "/enterprise/",
  "/submit-project/",
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — long enough to spare WP/DB from crawler bursts
let cache = null; // { xml, expiresAt }

function escapeXml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, { lastmod, changefreq, priority }) {
  return (
    "  <url>\n" +
    `    <loc>${escapeXml(loc)}</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>${changefreq}</changefreq>\n` +
    `    <priority>${priority}</priority>\n` +
    "  </url>\n"
  );
}

async function getBlogPosts() {
  try {
    const res = await fetch(`${WP_BASE}/posts?per_page=100`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function getAgencies() {
  try {
    return await Agency.find({ verified: true }).select("slug updatedAt featured").lean();
  } catch {
    return [];
  }
}

function getServiceSlugs() {
  try {
    const servicesJsonPath = path.join(__dirname, "../../../src/lib/services.json");
    const services = JSON.parse(fs.readFileSync(servicesJsonPath, "utf8"));
    return Object.keys(services);
  } catch {
    return [];
  }
}

async function buildSitemap() {
  const [agencies, blogPosts] = await Promise.all([getAgencies(), getBlogPosts()]);
  const serviceSlugs = getServiceSlugs();
  const today = new Date().toISOString().split("T")[0];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const route of STATIC_ROUTES) {
    xml += urlEntry(`${DOMAIN}${route}`, { lastmod: today, changefreq: "daily", priority: "0.8" });
  }

  for (const slug of serviceSlugs) {
    xml += urlEntry(`${DOMAIN}/agencies/${slug}/`, { lastmod: today, changefreq: "daily", priority: "0.8" });
  }

  for (const agency of agencies) {
    if (!agency.slug) continue;
    const lastMod = agency.updatedAt ? new Date(agency.updatedAt).toISOString().split("T")[0] : today;
    xml += urlEntry(`${DOMAIN}/agencies/${agency.slug}/`, {
      lastmod: lastMod,
      changefreq: "weekly",
      priority: agency.featured ? "0.8" : "0.6",
    });
  }

  for (const post of blogPosts) {
    if (!post.slug) continue;
    const lastMod = post.modified ? post.modified.split("T")[0] : post.date ? post.date.split("T")[0] : today;
    xml += urlEntry(`${DOMAIN}/blog/${post.slug}/`, { lastmod: lastMod, changefreq: "monthly", priority: "0.6" });
  }

  xml += "</urlset>\n";
  return xml;
}

export async function getSitemapXml() {
  if (cache && Date.now() < cache.expiresAt) return cache.xml;
  try {
    const xml = await buildSitemap();
    cache = { xml, expiresAt: Date.now() + CACHE_TTL_MS };
    return xml;
  } catch (err) {
    // Serve the last known-good sitemap rather than a 500 if a rebuild fails transiently.
    if (cache) return cache.xml;
    throw err;
  }
}
