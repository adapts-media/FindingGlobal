import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUDGET_TIERS } from "@/lib/mock-data";
import { projectApi, notificationApi, meetingsApi, leadApi, type ApiProject, type ApiNotification, type ApiLead, type ApiMeeting } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Wallet, MapPin, Building2, LayoutGrid, MessageSquare, FileText, Plus, Phone, Zap, Folder, ChevronRight, ChevronDown, Sparkles, Info, Calendar, Video, XCircle, Clock, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/confirmation-modal";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatTimeAgo(dateString: string) {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

const getIconForType = (type: string) => {
  if (type === "message") return <MessageSquare className="size-5" strokeWidth={1.5} />;
  if (type === "project_matched" || type === "new_lead") return <Sparkles className="size-5" strokeWidth={1.5} />;
  if (type === "meeting_scheduled") return <Calendar className="size-5" strokeWidth={1.5} />;
  return <Info className="size-5" strokeWidth={1.5} />;
};
import { LoadingScreen } from "@/components/loading-screen";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Client dashboard — Finding Global" },
      { name: "description", content: "Manage your projects, matches, and agency conversations." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/dashboard/" },
    ],
  }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<ApiLead[]>([]);
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    agencySlug: string;
    agencyName: string;
  }>({
    isOpen: false,
    agencySlug: "",
    agencyName: "",
    leadId: ""
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "meetings">("projects");
  const [error, setError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "primary" | "danger" | "success";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => { },
    variant: "primary"
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role === "admin") {
      navigate({ to: "/admin" });
    } else if (user.role === "agency") {
      navigate({ to: "/agency-dashboard" });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    projectApi
      .list()
      .then((r) => !cancel && setProjects(r.projects))
      .catch((e) => !cancel && setError(e instanceof Error && e.message === "Failed to fetch" ? "Could not connect to the server. Please try refreshing." : (e instanceof Error ? e.message : "Failed to load")))
      .finally(() => !cancel && setLoading(false));

    notificationApi
      .list()
      .then((r) => !cancel && setNotifications(r.notifications))
      .catch((e) => console.error(e));

    meetingsApi
      .requests()
      .then((r) => {
        if (!cancel) {
          const sorted = [...r.requests].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
          });
          setMeetingRequests(sorted);
        }
      })
      .catch((e) => console.error("Error loading meeting requests:", e));

    meetingsApi
      .list()
      .then((r) => !cancel && setMeetings(r.meetings))
      .catch((e) => console.error("Error loading meetings:", e));

    return () => { cancel = true; };
  }, [user]);



  const active = projects.filter((p) => p.status !== "Closed").length;
  const matchedTotal = projects.reduce((n, p) => n + (p.matchedAgencies?.length ?? 0), 0);
  const stats = [
    { label: "Active projects", value: active },
    { label: "Matched agencies", value: matchedTotal },
    { label: "Conversations", value: 0 },
    { label: "Quotes received", value: 0 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-card pt-5 pb-4 md:pt-6 md:pb-4">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-hyperblue mb-1">Client Workspace</div>
              <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold tracking-tight text-obsidian">
                Welcome back, {user?.name?.split(" ")[0] ?? "there"}
              </h1>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-steel-dark leading-relaxed">
                Track your active projects and connect with world-class agencies.
              </p>
            </div>
            <Link
              to="/submit-project/"
              className="group flex items-center justify-center gap-2.5 rounded-xl bg-obsidian px-4.5 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white hover:bg-hyperblue transition-all shadow-lg shadow-obsidian/10 active:scale-[0.98] w-full sm:w-auto"
            >
              <Plus className="size-3.5 group-hover:rotate-90 transition-transform" strokeWidth={2.5} />
              New project brief
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Active projects", value: active, icon: <Folder className="size-4 text-obsidian" strokeWidth={1.5} /> },
              { label: "Matched agencies", value: matchedTotal, icon: <Zap className="size-4 text-obsidian" strokeWidth={1.5} /> },
              { label: "Active Conversations", value: 0, icon: <MessageSquare className="size-4 text-obsidian" strokeWidth={1.5} /> },
              { label: "Quotes received", value: 0, icon: <FileText className="size-4 text-obsidian" strokeWidth={1.5} /> },
            ].map((s) => (
              <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-border bg-white p-3 sm:p-3.5 shadow-sm transition-all hover:border-obsidian/30 hover:shadow-elevated">
                <div className="absolute -right-4 -top-4 size-20 bg-obsidian/5 rounded-full blur-2xl group-hover:bg-obsidian/10 transition-colors" />
                <div className="size-7 mb-2 rounded-xl bg-obsidian/5 flex items-center justify-center border border-obsidian/10 group-hover:scale-110 transition-transform relative z-10">
                  {s.icon}
                </div>
                <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider sm:tracking-widest text-steel/80 mb-0.5 relative z-10">{s.label}</div>
                <div className="text-xl sm:text-2xl font-bold tabular-nums text-obsidian tracking-tight relative z-10">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Sub-navigation Tabs */}
      <div className="border-b border-border bg-white sticky top-[65px] z-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("projects")}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2 ${activeTab === "projects"
                ? "border-hyperblue text-hyperblue"
                : "border-transparent text-steel hover:text-obsidian"
                }`}
            >
              <span>Projects & Leads</span>
              {projects.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${activeTab === "projects" ? "bg-hyperblue text-white" : "bg-neutral-100 text-steel-dark"
                  }`}>
                  {projects.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("meetings")}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2 ${activeTab === "meetings"
                ? "border-hyperblue text-hyperblue"
                : "border-transparent text-steel hover:text-obsidian"
                }`}
            >
              <span>Meeting Requests</span>
              {meetingRequests.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${activeTab === "meetings" ? "bg-hyperblue text-white" : "bg-neutral-100 text-steel-dark"
                  }`}>
                  {meetingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "projects" ? (
        <section className="py-6 md:py-8">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">Your Active Projects</h2>
              <div className="text-[9px] font-bold uppercase tracking-widest text-steel bg-surface px-2.5 py-1 rounded-lg border border-border">Total: {projects.length}</div>
            </div>

            {loading ? (
              <LoadingScreen />
            ) : error ? (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive font-bold">{error}</div>
            ) : projects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface/50 p-20 text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white border border-border text-obsidian shadow-sm">
                  <Folder className="size-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-obsidian">No projects yet.</h3>
                <p className="mt-3 text-sm text-steel font-medium">Submit your first brief to start receiving agency matches.</p>
                <Link to="/submit-project/" className="mt-8 inline-block text-[10px] font-bold uppercase tracking-widest text-hyperblue hover:text-obsidian transition-colors underline underline-offset-4">Get started →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {projects.map((project) => {
                  const matched = project.matchedAgencies ?? [];
                  return (
                    <article
                      key={project._id}
                      className="group relative rounded-2xl border border-border bg-white p-4 sm:p-4.5 transition-all hover:border-hyperblue/30 hover:shadow-elevated"
                    >
                      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-[9px] font-bold tracking-widest text-steel uppercase">
                              #{project._id.slice(-6)}
                            </span>
                            <StatusBadge status={project.status} />
                          </div>
                          <h3 className="text-base sm:text-lg font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors leading-tight">
                            {project.title}
                          </h3>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-bold text-steel-dark uppercase tracking-tight">
                            <div className="flex items-center gap-1.5"><LayoutGrid className="size-3.5 text-obsidian" strokeWidth={2} /> {project.services[0]}</div>
                            <div className="flex items-center gap-1.5"><Wallet className="size-3.5 text-obsidian" strokeWidth={2} /> {BUDGET_TIERS.find((b) => b.id === project.budget)?.label}</div>
                            <div className="flex items-center gap-1.5"><MapPin className="size-3.5 text-obsidian" strokeWidth={2} /> {project.country}</div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-border/40 md:border-t-0 md:pt-0">
                          <div className="flex items-center gap-2.5 bg-surface px-3 py-2 rounded-xl border border-border/50 justify-between sm:justify-start">
                            <div className="flex -space-x-2.5">
                              {matched.length > 0 ? matched.slice(0, 3).map((a) => (
                                <div
                                  key={a._id}
                                  className="size-7.5 overflow-hidden rounded-full border-2 border-white bg-steel-light shadow-sm"
                                >
                                  <img
                                    src={a.logoSeed?.startsWith("data:") || a.logoSeed?.startsWith("http") ? a.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${a.logoSeed ?? a.slug}&backgroundColor=0038ff,050505,52525B`}
                                    alt={a.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )) : (
                                <div className="size-7.5 rounded-full bg-surface border-2 border-white border-dashed flex items-center justify-center text-[9px] text-steel">...</div>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-obsidian">
                              {matched.length} <span className="text-steel">Matched</span>
                            </div>
                          </div>

                          <Link
                            to="/projects/$id"
                            params={{ id: project._id }}
                            className="rounded-xl bg-obsidian px-4.5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white transition-all hover:bg-hyperblue shadow-lg shadow-obsidian/10 active:scale-95 text-center w-full sm:w-auto"
                          >
                            View Project
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="py-6 md:py-8 bg-neutral-50/30">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">Meeting Requests</h2>
                <p className="text-xs font-semibold text-steel-dark mt-0.5">Manage consultation call requests from your matched agencies.</p>
              </div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-steel bg-white px-2.5 py-1 rounded-lg border border-border shadow-xs">Total: {meetingRequests.length}</div>
            </div>

            {meetingRequests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center shadow-xs">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-obsidian/5 border border-border text-steel shadow-xs">
                  <Calendar className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className="text-base font-bold text-obsidian">No meeting requests yet</h3>
                <p className="mt-1.5 text-xs text-steel font-medium max-w-xs mx-auto">Agencies matched to your project briefs can request video consultation meetings. They will appear here once requested.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meetingRequests.map((l) => {
                  const meeting = meetings.find(
                    (m) => m.agencySlug === l.agency?.slug && m.status !== "cancelled" && m.status !== "declined"
                  );
                  return (
                    <div key={l._id} className="group flex flex-col lg:flex-row lg:items-center rounded-2xl border border-border bg-white p-4 sm:p-4.5 transition-all hover:border-hyperblue/30 hover:shadow-elevated gap-4">
                      <div className="flex items-center gap-4 mb-3 lg:mb-0 w-full lg:w-[320px] xl:w-[380px] shrink-0">
                        <div className="size-12 overflow-hidden rounded-2xl bg-surface border border-border group-hover:border-hyperblue transition-colors">
                          <img
                            src={l.agency?.logoSeed?.startsWith("data:") || l.agency?.logoSeed?.startsWith("http") ? l.agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${l.agency?.logoSeed || l.agency?.slug || "global"}&backgroundColor=0038ff,050505,52525B`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-bold text-obsidian tracking-tight group-hover:text-hyperblue transition-colors truncate">{l.agency?.name}</div>
                          <div className="flex items-center gap-2 mt-1 min-w-0">
                            <span className="relative flex size-2 shrink-0">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${l.meetingBooked ? 'bg-emerald-500' : 'bg-hyperblue'} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full size-2 ${l.meetingBooked ? 'bg-emerald-500' : 'bg-hyperblue'}`}></span>
                            </span>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.1em] shrink-0 ${l.meetingBooked ? 'text-emerald-600' : 'text-hyperblue'}`}>
                              {l.meetingBooked ? 'Call Scheduled' : 'Requested a meeting'}
                            </span>
                            {l.project?.title && (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="size-1 rounded-full bg-zinc-300 shrink-0" />
                                <span className="text-[10px] text-zinc-400 font-medium truncate" title={l.project.title}>
                                  For: {l.project.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center gap-3 lg:gap-4 w-full lg:w-auto lg:min-w-0">
                        {l.meetingBooked ? (
                          meeting ? (
                            <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                                    Details
                                    <ChevronDown className="size-3 text-steel-dark" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-5 rounded-2xl border border-border bg-white shadow-elevated" align="end">
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-obsidian text-sm tracking-tight border-b border-border/60 pb-2 text-left">Scheduled Call Details</h4>
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-steel">Date</span>
                                        <span className="text-xs font-black text-obsidian">{meeting.date}</span>
                                      </div>
                                      <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-steel">Time</span>
                                        <span className="text-xs font-black text-obsidian">
                                          {meeting.time} <span className="text-[10px] font-medium text-steel">({meeting.timezone?.split(" ")[0] || "GST"})</span>
                                        </span>
                                      </div>
                                    </div>
                                    {meeting.meetingLink && (
                                      <div className="pt-3 border-t border-border/60">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-steel block mb-2 text-left">Meeting Link</span>
                                        <a
                                          href={meeting.meetingLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-hyperblue hover:bg-obsidian px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-hyperblue/20 active:scale-95 transition-all"
                                        >
                                          <Video className="size-3.5" />
                                          Join Meeting Room
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>

                              {meeting.meetingLink && (
                                <a
                                  href={meeting.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-hyperblue hover:bg-obsidian px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-hyperblue/20 active:scale-95 transition-all shrink-0"
                                >
                                  <Video className="size-3.5" />
                                  Join Call
                                </a>
                              )}
                              <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                              <button
                                onClick={() => setScheduleModal({
                                  isOpen: true,
                                  agencySlug: l.agency?.slug || "",
                                  agencyName: l.agency?.name || ""
                                })}
                                className="rounded-xl bg-obsidian px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue shadow-lg shadow-obsidian/10 active:scale-95 transition-all shrink-0"
                              >
                                Schedule Call
                              </button>
                              <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                            <button
                              onClick={() => {
                                setScheduleModal({
                                  isOpen: true,
                                  agencySlug: l.agency?.slug || "",
                                  agencyName: l.agency?.name || "",
                                  leadId: l._id
                                });
                              }}
                              className="rounded-xl bg-obsidian px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue shadow-lg shadow-obsidian/10 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[130px] shrink-0"
                            >
                              Confirm Booking
                            </button>
                            <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="pb-10 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">Recent Activity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {notifications.slice(0, 3).map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  let targetLink = n.link;
                  if (n.message && n.message.includes("direct contact request")) {
                    targetLink = "/agency-inbox";
                  }
                  if (targetLink) navigate({ to: targetLink as any });
                }}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-white p-4 sm:p-4.5 transition-all hover:border-obsidian/30 hover:shadow-elevated cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-obsidian/5 border border-obsidian/10 text-obsidian group-hover:scale-110 transition-transform">
                      {getIconForType(n.type)}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest text-steel">{formatTimeAgo(n.createdAt)}</div>
                  </div>
                  <div className="text-xs font-bold text-obsidian group-hover:text-hyperblue transition-colors mb-1.5">{n.title}</div>
                  <div className="text-[11px] font-medium text-steel-dark leading-relaxed line-clamp-2">"{n.message}"</div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-hyperblue opacity-0 group-hover:opacity-100 transition-opacity">
                    {n.link ? "View Details →" : "Mark as read"}
                  </div>
                </div>
              </div>
            ))}
            {notifications.length === 0 && !loading && (
              <div className="col-span-1 md:col-span-3 py-12 text-center text-steel-dark text-sm border-2 border-dashed border-border rounded-2xl">
                No recent activity to show yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
      <ScheduleMeetingModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal((prev) => ({ ...prev, isOpen: false }))}
        agencySlug={scheduleModal.agencySlug}
        agencyName={scheduleModal.agencyName}
        leadId={scheduleModal.leadId}
        onSuccess={() => {
          meetingsApi
            .list()
            .then((r) => setMeetings(r.meetings))
            .catch((e) => console.error("Error refreshing meetings:", e));
            
          meetingsApi
            .requests()
            .then((r) => {
              const sorted = [...r.requests].sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateB - dateA;
              });
              setMeetingRequests(sorted);
            })
            .catch((e) => console.error("Error loading meeting requests:", e));
        }}
      />
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Matching: "bg-hyperblue/5 text-hyperblue border-hyperblue/10",
    "In Review": "bg-warning/10 text-warning border-warning/20",
    Active: "bg-success/10 text-success border-success/20",
    Closed: "bg-surface text-steel border-border",
  };
  return (
    <span
      className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
