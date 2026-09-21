import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { portfolioApi, type ApiPortfolioItem, type ApiPortfolioAgency } from "@/lib/api";

export const Route = createFileRoute("/portfolio_/$agencySlug/$itemSlug")({
  loader: async ({ params }): Promise<{ item: ApiPortfolioItem; agency: ApiPortfolioAgency }> => {
    try {
      return await portfolioApi.item(params.agencySlug, params.itemSlug);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.item.title} — ${loaderData.agency.name}` },
          {
            name: "description",
            content: loaderData.item.summary?.slice(0, 155) ?? "Agency case study",
          },
          { property: "og:title", content: `${loaderData.item.title} — ${loaderData.agency.name}` },
          {
            property: "og:description",
            content: loaderData.item.summary?.slice(0, 155) ?? "",
          },
          {
            property: "og:image",
            content: loaderData.item.imageSeed?.startsWith("data:") || loaderData.item.imageSeed?.startsWith("http") ? loaderData.item.imageSeed : `https://picsum.photos/seed/${loaderData.item.imageSeed}/1200/630`,
          },
        ]
      : [{ title: "Project — Finding Global" }],
    links: [
      {
        rel: "canonical",
        href: params?.agencySlug && params?.itemSlug
          ? `https://findingglobal.com/portfolio/${params.agencySlug}/${params.itemSlug}/`
          : "https://findingglobal.com/portfolio/",
      },
    ],
  }),
  component: PortfolioDetailPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-2xl font-extrabold">Could not load this project</h1>
          <p className="mt-2 text-sm text-steel-dark">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mt-6 rounded-sm bg-obsidian px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Retry
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Project not found</h1>
        <p className="mt-2 text-sm text-steel-dark">
          This case study may have been moved or removed.
        </p>
        <Link
          to="/portfolio/"
          className="mt-6 inline-block rounded-sm bg-obsidian px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Back to portfolio
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function PortfolioDetailPage() {
  const { item, agency } = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-6xl text-xs font-bold uppercase tracking-widest text-steel-dark">
          <Link to="/portfolio/" className="hover:text-obsidian">Portfolio</Link>
          <span className="px-2">/</span>
          <Link
            to="/agencies/$slug"
            params={{ slug: agency.slug }}
            className="hover:text-obsidian"
          >
            {agency.name}
          </Link>
          <span className="px-2">/</span>
          <span className="text-obsidian">{item.title}</span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-border bg-card px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-sm border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                {item.category}
              </span>
              {item.industry && (
                <span className="rounded-sm border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                  {item.industry}
                </span>
              )}
              {item.year && (
                <span className="rounded-sm border border-border bg-surface px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
                  {item.year}
                </span>
              )}
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              {item.title}
            </h1>
            <p className="mt-2 text-base font-bold text-steel-dark">For {item.client}</p>
            <p className="mt-5 text-base leading-relaxed text-foreground">{item.summary}</p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/agencies/$slug"
                params={{ slug: agency.slug }}
                className="rounded-sm border border-border bg-card px-5 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-obsidian transition-colors hover:border-obsidian"
              >
                View {agency.name}
              </Link>
              <Link
                to="/submit-project/"
                search={{ agency: agency.slug } as never}
                className="rounded-sm bg-obsidian px-5 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-hyperblue"
              >
                Brief this agency
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-sm border border-border bg-steel-light">
            <div className="aspect-[4/3]">
              <img
                src={item.imageSeed?.startsWith("data:") || item.imageSeed?.startsWith("http") ? item.imageSeed : `https://picsum.photos/seed/${item.imageSeed || item.title}/960/720`}
                alt={item.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/960x720/050505/FFFFFF?text=${encodeURIComponent(item.title)}`;
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* Left: description + deliverables + results */}
          <div className="space-y-10">
            <div>
              <div className="eyebrow text-hyperblue">The project</div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Overview</h2>
              <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">
                {item.description ?? item.summary}
              </p>
            </div>

            {item.deliverables && item.deliverables.length > 0 && (
              <div>
                <div className="eyebrow text-hyperblue">Scope</div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Deliverables</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {item.deliverables.map((d: string) => (
                    <li
                      key={d}
                      className="flex items-start gap-3 rounded-sm border border-border bg-card p-3 text-sm font-bold text-obsidian"
                    >
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-hyperblue" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {item.results && item.results.length > 0 && (
              <div>
                <div className="eyebrow text-hyperblue">Outcome</div>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Results</h2>
                <ul className="mt-4 space-y-2">
                  {item.results.map((r: string) => (
                    <li
                      key={r}
                      className="rounded-sm border border-border bg-card p-4 text-sm font-bold text-obsidian"
                    >
                      → {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right: meta panel */}
          <aside className="space-y-6">
            <div className="rounded-sm border border-border bg-card p-6">
              <div className="eyebrow text-steel-dark">Project facts</div>
              <dl className="mt-4 space-y-3 text-sm">
                <FactRow label="Client" value={item.client} />
                <FactRow label="Service" value={item.category} />
                {item.industry && <FactRow label="Industry" value={item.industry} />}
                {item.timeline && <FactRow label="Timeline" value={item.timeline} />}
                {item.year && <FactRow label="Year" value={String(item.year)} />}
                {item.role && <FactRow label="Agency role" value={item.role} />}
              </dl>
              {item.liveUrl && (
                <a
                  href={item.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 block rounded-sm border border-border bg-surface px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-obsidian hover:border-obsidian"
                >
                  Visit case study ↗
                </a>
              )}
            </div>

            <div className="rounded-sm border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-sm bg-steel-light">
                  <img
                    src={agency.logoSeed?.startsWith("data:") || agency.logoSeed?.startsWith("http") ? agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=003bb3,050505,52525B`}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&background=050505&color=fff`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="eyebrow text-steel-dark">Made by</div>
                  <div className="truncate text-base font-extrabold">{agency.name}</div>
                  <div className="truncate text-xs font-bold text-steel-dark">
                    {agency.city ? `${agency.city}, ` : ""}{agency.country}
                  </div>
                </div>
              </div>
              {agency.tagline && !agency.tagline.startsWith("Leading agency specializing in") && (
                <p className="mt-4 text-sm font-medium text-steel-dark">{agency.tagline}</p>
              )}
              <div className="mt-4 flex items-center gap-2 text-xs font-bold text-steel-dark">
                <span className="text-warning">★</span>
                <span className="tabular-nums text-obsidian">{agency.rating.toFixed(1)}</span>
                <span>· {agency.reviewCount} reviews</span>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-hyperblue/5 border border-hyperblue/20 pl-1.5 pr-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-hyperblue shadow-sm backdrop-blur-sm">
                    <svg className="size-3 text-hyperblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                    </svg>
                    <span>Verified</span>
                  </span>
              </div>
              <Link
                to="/agencies/$slug"
                params={{ slug: agency.slug }}
                className="mt-5 block rounded-sm bg-obsidian px-4 py-2.5 text-center text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue"
              >
                View agency profile
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <dt className="text-[11px] font-bold uppercase tracking-widest text-steel-dark">{label}</dt>
      <dd className="text-right text-sm font-bold text-obsidian">{value}</dd>
    </div>
  );
}
