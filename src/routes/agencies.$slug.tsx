import { createFileRoute, Link, notFound, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { type Agency, type Award, type Client, type PortfolioItem, type Country, type BudgetTier } from "@/lib/mock-data";
import { SLUG_TO_INFO } from "@/lib/services";
import { AgenciesPage } from "./agencies.index";
import { agencyApi, type ApiAgency } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PortfolioModal } from "@/components/portfolio-modal";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { DropdownSelect } from "@/components/dropdown-select";
import { getUtmWebsiteUrl } from "@/lib/utils";
import { Wallet, MapPin, Users, Building2, Star, ShieldCheck, Briefcase, Globe, Award as AwardIcon, Heart, CheckCircle2 } from "lucide-react";
import { PlusTailwindTag } from "@/components/plus-tag";


type AgencyExt = Agency & {
  awards: Award[];
  clients: Client[];
  messages: {
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message: string;
    createdAt?: string;
  }[];
  teamImage?: string;
  teamStory?: string;
  website?: string;
};

function fallbackAwards(name: string): Award[] {
  return [
    { title: "Agency of the Year — Global", organization: "Global Effie Awards", year: 2024, category: "Effectiveness" },
    { title: "Best Brand Campaign", organization: "Dubai Lynx", year: 2024, category: "Creative" },
    { title: "Top 50 Independent Agencies", organization: "Campaign Global", year: 2023, category: "Industry" },
    { title: `${name.split(" ")[0]} Excellence Award`, organization: "Transform Awards", year: 2023, category: "Branding" },
  ];
}

function fallbackClients(): Client[] {
  return [
    { name: "Emirates NBD", industry: "Finance & Banking", logoSeed: "enbd" },
    { name: "Aramco Ventures", industry: "Energy", logoSeed: "aramco-v" },
    { name: "Majid Al Futtaim", industry: "Retail & E-commerce", logoSeed: "maf" },
    { name: "Etisalat", industry: "Technology & SaaS", logoSeed: "etisalat" },
    { name: "Qatar Airways", industry: "Hospitality & Travel", logoSeed: "qa" },
    { name: "Mubadala", industry: "Finance & Banking", logoSeed: "mubadala" },
    { name: "ADNOC", industry: "Energy", logoSeed: "adnoc" },
    { name: "Talabat", industry: "Technology & SaaS", logoSeed: "talabat" },
  ];
}

function adaptAgency(a: ApiAgency): AgencyExt {
  const base: Agency = {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline?.startsWith("Leading agency specializing in") ? "" : a.tagline,
    description: a.description ?? "",
    city: a.city,
    country: a.country as Agency["country"],
    countryCode: a.countryCode,
    founded: a.founded ?? 0,
    teamSize: a.teamSize ?? "",
    minBudget: a.minBudget,
    rating: a.rating,
    reviewCount: a.reviewCount,
    services: a.services as Agency["services"],
    industries: a.industries as Agency["industries"],
    logoSeed: a.logoSeed,
    coverSeed: a.coverSeed ?? "",
    featured: a.featured,
    verified: a.verified,
    plan: a.plan,
    portfolio: (a.portfolio ?? []) as Agency["portfolio"],
    team: (a.team ?? []) as Agency["team"],
    reviews: (a.reviews ?? []) as Agency["reviews"],
  };
  const awardsRaw = (a.awards ?? []) as Award[];
  const clientsRaw = (a.clients ?? []) as Client[];
  const messagesRaw = a.messages ?? [];
  return {
    ...base,
    awards: awardsRaw,
    clients: clientsRaw,
    messages: messagesRaw,
    teamImage: a.teamImage,
    teamStory: a.teamStory,
    website: a.website,
  };
}

// Acronyms/initialisms in our service list that are pronounced starting with a vowel sound
// despite a consonant spelling (e.g. "an SEO agency", not "a SEO agency").
const VOWEL_SOUND_OVERRIDES = new Set(["SEO"]);

function withArticle(word: string): string {
  const firstWord = word.trim().split(/\s+/)[0] ?? "";
  const startsWithVowelSound =
    VOWEL_SOUND_OVERRIDES.has(firstWord.toUpperCase()) || /^[aeiou]/i.test(firstWord);
  return `${startsWithVowelSound ? "an" : "a"} ${word}`;
}

// Title: "{Agency} Pricing and Services | Finding Global", falling back to a shorter
// "{Agency} | {Service} Agency | Finding Global" whenever the primary form would run past a
// search result's effective display width (~60 characters).
function buildAgencyTitle(name: string, primaryService: string): string {
  const primary = `${name} Pricing and Services | Finding Global`;
  if (primary.length <= 60) return primary;
  return `${name} | ${primaryService} Agency | Finding Global`;
}

// Description: "{Agency} is a/an {Service} agency, team of {TeamSize}, projects from
// ${MinPrice}. See full services, pricing, verified profile, and client reviews." — each
// data-dependent clause is dropped cleanly if that field isn't set on the agency.
function buildAgencyDescription(name: string, primaryService: string, teamSize?: string, minBudget?: number): string {
  const clauses = [`${name} is ${withArticle(primaryService)} agency`];
  if (teamSize) clauses.push(`team of ${teamSize}`);
  if (minBudget) clauses.push(`projects from $${minBudget.toLocaleString("en-US")}`);
  return `${clauses.join(", ")}. See full services, pricing, verified profile, and client reviews.`;
}

const OLD_SLUG_REDIRECTS: Record<string, string> = {
  "seo": "seo-services",
  "software": "software-development",
  "ppc": "ppc-paid-ads",
  "social-media": "social-media-management",
  "influencer": "influencer-marketing",
  "mobile-app": "mobile-app-development",
  "ecommerce": "e-commerce",
  "ui-ux": "ui-ux-design",
  "ai": "artificial-intelligence",
  "api": "api-integration",
  "events": "event-management",
  "naming": "naming-positioning",
  "creative": "creative-services",
  "design": "design-services",
  "marketing": "marketing-services",
  "consulting": "consulting-services",
  "corporate-comms": "corporate-communications",
};

interface AgencySlugSearch {
  from?: string;
  category?: string;
  service?: string;
  country?: Country;
  budget?: BudgetTier;
  q?: string;
}

export const Route = createFileRoute("/agencies/$slug")({
  validateSearch: (search: Record<string, unknown>): AgencySlugSearch => ({
    from: (search.from as string) || undefined,
    category: (search.category as string) || undefined,
    service: (search.service as string) || undefined,
    country: (search.country as Country) || undefined,
    budget: (search.budget as BudgetTier) || undefined,
    q: (search.q as string) || undefined,
  }),
  loader: async ({ params }): Promise<
    | { type: "agency"; agency: AgencyExt }
    | { type: "service"; slug: string }
  > => {
    if (params.slug in OLD_SLUG_REDIRECTS) {
      throw redirect({
        to: `/agencies/${OLD_SLUG_REDIRECTS[params.slug]}/`,
        search: (search) => search,
      });
    }
    if (params.slug in SLUG_TO_INFO) {
      return { type: "service", slug: params.slug };
    }
    try {
      const { agency } = await agencyApi.get(params.slug);
      return { type: "agency", agency: adaptAgency(agency) };
    } catch {
      throw notFound();
    }
  },
  errorComponent: ({ error }) => (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <span className="eyebrow text-destructive">Error</span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        Couldn't load this agency
      </h1>
      <p className="mt-3 max-w-md text-sm font-bold text-steel-dark">
        {error instanceof Error ? error.message : "Unexpected error"}
      </p>
      <Link
        to="/agencies"
        className="mt-8 rounded-sm bg-obsidian px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue"
      >
        Browse all agencies
      </Link>
    </div>
  ),
  head: ({ loaderData, params }) => {
    const slug = params?.slug;
    if (loaderData?.type === "service" && slug && SLUG_TO_INFO[slug]) {
      const info = SLUG_TO_INFO[slug];
      const canonicalHref = `https://findingglobal.com/agencies/${slug}/`;
      return {
        meta: [
          { title: `Top ${info.title} Companies — Finding Global` },
          {
            name: "description",
            content: `Explore vetted ${info.title} companies globally. Filter by service, country, budget, and rating.`,
          },
          { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
          { property: "og:title", content: `Top ${info.title} Companies — Finding Global` },
          {
            property: "og:description",
            content: `Explore the global directory of vetted ${info.title} marketing, tech, and creative partners.`,
          },
        ],
        links: [
          { rel: "canonical", href: canonicalHref },
        ],
      };
    }

    const a = loaderData?.type === "agency" ? loaderData.agency : null;
    const canonicalHref = slug ? `https://findingglobal.com/agencies/${slug}/` : "https://findingglobal.com/agencies/";
    if (!a) {
      return {
        links: [
          { rel: "canonical", href: canonicalHref },
        ],
      };
    }
    const primaryService = a.services?.[0] || "Digital Marketing";
    const title = buildAgencyTitle(a.name, primaryService);
    const description = buildAgencyDescription(a.name, primaryService, a.teamSize, a.minBudget);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
      links: [
        { rel: "canonical", href: canonicalHref },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-32 text-center">
      <span className="eyebrow text-hyperblue">Not in directory</span>
      <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Agency not found</h1>
      <Link
        to="/agencies/"
        className="mt-8 rounded-sm bg-obsidian px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue"
      >
        Browse all agencies
      </Link>
    </div>
  ),
  component: AgenciesSlugRouteComponent,
});

function AgenciesSlugRouteComponent() {
  const data = Route.useLoaderData();
  const searchParams = Route.useSearch();

  if (data.type === "service") {
    const info = SLUG_TO_INFO[data.slug];
    const isParentCategory = info.category && !info.parent;

    return (
      <AgenciesPage
        key={data.slug}
        initialService={!isParentCategory ? data.slug : undefined}
        initialCategory={isParentCategory ? data.slug : undefined}
        searchParams={searchParams}
      />
    );
  }

  return <AgencyProfile key={data.agency.slug} agency={data.agency} />;
}

function fmtBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "Web Development": <Globe className="size-4" strokeWidth={2} />,
  "Mobile Development": <Briefcase className="size-4" strokeWidth={2} />,
  "Branding": <ShieldCheck className="size-4" strokeWidth={2} />,
  "Creative & Design": <Heart className="size-4" strokeWidth={2} />,
  "Marketing": <AwardIcon className="size-4" strokeWidth={2} />,
  "Performance & Paid Media": <Wallet className="size-4" strokeWidth={2} />,
  "SEO & Content": <CheckCircle2 className="size-4" strokeWidth={2} />,
  "Strategy & Consulting": <Building2 className="size-4" strokeWidth={2} />,
};

const SECTIONS: { id: string; label: string; ownerOnly?: boolean }[] = [
  { id: "about", label: "About" },
  { id: "services", label: "Services" },
  { id: "portfolio", label: "Portfolio" },
  { id: "team", label: "Team" },
  { id: "reviews", label: "Reviews" },
  { id: "awards", label: "Awards" },
  { id: "clients", label: "Clients" },
  { id: "contact", label: "Contact" },
];

function AgencyProfile({ agency }: { agency: AgencyExt }) {
  const { user } = useAuth();
  const isOwner = user?.role === "agency" && user?.agencySlug === agency.slug;
  const [active, setActive] = useState("about");
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const isManualScroll = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const search = Route.useSearch();
  const from = search.from;

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (from) {
      navigate({ to: from as any });
    } else {
      navigate({ to: "/agencies" });
    }
  };



  const visibleSections = useMemo(() => {
    return SECTIONS.filter((s) => {
      if (s.ownerOnly && !isOwner) return false;
      if (s.id === "portfolio" && (!agency.portfolio || agency.portfolio.length === 0)) return false;
      if (s.id === "awards" && (!agency.awards || agency.awards.length === 0)) return false;
      if (s.id === "team" && !agency.teamImage) return false;
      if (s.id === "clients" && (!agency.clients || agency.clients.length === 0)) return false;
      if (s.id === "reviews" && (!agency.reviews || agency.reviews.length === 0)) return false;
      return true;
    });
  }, [agency.portfolio, agency.awards, agency.teamImage, agency.clients, agency.reviews, isOwner]);

  useLayoutEffect(() => {
    const activeTab = tabRefs.current[active];
    const indicator = indicatorRef.current;
    if (!activeTab || !indicator) return;

    const update = () => {
      indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
      indicator.style.width = `${activeTab.offsetWidth}px`;
      indicator.style.opacity = "1";
    };

    update();

    // Use ResizeObserver for more robust updates (fonts loading, etc)
    const ro = new ResizeObserver(update);
    ro.observe(activeTab);
    if (navRef.current) ro.observe(navRef.current);

    return () => ro.disconnect();
  }, [active]);

  useEffect(() => {
    const handleScroll = () => {
      if (isManualScroll.current) return;

      const scrollPosition = window.scrollY + 160; // Offset for header + buffer

      let currentSection = active;
      for (let i = visibleSections.length - 1; i >= 0; i--) {
        const s = visibleSections[i];
        const el = refs.current[s.id];
        if (el && el.offsetTop <= scrollPosition) {
          currentSection = s.id;
          break;
        }
      }

      if (currentSection !== active) {
        setActive(currentSection);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount to set initial active state
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [active, visibleSections]);

  const scrollTo = (id: string) => {
    const el = refs.current[id];
    if (!el) return;

    isManualScroll.current = true;
    setActive(id);

    const y = el.getBoundingClientRect().top + window.scrollY - 128;
    window.scrollTo({ top: y, behavior: "smooth" });

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isManualScroll.current = false;
    }, 1000);
  };
  const bannerUrl = (agency.coverSeed?.startsWith("http") || agency.coverSeed?.startsWith("data:"))
    ? agency.coverSeed
    : `https://picsum.photos/seed/${agency.coverSeed || agency.logoSeed || agency.name}/1650/500`;

  const logoUrl = agency.logoSeed?.startsWith("http") || agency.logoSeed?.startsWith("data:")
    ? agency.logoSeed
    : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=003bb3,050505,52525B`;

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": agency.name,
    "description": agency.description || agency.tagline,
    "url": `https://findingglobal.com/agencies/${agency.slug}/`,
    "logo": logoUrl,
    "image": bannerUrl,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": agency.city,
      "addressCountry": agency.country,
    },
    ...(agency.reviewCount > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": agency.rating,
        "reviewCount": agency.reviewCount,
      }
    } : {}),
    "priceRange": agency.minBudget ? `$$$ (${fmtBudget(agency.minBudget)}+)` : "$$"
  };

  return (
    <div className="bg-background">
      <script type="application/ld+json">
        {JSON.stringify(schemaJson)}
      </script>
      {/* COVER */}
      <section className="relative overflow-hidden">
        {/* Floating Back Button */}
        <div className="absolute top-4 left-4 z-20 md:top-6 md:left-6">
          <button
            onClick={handleBack}
            className="flex size-9 items-center justify-center rounded-full bg-white/90 backdrop-blur border border-border/50 shadow-md text-obsidian hover:bg-white active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-left-4 duration-300"
            aria-label="Back"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="relative aspect-[2.5/1] md:aspect-[3.3/1] w-full overflow-hidden bg-obsidian">
          <img
            src={bannerUrl}
            className="h-full w-full object-cover transition-transform duration-700"
            alt=""
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${agency.name}/1650/500`;
            }}
          />


          {/* Readability gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

          {/* Decorative architectural grid */}
          <div className="architectural-grid absolute inset-0 opacity-10 pointer-events-none" />
        </div>



        <div className="relative z-10 mx-auto -mt-6 md:-mt-8 max-w-7xl px-4 md:px-6 pb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col items-center text-center md:items-start md:text-left gap-5 md:flex-row flex-1 min-w-0">
              <div className="relative shrink-0">
                <div className="relative size-28 overflow-hidden rounded-2xl border-4 border-background bg-card shadow-xl md:size-36">
                  <img
                    src={agency.logoSeed?.startsWith("http") || agency.logoSeed?.startsWith("data:") ? agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=003bb3,050505,52525B`}
                    alt={`${agency.name} logo`}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
                {agency.plan === "Growth" && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none">
                    <PlusTailwindTag />
                  </span>
                )}
              </div>

              <div className="flex-1 md:pt-12 w-full">
                <div className="mb-3.5 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  {agency.country && (
                    <span className="inline-flex items-center rounded-full border border-black/[0.06] bg-white px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-obsidian shadow-xs">
                      {agency.country}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full border border-hyperblue/20 bg-hyperblue/[0.03] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-hyperblue shadow-xs">
                    <svg className="size-3 text-hyperblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    <span>Verified</span>
                  </span>
                </div>
                <h1 className="text-3xl font-black tracking-tight text-obsidian md:text-5xl flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  <span>{agency.name}</span>
                  {agency.website && (
                    <a
                      href={getUtmWebsiteUrl(agency.website, agency.plan || "basic", "profile")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center text-obsidian/60 hover:text-hyperblue transition-all active:scale-95 cursor-pointer"
                      title="Visit Website"
                    >
                      <svg className="size-5 md:size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </a>
                  )}
                </h1>
                {agency.tagline && (
                  <p className="mt-2 text-base md:text-lg font-medium text-steel-dark leading-relaxed">
                    {agency.tagline}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 text-xs font-bold text-steel-dark">
                  <div className="flex items-center gap-1">
                    <span className="text-warning">★</span>
                    <span className="text-obsidian">{agency.rating.toFixed(1)}</span>
                    <span className="opacity-60">({agency.reviewCount} reviews)</span>
                  </div>
                  <span className="opacity-20 hidden sm:inline">•</span>
                  <span>{agency.teamSize} people</span>
                  <span className="opacity-20 hidden sm:inline">•</span>
                  <span>Est. {agency.founded}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
              {isOwner ? (
                <Link
                  to="/agency-onboarding"
                  className="rounded-xl bg-hyperblue px-8 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-obsidian shadow-lg shadow-hyperblue/20 active:scale-95 w-full md:w-auto"
                >
                  Edit Profile
                </Link>
              ) : (
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="rounded-xl bg-hyperblue hover:bg-obsidian text-white px-8 py-3.5 text-center text-[11px] font-bold uppercase tracking-widest transition-all shadow-md hover:shadow-lg active:scale-95 w-full md:w-auto cursor-pointer"
                  >
                    Book a Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STICKY TAB NAV */}
      <nav className="hidden sm:block sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div ref={navRef} className="relative mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6 no-scrollbar">
          {/* Sliding Indicator */}
          <div
            ref={indicatorRef}
            className="absolute bottom-0 left-0 h-0.5 bg-hyperblue transition-[transform,width] duration-300 ease-out pointer-events-none"
            style={{
              opacity: 0,
              willChange: "transform, width",
            }}
          />
          {visibleSections.map((s) => (
            <button
              key={s.id}
              ref={(el) => { tabRefs.current[s.id] = el; }}
              type="button"
              onClick={() => scrollTo(s.id)}
              className={`relative whitespace-nowrap px-2 sm:px-4 py-4 text-[10px] sm:text-xs font-bold uppercase tracking-normal sm:tracking-widest transition-colors ${active === s.id ? "text-obsidian" : "text-steel-dark hover:text-obsidian"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN GRID */}
      <section className="py-8 md:py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[1fr_320px] px-4 md:px-6">
          <div className="space-y-16 min-w-0">
            {/* ABOUT */}
            <section
              id="about"
              ref={(el) => { refs.current.about = el; }}
              className="scroll-mt-32"
            >
              <h3 className="mt-5 text-3xl font-bold tracking-tight text-obsidian">Who we are</h3>
              <p className="mt-4 text-lg leading-relaxed text-steel-dark max-w-3xl font-medium">
                {agency.description}
              </p>

              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    k: "Founded",
                    v: String(agency.founded),
                    icon: <Building2 className="size-4 text-obsidian" strokeWidth={2} />
                  },
                  {
                    k: "Team size",
                    v: agency.teamSize,
                    icon: <Users className="size-4 text-obsidian" strokeWidth={2} />
                  },
                  {
                    k: "Rating",
                    v: `${agency.rating.toFixed(1)} / 5`,
                    icon: <Star className="size-4 text-obsidian" strokeWidth={2} />
                  },
                  {
                    k: "Min. budget",
                    v: fmtBudget(agency.minBudget),
                    icon: <Wallet className="size-4 text-obsidian" strokeWidth={2} />
                  },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl border border-border/80 bg-card p-5 transition-all duration-300 hover:border-obsidian/20 hover:shadow-card-hover">
                    <div className="size-8 mb-3 rounded-lg bg-neutral-50 border border-border/40 flex items-center justify-center">
                      {s.icon}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-steel-dark mb-1">{s.k}</div>
                    <div className="text-lg font-bold tracking-tight text-obsidian">{s.v}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* SERVICES */}
            <section
              id="services"
              ref={(el) => { refs.current.services = el; }}
              className="scroll-mt-32"
            >
              <h3 className="mt-6 text-4xl font-black tracking-tight text-obsidian">What we do</h3>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {agency.services.map((s) => {
                  const icon = SERVICE_ICONS[s] || <CheckCircle2 className="size-4" strokeWidth={2} />;
                  return (
                    <div
                      key={s}
                      className="group flex items-center justify-between rounded-2xl border border-border/60 bg-white p-5 transition-all hover:border-obsidian hover:shadow-elevated"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian transition-colors group-hover:bg-obsidian group-hover:text-white">
                          {icon}
                        </div>
                        <span className="text-base font-bold text-obsidian tracking-tight">{s}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[8px] font-black uppercase tracking-[0.15em] text-steel-dark">Starting from</span>
                        <span className="text-base font-black text-obsidian">{fmtBudget(agency.minBudget)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {agency.industries && agency.industries.length > 0 && (
                <div className="mt-10 rounded-2xl border border-border/50 bg-surface/50 p-6 md:p-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-steel-dark">Industries expertise</h4>
                  <ul className="mt-5 flex flex-wrap gap-2.5">
                    {agency.industries.map((i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-border/60 bg-white px-4 py-2 text-xs font-bold text-obsidian shadow-sm transition-all hover:border-obsidian hover:-translate-y-0.5"
                      >
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* PORTFOLIO */}
            {agency.portfolio && agency.portfolio.length > 0 && (
              <section
                id="portfolio"
                ref={(el) => { refs.current.portfolio = el; }}
                className="scroll-mt-32"
              >
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="mt-6 text-4xl font-black tracking-tight text-obsidian">Selected work</h3>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {agency.portfolio.map((p) => (
                    <button
                      key={p.title}
                      type="button"
                      onClick={() => setSelectedProject(p)}
                      className="group relative flex flex-col sm:flex-row items-stretch gap-6 sm:gap-8 overflow-hidden rounded-[2rem] border border-border/60 bg-white p-6 text-left transition-all hover:border-hyperblue/30 hover:shadow-elevated active:scale-[0.98]"
                    >
                      {/* Circular Logo Area */}
                      <div className="flex justify-center sm:block shrink-0">
                        <div className="relative size-24 overflow-hidden rounded-full border border-border/50 bg-white transition-transform duration-500 group-hover:scale-110">
                          <img
                            src={p.imageSeed?.startsWith("http") || p.imageSeed?.startsWith("data:") ? p.imageSeed : `https://picsum.photos/seed/${p.imageSeed || p.title}/800/600`}
                            alt={p.title}
                            loading="lazy"
                            className="h-full w-full object-cover rounded-full"
                          />
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-hyperblue">{p.client}</div>
                          <div className="rounded-full bg-surface px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-steel-dark border border-border/50">
                            {p.category}
                          </div>
                        </div>

                        <h4 className="text-2xl font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors truncate">
                          {p.title}
                        </h4>

                        <p className="mt-2 text-sm leading-relaxed text-steel-dark font-medium line-clamp-2 opacity-80">
                          {p.summary}
                        </p>

                        <div className="mt-5 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-obsidian/40 group-hover:text-hyperblue transition-colors">
                          <span className="group-hover:underline decoration-2 underline-offset-4">Details</span>
                          <svg className="size-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* TEAM */}
            {agency.teamImage && (
              <section
                id="team"
                ref={(el) => { refs.current.team = el; }}
                className="scroll-mt-32"
              >
                <div className="mb-6">
                  <h3 className="text-4xl font-black tracking-tight text-obsidian">Team</h3>
                  <p className="mt-2 text-sm font-bold text-steel-dark">
                    <span className="text-obsidian">{agency.teamSize} members</span> in {agency.name}'s team
                  </p>
                </div>

                {agency.teamImage && (
                  <div className="mb-8 w-full overflow-hidden rounded-2xl shadow-md">
                    <img
                      src={agency.teamImage.startsWith("http") || agency.teamImage.startsWith("data:") ? agency.teamImage : `https://picsum.photos/seed/${agency.teamImage}/1200/500`}
                      alt={`${agency.name} team`}
                      className="w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {agency.teamStory && (
                  <div className="mb-12">
                    <h4 className="mb-4 text-xl font-bold tracking-tight text-obsidian">Story</h4>
                    <p className="text-base leading-relaxed text-steel-dark font-medium whitespace-pre-line">
                      {agency.teamStory}
                    </p>
                  </div>
                )}

                {agency.team.length > 0 && (
                  <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                    {agency.team.map((m) => (
                      <div key={m.name} className="group text-center">
                        <div className="relative mx-auto size-24 overflow-hidden rounded-2xl bg-obsidian transition-transform group-hover:-translate-y-2">
                          <div className="flex h-full w-full items-center justify-center text-xl font-black text-white">
                            {m.initials}
                          </div>
                          <div className="absolute inset-0 bg-hyperblue mix-blend-overlay opacity-0 group-hover:opacity-40 transition-opacity" />
                        </div>
                        <div className="mt-6 text-base font-black text-obsidian">{m.name}</div>
                        <div className="mt-1 text-xs font-bold text-steel-dark uppercase tracking-widest">{m.role}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* REVIEWS */}
            {visibleSections.some((s) => s.id === "reviews") && (
              <section
                id="reviews"
                ref={(el) => {
                  refs.current.reviews = el;
                }}
                className="scroll-mt-32"
              >
                <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-4xl font-black tracking-tight text-obsidian">Client reviews</h3>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-3">
                    <span className="text-3xl font-black text-obsidian">{agency.rating.toFixed(1)}</span>
                    <div className="flex flex-col">
                      <div className="text-warning text-sm">{"★".repeat(5)}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-steel-dark">{agency.reviewCount} verified reviews</div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 relative h-[380px] overflow-hidden w-full animate-in fade-in duration-500">
                  {agency.reviews && agency.reviews.length > 0 ? (
                    <>
                      {/* Top and Bottom Fades */}
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-10" />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />

                      {/* Scrolling Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                        {/* Column 1 */}
                        <div className="relative h-full overflow-hidden flex flex-col">
                          <div className="flex flex-col gap-6 animate-marquee-vertical-slow">
                            {[...agency.reviews, ...agency.reviews].map((r, idx) => (
                              <article
                                key={`col1-${idx}-${r.author}`}
                                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-hyperblue/20 transition-all duration-300 flex flex-col justify-between"
                              >
                                <div>
                                  {/* Rating and date row */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-bold text-warning">
                                      {"★".repeat(r.rating)}
                                      <span className="text-steel-light">{"★".repeat(5 - r.rating)}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-steel">
                                      {r.date}
                                    </span>
                                  </div>

                                  {/* Review text */}
                                  <p className="text-sm font-medium text-steel-dark leading-relaxed mb-6">
                                    "{r.excerpt}"
                                  </p>
                                </div>

                                {/* Author block */}
                                <div className="flex items-center gap-3 border-t border-border/40 pt-4 mt-auto">
                                  <div className="size-10 rounded-full bg-surface border border-border/60 flex items-center justify-center font-black text-hyperblue text-sm shrink-0">
                                    {r.author.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-obsidian leading-none">{r.author}</span>
                                    <span className="text-xs text-steel mt-1">{r.company}</span>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>

                        {/* Column 2 - Hidden on mobile, fast vertical marquee on desktop */}
                        <div className="relative h-full overflow-hidden flex flex-col hidden md:flex">
                          <div className="flex flex-col gap-6 animate-marquee-vertical-fast">
                            {[...agency.reviews, ...agency.reviews].reverse().map((r, idx) => (
                              <article
                                key={`col2-${idx}-${r.author}`}
                                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-hyperblue/20 transition-all duration-300 flex flex-col justify-between"
                              >
                                <div>
                                  {/* Rating and date row */}
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="text-sm font-bold text-warning">
                                      {"★".repeat(r.rating)}
                                      <span className="text-steel-light">{"★".repeat(5 - r.rating)}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-steel">
                                      {r.date}
                                    </span>
                                  </div>

                                  {/* Review text */}
                                  <p className="text-sm font-medium text-steel-dark leading-relaxed mb-6">
                                    "{r.excerpt}"
                                  </p>
                                </div>

                                {/* Author block */}
                                <div className="flex items-center gap-3 border-t border-border/40 pt-4 mt-auto">
                                  <div className="size-10 rounded-full bg-surface border border-border/60 flex items-center justify-center font-black text-hyperblue text-sm shrink-0">
                                    {r.author.charAt(0)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-obsidian leading-none">{r.author}</span>
                                    <span className="text-xs text-steel mt-1">{r.company}</span>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* CSS styles for vertical scrolling */}
                      <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes marquee-vertical {
                          0% { transform: translateY(0); }
                          100% { transform: translateY(-50%); }
                        }
                        .animate-marquee-vertical-slow {
                          animation: marquee-vertical 160s linear infinite;
                        }
                        .animate-marquee-vertical-fast {
                          animation: marquee-vertical 120s linear infinite;
                        }
                        .animate-marquee-vertical-slow:hover,
                        .animate-marquee-vertical-fast:hover {
                          animation-play-state: paused;
                        }
                      `}} />
                    </>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center relative overflow-hidden">
                      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-obsidian/5 text-steel mb-4">
                        <Star className="size-8 text-steel-dark" strokeWidth={1.5} />
                      </div>
                      <p className="text-lg font-bold text-obsidian">No reviews yet</p>
                      <p className="mt-2 text-sm text-steel-dark max-w-sm mx-auto font-medium">
                        This agency hasn't received any verified client reviews on Finding Global yet.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* AWARDS */}
            {agency.awards && agency.awards.length > 0 && (
              <section
                id="awards"
                ref={(el) => { refs.current.awards = el; }}
                className="scroll-mt-32"
              >
                <h3 className="mt-6 text-4xl font-black tracking-tight text-obsidian">Awards & Accolades</h3>

                <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {agency.awards.map((a) => (
                    <div key={`${a.title}-${a.year}`} className="flex items-center gap-6 rounded-3xl border border-border bg-card p-6 transition-all hover:border-hyperblue hover:shadow-md group">
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface text-3xl transition-transform group-hover:scale-110">🏆</div>
                      <div className="min-w-0">
                        <div className="text-lg font-black leading-tight text-obsidian">{a.title}</div>
                        <div className="mt-1 text-sm font-bold text-steel-dark">{a.organization}</div>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-hyperblue">{a.year}</span>
                          {a.category && (
                            <>
                              <div className="h-2 w-px bg-border" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-steel">{a.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CLIENTS */}
            {agency.clients && agency.clients.length > 0 && (
              <section
                id="clients"
                ref={(el) => { refs.current.clients = el; }}
                className="scroll-mt-32"
              >
                <h3 className="mt-6 text-4xl font-black tracking-tight text-obsidian">Trusted by</h3>

                <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {agency.clients.map((c) => (
                    <div key={c.name} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-hyperblue hover:shadow-md">
                      <div className="size-16 mx-auto overflow-hidden rounded-xl bg-surface group-hover:scale-110 transition-transform">
                        <img
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${c.logoSeed || c.name}&backgroundColor=050505&textColor=ffffff`}
                          alt={c.name}
                          className="h-full w-full object-cover p-2"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-4 text-center">
                        <div className="truncate text-sm font-black text-obsidian">{c.name}</div>
                        {c.industry && <div className="mt-1 truncate text-[10px] font-black uppercase tracking-widest text-steel-dark">{c.industry}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* CONTACT */}
            <section
              id="contact"
              ref={(el) => { refs.current.contact = el; }}
              className="scroll-mt-32"
            >
              <h3 className="mt-6 text-4xl font-black tracking-tight text-obsidian">
                {isOwner ? "Inbound Requests" : `Work with ${agency.name}`}
              </h3>

              {isOwner ? (
                <div className="mt-8 rounded-3xl border border-border bg-surface p-12 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-hyperblue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white text-hyperblue mb-6 shadow-sm ring-8 ring-hyperblue/5">
                      <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-2xl font-bold tracking-tight text-obsidian">This is your storefront</h4>
                    <p className="mt-4 text-base font-medium text-steel-dark max-w-lg mx-auto">This section is how potential clients reach out to you. All messages are sent directly to your account email.</p>
                    <Link
                      to="/agency-onboarding"
                      className="mt-10 inline-flex rounded-xl bg-hyperblue px-8 py-4 text-[11px] font-bold uppercase tracking-widest text-white hover:bg-obsidian transition-all shadow-xl shadow-hyperblue/20 active:scale-95"
                    >
                      Update Profile Details
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-8 relative">
                  <div className="absolute -inset-4 bg-hyperblue/5 rounded-[40px] -z-10 blur-2xl" />
                  <div className="rounded-3xl border border-border bg-card p-1 shadow-elevated">
                    <ContactForm slug={agency.slug} agencyName={agency.name} />
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* STICKY SIDEBAR */}
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
              <div className="p-6 border-b border-border relative overflow-hidden group bg-surface/30">
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian border border-obsidian/10 group-hover:scale-110 group-hover:bg-hyperblue/5 group-hover:text-hyperblue group-hover:border-hyperblue/20 transition-all duration-300">
                    <Building2 className="size-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold tracking-tight text-obsidian">Core Details</h4>
                    <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-steel-dark/60 mt-0.5">Agency Overview</p>
                  </div>
                </div>
                {/* Subtle decorative element */}
                <div className="absolute -right-4 -top-4 size-24 bg-hyperblue/5 rounded-full blur-2xl group-hover:bg-hyperblue/10 transition-colors" />
              </div>

              <div className="p-5">
                {isOwner ? (
                  <Link
                    to="/agency-onboarding"
                    className="flex w-full items-center justify-center rounded-lg bg-hyperblue px-4 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-obsidian shadow-md shadow-hyperblue/10"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => scrollTo("contact")}
                      className="flex w-full items-center justify-center rounded-lg bg-obsidian px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-hyperblue hover:shadow-lg shadow-hyperblue/20"
                    >
                      Message agency
                    </button>
                  </div>
                )}

                <div className="mt-8 space-y-5">
                  {[
                    {
                      label: "Min. Budget",
                      value: fmtBudget(agency.minBudget),
                      icon: <Wallet className="size-4 text-obsidian" strokeWidth={1.5} />
                    },
                    {
                      label: "Location",
                      value: agency.city || agency.country,
                      icon: <MapPin className="size-4 text-obsidian" strokeWidth={1.5} />
                    },
                    {
                      label: "Team Size",
                      value: agency.teamSize,
                      icon: <Users className="size-4 text-obsidian" strokeWidth={1.5} />
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-4 group cursor-default">
                      <div className="size-10 shrink-0 rounded-xl bg-obsidian/5 flex items-center justify-center border border-obsidian/10 group-hover:border-obsidian/30 transition-all">
                        {item.icon}
                      </div>
                      <div>
                        <dt className="text-[9px] font-bold uppercase tracking-[0.1em] text-steel mb-0.5">{item.label}</dt>
                        <dd className="text-sm font-bold text-obsidian tracking-tight">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-steel mb-4">Core Focus</div>
                  <div className="flex flex-wrap gap-2">
                    {agency.services.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-md bg-obsidian/5 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest text-obsidian border border-transparent hover:border-obsidian/10 transition-colors">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* PORTFOLIO MODAL */}
      {selectedProject && (
        <PortfolioModal
          project={selectedProject}
          agency={agency}
          onClose={() => setSelectedProject(null)}
        />
      )}

      {/* MEETING MODAL */}
      <ScheduleMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        agencySlug={agency.slug}
        agencyName={agency.name}
      />
    </div>
  );
}


function ContactForm({ slug, agencyName }: { slug: string; agencyName: string }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", budget: "", message: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Name, email, and message are required.");
      return;
    }
    if (form.message.length > 4000) {
      setError("Message is too long (max 4000 characters).");
      return;
    }
    setStatus("submitting");
    try {
      await agencyApi.contact(slug, {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        budget: form.budget || undefined,
        message: form.message.trim(),
      });
      setStatus("success");
      setForm({ name: "", email: "", company: "", budget: "", message: "" });
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not send message.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
        <div className="flex size-20 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mb-6 shadow-sm ring-8 ring-hyperblue/5">
          <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h4 className="text-2xl font-bold tracking-tight text-obsidian">Message delivered</h4>
        <p className="mt-3 text-base font-medium text-steel-dark max-w-sm">
          {agencyName} has received your inquiry. Their team typically responds within one business day via email.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-10 rounded-md border border-border bg-card px-8 py-3 text-[11px] font-bold uppercase tracking-widest text-obsidian transition-all hover:border-obsidian hover:bg-surface shadow-sm"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 p-10 md:grid-cols-2">
      <Field label="Your name *">
        <input value={form.name} onChange={onChange("name")} maxLength={200} required className="input-base !rounded-xl !bg-surface/50 border-border/50 focus:!border-hyperblue h-12" placeholder="e.g. Sarah Jenkins" />
      </Field>
      <Field label="Email address *">
        <input type="email" value={form.email} onChange={onChange("email")} maxLength={200} required className="input-base !rounded-xl !bg-surface/50 border-border/50 focus:!border-hyperblue h-12" placeholder="sarah@company.com" />
      </Field>
      <Field label="Company name">
        <input value={form.company} onChange={onChange("company")} maxLength={200} className="input-base !rounded-xl !bg-surface/50 border-border/50 focus:!border-hyperblue h-12" placeholder="e.g. Acme Corp" />
      </Field>
      <Field label="Estimated budget">
        <DropdownSelect
          value={form.budget}
          onChange={(val) => setForm((f) => ({ ...f, budget: val }))}
          options={[
            { value: "", label: "Select range" },
            { value: "<25k", label: "Under $25,000" },
            { value: "25k-75k", label: "$25,000 – $75,000" },
            { value: "75k-150k", label: "$75,000 – $150,000" },
            { value: "150k-500k", label: "$150,000 – $500,000" },
            { value: "500k+", label: "$500,000+" },
          ]}
          placeholder="Select range"
          triggerClassName="!bg-surface/50 border-border/50 focus:border-hyperblue h-12 py-0 pl-4 pr-10 rounded-xl"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Project details *">
          <textarea
            value={form.message}
            onChange={onChange("message")}
            maxLength={4000}
            required
            rows={5}
            className="input-base !rounded-xl !bg-surface/50 border-border/50 focus:!border-hyperblue resize-y min-h-[160px] p-4"
            placeholder="Briefly describe your project, timeline, and goals."
          />
        </Field>
        <div className="mt-2 text-right text-[10px] font-black uppercase tracking-widest text-steel-dark">
          {form.message.length} <span className="text-steel">/ 4000 characters</span>
        </div>
      </div>
      {error && (
        <div className="md:col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-4 text-xs font-black text-destructive flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          {error}
        </div>
      )}
      <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border pt-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-steel-dark leading-relaxed max-w-xs">
          By submitting this form, you agree to our <span className="text-hyperblue underline cursor-pointer">Terms of Service</span>.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full sm:w-auto rounded-full bg-obsidian px-10 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-hyperblue hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl"
        >
          {status === "submitting" ? "Sending Request..." : "Send Message"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-steel-dark">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}