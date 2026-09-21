import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ConfirmationModal } from "@/components/confirmation-modal";
import {
  adminApi,
  projectApi,
  leadApi,
  type AdminStats,
  type ApiAgency,
  type ApiProject,
  type ApiLead,
  type ApiEnterpriseInquiry,
  type ApiContactMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { BUDGET_TIERS } from "@/lib/mock-data";
import {
  Users,
  Clock,
  Briefcase,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Check,
  Loader2,
  Sparkles,
  Building2,
  MapPin,
  Star,
  LayoutGrid,
  Trash2,
  Search,
  Globe,
  MessageSquare
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>): { v?: "dashboard" | "projects" | "leads" | "agencies" | "enterprise" | "messages" } => ({
    v: (search.v as any) || "dashboard",
  }),
  head: () => ({
    meta: [
      { title: "Admin panel — Finding Global" },
      { name: "description", content: "Platform administration and analytics." },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/admin/" },
    ],
  }),
  component: AdminPanel,
});

function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { v: view } = Route.useSearch();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<ApiAgency[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [allAgencies, setAllAgencies] = useState<ApiAgency[]>([]);
  const [top, setTop] = useState<ApiAgency[]>([]);
  const [enterpriseInquiries, setEnterpriseInquiries] = useState<ApiEnterpriseInquiry[]>([]);
  const [messages, setMessages] = useState<ApiContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [agencyToDelete, setAgencyToDelete] = useState<{ slug: string; name: string } | null>(null);

  // States to track micro-animations during approval
  const [approvingSlugs, setApprovingSlugs] = useState<string[]>([]);
  const [approvedSlugs, setApprovedSlugs] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredAgencies = useMemo(() => {
    if (!searchQuery.trim()) return allAgencies;
    const query = searchQuery.toLowerCase().trim();
    return allAgencies.filter((agency) => {
      const nameMatch = agency.name?.toLowerCase().includes(query);
      const cityMatch = agency.city?.toLowerCase().includes(query);
      const countryMatch = agency.country?.toLowerCase().includes(query);
      const planMatch = agency.plan?.toLowerCase().includes(query);
      const servicesMatch = agency.services?.some((s) => s.toLowerCase().includes(query));
      return nameMatch || cityMatch || countryMatch || planMatch || servicesMatch;
    });
  }, [allAgencies, searchQuery]);

  const totalPages = Math.ceil(filteredAgencies.length / ITEMS_PER_PAGE);
  const paginatedAgencies = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAgencies.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAgencies, currentPage]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  function loadData(showLoader = true) {
    if (showLoader) setLoading(true);
    const promises = [
      adminApi.stats(),
      adminApi.pending(),
      adminApi.recentProjects(),
      adminApi.topAgencies(),
    ];

    if (view === "projects" || view === "leads") promises.push(projectApi.list());
    if (view === "agencies") promises.push(adminApi.allAgencies());
    if (view === "enterprise") promises.push(adminApi.enterpriseInquiries());
    if (view === "messages") promises.push(adminApi.messages());

    Promise.all(promises)
      .then(([s, p, pr, t, extra]: any[]) => {
        setStats(s.stats);
        setPending(p.agencies);
        setTop(t.agencies);

        if ((view === "projects" || view === "leads") && extra) {
          setProjects((extra as any).projects);
        } else if (view === "agencies" && extra) {
          setAllAgencies((extra as any).agencies);
        } else if (view === "enterprise" && extra) {
          setEnterpriseInquiries((extra as any).inquiries);
        } else if (view === "messages" && extra) {
          setMessages((extra as any).messages);
        } else {
          setProjects(pr.projects);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === "admin") {
      loadData(true);
      setCurrentPage(1);
    }
  }, [user, view]);

  async function approve(slug: string) {
    if (approvingSlugs.includes(slug) || approvedSlugs.includes(slug)) return;

    // Optimistic UI updates
    setApprovingSlugs((prev) => [...prev, slug]);
    setApprovedSlugs((prev) => [...prev, slug]);
    toast.success("Agency approved successfully");

    // API call in background
    adminApi.approve(slug)
      .then(() => {
        // Let success checkmark show for 800ms before removing the row with a smooth exit
        setTimeout(() => {
          setPending((prev) => prev.filter((a) => a.slug !== slug));
          setApprovingSlugs((prev) => prev.filter((s) => s !== slug));
          setApprovedSlugs((prev) => prev.filter((s) => s !== slug));
          loadData(false);
        }, 800);
      })
      .catch((err) => {
        toast.error("Failed to approve agency");
        setApprovingSlugs((prev) => prev.filter((s) => s !== slug));
        setApprovedSlugs((prev) => prev.filter((s) => s !== slug));
      });
  }

  async function reject(slug: string) {
    setPending((prev) => prev.filter((a) => a.slug !== slug));
    toast.success("Agency application rejected");
    adminApi.reject(slug).then(() => loadData(false)).catch(() => {
      toast.error("Failed to reject agency");
      loadData(false);
    });
  }

  async function handleUpdatePlan(slug: string, plan: string) {
    const originalPlan = allAgencies.find((a) => a.slug === slug)?.plan;
    setAllAgencies((prev) => prev.map((a) => a.slug === slug ? { ...a, plan } : a));
    toast.success("Agency plan updated");

    adminApi.updatePlan(slug, plan).then(() => loadData(false)).catch(() => {
      toast.error("Failed to update agency plan");
      if (originalPlan) {
        setAllAgencies((prev) => prev.map((a) => a.slug === slug ? { ...a, plan: originalPlan } : a));
      }
    });
  }

  async function handleToggleFeatured(slug: string, featured: boolean) {
    setAllAgencies((prev) => prev.map((a) => a.slug === slug ? { ...a, featured } : a));
    toast.success(featured ? "Agency set as featured" : "Agency removed from featured");

    adminApi.toggleFeatured(slug, featured).then(() => loadData(false)).catch(() => {
      toast.error("Failed to update featured status");
      setAllAgencies((prev) => prev.map((a) => a.slug === slug ? { ...a, featured: !featured } : a));
    });
  }

  async function confirmDeleteAgency() {
    if (!agencyToDelete) return;
    const { slug, name } = agencyToDelete;

    // Optimistic UI updates
    setAllAgencies((prev) => prev.filter((a) => a.slug !== slug));
    setPending((prev) => prev.filter((a) => a.slug !== slug));
    setTop((prev) => prev.filter((a) => a.slug !== slug));
    toast.success(`Agency "${name}" has been successfully deleted.`);
    setAgencyToDelete(null);

    adminApi.deleteAgency(slug).then(() => loadData(false)).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete agency");
      loadData(false); // Rollback by fetching real data
    });
  }

  if (authLoading || !user || user.role !== "admin") return null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
        {/* Architectural Grid Background */}
        <div className="absolute inset-0 architectural-grid opacity-30 pointer-events-none" />

        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-hyperblue/5 rounded-full blur-3xl pointer-events-none animate-pulse" />

        <div className="flex flex-col items-center max-w-sm w-full text-center relative z-10">
          {/* Animated concentric loader widget */}
          <div className="relative size-24 mb-6 flex items-center justify-center">
            {/* Outer dotted spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-steel/30 animate-[spin_8s_linear_infinite]" />
            {/* Middle pulsing ring */}
            <div className="absolute inset-2 rounded-full border border-hyperblue/20 bg-hyperblue-soft animate-ping opacity-60" style={{ animationDuration: "1.5s" }} />
            {/* Inner logo container */}
            <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center shadow-lg border border-border">
              <img
                src="/minimallogo"
                alt="Finding Global"
                className="w-12 h-auto object-contain animate-pulse"
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-obsidian animate-pulse">Finding Global Console</span>
            <span className="h-1.5 w-1.5 rounded-full bg-hyperblue animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="bg-background pt-8 pb-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-hyperblue/5 px-2.5 py-1 text-hyperblue mb-2.5">
                <span className="text-[9px] font-bold uppercase tracking-widest">Finding Global Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-obsidian leading-[1.1]">
                {view === "dashboard" ? "Platform Overview" : view === "projects" ? "All Projects" : view === "leads" ? "All Leads" : view === "enterprise" ? "Enterprise Inquiries" : view === "messages" ? "General Messages" : "All Agencies"}
              </h1>
            </div>

            {/* View Switching Tabs */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-surface p-0.5 border border-border/85 self-start sm:self-center shadow-xs">
              <Link
                to="/admin"
                search={{ v: "dashboard" }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "dashboard"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-obsidian hover:bg-white"
                  }`}
              >
                <LayoutGrid className="size-3.5" />
                Dashboard
              </Link>
              <Link
                to="/admin"
                search={{ v: "agencies" }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "agencies"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-obsidian hover:bg-white"
                  }`}
              >
                <Building2 className="size-3.5" />
                Agencies
              </Link>
              <Link
                to="/admin"
                search={{ v: "leads" }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "leads"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-obsidian hover:bg-white"
                  }`}
              >
                <Briefcase className="size-3.5" />
                Leads & Projects
              </Link>
              <Link
                to="/admin"
                search={{ v: "enterprise" }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "enterprise"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-obsidian hover:bg-white"
                  }`}
              >
                <Globe className="size-3.5" />
                Enterprise
              </Link>
              <Link
                to="/admin"
                search={{ v: "messages" }}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all ${view === "messages"
                  ? "bg-obsidian text-white shadow-sm"
                  : "text-steel hover:text-obsidian hover:bg-white"
                  }`}
              >
                <MessageSquare className="size-3.5" />
                Messages
              </Link>
            </div>
          </div>

          {/* Metric Stats Cards */}
          {view === "dashboard" && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Total Agencies", value: stats?.totalAgencies ?? "—", icon: <Building2 className="size-4.5 text-obsidian" />, link: true },
                { label: "Pending Approvals", value: stats?.pendingAgencies ?? "—", icon: <Clock className="size-4.5 text-obsidian" />, warning: true },
                { label: "Projects (30d)", value: stats?.projects30d ?? "—", icon: <Briefcase className="size-4.5 text-obsidian" /> },
                { label: "Successful Matches", value: stats?.successfulMatches ?? "—", icon: <Sparkles className="size-4.5 text-obsidian" /> },
                { label: "Active Clients", value: stats?.activeClients ?? "—", icon: <Users className="size-4.5 text-obsidian" /> },
                {
                  label: "Conversion Rate",
                  value: stats && stats.projects30d ? `${Math.round((stats.successfulMatches / Math.max(stats.projects30d, 1)) * 100)}%` : "—",
                  icon: <TrendingUp className="size-4.5 text-obsidian" />
                },
              ].map((card) => {
                const CardWrapper = card.link
                  ? ({ children }: { children: React.ReactNode }) => (
                    <Link to="/admin" search={{ v: "agencies" }} className="group relative overflow-hidden rounded-xl border border-border bg-card p-4.5 sm:p-5 shadow-xs transition-all duration-300 hover:border-obsidian/30 hover:shadow-elevated hover:scale-[1.02]">
                      {children}
                    </Link>
                  )
                  : ({ children }: { children: React.ReactNode }) => (
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4.5 sm:p-5 shadow-xs transition-all duration-300 hover:border-obsidian/20 hover:shadow-md hover:scale-[1.02]">
                      {children}
                    </div>
                  );

                return (
                  <CardWrapper key={card.label}>
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-steel group-hover:text-obsidian transition-colors">
                        {card.label}
                      </span>
                      <div className="size-8 rounded-lg bg-surface flex items-center justify-center border border-border group-hover:scale-105 transition-transform shrink-0">
                        {card.icon}
                      </div>
                    </div>
                    <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-obsidian ${card.warning && (stats?.pendingAgencies ?? 0) > 0 ? 'text-warning' : ''}`}>
                      {card.value}
                    </div>
                    <div className="absolute -bottom-2 -right-2 size-12 bg-obsidian/[0.01] rounded-full blur-lg group-hover:bg-obsidian/[0.03] transition-colors" />
                  </CardWrapper>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-6 flex-1">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {view === "dashboard" && (
            <div className="space-y-8">
              {/* Pending Approvals Table */}
              <div>
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-obsidian flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-2 bg-warning"></span>
                  </span>
                  Pending agency approvals
                </h2>
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-surface/50">
                      <tr>
                        <Th>Agency</Th>
                        <Th>Country</Th>
                        <Th>Services</Th>
                        <Th className="text-right">Action</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pending.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-10 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 max-w-xs mx-auto">
                              <div className="size-11 rounded-xl bg-success/5 border border-success/15 flex items-center justify-center mb-1">
                                <ShieldCheck className="size-5.5 text-success" />
                              </div>
                              <h3 className="text-xs font-bold text-obsidian uppercase tracking-wider">All Caught Up!</h3>
                              <p className="text-[11px] text-steel-dark leading-relaxed">No pending agency profile registrations require approval.</p>
                            </div>
                          </td>
                        </tr>
                      ) : pending.map((row) => {
                        const isApproving = approvingSlugs.includes(row.slug);
                        const isApproved = approvedSlugs.includes(row.slug);

                        return (
                          <tr
                            key={row.slug}
                            className={`group transition-all duration-500 hover:bg-surface/30 ${isApproved ? "opacity-0 -translate-x-4 scale-95 pointer-events-none" : ""
                              }`}
                            style={{ transitionProperty: "all" }}
                          >
                            <Td className="font-bold text-obsidian align-middle">
                              <Link to="/agencies/$slug" params={{ slug: row.slug }} className="hover:text-hyperblue transition-colors">
                                {row.name}
                              </Link>
                            </Td>
                            <Td className="align-middle">
                              <div className="flex items-center gap-1.5 font-medium text-steel-dark">
                                <MapPin className="size-3.5 text-steel" />
                                {row.country || "—"}
                              </div>
                            </Td>
                            <Td className="text-steel-dark font-medium align-middle">
                              <div className="flex flex-wrap gap-1">
                                {row.services && row.services.length > 0 ? (
                                  row.services.slice(0, 3).map((s) => (
                                    <span key={s} className="rounded bg-surface px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-obsidian border border-border/50">
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-steel-light italic">—</span>
                                )}
                              </div>
                            </Td>
                            <Td className="text-right align-middle">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => approve(row.slug)}
                                  disabled={isApproving || isApproved}
                                  className={`relative overflow-hidden rounded-lg px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white shadow-xs transition-all duration-350 active:scale-[0.97] ${isApproved
                                    ? "bg-success hover:bg-success shadow-success/15"
                                    : isApproving
                                      ? "bg-obsidian/80 cursor-not-allowed"
                                      : "bg-obsidian hover:bg-hyperblue shadow-obsidian/5"
                                    }`}
                                >
                                  <span className="flex items-center gap-1.5 justify-center">
                                    {isApproving && (
                                      <Loader2 className="size-3.5 animate-spin" />
                                    )}
                                    {isApproved && (
                                      <Check className="size-3.5" />
                                    )}
                                    {isApproved ? "Approved ✓" : isApproving ? "Approving..." : "Approve"}
                                  </span>
                                </button>
                              </div>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lists Section */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* Recent Projects Card */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-xs relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-obsidian flex items-center gap-1.5">
                      <Briefcase className="size-4 text-steel" />
                      Recent projects
                    </div>
                    <Link to="/admin" search={{ v: "leads" }} className="text-[9px] font-bold uppercase tracking-widest text-steel hover:text-obsidian transition-colors">
                      View all →
                    </Link>
                  </div>
                  <ul className="divide-y divide-border/40">
                    {projects.slice(0, 5).map((p) => (
                      <li key={p._id} className="group/item">
                        <Link
                          to="/projects/$id"
                          params={{ id: p._id }}
                          className="flex items-center justify-between py-2.5 hover:bg-surface/50 px-2 rounded-lg transition-colors w-full"
                        >
                          <div>
                            <div className="text-xs font-bold text-obsidian group-hover/item:text-hyperblue transition-colors">{p.title}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-steel">
                              <span>{p.country}</span>
                              <span className="opacity-45">•</span>
                              <span>{p.industry}</span>
                            </div>
                          </div>
                          <span className="font-mono text-[9px] font-bold text-steel bg-surface border border-border/80 px-1.5 py-0.5 rounded">
                            #{p._id.slice(-6).toUpperCase()}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Top Performing Agencies Card */}
                <div className="rounded-xl border border-border bg-card p-5 shadow-xs relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-obsidian flex items-center gap-1.5">
                      <Sparkles className="size-4 text-steel" />
                      Top performing agencies
                    </div>
                    <Link to="/admin" search={{ v: "agencies" }} className="text-[9px] font-bold uppercase tracking-widest text-steel hover:text-obsidian transition-colors">
                      View all →
                    </Link>
                  </div>
                  <ul className="divide-y divide-border/40">
                    {top.slice(0, 5).map((a, i) => (
                      <li key={a.slug} className="flex items-center justify-between py-2.5 group/item hover:bg-surface/50 px-2 rounded-lg transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-[9px] font-bold text-steel bg-surface border border-border/80 size-5.5 rounded-full flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <div>
                            <Link to="/agencies/$slug" params={{ slug: a.slug }} className="text-xs font-bold text-obsidian hover:text-hyperblue transition-colors">
                              {a.name}
                            </Link>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-medium text-steel uppercase tracking-wider">
                              {a.country}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-obsidian">
                          <span className="text-steel-dark text-[10px]">{a.reviewCount} reviews</span>
                          <span className="opacity-45">•</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="size-3 fill-current" />
                            <span className="text-[10px]">{a.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {view === "leads" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface/50">
                  <tr>
                    <Th>Project</Th>
                    <Th>Client</Th>
                    <Th>Budget</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center text-xs font-bold text-steel-dark">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin text-hyperblue" />
                          <span>Loading leads & projects...</span>
                        </div>
                      </td>
                    </tr>
                  ) : projects.map((p) => {
                    const statusStyles: Record<string, string> = {
                      Matching: "bg-hyperblue/10 text-hyperblue border border-hyperblue/20",
                      "In Review": "bg-warning/10 text-warning border border-warning/20",
                      Active: "bg-success/10 text-success border border-success/20",
                      Closed: "bg-surface text-steel-dark border border-border",
                    };

                    return (
                      <tr key={p._id} className="group hover:bg-surface/30 transition-colors">
                        <Td className="font-semibold text-obsidian align-middle">
                          <Link to="/projects/$id" params={{ id: p._id }} className="hover:text-hyperblue transition-colors">
                            {p.title}
                          </Link>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-steel">
                            <span>{p.country}</span>
                            <span className="opacity-45">•</span>
                            <span>{p.industry}</span>
                          </div>
                        </Td>
                        <Td className="align-middle">
                          <div className="font-semibold text-obsidian">{p.clientUserId?.name ?? "—"}</div>
                          <div className="mt-0.5 text-[9px] font-bold text-steel uppercase tracking-wider">{p.clientUserId?.company ?? ""}</div>
                        </Td>
                        <Td className="font-semibold text-obsidian align-middle whitespace-nowrap">
                          {BUDGET_TIERS.find(b => b.id === p.budget)?.label ?? p.budget}
                        </Td>
                        <Td className="align-middle">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${statusStyles[p.status] ?? "bg-surface text-steel-dark"}`}>
                            {p.status}
                          </span>
                        </Td>
                        <Td className="text-[11px] font-medium text-steel-dark align-middle">
                          {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {view === "agencies" && (
            <div className="space-y-4">
              {/* Search and Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card border border-border/80 rounded-xl p-4.5 shadow-xs">
                <div className="relative w-full sm:max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Search className="size-4 text-steel" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search agencies by name, location, service, or plan..."
                    className="w-full pl-10 pr-14 py-2.5 text-xs font-semibold bg-surface border border-border/80 rounded-xl text-obsidian placeholder-steel-light focus:outline-none focus:border-obsidian/45 focus:ring-1 focus:ring-obsidian/10 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[9px] font-bold uppercase tracking-widest text-steel hover:text-obsidian transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-steel bg-surface border border-border px-3.5 py-2.5 rounded-xl shrink-0">
                  Showing {filteredAgencies.length} of {allAgencies.length} agencies
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-surface/50">
                    <tr>
                      <Th>Agency</Th>
                      <Th>Location</Th>
                      <Th>Team</Th>
                      <Th>Services</Th>
                      <Th>Featured</Th>
                      <Th>Plan</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-xs font-bold text-steel-dark">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="size-4 animate-spin text-hyperblue" />
                            <span>Loading agencies...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredAgencies.length === 0 ? (
                      <tr><td colSpan={7} className="p-16 text-center font-bold text-steel-dark">No agencies found matching your search.</td></tr>
                    ) : paginatedAgencies.map((a) => (
                      <tr key={a.slug} className="group hover:bg-surface/30 transition-colors">
                        <Td className="font-bold text-obsidian align-middle">
                          <Link to="/agencies/$slug" params={{ slug: a.slug }} className="hover:text-hyperblue transition-colors">
                            {a.name}
                          </Link>
                        </Td>
                        <Td className="font-medium text-steel-dark align-middle">
                          {a.city ? `${a.city}, ` : ""}{a.country}
                        </Td>
                        <Td className="font-medium text-steel-dark align-middle whitespace-nowrap">{a.teamSize || "—"}</Td>
                        <Td className="text-steel-dark align-middle">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {a.services && a.services.length > 0 ? (
                              a.services.slice(0, 3).map((s) => (
                                <span key={s} className="whitespace-nowrap rounded bg-surface px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-obsidian border border-border/50">
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-steel-light italic text-[11px]">—</span>
                            )}
                          </div>
                        </Td>
                        <Td className="align-middle">
                          <button
                            onClick={() => handleToggleFeatured(a.slug, !a.featured)}
                            className={`rounded-lg border px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-widest transition-all ${a.featured
                              ? "bg-hyperblue/10 border-hyperblue/20 text-hyperblue hover:bg-hyperblue/20"
                              : "bg-card border-border text-steel hover:text-obsidian hover:bg-surface"
                              }`}
                          >
                            {a.featured ? "★ Featured" : "☆ Feature"}
                          </button>
                        </Td>
                        <Td className="align-middle">
                          <select
                            value={a.plan}
                            onChange={(e) => handleUpdatePlan(a.slug, e.target.value)}
                            className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-widest text-obsidian outline-none cursor-pointer hover:border-obsidian/40 transition-colors"
                          >
                            <option value="Starter">Free</option>
                            <option value="Growth">FindingGlobal+</option>
                          </select>
                        </Td>
                        <Td className="text-right align-middle">
                          <button
                            onClick={() => {
                              setAgencyToDelete({ slug: a.slug, name: a.name });
                              setDeleteModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1 text-[8.5px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 active:scale-95"
                            title={`Delete ${a.name}`}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border/40 pt-4 pb-4">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-[9px] font-bold uppercase tracking-widest text-steel hover:border-obsidian hover:text-obsidian disabled:opacity-30 disabled:pointer-events-none active:scale-[0.97] shadow-sm transition-all"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-1">
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
                              }}
                              className={`inline-flex size-8 items-center justify-center rounded-lg text-[9px] font-bold transition-all active:scale-[0.97] ${currentPage === p
                                ? "bg-obsidian text-white shadow-sm"
                                : "border border-border bg-card text-steel hover:border-obsidian hover:text-obsidian"
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
                            <span key={p} className="px-1 text-xs font-bold text-steel">
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
                      }}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-card px-3 text-[9px] font-bold uppercase tracking-widest text-steel hover:border-obsidian hover:text-obsidian disabled:opacity-30 disabled:pointer-events-none active:scale-[0.97] shadow-sm transition-all"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "enterprise" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface/50">
                  <tr>
                    <Th>Company / Name</Th>
                    <Th>Contact</Th>
                    <Th>Requirements</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-xs font-bold text-steel-dark">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin text-hyperblue" />
                          <span>Loading inquiries...</span>
                        </div>
                      </td>
                    </tr>
                  ) : enterpriseInquiries.length === 0 ? (
                    <tr><td colSpan={4} className="p-16 text-center font-bold text-steel-dark">No enterprise inquiries found.</td></tr>
                  ) : enterpriseInquiries.map((inq) => (
                    <tr key={inq._id} className="group hover:bg-surface/30 transition-colors">
                      <Td className="font-semibold text-obsidian align-middle">
                        <div className="text-obsidian">{inq.company || "—"}</div>
                        <div className="text-[10px] font-bold text-steel uppercase tracking-wider">{inq.name}</div>
                      </Td>
                      <Td className="align-middle text-obsidian">
                        <div className="font-medium">{inq.email}</div>
                        {inq.phone && <div className="text-[10px] text-steel-dark mt-0.5">{inq.phone}</div>}
                      </Td>
                      <Td className="text-xs text-steel-dark align-middle max-w-md">
                        {inq.requirements}
                      </Td>
                      <Td className="text-[11px] font-medium text-steel-dark align-middle">
                        {new Date(inq.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "messages" && (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface/50">
                  <tr>
                    <Th>Sender</Th>
                    <Th>Subject</Th>
                    <Th>Message</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center text-xs font-bold text-steel-dark">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="size-4 animate-spin text-hyperblue" />
                          <span>Loading messages...</span>
                        </div>
                      </td>
                    </tr>
                  ) : messages.length === 0 ? (
                    <tr><td colSpan={4} className="p-16 text-center font-bold text-steel-dark">No messages found.</td></tr>
                  ) : messages.map((msg) => (
                    <tr key={msg._id} className="group hover:bg-surface/30 transition-colors">
                      <Td className="font-semibold text-obsidian align-middle">
                        <div className="text-obsidian">{msg.name}</div>
                        <div className="text-[10px] font-medium text-steel-dark mt-0.5">{msg.email}</div>
                      </Td>
                      <Td className="align-middle text-obsidian font-medium">
                        {msg.subject || "—"}
                      </Td>
                      <Td className="text-xs text-steel-dark align-middle max-w-md">
                        {msg.message}
                      </Td>
                      <Td className="text-[11px] font-medium text-steel-dark align-middle">
                        {new Date(msg.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAgencyToDelete(null);
        }}
        onConfirm={confirmDeleteAgency}
        title={`Delete "${agencyToDelete?.name}"?`}
        message="This action is permanent and cannot be undone. This will permanently delete this agency profile, all its associated leads, meeting bookings, and remove it from matched project lists."
        confirmText="Delete Agency"
        cancelText="Cancel"
        variant="danger"
      />

      <SiteFooter />
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-3 text-left text-[9px] font-bold uppercase tracking-[0.2em] text-steel-dark border-b border-border/40 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 align-top text-xs font-semibold text-obsidian ${className}`}>{children}</td>;
}
