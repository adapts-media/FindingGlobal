// Permanent (301) redirects for URLs from the site's previous structure (old WordPress-era
// post permalinks, category archives, /listings/), so search engines pass their ranking on to
// the new pages and old links/bookmarks keep working.
//
// Keys and targets are paths on findingglobal.com. Keys are matched with or without a trailing
// slash and case-insensitively; targets use the trailing-slash form the site canonicalizes to,
// so each old URL is a single hop.
const REDIRECTS = {
  "/comparing-digital-marketing-agencies-key-metrics-to-evaluate/": "/blog/comparing-digital-marketing-agencies-key-metrics-to-evaluate/",
  "/top-reasons-why-companies-require-media-agencies/": "/blog/top-reasons-why-companies-require-media-agencies/",
  "/role-of-an-advertising-agency-in-mena/": "/",
  "/why-to-choose-digital-marketing-agency/": "/blog/why-to-choose-digital-marketing-agency/",
  "/essential-tips-for-choosing-the-best-digital-marketing-agency-in-dubai/": "/blog/essential-tips-for-choosing-the-best-digital-marketing-agency-in-dubai/",
  "/top-reasons-to-invest-in-professional-seo-services-for-your-website/": "/blog/top-reasons-to-invest-in-professional-seo-services-for-your-website/",
  "/strategic-alliances-building-bridges-between-businesses-and-digital-marketing-in-mena/": "/blog/strategic-alliances-building-bridges-between-businesses-and-digital-marketing-in-mena/",
  "/unlocking-business-connections-through-digital-marketing-agencies-in-the-mena-region/": "/blog/unlocking-business-connections-through-digital-marketing-agencies-in-the-mena-region/",
  "/data-driven-decisions-how-analytics-can-drive-your-digital-marketing-strategy-in-mena/": "/blog/data-driven-decisions-how-analytics-can-drive-your-digital-marketing-strategy-in-mena/",
  "/why-your-business-needs-a-comprehensive-digital-marketing-strategy/": "/blog/why-your-business-needs-a-comprehensive-digital-marketing-strategy/",

  "/category/graphic-design/": "/agencies/graphic-design/",
  "/category/digital-marketing/": "/",
  "/category/seo/": "/agencies/seo-services/",
  "/category/media-planning-buying/": "/agencies/media-relations/",

  "/listings/": "/",
};

const normalize = (p) => (p.endsWith("/") ? p : `${p}/`).toLowerCase();
const LOOKUP = new Map(Object.entries(REDIRECTS).map(([from, to]) => [normalize(from), to]));

export function legacyRedirects(req, res, next) {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const target = LOOKUP.get(normalize(req.path));
  if (!target) return next();
  // Keep any query string (e.g. utm_ tracking parameters) on the new URL.
  const qs = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
  res.redirect(301, target + qs);
}
