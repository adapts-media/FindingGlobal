import { Link, useRouterState } from "@tanstack/react-router";
import type { Agency } from "@/lib/mock-data";
import type { ApiAgency } from "@/lib/api";
import { MapPin } from "lucide-react";
import { getUtmWebsiteUrl } from "@/lib/utils";
import { PlusTailwindTag } from "@/components/plus-tag";

interface AgencyCardProps {
  agency: Agency & { website?: string };
}

function fmtBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}

export function AgencyCard({ agency }: AgencyCardProps) {
  const location = useRouterState({ select: (s) => s.location });
  const fromPath = location.href;

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-obsidian/20 hover:shadow-xl hover:shadow-obsidian/5">
      <Link
        to="/agencies/$slug"
        params={{ slug: agency.slug }}
        search={{ from: fromPath }}
        className="absolute inset-0 z-0"
        aria-label={`View ${agency.name} profile`}
      />


      {/* CENTER CONTENT: LOGO, TITLE, REVIEWS, DESCRIPTION */}
      <div className="relative z-10 flex flex-col items-center text-center pointer-events-none px-4">
        <div className="relative mb-4">
          <div className="size-20 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <img
              src={agency.logoSeed?.startsWith("data:") || agency.logoSeed?.startsWith("http") ? agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=003bb3,050505,52525B`}
              loading="lazy"
              alt={`${agency.name} logo`}
              className="h-full w-full object-contain p-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&background=050505&color=fff`;
              }}
            />
          </div>
          {agency.plan === "Growth" && (
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none select-none">
              <PlusTailwindTag />
            </span>
          )}
        </div>

        <div className="mb-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-hyperblue/5 border border-hyperblue/20 pl-1.5 pr-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-hyperblue shadow-xs backdrop-blur-xs">
            <svg className="size-3 text-hyperblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span>Verified</span>
          </span>
        </div>

        <h3 className="text-2xl font-bold tracking-tight text-obsidian mb-2 transition-colors group-hover:text-hyperblue leading-tight flex items-center justify-center gap-1.5 flex-wrap">
          <span>{agency.name}</span>
          {agency.website && (
            <a
              href={getUtmWebsiteUrl(agency.website, agency.plan || "basic", "directory")}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 inline-flex items-center justify-center text-obsidian/60 hover:text-hyperblue transition-all active:scale-95 pointer-events-auto cursor-pointer"
              title="Visit Website"
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </h3>

        <div className="flex items-center gap-1.5 mb-4 text-sm">
          {agency.reviewCount > 0 ? (
            <>
              <span className="font-black text-obsidian">{(agency.rating || 0).toFixed(1)}</span>
              <div className="flex text-warning">
                {"★".repeat(Math.round(agency.rating || 0))}
                {"☆".repeat(5 - Math.round(agency.rating || 0))}
              </div>
            </>
          ) : (
            <>
              <span className="font-black text-steel-light">—</span>
              <div className="flex text-steel-light/40">
                {"☆".repeat(5)}
              </div>
            </>
          )}
          <span className="text-steel-dark font-medium ml-1">({agency.reviewCount} reviews)</span>
        </div>

        <p className="text-sm font-medium leading-relaxed text-obsidian line-clamp-2 mb-5">
          {agency.description || agency.tagline}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {agency.services.slice(0, 2).map((s) => (
            <span
              key={s}
              className="rounded-md border border-border bg-transparent px-3 py-1 text-[11px] font-medium text-steel-dark transition-colors"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* DIVIDER */}
      <div className="relative z-10 w-full h-px bg-border mb-6 pointer-events-none" />

      {/* LIST DETAILS */}
      <div className="relative z-10 flex flex-col gap-4 text-sm text-steel-dark pointer-events-none flex-grow mb-6">
        {agency.services.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-obsidian/5 text-obsidian/40">
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <p>
              Looking for work in <span className="font-bold text-obsidian">{agency.services[0]}</span>
            </p>
          </div>
        )}

        {(agency.city || agency.country) && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-obsidian/5 text-obsidian/40">
              <MapPin className="size-3.5" strokeWidth={2.5} />
            </div>
            <p>
              Located in <span className="font-bold text-obsidian">{[agency.city, agency.country].filter(Boolean).join(", ")}</span>
            </p>
          </div>
        )}

        {agency.minBudget > 0 && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-obsidian/5 text-obsidian/40">
              <span className="text-[10px] font-black">$</span>
            </div>
            <p>
              From <span className="font-bold text-obsidian">{fmtBudget(agency.minBudget)}</span> {agency.services[0] ? `for ${agency.services[0]}` : ""}
            </p>
          </div>
        )}

        {agency.teamSize && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded bg-obsidian/5 text-obsidian/40">
              <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p>
              <span className="font-bold text-obsidian">{agency.teamSize}</span> members
            </p>
          </div>
        )}
      </div>

      {/* FULL WIDTH BUTTON */}
      <Link
        to="/agencies/$slug"
        params={{ slug: agency.slug }}
        search={{ from: fromPath }}
        className="relative z-10 mt-auto flex w-full items-center justify-center rounded-lg bg-hyperblue px-4 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#003296] pointer-events-auto cursor-pointer"
      >
        View profile
      </Link>
    </div>
  );
}
