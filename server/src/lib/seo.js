// On-demand meta/canonical injection for dynamic pages (blog posts, agency profiles) that
// don't have a statically prerendered file yet — e.g. content published after the last
// build/deploy. Without this, those URLs fall through to the generic app shell and (before
// this existed) to the fully-baked homepage HTML, which meant they inherited the homepage's
// canonical URL, title, and meta tags. See scripts/prerender.js for the static-build side.
import Agency from "../models/Agency.js";

const WP_BASE = "https://cms.findingglobal.com/wp-json/wp/v2";
const SITE = "https://findingglobal.com";

// Short-lived in-memory cache so a burst of crawler/bot hits to the same uncached slug
// doesn't hammer the WordPress API or the database.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // key -> { value, expiresAt }

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HTML_NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

// Decodes HTML entities in a plain string. WordPress's REST API returns `.rendered` fields
// pre-encoded for direct HTML embedding (e.g. a title literally containing "&#8217;" for an
// apostrophe) — correct when parsed as HTML, wrong once dropped into a <title> or meta
// content attribute as plain text, which never re-parses entities. Mirrors decodeHtmlEntities
// in src/lib/utils.ts.
function decodeHtmlEntities(str = "") {
  return String(str).replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body) => {
    if (body[0] === "#") {
      const isHex = body[1]?.toLowerCase() === "x";
      const codePoint = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return HTML_NAMED_ENTITIES[body] ?? match;
  });
}

function cleanHtmlSnippet(html = "", length = 155) {
  const cleaned = decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, "")
      .replace(/\s*\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]/g, "")
      .replace(/\s*(?:&hellip;|&#8230;|#8230;|\.\.\.)$/g, "")
  ).trim();
  return cleaned.slice(0, length) + (cleaned.length > length ? "..." : "");
}

function getFeaturedImage(post, slug) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url) return media.source_url;
  const ogImg = post.yoast_head_json?.og_image?.[0]?.url;
  if (ogImg) return ogImg;
  return `https://picsum.photos/seed/${slug}/1200/630`;
}

// Replace (or insert) a handful of <head> tags in the shell HTML: <title>, meta description,
// meta robots, og:title/og:description/og:image, and the canonical <link>.
export function injectMetaTags(shellHtml, { title, description, canonical, ogImage, robots }) {
  let html = shellHtml;

  // Strip-then-insert (never in-place substitution) so this works whether or not the shell
  // already has these tags — the app shell intentionally ships with none (see index.html),
  // relying on this same strip-then-insert pattern to be the sole source of each tag.
  html = html.replace(/<title>.*?<\/title>/gis, "");
  html = html.replace(/<link\s+rel=["']canonical["'][^>]*\/?>/gi, "");
  html = html.replace(/<meta\s+name=["']description["'][^>]*\/?>/gi, "");
  html = html.replace(/<meta\s+property=["']og:title["'][^>]*\/?>/gi, "");
  html = html.replace(/<meta\s+property=["']og:description["'][^>]*\/?>/gi, "");
  html = html.replace(/<meta\s+property=["']og:image["'][^>]*\/?>/gi, "");
  html = html.replace(/<meta\s+name=["']robots["'][^>]*\/?>/gi, "");

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : "",
    `<link rel="canonical" href="${canonical}" />`,
  ].filter(Boolean).join("\n    ");

  return html.replace(/<\/head>/i, `    ${tags}\n  </head>`);
}

// Fetches a single WP post by slug (mirrors src/lib/api.ts's wpBlogApi.getBySlug) and, on a
// hit, returns the shell HTML with that post's meta/canonical injected. Returns null when the
// post doesn't exist or the CMS can't be reached, so the caller can fall through to the
// generic shell instead.
export async function renderBlogMeta(shellHtml, slug) {
  const cacheKey = `blog:${slug}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached ? injectMetaTags(shellHtml, cached) : null;

  try {
    const res = await fetch(`${WP_BASE}/posts?slug=${encodeURIComponent(slug)}&_embed`);
    if (!res.ok) {
      setCached(cacheKey, null);
      return null;
    }
    const posts = await res.json();
    const post = Array.isArray(posts) ? posts[0] : null;
    if (!post) {
      setCached(cacheKey, null);
      return null;
    }

    const meta = {
      // The SEO title / meta description set in WordPress (Yoast) win when present; the post
      // title and cleaned excerpt are only the fallback. Mirrors getSeoTitle/getSeoDescription
      // in src/routes/blog_.$slug.tsx.
      title: decodeHtmlEntities(post.yoast_head_json?.title?.trim() || post.title?.rendered || "Blog"),
      description: post.yoast_head_json?.description?.trim()
        ? decodeHtmlEntities(post.yoast_head_json.description.trim())
        : cleanHtmlSnippet(post.excerpt?.rendered || post.content?.rendered || ""),
      canonical: `${SITE}/blog/${slug}/`,
      ogImage: getFeaturedImage(post, slug),
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    };
    setCached(cacheKey, meta);
    return injectMetaTags(shellHtml, meta);
  } catch {
    setCached(cacheKey, null);
    return null;
  }
}

// Acronyms/initialisms in our service list that are pronounced starting with a vowel sound
// despite a consonant spelling (e.g. "an SEO agency", not "a SEO agency"). Mirrors the same
// set in src/routes/agencies.$slug.tsx — keep both in sync if this list ever grows.
const VOWEL_SOUND_OVERRIDES = new Set(["SEO"]);

function withArticle(word) {
  const firstWord = word.trim().split(/\s+/)[0] ?? "";
  const startsWithVowelSound =
    VOWEL_SOUND_OVERRIDES.has(firstWord.toUpperCase()) || /^[aeiou]/i.test(firstWord);
  return `${startsWithVowelSound ? "an" : "a"} ${word}`;
}

// Title: "{Agency} Pricing and Services | Finding Global", falling back to a shorter
// "{Agency} | {Service} Agency | Finding Global" once the primary form runs past a search
// result's effective display width (~60 characters). Mirrors buildAgencyTitle in
// src/routes/agencies.$slug.tsx — that's the version prerendering actually uses; this one
// only ever runs for a slug that isn't statically prerendered yet.
function buildAgencyTitle(name, primaryService) {
  const primary = `${name} Pricing and Services | Finding Global`;
  if (primary.length <= 60) return primary;
  return `${name} | ${primaryService} Agency | Finding Global`;
}

// Description: "{Agency} is a/an {Service} agency, team of {TeamSize}, projects from
// ${MinPrice}. See full services, pricing, verified profile, and client reviews." — each
// data-dependent clause drops cleanly if that field isn't set on the agency. Mirrors
// buildAgencyDescription in src/routes/agencies.$slug.tsx.
function buildAgencyDescription(name, primaryService, teamSize, minBudget) {
  const clauses = [`${name} is ${withArticle(primaryService)} agency`];
  if (teamSize) clauses.push(`team of ${teamSize}`);
  if (minBudget) clauses.push(`projects from $${minBudget.toLocaleString("en-US")}`);
  return `${clauses.join(", ")}. See full services, pricing, verified profile, and client reviews.`;
}

// Fetches a single agency by slug from our own DB (mirrors GET /api/agencies/:slug) and, on a
// hit, returns the shell HTML with that agency's meta/canonical injected. Only surfaces
// verified agencies — unverified ones aren't public pages, same as the API route.
export async function renderAgencyMeta(shellHtml, slug) {
  const cacheKey = `agency:${slug}`;
  const cached = getCached(cacheKey);
  if (cached !== undefined) return cached ? injectMetaTags(shellHtml, cached) : null;

  try {
    const agency = await Agency.findOne({ slug, verified: true })
      .select("name services teamSize minBudget")
      .lean();
    if (!agency) {
      setCached(cacheKey, null);
      return null;
    }

    const primaryService = agency.services?.[0] || "Digital Marketing";
    const title = buildAgencyTitle(agency.name, primaryService);
    const description = buildAgencyDescription(agency.name, primaryService, agency.teamSize, agency.minBudget);
    const meta = {
      title,
      description,
      canonical: `${SITE}/agencies/${slug}/`,
      robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    };
    setCached(cacheKey, meta);
    return injectMetaTags(shellHtml, meta);
  } catch {
    setCached(cacheKey, null);
    return null;
  }
}
