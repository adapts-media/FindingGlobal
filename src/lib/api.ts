// Thin fetch wrapper that talks to the Express backend.
// Configure VITE_API_URL in .env (default: http://localhost:4000/api).

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export function getProxyUrl(url: string): string {
  if (!url || !url.startsWith("http")) return url;
  if (url.includes("/api/proxy?url=")) return url;
  return `${BASE_URL}/proxy?url=${encodeURIComponent(url)}`;
}

const TOKEN_KEY = "fm_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...(headers as Record<string, string> | undefined),
  };

  // Mobile browsers (iOS Safari) block cross-origin SameSite=None cookies.
  // Send the JWT as a Bearer token header as a reliable fallback.
  // The backend auth middleware checks the Authorization header first, then cookies.
  if (auth) {
    const storedToken = getToken();
    if (storedToken) {
      finalHeaders["Authorization"] = `Bearer ${storedToken}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    credentials: "include" // Also send cookies for browsers that support it
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

  // Every route on this API responds with JSON. A non-JSON 200 here almost always means the
  // request never actually reached the intended route — e.g. the API server briefly
  // unreachable and something in front of it (a dev proxy, or the SPA's own catch-all) handed
  // back the app shell's HTML instead. Treating that as "success" is how callers end up
  // silently assigning a raw HTML string where they expected `{ items: [...] }` and crashing
  // later on `undefined.length`/`.map` deep in a render — surfacing it as a real error here,
  // right where the mismatch is detected, is far easier to diagnose and to recover from.
  if (!isJson) {
    throw new ApiError(`Unexpected response format (expected JSON, got ${res.status})`, res.status, body);
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-unauthorized"));
      }
    }
    const message =
      (body && typeof body === "object" && "error" in body && (body as { error: string }).error) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }
  return body as T;
}

// Typed helpers
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "client" | "agency" | "admin";
  company?: string;
  country?: string;
  agencySlug?: string;
}

export interface ApiAgency {
  _id: string;
  slug: string;
  name: string;
  tagline: string;
  description?: string;
  website?: string;
  city: string;
  country: string;
  countryCode: string;
  founded?: number;
  teamSize?: string;
  minBudget: number;
  rating: number;
  reviewCount: number;
  services: string[];
  industries: string[];
  logoSeed: string;
  coverSeed?: string;
  featured: boolean;
  verified: boolean;
  plan: "Starter" | "Growth";
  planExpiresAt?: string;
  planPurchasedAt?: string;
  planBillingPeriod?: "monthly" | "annual" | "none";
  leadsUsed: number;
  leadsLimit: number;
  portfolio?: unknown[];
  team?: unknown[];
  teamImage?: string;
  teamStory?: string;
  reviews?: unknown[];
  awards?: unknown[];
  clients?: unknown[];
  messages?: {
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message: string;
    createdAt?: string;
  }[];
  calendlyLink?: string;
}

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: "client" | "agency";
    company: string;
    country?: string;
  }) =>
    api<{ message: string; requiresOtp: boolean }>("/auth/register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  verifyRegister: (data: { email: string; otp: string }) =>
    api<{ token: string; user: AuthUser }>("/auth/verify-register", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  me: () => api<{ user: AuthUser }>("/auth/me", { method: "GET" }),
  google: (data: { credential: string; role?: "client" | "agency" }) =>
    api<{ token: string; user: AuthUser }>("/auth/google", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  forgotPassword: (data: { email: string }) =>
    api<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  resetPassword: (data: { email: string; otp: string; password: string }) =>
    api<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  logout: () => api<{ success: boolean }>("/auth/logout", { method: "POST" }),
};

export const agencyApi = {
  list: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    ).toString();
    return api<{ agencies: ApiAgency[] }>(`/agencies${qs ? `?${qs}` : ""}`, {
      method: "GET",
      auth: false,
    });
  },
  upgrade: (plan: string, billingPeriod?: "monthly" | "annual") =>
    api<{ redirectUrl?: string; agency?: ApiAgency }>("/agencies/upgrade", {
      method: "POST",
      body: JSON.stringify({ plan, billingPeriod }),
    }),
  confirmPayment: (paymentIntentId: string) =>
    api<{ success: boolean; status: string; agency?: ApiAgency }>("/agencies/confirm-payment", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId }),
    }),
  update: (slug: string, data: Partial<ApiAgency>) =>
    api<{ agency: ApiAgency }>(`/agencies/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  get: (slug: string) =>
    api<{ agency: ApiAgency }>(`/agencies/${slug}`, { method: "GET", auth: true }),
  match: (data: {
    services: string[];
    budget: string;
    country: string;
    industry: string;
    limit?: number;
  }) =>
    api<{ matches: { agency: ApiAgency; score: number }[] }>("/agencies/match", {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  contact: (
    slug: string,
    data: { name: string; email: string; company?: string; budget?: string; message: string }
  ) =>
    api<{ ok: true }>(`/agencies/${slug}/contact`, {
      method: "POST",
      auth: false,
      body: JSON.stringify(data),
    }),
  submitReview: (agencyId: string, data: { rating: number; excerpt: string; projectId: string }) =>
    api<{ review: unknown; rating: number; reviewCount: number }>(`/agencies/${agencyId}/reviews`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export interface ApiPortfolioItem {
  title: string;
  client: string;
  category: string;
  imageSeed: string;
  summary: string;
  description?: string;
  deliverables?: string[];
  timeline?: string;
  year?: number;
  role?: string;
  results?: string[];
  liveUrl?: string;
  industry?: string;
}

export interface ApiPortfolioAgency {
  slug: string;
  name: string;
  tagline?: string;
  city: string;
  country: string;
  countryCode?: string;
  logoSeed: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  services: string[];
  industries: string[];
  plan?: "Starter" | "Growth";
}

export interface ApiPortfolioEntry {
  item: ApiPortfolioItem;
  agency: ApiPortfolioAgency;
  industry: string;
}

export const portfolioApi = {
  list: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "") as [string, string][]
    ).toString();
    return api<{ items: ApiPortfolioEntry[] }>(
      `/portfolio${qs ? `?${qs}` : ""}`,
      { method: "GET", auth: false }
    );
  },
  byAgency: (slug: string) =>
    api<{
      agency: { slug: string; name: string };
      items: ApiPortfolioItem[];
    }>(`/portfolio/agency/${slug}`, { method: "GET", auth: false }),
  item: (agencySlug: string, itemSlug: string) =>
    api<{ item: ApiPortfolioItem; agency: ApiPortfolioAgency }>(
      `/portfolio/agency/${agencySlug}/item/${itemSlug}`,
      { method: "GET", auth: false }
    ),
};

export const projectApi = {
  list: () => api<{ projects: ApiProject[] }>("/projects", { method: "GET" }),
  create: (data: {
    title: string;
    description?: string;
    services: string[];
    budget: string;
    country: string;
    industry: string;
  }) =>
    api<{ project: ApiProject }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (id: string) => api<{ project: ApiProject; leads: ApiLead[] }>(`/projects/${id}`, { method: "GET" }),
  update: (id: string, data: Partial<Pick<ApiProject, "title" | "description" | "services" | "budget" | "country" | "industry" | "status" | "hiredAgency">>) =>
    api<{ project: ApiProject }>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export interface ApiProject {
  _id: string;
  title: string;
  description?: string;
  services: string[];
  budget: string;
  country: string;
  industry: string;
  status: "Matching" | "In Review" | "Active" | "Closed";
  matchedAgencies: ApiAgency[];
  hiredAgency?: string | ApiAgency;
  clientUserId?: { name: string; email: string; company?: string };
  createdAt: string;
}

export interface ApiLead {
  _id: string;
  type: "Matched" | "Direct";
  status: "New" | "Quoted" | "In Conversation" | "Won" | "Lost";
  note?: string;
  createdAt: string;
  updatedAt?: string;
  project?: {
    _id: string;
    title: string;
    description?: string;
    budget: string;
    country: string;
    industry?: string;
    services: string[];
    clientUserId?: {
      _id: string;
      name: string;
      email: string;
      company?: string;
    };
  };
  agency?: { _id: string; name: string; slug: string; logoSeed?: string; calendlyLink?: string };
  unlocked: boolean;
  meetingRequested: boolean;
  meetingBooked: boolean;
  directContact?: {
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message?: string;
  };
  matchReasons?: string[];
}

export const leadApi = {
  list: () => api<{ leads: ApiLead[] }>("/leads", { method: "GET" }),
  get: (id: string) => api<{ lead: ApiLead }>(`/leads/${id}`, { method: "GET" }),
  update: (id: string, data: { status?: ApiLead["status"]; note?: string; meetingRequested?: boolean; meetingBooked?: boolean }) =>
    api<{ lead: ApiLead }>(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export interface AdminStats {
  totalAgencies: number;
  pendingAgencies: number;
  projects30d: number;
  successfulMatches: number;
  activeClients: number;
}

export const adminApi = {
  stats: () => api<{ stats: AdminStats }>("/admin/stats", { method: "GET" }),
  pending: () => api<{ agencies: ApiAgency[] }>("/admin/agencies/pending", { method: "GET" }),
  allAgencies: () => api<{ agencies: ApiAgency[] }>("/admin/agencies/all", { method: "GET" }),
  approve: (slug: string) =>
    api<{ agency: ApiAgency }>(`/admin/agencies/${slug}/approve`, { method: "POST" }),
  reject: (slug: string) =>
    api<{ ok: true }>(`/admin/agencies/${slug}/reject`, { method: "POST" }),
  recentProjects: () =>
    api<{ projects: ApiProject[] }>("/admin/projects/recent", { method: "GET" }),
  topAgencies: () =>
    api<{ agencies: ApiAgency[] }>("/admin/agencies/top", { method: "GET" }),
  updatePlan: (slug: string, plan: string) =>
    api<{ agency: ApiAgency }>(`/admin/agencies/${slug}/plan`, {
      method: "PATCH",
      body: JSON.stringify({ plan }),
    }),
  toggleFeatured: (slug: string, featured: boolean) =>
    api<{ agency: ApiAgency }>(`/admin/agencies/${slug}/featured`, {
      method: "PATCH",
      body: JSON.stringify({ featured }),
    }),
  deleteAgency: (slug: string) =>
    api<{ ok: true }>(`/admin/agencies/${slug}`, { method: "DELETE" }),
  enterpriseInquiries: () =>
    api<{ inquiries: ApiEnterpriseInquiry[] }>("/admin/enterprise-inquiries", { method: "GET" }),
  messages: () =>
    api<{ messages: ApiContactMessage[] }>("/admin/messages", { method: "GET" }),
};

export interface ApiContactMessage {
  _id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}

export interface ApiEnterpriseInquiry {
  _id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  requirements: string;
  createdAt: string;
}

export interface ApiNotification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: "new_lead" | "system" | "general" | "meeting_request" | "meeting_booked";
  read: boolean;
  link?: string;
  createdAt: string;
}

export const notificationApi = {
  list: () => api<{ notifications: ApiNotification[] }>("/notifications", { method: "GET" }),
  read: (id: string, read = true) =>
    api<{ notification: ApiNotification }>(`/notifications/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({ read }),
    }),
  readAll: () => api<{ ok: true }>("/notifications/read-all", { method: "POST" }),
};

export interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export const contactApi = {
  submit: (data: ContactSubmission) =>
    api<{ success: boolean; contact: any }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
  submitEnterprise: (data: { name: string; email: string; company?: string; phone?: string; requirements: string }) =>
    api<{ success: boolean; contact: any }>("/contact/enterprise", {
      method: "POST",
      body: JSON.stringify(data),
      auth: false,
    }),
};

export interface WpPost {
  id: number;
  date: string;
  modified?: string;
  slug: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  yoast_head_json?: {
    // The SEO title / meta description editors set in WordPress's Yoast panel.
    title?: string;
    description?: string;
    og_image?: {
      url: string;
    }[];
  };
  _embedded?: {
    author?: {
      name: string;
      slug: string;
      avatar_urls?: Record<string, string>;
    }[];
    "wp:featuredmedia"?: {
      source_url: string;
      media_details?: {
        width: number;
        height: number;
        sizes?: Record<string, {
          file: string;
          width: number;
          height: number;
          mime_type: string;
          source_url: string;
        }>;
      };
    }[];
    "wp:term"?: {
      id: number;
      name: string;
      slug: string;
      taxonomy: string;
    }[][];
  };
}

const wpCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchWp<T>(url: string, timeoutMs = 6000): Promise<T> {
  const cached = wpCache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`WordPress API returned status ${res.status}`);
    const data = await res.json();
    wpCache.set(url, { data, expiry: Date.now() + CACHE_TTL });
    return data as T;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const wpBlogApi = {
  list: async (limit = 12): Promise<WpPost[]> => {
    return fetchWp<WpPost[]>(`https://cms.findingglobal.com/wp-json/wp/v2/posts?per_page=${limit}&_embed`);
  },
  getBySlug: async (slug: string): Promise<WpPost | null> => {
    const posts = await fetchWp<WpPost[]>(`https://cms.findingglobal.com/wp-json/wp/v2/posts?slug=${slug}&_embed`);
    return posts.length > 0 ? posts[0] : null;
  },
  getRecent: async (excludeId?: number, limit = 3): Promise<WpPost[]> => {
    const excludeParam = excludeId ? `&exclude=${excludeId}` : "";
    return fetchWp<WpPost[]>(`https://cms.findingglobal.com/wp-json/wp/v2/posts?per_page=${limit}${excludeParam}&_embed`);
  },
};

export interface ApiMeeting {
  _id: string;
  client: {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  clientName: string;
  clientEmail: string;
  agency: {
    _id: string;
    name: string;
    slug: string;
    logoSeed?: string;
  };
  agencySlug: string;
  agencyName: string;
  date: string;
  time: string;
  duration: number;
  topic: string;
  notes?: string;
  timezone?: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  meetingLink?: string;
  createdAt: string;
}

export const meetingsApi = {
  list: async (): Promise<{ meetings: ApiMeeting[] }> => {
    return api<{ meetings: ApiMeeting[] }>("/meetings");
  },
  requests: async (): Promise<{ requests: ApiLead[] }> => {
    return api<{ requests: ApiLead[] }>("/meetings/requests");
  },
  book: async (data: {
    agencySlug: string;
    date: string;
    time: string;
    topic: string;
    notes?: string;
    timezone?: string;
    meetingLink?: string;
    leadId?: string;
  }): Promise<{ meeting: ApiMeeting }> => {
    return api<{ meeting: ApiMeeting }>("/meetings", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (
    id: string,
    status: "accepted" | "declined" | "cancelled"
  ): Promise<{ meeting: ApiMeeting }> => {
    return api<{ meeting: ApiMeeting }>(`/meetings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};
