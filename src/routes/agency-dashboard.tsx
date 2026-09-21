import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUDGET_TIERS } from "@/lib/mock-data";
import { leadApi, agencyApi, meetingsApi, type ApiLead, type ApiAgency, type ApiMeeting } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Wallet, MapPin, Users, Building2, Star, ShieldCheck, Briefcase, Zap, BarChart3, Inbox, Sparkles, Plus, Phone, LayoutGrid, MessageSquare, Eye, User, CreditCard, Settings, ChevronRight, RefreshCw, WifiOff, Trophy, XCircle, Calendar, Clock, Video, Check, X } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmationModal } from "@/components/confirmation-modal";

export const Route = createFileRoute("/agency-dashboard")({
  head: () => ({
    meta: [
      { title: "Agency dashboard — Finding Global" },
      { name: "description", content: "Manage incoming leads, proposals, and your agency profile." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/agency-dashboard/" },
    ],
  }),
  component: AgencyDashboard,
});

function AgencyDashboard() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [activeTab, setActiveTab] = useState<"leads" | "meetings">("leads");

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
    onConfirm: () => {},
    variant: "primary"
  });

  useEffect(() => {
    if (initialized && (!user || (user.role !== "agency" && user.role !== "admin"))) {
      navigate({ to: "/login" });
    }
  }, [initialized, user, navigate]);

  const [agency, setAgency] = useState<ApiAgency | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!initialized) return;

    if (!user || user.role !== "agency" || !user.agencySlug) {
      setAgencyLoading(false);
      return;
    }
    agencyApi.get(user.agencySlug)
      .then(r => {
        setAgency(r.agency);
        setConnectionError(false);
      })
      .catch(err => {
        console.error(err);
        if (err && err.status === 404) {
          setAgency(null);
          setConnectionError(false);
        } else {
          setConnectionError(true);
        }
      })
      .finally(() => setAgencyLoading(false));
  }, [user, initialized]);

  function load() {
    setLoading(true);
    leadApi
      .list()
      .then((r) => setLeads(r.leads))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));

    meetingsApi
      .list()
      .then((r) => setMeetings(r.meetings))
      .catch((e) => console.error("Error loading meetings:", e));
  }

  const handleUpdateMeetingStatus = (meetingId: string, status: "accepted" | "declined") => {
    const verb = status === "accepted" ? "accept" : "decline";
    setConfirmModal({
      isOpen: true,
      title: `${status === "accepted" ? "Accept" : "Decline"} Meeting?`,
      message: `Are you sure you want to ${verb} this meeting request?`,
      variant: status === "accepted" ? "primary" : "danger",
      onConfirm: async () => {
        try {
          await meetingsApi.updateStatus(meetingId, status);
          toast.success(`Meeting ${status} successfully.`);
          const r = await meetingsApi.list();
          setMeetings(r.meetings);
        } catch (err: any) {
          toast.error(err.message || "Failed to update meeting.");
        }
      }
    });
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  const newLeads = leads.filter((l) => l.status === "New").length;
  const active = leads.filter((l) => l.status === "Quoted" || l.status === "In Conversation").length;

  const filteredLeads = leads.filter((lead) => {
    if (selectedStatus === "All") return true;
    return lead.status === selectedStatus;
  });

  if (!initialized || agencyLoading) {
    return <LoadingScreen />;
  }

  // Not logged in or wrong role -> redirect is handled by useEffect, but we must return null here
  if (!user || (user.role !== "agency" && user.role !== "admin")) {
    return null;
  }

  // CASE 1: Network error or connection refusal (Too Many Requests / Server offline)
  if (connectionError) {
    return (
      <div className="flex min-h-screen flex-col bg-background selection:bg-hyperblue/20">
        <SiteHeader />
        <section className="flex flex-1 items-center justify-center px-6 py-24 relative overflow-hidden">
          {/* Elegant ambient backdrop blur blobs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-hyperblue/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-destructive/5 rounded-full blur-[60px] pointer-events-none" />

          <div className="w-full max-w-md relative bg-card/60 backdrop-blur-xl border border-border/85 rounded-2xl p-8 shadow-xl text-center transition-all duration-300 hover:border-obsidian/10">
            {/* Elegant warning icon inside a custom micro-animated container */}
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-xl bg-destructive/5 text-destructive border border-destructive/10 relative group">
              <WifiOff className="size-7 animate-pulse text-destructive/80" />
              <div className="absolute inset-0 rounded-xl bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-obsidian sm:text-3xl">
              Connection Interrupted
            </h1>
            <p className="mt-4 text-xs font-semibold text-steel-dark uppercase tracking-wider">
              Network or Rate Limit Reset
            </p>
            <p className="mt-3 text-sm text-steel-dark leading-relaxed">
              We are having trouble communicating with our servers. This can happen during temporary network lag or a rate-limit reset. Please refresh your tab to restore your workspace.
            </p>

            <div className="mt-8">
              <button
                onClick={() => window.location.reload()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-obsidian hover:bg-hyperblue px-6 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-obsidian/10 hover:shadow-hyperblue/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <RefreshCw className="size-4 animate-spin" style={{ animationDuration: '3s' }} />
                Refresh Tab
              </button>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  // CASE 2: No slug yet or profile not found (Needs onboarding)
  if (!user.agencySlug || !agency || !agency.teamSize) {
    return <Navigate to="/agency-onboarding" />;
  }

  // CASE 3: Profile under review
  if (agency && !agency.verified) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <section className="flex flex-1 items-center justify-center px-6 py-24">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-8 flex size-20 items-center justify-center rounded-sm bg-hyperblue-soft text-hyperblue">
              <svg className="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Your application is under review</h1>
            <p className="mt-4 text-lg font-medium text-steel-dark">
              Thanks for joining Finding Global! Our team is currently verifying your agency profile.
              This usually takes less than 24 hours.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 border-t border-border pt-10 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="size-2 animate-pulse rounded-full bg-hyperblue" />
                <span className="text-sm font-bold uppercase tracking-widest text-obsidian">Status: Pending Approval</span>
              </div>
            </div>
            <p className="mt-8 text-xs text-steel">
              We'll send an email to <span className="font-bold text-steel-dark">{user?.email}</span> once your profile is live.
            </p>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }
  const formatDate = (d?: string | Date) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const stats = [
    { label: "New leads", value: newLeads },
    { label: "Active proposals", value: active },
    { label: "In conversation", value: leads.filter((l) => l.status === "In Conversation").length },
    { label: "Won", value: leads.filter((l) => l.status === "Won").length },
    { label: "Lost", value: leads.filter((l) => l.status === "Lost").length },
    { label: "Total leads", value: leads.length },
  ];

  const statsBlocks = [
    {
      label: "New leads",
      value: newLeads,
      icon: <Zap className="size-4.5 sm:size-5 text-obsidian" strokeWidth={1.5} />,
      colorClass: "hover:border-obsidian/30 col-span-1",
      bgClass: "bg-obsidian/5 border-obsidian/10"
    },
    {
      label: "In conversation",
      value: leads.filter((l) => l.status === "In Conversation").length,
      icon: <MessageSquare className="size-4.5 sm:size-5 text-obsidian" strokeWidth={1.5} />,
      colorClass: "hover:border-obsidian/30 col-span-1",
      bgClass: "bg-obsidian/5 border-obsidian/10"
    },
    {
      label: "Won",
      value: leads.filter((l) => l.status === "Won").length,
      icon: <Trophy className="size-4.5 sm:size-5 text-obsidian" strokeWidth={1.5} />,
      colorClass: "hover:border-obsidian/30 col-span-1",
      bgClass: "bg-obsidian/5 border-obsidian/10"
    },
    {
      label: "Lost",
      value: leads.filter((l) => l.status === "Lost").length,
      icon: <XCircle className="size-4.5 sm:size-5 text-obsidian" strokeWidth={1.5} />,
      colorClass: "hover:border-obsidian/30 col-span-1",
      bgClass: "bg-obsidian/5 border-obsidian/10"
    },
    {
      label: "Total leads",
      value: leads.length,
      icon: <Briefcase className="size-4.5 sm:size-5 text-obsidian" strokeWidth={1.5} />,
      colorClass: "hover:border-obsidian/30 col-span-2 lg:col-span-1",
      bgClass: "bg-obsidian/5 border-obsidian/10"
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="bg-background pt-8 pb-6 md:pt-10 md:pb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {agency && (!agency.founded || agency.services.length === 0) && (
            <div className="mb-10 flex flex-col items-center justify-between gap-4 rounded-xl border border-hyperblue/20 bg-hyperblue/5 p-6 sm:flex-row relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-hyperblue" />
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-hyperblue text-white shadow-lg shadow-hyperblue/20">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-obsidian uppercase tracking-tight">Complete your profile</h3>
                  <p className="text-xs font-medium text-steel-dark">Help clients find you by adding your services and portfolio.</p>
                </div>
              </div>
              <Link
                to="/agency-onboarding"
                className="rounded-md bg-obsidian px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white hover:bg-hyperblue transition-all"
              >
                Finish setup
              </Link>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center text-center sm:text-left">
              {agency && (
                <div className="size-20 shrink-0 overflow-hidden rounded-2xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-obsidian/20 hover:shadow-md sm:size-24">
                  <img
                    src={agency.logoSeed?.startsWith("data:") || agency.logoSeed?.startsWith("http") ? agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${agency.logoSeed || agency.name}&backgroundColor=0038ff,050505,52525B`}
                    alt={`${agency.name} logo`}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agency.name)}&background=050505&color=fff`;
                    }}
                  />
                </div>
              )}
              <div className="flex flex-col items-center sm:items-start">
                <div className="inline-flex items-center gap-2 rounded-md bg-hyperblue/5 px-2.5 py-1 text-hyperblue mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest">Agency Dashboard</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-obsidian sm:text-5xl">
                  {agency?.name || "Your agency"}
                </h1>
                <p className="mt-1.5 text-sm font-medium text-steel-dark flex items-center gap-2 justify-center sm:justify-start">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  Profile live · {agency?.country}
                </p>
              </div>
            </div>
            {user?.agencySlug && (
              <Link
                to="/agencies/$slug"
                params={{ slug: user.agencySlug }}
                className="group flex items-center justify-center gap-2 rounded-md border border-border bg-card px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-obsidian transition-all hover:border-obsidian hover:shadow-sm w-full sm:w-auto"
              >
                <svg className="size-4 text-steel group-hover:text-obsidian transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Public Profile
              </Link>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 w-full">
            {statsBlocks.map((s) => (
              <div key={s.label} className={`group relative overflow-hidden rounded-xl border border-border bg-card p-3.5 sm:p-5 transition-all ${s.colorClass} hover:shadow-elevated`}>
                <div className={`size-8 sm:size-10 mb-3 sm:mb-4 rounded-xl ${s.bgClass} flex items-center justify-center group-hover:scale-110 transition-transform relative z-10`}>
                  {s.icon}
                </div>
                <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest text-steel mb-1 sm:mb-2 relative z-10 leading-tight">{s.label}</div>
                <div className="text-2xl sm:text-4xl font-bold tabular-nums text-obsidian tracking-tight relative z-10">{s.value}</div>
                <div className="absolute -bottom-2 -right-2 size-16 bg-obsidian/5 rounded-full blur-2xl group-hover:bg-obsidian/10 transition-colors" />
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
              onClick={() => setActiveTab("leads")}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2 ${
                activeTab === "leads"
                  ? "border-hyperblue text-hyperblue"
                  : "border-transparent text-steel hover:text-obsidian"
              }`}
            >
              <span>Leads Inbox</span>
              {leads.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                  activeTab === "leads" ? "bg-hyperblue text-white" : "bg-neutral-100 text-steel-dark"
                }`}>
                  {leads.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("meetings")}
              className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all relative flex items-center gap-2 ${
                activeTab === "meetings"
                  ? "border-hyperblue text-hyperblue"
                  : "border-transparent text-steel hover:text-obsidian"
              }`}
            >
              <span>Meetings Scheduler</span>
              {meetings.length > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                  activeTab === "meetings" ? "bg-hyperblue text-white" : "bg-neutral-100 text-steel-dark"
                }`}>
                  {meetings.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {activeTab === "leads" ? (
        <section className="pt-4 pb-12">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-obsidian">Incoming Leads</h2>
              <p className="mt-1 text-sm font-medium text-zinc-500">Manage and respond to your active matched briefs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50/50 p-1">
              {["All", "New", "In Conversation", "Won", "Lost"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${selectedStatus === status
                      ? "bg-white text-obsidian shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-zinc-100/80"
                      : "text-zinc-500 hover:text-zinc-900 border border-transparent"
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-zinc-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/50">
                <tr>
                  <Th>Lead ID</Th>
                  <Th>Project & Client</Th>
                  <Th>Services Focus</Th>
                  <Th>Budget Range</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-12 text-center text-sm font-bold text-zinc-400">Loading leads…</td></tr>
                ) : error ? (
                  <tr><td colSpan={5} className="p-12 text-center text-sm font-bold text-destructive">{error}</td></tr>
                ) : filteredLeads.length === 0 ? (
                  <tr><td colSpan={5} className="p-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="size-16 mx-auto mb-4 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-100">
                        <Inbox className="size-8" strokeWidth={1.5} />
                      </div>
                      <p className="text-base font-bold text-zinc-900">
                        {selectedStatus === "All" ? "No leads matching your profile yet" : `No ${selectedStatus.toLowerCase()} leads`}
                      </p>
                      <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                        {selectedStatus === "All"
                          ? "Verified agencies receive matched briefs automatically when clients submit projects that fit their expertise."
                          : `There are currently no active briefs marked as ${selectedStatus.toLowerCase()}.`
                        }
                      </p>
                    </div>
                  </td></tr>
                ) : filteredLeads.map((lead) => (
                  <tr key={lead._id} className="group transition-colors hover:bg-zinc-50/60">
                    <Td className="w-32">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                          #{lead._id.slice(-6)}
                        </span>
                        {lead.type === "Direct" ? (
                          <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                            Direct
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-hyperblue/20 bg-hyperblue/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-hyperblue">
                            Matched
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td>
                      {lead.status === "Lost" ? (
                        <span
                          className="text-[13px] font-semibold text-zinc-400 cursor-not-allowed"
                          title="Lost leads cannot be opened"
                        >
                          {lead.type === "Direct" ? `Message from ${lead.directContact?.name}` : (lead.project?.title ?? "—")}
                        </span>
                      ) : (
                        <Link
                          to="/leads/$id"
                          params={{ id: lead._id }}
                          className="text-[13px] font-semibold text-zinc-900 group-hover:text-hyperblue transition-colors"
                        >
                          {lead.type === "Direct" ? `Message from ${lead.directContact?.name}` : (lead.project?.title ?? "—")}
                        </Link>
                      )}
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                        <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}</span>
                        <span className="text-zinc-300">·</span>
                        <span className="text-zinc-500 uppercase tracking-tight">{lead.type === "Direct" ? "Agency Message" : (lead.project?.country ?? "—")}</span>
                      </div>
                      {(lead.matchReasons?.length ?? 0) > 0 && (
                        <div
                          className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-hyperblue/5 border border-hyperblue/15 px-2 py-0.5 text-[9px] font-bold text-hyperblue"
                          title={lead.matchReasons!.join(" • ")}
                        >
                          <Sparkles className="size-2.5" />
                          Why matched: {lead.matchReasons![0]}
                          {lead.matchReasons!.length > 1 && ` +${lead.matchReasons!.length - 1} more`}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {lead.type === "Direct" ? (
                        <div className="text-xs font-medium text-zinc-500 italic truncate max-w-[180px]">
                          "{lead.directContact?.message?.slice(0, 45)}..."
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(lead.project?.services ?? []).slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-100/80"
                            >
                              {s}
                            </span>
                          ))}
                          {(lead.project?.services ?? []).length > 2 && (
                            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">+{(lead.project?.services ?? []).length - 2} more</span>
                          )}
                        </div>
                      )}
                    </Td>
                    <Td className="font-semibold text-zinc-900 text-[13px] tabular-nums">
                      {lead.type === "Direct"
                        ? (lead.directContact?.budget || "—")
                        : (BUDGET_TIERS.find((b) => b.id === lead.project?.budget)?.label ?? "—")}
                    </Td>
                    <Td>
                      <LeadStatus status={lead.status} unlocked={lead.unlocked} plan={agency?.plan} agency={agency} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE LEADS LIST (Visible on screens smaller than md) */}
          <div className="block md:hidden space-y-4">
            {loading ? (
              <div className="rounded-xl border border-zinc-100 bg-white p-12 text-center text-sm font-bold text-zinc-400">
                Loading leads…
              </div>
            ) : error ? (
              <div className="rounded-xl border border-zinc-100 bg-white p-12 text-center text-sm font-bold text-destructive">
                {error}
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="rounded-xl border border-zinc-100 bg-white p-12 text-center">
                <div className="size-16 mx-auto mb-4 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 border border-zinc-100">
                  <Inbox className="size-8" strokeWidth={1.5} />
                </div>
                <p className="text-base font-bold text-zinc-900">
                  {selectedStatus === "All" ? "No leads matching your profile yet" : `No ${selectedStatus.toLowerCase()} leads`}
                </p>
                <p className="mt-1 text-sm text-zinc-500 leading-relaxed">
                  {selectedStatus === "All"
                    ? "Verified agencies receive matched briefs automatically when clients submit projects."
                    : `There are currently no active briefs marked as ${selectedStatus.toLowerCase()}.`
                  }
                </p>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <div
                  key={lead._id}
                  className="rounded-xl border border-zinc-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                        #{lead._id.slice(-6)}
                      </span>
                      {lead.type === "Direct" ? (
                        <span className="inline-flex rounded-full bg-zinc-900 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                          Direct
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-hyperblue/20 bg-hyperblue/5 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-hyperblue">
                          Matched
                        </span>
                      )}
                    </div>
                    <LeadStatus status={lead.status} unlocked={lead.unlocked} plan={agency?.plan} agency={agency} />
                  </div>

                  <div>
                    {lead.status === "Lost" ? (
                      <span
                        className="text-[15px] font-bold text-zinc-400 cursor-not-allowed block leading-tight"
                        title="Lost leads cannot be opened"
                      >
                        {lead.type === "Direct" ? `Message from ${lead.directContact?.name}` : (lead.project?.title ?? "—")}
                      </span>
                    ) : (
                      <Link
                        to="/leads/$id"
                        params={{ id: lead._id }}
                        className="text-[15px] font-bold text-zinc-900 hover:text-hyperblue transition-colors block leading-tight"
                      >
                        {lead.type === "Direct" ? `Message from ${lead.directContact?.name}` : (lead.project?.title ?? "—")}
                      </Link>
                    )}
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-400">
                      <span>{lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}</span>
                      <span>·</span>
                      <span className="uppercase tracking-wider">{lead.type === "Direct" ? "Agency Message" : (lead.project?.country ?? "—")}</span>
                    </div>
                    {(lead.matchReasons?.length ?? 0) > 0 && (
                      <div
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-hyperblue/5 border border-hyperblue/15 px-2 py-0.5 text-[9px] font-bold text-hyperblue"
                        title={lead.matchReasons!.join(" • ")}
                      >
                        <Sparkles className="size-2.5" />
                        Why matched: {lead.matchReasons![0]}
                        {lead.matchReasons!.length > 1 && ` +${lead.matchReasons!.length - 1} more`}
                      </div>
                    )}
                  </div>

                  {lead.type === "Direct" ? (
                    <p className="text-xs text-zinc-500 italic line-clamp-2">
                      "{lead.directContact?.message}"
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(lead.project?.services ?? []).slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-100/80"
                        >
                          {s}
                        </span>
                      ))}
                      {(lead.project?.services ?? []).length > 3 && (
                        <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">
                          +{(lead.project?.services ?? []).length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3.5 border-t border-zinc-100">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Estimated Budget</div>
                      <div className="text-sm font-extrabold text-zinc-950 mt-0.5">
                        {lead.type === "Direct"
                          ? (lead.directContact?.budget || "—")
                          : (BUDGET_TIERS.find((b) => b.id === lead.project?.budget)?.label ?? "—")}
                      </div>
                    </div>

                    {lead.status === "Lost" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-not-allowed border border-zinc-200/50">
                        Lost
                      </span>
                    ) : (
                      <Link
                        to="/leads/$id"
                        params={{ id: lead._id }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-obsidian hover:bg-hyperblue px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 shadow-sm"
                      >
                        <span>View</span>
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      ) : (
      <section className="py-6 md:py-8 bg-neutral-50/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-obsidian">Scheduled Meetings</h2>
              <p className="text-sm font-medium text-zinc-500 mt-0.5">Manage consultation calls and video inquiries from clients.</p>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-steel bg-white px-2.5 py-1 rounded-lg border border-border shadow-xs">Total: {meetings.length}</div>
          </div>

          {meetings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-white p-12 text-center shadow-xs">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-obsidian/5 border border-border text-steel shadow-xs">
                <Calendar className="size-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-bold text-obsidian">No meetings yet</h3>
              <p className="mt-1.5 text-xs text-steel font-medium max-w-xs mx-auto">Clients will see a booking option on your public profile and can schedule video calls with you directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetings.map((meeting) => {
                const isPending = meeting.status === "pending";
                const isAccepted = meeting.status === "accepted";
                const isDeclined = meeting.status === "declined";

                // Generate initials for avatar
                const initials = meeting.clientName
                  ? meeting.clientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "CL";

                return (
                  <Card
                    key={meeting._id}
                    className="group flex flex-col justify-between overflow-hidden shadow-xs border-zinc-200 bg-white"
                  >
                    <div>
                      {/* CardHeader: Client & Status */}
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-4 min-w-0 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="size-10 rounded-xl">
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-hyperblue to-obsidian text-white text-[11px] font-black tracking-wider shadow-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-zinc-900 tracking-tight leading-none mb-1 truncate">
                              {meeting.clientName}
                            </h4>
                            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider truncate">
                              {meeting.client?.company || meeting.clientEmail}
                            </div>
                          </div>
                        </div>

                      </CardHeader>

                      {/* CardContent: Date, time, topic */}
                      <CardContent className="p-5 pt-0 pb-4">
                        <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-200/60 relative overflow-hidden">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs font-semibold text-zinc-600 pb-3 border-b border-zinc-200/50 mb-3">
                            <span className="flex items-center gap-1.5 shrink-0"><Calendar className="size-3.5 text-zinc-500" /> {meeting.date}</span>
                            <span className="size-1 rounded-full bg-zinc-300 shrink-0" />
                            <span className="flex items-center gap-1.5 shrink-0"><Clock className="size-3.5 text-zinc-500" /> {meeting.time}</span>
                            <span className="size-1 rounded-full bg-zinc-300 shrink-0" />
                            <span className="text-zinc-500 text-[10px] font-medium shrink-0">({meeting.timezone || "GST"}) · {meeting.duration}m</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 block">Topic</span>
                            <span className="text-[13px] font-semibold text-zinc-900 tracking-tight leading-snug block">{meeting.topic}</span>
                          </div>
                          {meeting.notes && (
                            <div className="mt-3.5 bg-white rounded-lg p-2.5 border border-zinc-100 shadow-3xs relative">
                              <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">Notes</span>
                              <p className="text-xs text-zinc-600 leading-relaxed font-normal">"{meeting.notes}"</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>

                    {/* CardFooter: Action buttons */}
                    <CardFooter className="p-5 pt-0 flex gap-2">
                      {isPending && (
                        <>
                          <Button
                            type="button"
                            onClick={() => handleUpdateMeetingStatus(meeting._id, "accepted")}
                            className="flex-1 bg-hyperblue hover:bg-hyperblue/90 text-white font-bold uppercase tracking-widest text-[9px] h-9 gap-1.5 shadow-xs"
                          >
                            <Check className="size-3.5" />
                            Accept Request
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleUpdateMeetingStatus(meeting._id, "declined")}
                            className="border-zinc-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold uppercase tracking-widest text-[9px] h-9 gap-1.5 px-4 shadow-3xs"
                          >
                            <X className="size-3.5" />
                            Decline
                          </Button>
                        </>
                      )}
                      {isAccepted && (
                        <>
                          {meeting.meetingLink && (
                            <Button
                              asChild
                              className="flex-1 bg-hyperblue hover:bg-hyperblue/90 text-white font-bold uppercase tracking-widest text-[9px] h-9 gap-1.5 shadow-xs"
                            >
                              <a
                                href={meeting.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Video className="size-3.5" />
                                Join Call
                              </a>
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleUpdateMeetingStatus(meeting._id, "declined")}
                            className="border-zinc-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 font-bold uppercase tracking-widest text-[9px] h-9 gap-1.5 px-4 shadow-3xs"
                          >
                            <XCircle className="size-3.5" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
      )}

      <section className="pb-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3 px-4 md:px-6">
          {/* PROFILE COMPLETENESS (Profile Health) */}
          <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Profile Health
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  Level 03
                </span>
              </div>

              <div className="text-4xl font-semibold text-zinc-900 tracking-tight mb-4">82%</div>

              <div className="space-y-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-hyperblue transition-all duration-1000 ease-out"
                    style={{ width: "82%" }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 font-medium">
                  <span>Progress</span>
                  <span>18% remaining</span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-[12px] font-medium text-zinc-500 leading-relaxed border-t border-zinc-100 pt-4">
              Add <span className="text-hyperblue font-semibold">2 more case studies</span> to reach 100% and unlock featured placement on the homepage.
            </p>
          </div>

          {/* SUBSCRIPTION (Account Plan) */}
          <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Account Plan
                </span>
                <span className="rounded bg-zinc-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xl font-semibold text-zinc-900 tracking-tight">
                    {agency?.plan === "Growth" ? "FindingGlobal+" : "Free"} Plan
                  </div>
                  <div className="text-[12px] text-zinc-500 mt-0.5">
                    {agency?.plan === "Growth" ? "$99 / month" : "Free"}
                  </div>
                  {agency?.plan !== "Starter" && (
                    <div className="mt-3.5 space-y-1.5 text-[11px] font-medium text-zinc-500 border-t border-zinc-100 pt-3 max-w-[220px]">
                      {agency?.planPurchasedAt && (
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">Purchased:</span>
                          <span className="text-zinc-800 font-bold">{formatDate(agency.planPurchasedAt)}</span>
                        </div>
                      )}
                      {agency?.planExpiresAt && (
                        <div className="flex justify-between gap-4">
                          <span className="text-zinc-400">Expires:</span>
                          <span className="text-zinc-800 font-bold">{formatDate(agency.planExpiresAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  {agency?.plan === "Starter" ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
                        <span>Monthly Quota Used</span>
                        <span className={`font-mono font-bold ${agency.leadsUsed >= (agency.leadsLimit || 3) ? "text-destructive" : "text-zinc-900"}`}>
                          {agency.leadsUsed} / {agency.leadsLimit || 3}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${agency.leadsUsed >= (agency.leadsLimit || 3)
                            ? "bg-destructive"
                            : "bg-hyperblue"
                            }`}
                          style={{ width: `${Math.min(100, ((agency.leadsUsed / (agency.leadsLimit || 3)) * 100))}%` }}
                        />
                      </div>
                      {agency.leadsUsed >= (agency.leadsLimit || 3) && (
                        <p className="text-[11px] font-medium text-destructive flex items-center gap-1 mt-1">
                          <span className="size-1.5 rounded-full bg-destructive inline-block" />
                          Monthly limits reached. Please upgrade to unlock new briefs.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded bg-zinc-50 border border-zinc-100 px-2.5 py-1 text-zinc-700 shadow-none">
                      <span className="size-1.5 rounded-full bg-success inline-block"></span>
                      <span className="text-[9px] font-bold uppercase tracking-[0.05em]">Unlimited Marketplace Match</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 mt-5">
              <Link
                to="/upgrade"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-hyperblue hover:underline group/link"
              >
                <span>Billing & Subscription</span>
                <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="rounded-xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-5">Quick Actions</div>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { l: "Edit public profile", to: "/agency-onboarding", i: <User className="size-4" strokeWidth={2} /> },
                  { l: "Add case study", to: "/agency-onboarding", s: { step: 4 }, i: <Briefcase className="size-4" strokeWidth={2} /> },
                ].map((link) => (
                  <Link
                    key={link.l}
                    to={link.to}
                    search={link.s as never}
                    className="flex items-center justify-between group rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2.5 transition-all hover:bg-zinc-50 hover:border-zinc-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-7 rounded bg-white border border-zinc-100 flex items-center justify-center text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] group-hover:text-hyperblue group-hover:border-hyperblue/20 transition-colors">
                        {link.i}
                      </div>
                      <span className="text-[12px] font-semibold text-zinc-700">{link.l}</span>
                    </div>
                    <ChevronRight className="size-3.5 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-5 text-[12px] text-zinc-400 border-t border-zinc-100 pt-4">
              Select an action to update your profile.
            </p>
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
      <SiteFooter />
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-6 py-4.5 align-middle ${className}`}>{children}</td>;
}
function LeadStatus({ status, unlocked, plan, agency }: { status: string, unlocked?: boolean, plan?: string, agency?: ApiAgency | null }) {
  const isLocked = plan === "Starter" && !unlocked && (agency ? agency.leadsUsed >= (agency.leadsLimit || 3) : true);

  if (isLocked && status === "New") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Locked
      </span>
    );
  }

  const styles: Record<string, string> = {
    New: "bg-hyperblue/10 text-hyperblue border border-hyperblue/20",
    Quoted: "bg-amber-500/10 text-amber-600 border border-amber-500/20",
    "In Conversation": "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
    Won: "bg-hyperblue/10 text-hyperblue border border-hyperblue/20",
    Lost: "bg-zinc-100 text-zinc-500 border border-zinc-200/50",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}
