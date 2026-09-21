import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PortfolioModal } from "@/components/portfolio-modal";
import { type PortfolioItem } from "@/lib/mock-data";
import {
  SERVICE_CATEGORIES,
  INDUSTRIES,
  type ServiceCategory,
  type Industry,
} from "@/lib/mock-data";
import { portfolioApi, type ApiPortfolioEntry } from "@/lib/api";

function slugifyTitle(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Agency Portfolio Showcase — Finding Global" },
      {
        name: "description",
        content:
          "Explore standout work from leading global agencies. Filter by service and industry to discover the partner behind every campaign, brand, and product.",
      },
      { property: "og:title", content: "Agency Portfolio Showcase — Finding Global" },
      {
        property: "og:description",
        content:
          "A curated gallery of campaigns, brands, and products built by vetted global agencies.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/portfolio/" },
    ],
  }),
  component: PortfolioPage,
});function PortfolioPage() {
  const [items, setItems] = useState<ApiPortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<ServiceCategory | "all">("all");
  const [industry, setIndustry] = useState<Industry | "all">("all");
  const [selectedProject, setSelectedProject] = useState<{ item: PortfolioItem; agency: any } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    portfolioApi
      .list({
        service: service !== "all" ? service : undefined,
        industry: industry !== "all" ? industry : undefined,
      })
      .then((r) => !cancelled && setItems(Array.isArray(r?.items) ? r.items : []))
      .catch(
        (err) =>
          !cancelled &&
          setError(
            err instanceof Error
              ? `${err.message}`
              : "Failed to load portfolio"
          )
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [service, industry]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="bg-background pt-24 pb-16 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-md bg-hyperblue/5 px-3 py-1 text-hyperblue mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest">Showcase</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-obsidian md:text-6xl">
            Global agency showcase
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium text-steel-dark leading-relaxed">
            A curated gallery of standout campaigns, brand systems, and digital products. 
            Discover the global experts behind every successful project.
          </p>
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 size-[600px] bg-hyperblue/5 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* FILTERS */}
      <section className="sticky top-[72px] z-30 border-y border-border bg-card/80 backdrop-blur-xl py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 md:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <FilterSelect
              label="Service"
              value={service}
              onChange={(v) => setService(v as ServiceCategory | "all")}
              options={[
                { v: "all", l: "All Services" },
                ...SERVICE_CATEGORIES.map((s) => ({ v: s, l: s })),
              ]}
            />
            <div className="hidden h-8 w-px bg-border sm:block" />
            <FilterSelect
              label="Industry"
              value={industry}
              onChange={(v) => setIndustry(v as Industry | "all")}
              options={[
                { v: "all", l: "All Industries" },
                ...INDUSTRIES.map((i) => ({ v: i, l: i })),
              ]}
            />
          </div>
          
          <div className="flex items-center gap-3">
             <p className="text-[11px] font-bold uppercase tracking-widest text-steel">
              {loading ? "Refreshing..." : (
                <><span className="text-obsidian">{items.length}</span> results</>
              )}
            </p>
            <Link to="/submit-project/" className="rounded-full bg-obsidian px-5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-hyperblue">
              Brief Us
            </Link>
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-12 text-center">
              <div className="text-3xl mb-4">⚠️</div>
              <p className="text-sm font-bold text-destructive">{error}</p>
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-24 text-center">
              <div className="text-4xl mb-6">🔍</div>
              <p className="text-xl font-bold text-obsidian">No results found</p>
              <p className="mt-2 text-steel-dark">Try adjusting your filters to see more projects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((w, idx) => (
                <button
                  key={`${w.agency.slug}-${w.item.title}-${idx}`}
                  onClick={() => setSelectedProject({ item: w.item as unknown as PortfolioItem, agency: w.agency })}
                  className="group relative flex flex-col h-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-elevated">
                    <img
                      src={w.item.imageSeed?.startsWith("data:image") || w.item.imageSeed?.startsWith("http") ? w.item.imageSeed : `https://picsum.photos/seed/${w.item.imageSeed || w.item.title}/720/540`}
                      alt={w.item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/720x540/050505/FFFFFF?text=" + encodeURIComponent(w.item.title);
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute bottom-4 right-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-obsidian shadow-xl">
                        View Project
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex-1 px-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="rounded bg-hyperblue/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-hyperblue">
                        {w.item.category}
                      </span>
                      {w.item.industry && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-steel">
                          {w.item.industry}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors">
                      {w.item.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-steel-dark">
                      for {w.item.client}
                    </p>
                    
                    <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                      <div className="size-9 shrink-0 overflow-hidden rounded-lg border border-border bg-surface p-0.5">
                        <img
                          src={w.agency.logoSeed?.startsWith("data:image") || w.agency.logoSeed?.startsWith("http") ? w.agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${w.agency.logoSeed || w.agency.name}&backgroundColor=0038ff,050505,52525B`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold text-obsidian">
                          {w.agency.name}
                        </div>
                        <div className="truncate text-[10px] font-bold text-steel">
                          {w.agency.city || w.agency.country}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />

      {selectedProject && (
        <PortfolioModal
          project={selectedProject.item}
          agency={selectedProject.agency}
          onClose={() => setSelectedProject(null)}
        />
      )}
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
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-steel whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent py-1 pr-6 text-[11px] font-bold uppercase tracking-widest text-obsidian outline-none cursor-pointer border-b border-transparent hover:border-obsidian focus:border-obsidian transition-colors"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right center',
          backgroundSize: '12px',
        }}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </div>
  );
}
