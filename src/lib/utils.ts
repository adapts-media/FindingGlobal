import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

// Decodes HTML entities in a plain string — WordPress's REST API returns `.rendered` fields
// pre-encoded for direct HTML embedding (e.g. a title containing the literal text "&#8217;"
// for an apostrophe). That's correct when the string is parsed as HTML (dangerouslySetInnerHTML
// does this automatically), but wrong wherever it's used as plain text instead — a <title>,
// a meta content attribute, or a JSON-LD string value — since none of those re-parse entities,
// so without this the page would visibly show "&#8217;" instead of an apostrophe.
export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
    if (body[0] === "#") {
      const isHex = body[1]?.toLowerCase() === "x";
      const codePoint = isHex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
    }
    return HTML_NAMED_ENTITIES[body] ?? match;
  });
}

export function getUtmWebsiteUrl(
  websiteUrl: string | undefined | null,
  medium: string,
  campaign: string
): string {
  if (!websiteUrl) return "";
  
  let cleanUrl = websiteUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  try {
    const url = new URL(cleanUrl);
    url.searchParams.set("utm_source", "findingglobal");
    url.searchParams.set("utm_medium", medium.toLowerCase());
    url.searchParams.set("utm_campaign", campaign);
    return url.toString();
  } catch {
    const separator = cleanUrl.includes("?") ? "&" : "?";
    return `${cleanUrl}${separator}utm_source=findingglobal&utm_medium=${encodeURIComponent(medium.toLowerCase())}&utm_campaign=${encodeURIComponent(campaign)}`;
  }
}

const SEARCH_MAPPING: Record<string, { type: "service" | "category"; slug: string }> = {
  "advertising": { type: "service", slug: "advertising" },
  "360º advertising": { type: "service", slug: "360-advertising" },
  "advertising campaign": { type: "service", slug: "advertising-campaign" },
  "advertising production": { type: "service", slug: "advertising-production" },
  "creative": { type: "service", slug: "creative-services" },
  
  "branding & positioning": { type: "service", slug: "branding-positioning" },
  "branding & strategy": { type: "category", slug: "branding-strategy" },
  "branding": { type: "category", slug: "branding-strategy" },
  
  "content marketing": { type: "service", slug: "content-marketing" },
  "copywriting": { type: "service", slug: "copywriting" },
  
  "digital marketing": { type: "category", slug: "digital-marketing" },
  
  "e-commerce": { type: "service", slug: "e-commerce" },
  "ecommerce": { type: "service", slug: "e-commerce" },
  
  "email marketing": { type: "service", slug: "email-marketing" },
  
  "graphic design": { type: "service", slug: "graphic-design" },
  "design": { type: "service", slug: "design-services" },
  
  "influencer marketing": { type: "service", slug: "influencer-marketing" },
  "influencer": { type: "service", slug: "influencer-marketing" },
  
  "logo design": { type: "service", slug: "logo-design" },
  
  "mobile app development": { type: "service", slug: "mobile-app-development" },
  "mobile app": { type: "service", slug: "mobile-app-development" },
  
  "online advertising": { type: "service", slug: "online-advertising" },
  
  "ppc / paid ads": { type: "service", slug: "ppc-paid-ads" },
  "ppc": { type: "service", slug: "ppc-paid-ads" },
  
  "pr & communications": { type: "category", slug: "pr-communications" },
  "public relations (pr)": { type: "category", slug: "pr-communications" },
  
  "product design": { type: "service", slug: "product-design" },
  
  "seo": { type: "service", slug: "seo-services" },
  
  "social media management": { type: "service", slug: "social-media-management" },
  "social media": { type: "service", slug: "social-media-management" },
  
  "software development": { type: "service", slug: "software-development" },
  "software": { type: "service", slug: "software-development" },
  
  "ui/ux design": { type: "service", slug: "ui-ux-design" },
  "user experience (ux/ui)": { type: "service", slug: "ui-ux-design" },
  
  "video production": { type: "service", slug: "video-production" },
  "video editing": { type: "service", slug: "video-editing" },
  
  "web design": { type: "service", slug: "web-design" },
  "web development": { type: "service", slug: "web-development" },
  
  "aws consulting": { type: "service", slug: "aws-consulting" },
  "consulting": { type: "service", slug: "consulting-services" },
  "cyber security": { type: "service", slug: "cyber-security" },
  "data protection": { type: "service", slug: "data-protection" },
  "saas strategy consulting": { type: "service", slug: "saas-strategy-consulting" },
  
  "affiliate marketing": { type: "service", slug: "affiliate-marketing" },
  "b2b-marketing": { type: "service", slug: "b2b-marketing" },
  "communication strategy": { type: "service", slug: "communication-strategy" },
  "international marketing": { type: "service", slug: "international-marketing" },
  "marketing": { type: "service", slug: "marketing-services" },
  
  "events": { type: "service", slug: "event-management" },
  "event": { type: "service", slug: "event-management" },
  
  "artificial intelligence": { type: "service", slug: "artificial-intelligence" },
  "post production": { type: "service", slug: "post-production" },
  "photography": { type: "service", slug: "photography" }
};

export function getSearchUrlParams(term: string): { category?: string; service?: string; q?: string } {
  const normalized = term.trim().toLowerCase();
  const match = SEARCH_MAPPING[normalized];
  if (match) {
    return { [match.type]: match.slug };
  }
  return { q: term };
}

export function getSearchUrl(term: string): string {
  const params = getSearchUrlParams(term);
  if (params.category) {
    return `/agencies/${encodeURIComponent(params.category)}/`;
  }
  if (params.service) {
    return `/agencies/${encodeURIComponent(params.service)}/`;
  }
  return `/agencies/?q=${encodeURIComponent(params.q || "")}`;
}


