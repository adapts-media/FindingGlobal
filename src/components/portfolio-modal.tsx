import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { type PortfolioItem } from "@/lib/mock-data";

interface PortfolioModalProps {
  project: PortfolioItem;
  onClose: () => void;
  agency?: {
    slug: string;
    name: string;
    tagline?: string;
    city: string;
    country: string;
    logoSeed: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
}

export function PortfolioModal({ project, onClose, agency }: PortfolioModalProps) {
  const navigate = useNavigate();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative flex flex-col w-full max-w-6xl max-h-full overflow-hidden bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-8 top-8 z-20 size-12 flex items-center justify-center rounded-full bg-white/80 text-obsidian backdrop-blur hover:bg-obsidian hover:text-white transition-all shadow-sm group active:scale-95"
        >
          <svg className="size-6 transition-transform group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto no-scrollbar bg-white">
          <div className="p-8 md:p-16">
            <div className="w-full">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row gap-10 mb-20 items-start md:items-center">
                <div className="size-32 md:size-48 shrink-0 rounded-3xl bg-surface border border-border/50 overflow-hidden shadow-sm">
                  <img
                    src={project.imageSeed?.startsWith("http") || project.imageSeed?.startsWith("data:") ? project.imageSeed : `https://picsum.photos/seed/${project.imageSeed || project.title}/600/600`}
                    alt=""
                    className="h-full w-full object-cover transform hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="rounded-full bg-hyperblue/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-hyperblue border border-hyperblue/10">
                      {project.category}
                    </span>
                    <span className="text-steel-light">/</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-steel">
                      {project.client}
                    </span>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-obsidian leading-[0.95]">
                    {project.title}
                  </h2>
                </div>
              </div>

              {/* Grid Content */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-20">
                {/* Main Content */}
                <div className="space-y-16">
                  {/* Executive Summary */}
                  <section className="max-w-3xl">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-hyperblue mb-6">Executive Summary</div>
                    <p className="text-xl md:text-xl font-medium leading-[1.6] text-obsidian tracking-tight">
                      {project.summary}
                    </p>
                  </section>

                  {/* Detailed breakdown */}
                  {project.description && (
                    <section className="prose prose-lg max-w-none">
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-steel mb-8">Detailed Breakdown</div>
                      <div className="space-y-12">
                        {project.description.split('\n\n').map((para, i) => {
                          const parts = para.split(': ');
                          if (parts.length > 1) {
                            return (
                              <div key={i} className="group">
                                <span className="block text-xs font-bold uppercase tracking-widest text-obsidian mb-2 group-hover:text-hyperblue transition-colors">
                                  {parts[0]}
                                </span>
                                <p className="text-lg leading-relaxed text-steel-dark font-medium">
                                  {parts.slice(1).join(': ')}
                                </p>
                              </div>
                            );
                          }
                          return (
                            <p key={i} className="text-lg leading-relaxed text-steel-dark font-medium">
                              {para}
                            </p>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Impact Grid */}
                  {project.results && project.results.length > 0 && (
                    <section className="relative overflow-hidden rounded-[2rem] bg-obsidian p-10 md:p-14 text-white shadow-2xl">
                      <div className="absolute top-0 right-0 p-10 opacity-10">
                        <svg className="size-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-hyperblue mb-10">Success Metrics</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        {project.results.map((result) => (
                          <div key={result} className="space-y-2">
                            <div className="text-3xl font-bold tracking-tight">{result.split(' ').slice(0, -1).join(' ')} <span className="text-hyperblue">{result.split(' ').slice(-1)}</span></div>
                            <div className="h-0.5 w-8 bg-hyperblue/40" />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar Details */}
                <aside className="space-y-12 lg:sticky lg:top-0 h-fit">
                  {project.liveUrl && (
                    <div className="pt-6">
                      <a
                        href={project.liveUrl.startsWith('http') ? project.liveUrl : `https://${project.liveUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl bg-obsidian p-5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue transition-all shadow-xl shadow-hyperblue/20"
                      >
                        Visit Live Case
                        <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Made By Card */}
                  {agency && (
                    <div className="rounded-3xl border border-border/50 bg-white p-10 shadow-sm group">
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-steel mb-8">Curated By</div>
                      <div className="flex items-center gap-5 mb-8">
                        <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-surface border border-border group-hover:border-hyperblue transition-colors">
                          <img
                            src={agency.logoSeed?.startsWith("data:") || agency.logoSeed?.startsWith("http") ? agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=0038ff,050505,52525B`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-xl font-bold tracking-tight text-obsidian">{agency.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-warning text-sm">★</span>
                            <span className="text-xs font-bold text-obsidian">{agency.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate({
                            to: "/agencies/$slug",
                            params: { slug: agency.slug }
                          });
                          window.scrollTo(0, 0);
                        }}
                        className="w-full flex items-center justify-center rounded-2xl border border-border py-4 text-[10px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface transition-all active:scale-[0.98]"
                      >
                        View Agency Profile
                      </button>
                    </div>
                  )}
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
