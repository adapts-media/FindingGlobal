import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = "https://findingglobal.com";

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

async function getAgencies() {
  // PRERENDER_API_ORIGIN (optional) wins; otherwise a local backend, then the live site.
  if (process.env.PRERENDER_API_ORIGIN) {
    try {
      const res = await fetch(`${process.env.PRERENDER_API_ORIGIN}/api/agencies`);
      if (res.ok) return (await res.json()).agencies || [];
    } catch (err) {}
  }
  const localUrl = "http://localhost:4000/api/agencies";
  const prodUrl = "https://findingglobal.com/api/agencies";

  try {
    console.log("Attempting to fetch agencies from local API...");
    const res = await fetch(localUrl);
    if (res.ok) {
      const data = await res.json();
      return data.agencies || [];
    }
  } catch (err) {
    console.log("Local API not available, falling back to production API...");
  }

  try {
    console.log("Fetching agencies from production API...");
    const res = await fetch(prodUrl);
    if (res.ok) {
      const data = await res.json();
      return data.agencies || [];
    }
  } catch (err) {
    console.error("Failed to fetch agencies from production API:", err.message);
  }

  return [];
}

async function getBlogPosts() {
  const wpUrl = "https://cms.findingglobal.com/wp-json/wp/v2/posts?per_page=100";
  try {
    console.log("Fetching blog posts from WordPress...");
    const res = await fetch(wpUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch blog posts from WordPress:", err.message);
  }
  return [];
}

async function generate() {
  const agencies = await getAgencies();
  const blogPosts = await getBlogPosts();

  const servicesJsonPath = path.join(__dirname, "..", "src", "lib", "services.json");
  const services = JSON.parse(fs.readFileSync(servicesJsonPath, "utf8"));
  const serviceSlugs = Object.keys(services);

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // 1. Static Routes
  const today = new Date().toISOString().split("T")[0];
  for (const route of STATIC_ROUTES) {
    const locUrl = `${DOMAIN}${route}`;
    xml += "  <url>\n";
    xml += `    <loc>${locUrl}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.8</priority>\n";
    xml += "  </url>\n";
  }

  // 1b. Dynamic Category & Service Routes
  console.log(`Adding ${serviceSlugs.length} category/service routes to sitemap...`);
  for (const slug of serviceSlugs) {
    xml += "  <url>\n";
    xml += `    <loc>${DOMAIN}/agencies/${slug}/</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += "    <changefreq>daily</changefreq>\n";
    xml += "    <priority>0.8</priority>\n";
    xml += "  </url>\n";
  }

  // 2. Dynamic Agency Routes
  console.log(`Adding ${agencies.length} agencies to sitemap...`);
  for (const agency of agencies) {
    if (!agency.slug) continue;
    const lastMod = agency.updatedAt
      ? new Date(agency.updatedAt).toISOString().split("T")[0]
      : today;
    xml += "  <url>\n";
    xml += `    <loc>${DOMAIN}/agencies/${agency.slug}/</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += "    <changefreq>weekly</changefreq>\n";
    xml += `    <priority>${agency.featured ? "0.8" : "0.6"}</priority>\n`;
    xml += "  </url>\n";
  }

  // 3. Dynamic Blog Routes
  console.log(`Adding ${blogPosts.length} blog posts to sitemap...`);
  for (const post of blogPosts) {
    if (!post.slug) continue;
    const lastMod = post.modified
      ? post.modified.split("T")[0]
      : post.date
        ? post.date.split("T")[0]
        : today;
    xml += "  <url>\n";
    xml += `    <loc>${DOMAIN}/blog/${post.slug}/</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += "    <changefreq>monthly</changefreq>\n";
    xml += "    <priority>0.6</priority>\n";
    xml += "  </url>\n";
  }

  xml += "</urlset>\n";

  const publicDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outputPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf8");
  console.log(`Sitemap generated successfully at: ${outputPath}`);
}

generate().catch((err) => {
  console.error("Error generating sitemap:", err);
  process.exit(1);
});
