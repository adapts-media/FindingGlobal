import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { SLUG_TO_INFO } from "@/lib/services";
import { AgencyCard } from "@/components/agency-card";
import { ChevronDown, ArrowRight, Search } from "lucide-react";
import {
  SERVICE_CATEGORIES,
  COUNTRIES,
  BUDGET_TIERS,
  type ServiceCategory,
  type Country,
  type BudgetTier,
  type Agency,
} from "@/lib/mock-data";
import { agencyApi, type ApiAgency } from "@/lib/api";
import { getCountryFlagUrl } from "@/lib/country-codes";
import { LazyFlag } from "@/components/lazy-flag";

// Paid-tier priority: Growth ("FindingGlobal+", paid) > Starter (free) — mirrors
// server/src/lib/matching.js so directory ordering matches project-matching priority.
const PLAN_RANK: Record<string, number> = { Growth: 1, Starter: 0 };

function adaptAgency(a: ApiAgency): Agency {
  return {
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
    website: a.website,
  };
}

interface AgencySearch {
  category?: string;
  service?: string;
  country?: Country;
  budget?: BudgetTier;
  q?: string;
}

export const Route = createFileRoute("/agencies/")({
  validateSearch: (search: Record<string, unknown>): AgencySearch => ({
    category: (search.category as string) || undefined,
    service: (search.service as string) || undefined,
    country: (search.country as Country) || undefined,
    budget: (search.budget as BudgetTier) || undefined,
    q: (search.q as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Browse Global Agencies — Finding Global" },
      {
        name: "description",
        content:
          "Explore vetted agencies globally. Filter by service, country, budget, and rating.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Browse Global Agencies — Finding Global" },
      {
        property: "og:description",
        content: "Explore the global directory of vetted marketing, tech, and creative partners.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/agencies/" },
    ],
  }),
  component: function AgenciesRouteComponent() {
    const searchParams = Route.useSearch();
    return <AgenciesPage searchParams={searchParams} />;
  },
});

export function AgenciesPage({
  initialService,
  initialCategory,
  searchParams,
}: {
  initialService?: string;
  initialCategory?: string;
  searchParams: AgencySearch;
}) {
  const initial = useMemo(() => ({
    ...searchParams,
    service: initialService ?? searchParams.service,
    category: initialCategory ?? searchParams.category,
  }), [searchParams, initialService, initialCategory]);

  const [service, setService] = useState<ServiceCategory | "all">(initial.service ? (SLUG_TO_INFO[initial.service]?.category ?? "all") : "all");
  const [country, setCountry] = useState<Country | "all">(initial.country ?? "all");
  const [budget, setBudget] = useState<BudgetTier | "all">(initial.budget ?? "all");
  const [sort, setSort] = useState<"rating" | "reviews" | "minBudget">("rating");
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const pageInfo = useMemo(() => {
    if (initial.q) {
      const matchedSlug = Object.keys(SLUG_TO_INFO).find(
        (key) => SLUG_TO_INFO[key].title.toLowerCase() === initial.q?.toLowerCase()
      );
      if (matchedSlug) {
        const info = SLUG_TO_INFO[matchedSlug];
        return {
          title: `Top ${info.title} Companies`,
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: info.parent || "Directory", href: "/agencies/" },
            { label: info.title }
          ],
          dbServiceFilter: info.category
        };
      }
      return {
        title: `Search Results for "${initial.q}"`,
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: "Directory", href: "/agencies/" },
          { label: `Search: ${initial.q}` }
        ],
        dbServiceFilter: undefined
      };
    }
    if (initial.service && SLUG_TO_INFO[initial.service]) {
      const info = SLUG_TO_INFO[initial.service];
      return {
        title: `Top ${info.title} Companies`,
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: info.parent || "Directory", href: "/agencies/" },
          { label: info.title }
        ],
        dbServiceFilter: info.category
      };
    }
    if (initial.category && SLUG_TO_INFO[initial.category]) {
      const info = SLUG_TO_INFO[initial.category];
      return {
        title: `Top ${info.title} Companies`,
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: info.title }
        ],
        dbServiceFilter: info.category
      };
    }
    if (service !== "all") {
      return {
        title: `Top ${service} Companies`,
        breadcrumbs: [
          { label: "Home", href: "/" },
          { label: "Directory", href: "/agencies/" },
          { label: service }
        ],
        dbServiceFilter: service
      };
    }
    return {
      title: "Top Agencies Globally",
      breadcrumbs: [
        { label: "Home", href: "/" },
        { label: "Directory" }
      ],
      dbServiceFilter: undefined
    };
  }, [initial.service, initial.category, service, initial.q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [service, country, budget, sort]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const activeServiceFilter = pageInfo.dbServiceFilter || (service !== "all" ? service : undefined);

    agencyApi
      .list({
        service: activeServiceFilter,
        country: country !== "all" ? country : undefined,
      })
      .then((r) => {
        if (!cancelled) setAgencies(r.agencies.map(adaptAgency));
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? `${err.message} — is the backend running on VITE_API_URL?`
              : "Failed to load agencies"
          );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [service, country, pageInfo.dbServiceFilter]);

  const filtered = useMemo(() => {
    const tier = budget !== "all" ? BUDGET_TIERS.find((b) => b.id === budget) : null;
    const activeServiceFilter = pageInfo.dbServiceFilter || (service !== "all" ? service : undefined);

    return agencies.filter((a) => {
      if (activeServiceFilter && !a.services.includes(activeServiceFilter)) return false;
      if (country !== "all" && a.country !== country) return false;
      if (tier && a.minBudget > tier.max) return false;

      if (initial.q) {
        const query = initial.q.toLowerCase();
        const matchesName = a.name.toLowerCase().includes(query);
        const matchesTagline = a.tagline.toLowerCase().includes(query);
        const matchesDesc = a.description.toLowerCase().includes(query);
        const matchesServices = a.services.some(s => s.toLowerCase().includes(query));
        const matchesIndustries = a.industries.some(i => i.toLowerCase().includes(query));
        
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesServices && !matchesIndustries) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Paid-tier agencies (Growth/"FindingGlobal+") always surface above
      // free Starter agencies, within every category/filter combination; the chosen sort
      // (rating/reviews/budget) only orders agencies within the same tier.
      const tierDiff = PLAN_RANK[b.plan ?? "Starter"] - PLAN_RANK[a.plan ?? "Starter"];
      if (tierDiff !== 0) return tierDiff;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "reviews") return b.reviewCount - a.reviewCount;
      return a.minBudget - b.minBudget;
    });
  }, [agencies, service, country, budget, sort, pageInfo.dbServiceFilter, initial.q]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedAgencies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  return (
    <div className="bg-background min-h-screen">
      {/* Sleek Dark Hero Section matching user screenshot */}
      <section className="bg-[#121212] text-white pt-24 pb-28 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="architectural-grid absolute inset-0 opacity-15 pointer-events-none" />

        {/* Radial Glow Highlight */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-hyperblue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1 mb-6 shadow-sm backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />
            <span className="eyebrow text-white/70 text-[9px] font-bold tracking-widest uppercase">Verified Directory</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-4xl leading-[1.1]">
            {pageInfo.title}
          </h1>

          {/* Subheading */}
          <p className="mt-4 max-w-2xl text-base md:text-lg font-medium text-white/60 leading-relaxed">
            Which one is the best for your company?
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              to="/submit-project/"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-sm font-extrabold text-obsidian shadow-lg hover:bg-neutral-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Find my agency
            </Link>
            <span className="text-xs font-bold text-white/40 tracking-wide">
              Takes 3 min. 100% free
            </span>
          </div>
        </div>
      </section>

      {/* BREADCRUMB & METRICS BAR */}
      <section className="border-b border-border/40 bg-card py-4">
        <div className="mx-auto max-w-7xl px-4 md:px-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs md:text-sm">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-steel font-bold" aria-label="Breadcrumb">
            {pageInfo.breadcrumbs.map((crumb, idx) => {
              const isLast = idx === pageInfo.breadcrumbs.length - 1;
              return (
                <div key={crumb.label} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-steel-light font-normal">/</span>}
                  {isLast ? (
                    <span className="text-obsidian font-extrabold truncate max-w-[200px]">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.href as "/"} className="hover:text-hyperblue transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Metrics */}
          <div className="flex items-center gap-4 justify-between sm:justify-end">
            <span className="font-bold text-steel-dark">
              {loading ? (
                "Loading agencies…"
              ) : (
                <>
                  <span className="text-hyperblue font-extrabold tabular-nums">{filtered.length}</span> companies
                </>
              )}
            </span>
          </div>
        </div>
      </section>

      {/* FILTER CONTROL PANEL */}
      <section className="py-6 border-b border-border/30 bg-surface/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${initial.category || initial.service ? "md:grid-cols-3" : "md:grid-cols-4"}`}>
            {!(initial.category || initial.service) && (
              <FilterSelect
                label="Service"
                value={service}
                onChange={(v) => {
                  setService(v as ServiceCategory | "all");
                  // Clear query params to make manual filtering active
                  window.history.replaceState({}, "", "/agencies/");
                }}
                options={[{ v: "all", l: "All services" }, ...SERVICE_CATEGORIES.map((s) => ({ v: s, l: s }))]}
              />
            )}
            <FilterSelect
              label="Country"
              value={country}
              onChange={(v) => setCountry(v as Country | "all")}
              options={[{ v: "all", l: "All countries" }, ...COUNTRIES.filter((c) => c !== "All Countries").map((c) => ({ v: c, l: c }))]}
            />
            <FilterSelect
              label="Budget"
              value={budget}
              onChange={(v) => setBudget(v as BudgetTier | "all")}
              options={[{ v: "all", l: "Any budget" }, ...BUDGET_TIERS.map((b) => ({ v: b.id, l: b.label }))]}
            />
            <FilterSelect
              label="Sort by"
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              options={[
                { v: "rating", l: "Highest rated" },
                { v: "reviews", l: "Most reviewed" },
                { v: "minBudget", l: "Lowest min. budget" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* LISTING SECTION */}
      <section className="py-12 mt-4">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-8 flex items-baseline justify-between border-b border-border/30 pb-4">
            <p className="text-sm font-bold text-steel-dark">
              {loading ? (
                "Loading agencies…"
              ) : (
                <>
                  Found <span className="text-hyperblue font-extrabold tabular-nums">{filtered.length}</span> agencies
                </>
              )}
            </p>
          </div>
          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-sm font-bold text-destructive">
              {error}
            </div>
          ) : !loading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center shadow-xs">
              {(initial.category || initial.service) ? (
                <>
                  <p className="font-bold text-obsidian">No agencies listed under {pageInfo.title.replace("Top ", "")} yet.</p>
                  <p className="mt-2 text-sm text-steel-dark max-w-md mx-auto">
                    We don't have any verified agencies in this category right now. We'll be onboarding partners in this field soon!
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/for-agencies"
                      className="inline-flex items-center justify-center rounded-xl bg-obsidian px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-hyperblue transition-all duration-200"
                    >
                      Are you an agency? List here
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-bold text-obsidian">No agencies match these filters.</p>
                  <p className="mt-2 text-sm text-steel-dark">Try widening your criteria.</p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                {paginatedAgencies.map((agency) => (
                  <AgencyCard key={agency.slug} agency={agency} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-2 border-t border-border/40 pt-8">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest text-steel-dark transition-all hover:border-obsidian hover:text-obsidian disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
                  >
                    ← Prev
                  </button>

                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                      const isFirst = p === 1;
                      const isLast = p === totalPages;
                      const isAdjacent = Math.abs(p - currentPage) <= 1;

                      if (isFirst || isLast || isAdjacent) {
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setCurrentPage(p);
                              window.scrollTo({ top: 300, behavior: "smooth" });
                            }}
                            className={`inline-flex size-10 items-center justify-center rounded-xl text-xs font-bold transition-all active:scale-95 ${currentPage === p
                                ? "bg-obsidian text-white shadow-md shadow-obsidian/20"
                                : "border border-border bg-card text-steel-dark hover:border-obsidian hover:text-obsidian"
                              }`}
                          >
                            {p}
                          </button>
                        );
                      }

                      if (
                        (p === 2 && currentPage > 3) ||
                        (p === totalPages - 1 && currentPage < totalPages - 2)
                      ) {
                        return (
                          <span key={p} className="px-2 text-xs font-bold text-steel">
                            ...
                          </span>
                        );
                      }

                      return null;
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-card px-4 text-xs font-bold uppercase tracking-widest text-steel-dark transition-all hover:border-obsidian hover:text-obsidian disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption = options.find((o) => o.v === value) || options[0];
  const containerClass = `select-container-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const showSearch = options.length > 10;
  const filteredOptions = options.filter((o) =>
    o.l.toLowerCase().includes(search.toLowerCase())
  );

  const flagUrl = label === "Country" && selectedOption.v !== "all" ? getCountryFlagUrl(selectedOption.v) : null;

  return (
    <div ref={containerRef} className={`relative flex flex-col ${containerClass}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider text-steel-dark mb-1.5">
        {label}
      </span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-card py-3 px-4 text-xs font-bold text-obsidian outline-none transition-all duration-200 hover:border-hyperblue/30 focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 cursor-pointer text-left shadow-xs"
        >
          <span className="flex items-center gap-2 truncate">
            {flagUrl && (
              <img
                src={flagUrl}
                alt=""
                className="w-5 h-3.5 object-cover rounded-[2px] border border-border/40 shadow-xs shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <span className="truncate">{selectedOption.l}</span>
          </span>
          <ChevronDown className={`size-4 text-steel transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 z-30 mt-2 flex flex-col rounded-xl border border-border bg-card p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
            {showSearch && (
              <div className="flex items-center gap-2 border-b border-border/40 px-2.5 pb-2 pt-1.5 mb-1">
                <Search className="size-3.5 text-steel shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-obsidian placeholder-steel outline-none border-none p-0 focus:ring-0"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs font-semibold text-steel">
                  No options found
                </div>
              ) : (
                filteredOptions.map((o) => {
                  const oFlagUrl = label === "Country" && o.v !== "all" ? getCountryFlagUrl(o.v) : null;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => {
                        onChange(o.v);
                        setIsOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${o.v === value
                          ? "bg-hyperblue text-white"
                          : "text-steel-dark hover:bg-surface-muted hover:text-obsidian"
                        }`}
                    >
                      {oFlagUrl && (
                        <LazyFlag src={oFlagUrl} isSelected={o.v === value} />
                      )}
                      <span className="truncate">{o.l}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


