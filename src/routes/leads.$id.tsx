import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUDGET_TIERS } from "@/lib/mock-data";
import { leadApi, type ApiLead, ApiError } from "@/lib/api";
import { getCountryFlagUrl } from "@/lib/country-codes";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import {
  Wallet,
  MapPin,
  Building2,
  Zap,
  Calendar,
  ChevronLeft,
  Mail,
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  FileText,
  Clock,
  Sparkles,
  User,
  Info,
  PhoneCall
} from "lucide-react";

export const Route = createFileRoute("/leads/$id")({
  loader: async ({ params }): Promise<{ lead?: ApiLead; error?: string; code?: string }> => {
    try {
      const { lead } = await leadApi.get(params.id);
      if (lead.status === "Lost") {
        return { error: "This lead is marked as lost and cannot be viewed.", code: "LOST_LEAD" };
      }
      return { lead };
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        return { error: e.message, code: "LIMIT_REACHED" };
      }
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const l = loaderData?.lead;
    if (!l || !l.project) return {
      links: [
        { rel: "canonical", href: `https://findingglobal.com/leads/${params.id}/` },
      ],
    };
    return {
      meta: [
        { title: `Lead: ${l.project.title} — Finding Global` },
      ],
      links: [
        { rel: "canonical", href: `https://findingglobal.com/leads/${params.id}/` },
      ],
    };
  },
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const router = useRouter();
  const loaderData = Route.useLoaderData() as { lead?: ApiLead; error?: string; code?: string };
  const { code } = loaderData;
  const [lead, setLead] = useState<ApiLead | undefined>(loaderData.lead);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [requestingMeeting, setRequestingMeeting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLead(loaderData.lead);
    if (loaderData.lead) {
      setNote(loaderData.lead.note || "");
    }
  }, [loaderData.lead]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNote = async () => {
    if (!lead) return;
    setSavingNote(true);
    try {
      const { lead: updated } = await leadApi.update(lead._id, { note });
      setLead(updated);
      setNote(updated.note || "");
      router.invalidate();
      toast.success("Engagement notes saved successfully!");
    } catch (e) {
      toast.error("Failed to save notes");
    } finally {
      setSavingNote(false);
    }
  };

  if (code === "LOST_LEAD") {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <section className="flex flex-1 items-center justify-center px-6 py-24 relative overflow-hidden">
          <div className="absolute inset-0 architectural-grid opacity-20 pointer-events-none" />
          <div className="w-full max-w-md text-center relative z-10 bg-card p-8 rounded-2xl border border-border/60 shadow-elevated">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/25 shadow-lg">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-obsidian tracking-tight">Lead not available</h1>
            <p className="mt-3 text-sm leading-relaxed text-steel-dark font-semibold">
              This lead has been marked as lost and can no longer be opened or viewed.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link to="/agency-dashboard/" className="rounded-xl bg-obsidian px-6 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-obsidian/90 text-center transition-all shadow-md active:scale-97">
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  if (code === "LIMIT_REACHED") {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SiteHeader />
        <section className="flex flex-1 items-center justify-center px-6 py-24 relative overflow-hidden">
          <div className="absolute inset-0 architectural-grid opacity-20 pointer-events-none" />
          <div className="w-full max-w-md text-center relative z-10 bg-card p-8 rounded-2xl border border-border/60 shadow-elevated">
            <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-obsidian text-white shadow-lg">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-obsidian tracking-tight">Monthly limit reached</h1>
            <p className="mt-3 text-sm leading-relaxed text-steel-dark font-semibold">
              You've already responded to 3 leads this month. To unlock more qualified briefs and contact details, please upgrade your plan.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link to="/upgrade/" className="rounded-xl bg-obsidian px-6 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-obsidian/90 text-center transition-all shadow-md active:scale-97">
                Upgrade to FindingGlobal+
              </Link>
              <Link to="/agency-dashboard/" className="text-xs font-bold uppercase tracking-wider text-steel-dark hover:text-obsidian text-center py-2 transition-colors">
                Back to dashboard
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  if (!lead) return null;
  const isDirect = lead.type === "Direct";
  const project = lead.project;
  const contact = isDirect
    ? lead.directContact
    : (project?.clientUserId as { name: string; email: string; company?: string });
  const matchReasons = !isDirect ? (lead.matchReasons ?? []) : [];

  const countryFlag = !isDirect && project?.country ? getCountryFlagUrl(project.country) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden text-foreground">
      <SiteHeader />

      {/* Decorative grid background */}
      <div className="absolute inset-0 architectural-grid opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-hyperblue/[0.02] rounded-full blur-[80px] pointer-events-none" />
      
      <main className="flex-1 py-6 md:py-8 relative z-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 space-y-6">
          
          {/* Breadcrumbs & ID Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border/40">
            <Link 
              to="/agency-dashboard/" 
              className="group flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-steel-dark hover:text-obsidian transition-colors"
            >
              <ChevronLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              Back to dashboard
            </Link>
            
            <span className="font-mono text-[10px] font-bold text-steel bg-surface-muted px-3 py-1 rounded-xl border border-border/50 shadow-2xs">
              LEAD ID: #{lead._id.slice(-6).toUpperCase()}
            </span>
          </div>
  
          {/* Starter Plan Quota Banner */}
          {lead.agency && (lead.agency as any).plan === "Starter" && (
            <div className="rounded-2xl border border-hyperblue/20 bg-hyperblue/[0.02] p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-hyperblue/10 text-hyperblue border border-hyperblue/20">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-obsidian uppercase tracking-wider">Lead Unlocked</h3>
                  <p className="text-xs font-semibold text-steel-dark mt-0.5 leading-normal">
                    This lead was successfully unlocked using your monthly Starter plan quota.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-steel">Quota Used:</span>
                <span className="rounded-lg bg-hyperblue/10 px-2.5 py-0.5 text-xs font-bold text-hyperblue font-mono border border-hyperblue/20">
                  {(lead.agency as any).leadsUsed} / {(lead.agency as any).leadsLimit || 3}
                </span>
              </div>
            </div>
          )}

          {/* Lead Details Header Card */}
          <Card className="border border-border/80 bg-card/65 backdrop-blur-md shadow-lg shadow-obsidian/5 rounded-2xl overflow-hidden p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {(() => {
                  const statusStyles: Record<string, { bg: string, dot: string, border: string, text: string }> = {
                    New: { bg: "bg-hyperblue/10", dot: "bg-hyperblue", border: "border-hyperblue/20", text: "text-hyperblue" },
                    Quoted: { bg: "bg-amber-500/10", dot: "bg-amber-500", border: "border-amber-500/20", text: "text-amber-600" },
                    "In Conversation": { bg: "bg-emerald-500/10", dot: "bg-emerald-500", border: "border-emerald-500/20", text: "text-emerald-600" },
                    Won: { bg: "bg-hyperblue/10", dot: "bg-hyperblue", border: "border-hyperblue/20", text: "text-hyperblue" },
                    Lost: { bg: "bg-zinc-50", dot: "bg-zinc-400", border: "border-zinc-200", text: "text-zinc-500" },
                  };
                  const s = statusStyles[lead.status] || statusStyles.New;
                  return (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border ${s.border} ${s.bg} px-3 py-1 text-[10px] font-black uppercase tracking-widest ${s.text}`}>
                      <span className={`size-1.5 rounded-full ${s.dot} animate-pulse`} />
                      {lead.status}
                    </span>
                  );
                })()}
                
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest text-steel-dark">
                  {lead.type === 'Direct' ? 'Direct Inquiry' : 'Marketplace Match'}
                </span>
                
                <span className="text-xs font-semibold text-steel flex items-center gap-1.5 sm:ml-auto mt-0.5 sm:mt-0">
                  <Calendar className="size-3.5 text-steel" />
                  <span>Received {new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </span>
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-obsidian leading-tight">
                {isDirect ? `Inquiry from ${contact?.name}` : project?.title}
              </h1>

              {/* Core Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border/40 pt-4 mt-2">
                
                {/* Budget */}
                <div className="p-4 rounded-xl border border-border/60 bg-surface-muted/30 flex items-center gap-3">
                  <div className="p-2 bg-card rounded-lg border border-border text-obsidian shadow-2xs">
                    <Wallet className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-steel">Project Budget</span>
                    <span className="text-sm font-bold text-obsidian tracking-tight">
                      {!isDirect && project ? (BUDGET_TIERS.find(b => b.id === project.budget)?.label ?? project.budget) : (lead.directContact?.budget || 'Not specified')}
                    </span>
                  </div>
                </div>

                {/* Target Market */}
                <div className="p-4 rounded-xl border border-border/60 bg-surface-muted/30 flex items-center gap-3">
                  <div className="p-2 bg-card rounded-lg border border-border text-obsidian shadow-2xs">
                    <MapPin className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-steel">Target Market</span>
                    <span className="text-sm font-bold text-obsidian tracking-tight flex items-center gap-1.5">
                      {countryFlag && (
                        <img 
                          src={countryFlag} 
                          alt="" 
                          className="w-5 h-3.5 object-cover rounded-[2px] border border-border/40 shadow-xs shrink-0" 
                        />
                      )}
                      <span>{!isDirect ? project?.country : "Global Market"}</span>
                    </span>
                  </div>
                </div>

                {/* Industry */}
                <div className="p-4 rounded-xl border border-border/60 bg-surface-muted/30 flex items-center gap-3">
                  <div className="p-2 bg-card rounded-lg border border-border text-obsidian shadow-2xs">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-steel">Industry Segment</span>
                    <span className="text-sm font-bold text-obsidian tracking-tight">
                      {!isDirect ? project?.industry : "General"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </Card>

          {/* Left Column (Brief Details) & Right Column (Client Desk Sidebar) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] items-start">
            
            {/* Left Content Side */}
            <div className="space-y-6">

              {/* Service Categories Card */}
              {!isDirect && project?.services && project.services.length > 0 && (
                <Card className="border border-border/80 bg-card shadow-xs rounded-2xl p-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-obsidian flex items-center gap-2 mb-4">
                    <Zap className="size-4 text-hyperblue" />
                    Required Service Categories
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.services.map((service, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="rounded-xl border-border/80 bg-surface-muted/30 px-3 py-1.5 text-xs font-bold text-obsidian hover:border-hyperblue/30 transition-colors"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}

              {/* Project Description Card */}
              <Card className="border border-border/80 bg-card shadow-xs rounded-2xl p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                  <FileText className="size-4 text-hyperblue" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-obsidian">Project Scope & Brief</h3>
                </div>
                <div className="prose prose-sm max-w-none">
                  {isDirect || project?.description ? (
                    <p className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-obsidian">
                      {isDirect ? lead.directContact?.message : project?.description}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-steel-dark">
                      <Info className="size-8 text-steel mb-2 opacity-50" />
                      <p className="text-sm font-bold">No description provided by the client.</p>
                      <p className="text-xs text-steel mt-0.5">Please contact the client directly using the credentials on the right.</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* CRM / Engagement Notes Card */}
              <Card className="border border-border/80 bg-card shadow-xs rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-hyperblue" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-obsidian">Internal Engagement Notes</h3>
                  </div>
                  <Badge variant="secondary" className="text-[9px] font-black uppercase bg-surface-muted text-steel-dark border-border/50">
                    Private Workspace
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="relative rounded-2xl border border-border bg-card p-1 focus-within:border-hyperblue focus-within:ring-2 focus-within:ring-hyperblue/10 transition-all shadow-inner">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Document your engagement status, call schedules, next steps, or specific follow-up checklist..."
                      className="w-full min-h-[120px] bg-transparent border-0 outline-none p-3.5 text-xs font-semibold text-obsidian placeholder-steel/60 resize-y"
                    />
                    <div className="flex justify-between items-center border-t border-border/30 px-3.5 py-2 mt-1">
                      <span className="text-[10px] text-steel font-bold uppercase">
                        {note.length} characters
                      </span>
                      {note !== (lead.note || "") && (
                        <Button
                          onClick={handleSaveNote}
                          disabled={savingNote}
                          size="sm"
                          className="rounded-xl bg-obsidian px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-2xs"
                        >
                          {savingNote ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin mr-1" />
                              Saving...
                            </>
                          ) : (
                            "Save Notes"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-steel font-medium leading-relaxed">
                    * Notes entered here are strictly private to your agency teammates and are never visible to the client or Finding Global operators.
                  </p>
                </div>
              </Card>

            </div>

            {/* Right Desk Sidebar (Client Desk) */}
            <div className="space-y-6 lg:sticky lg:top-24">

              {/* Why You Were Matched */}
              {matchReasons.length > 0 && (
                <Card className="border border-hyperblue/15 bg-hyperblue/[0.02] shadow-lg shadow-obsidian/5 rounded-2xl overflow-hidden p-6 relative">
                  <div className="absolute top-0 right-0 size-24 bg-hyperblue/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-hyperblue mb-4 pb-2 border-b border-hyperblue/10 flex items-center gap-1.5">
                    <Sparkles className="size-3.5" />
                    Why You Were Matched
                  </h3>
                  <ul className="space-y-2.5">
                    {matchReasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2.5">
                        <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mt-0.5">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className="text-xs font-bold text-obsidian leading-relaxed">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Client Contact Profile Card */}
              <Card className="border border-border/80 bg-card shadow-lg shadow-obsidian/5 rounded-2xl overflow-hidden p-6 relative">
                <div className="absolute top-0 right-0 size-24 bg-hyperblue/[0.01] rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                
                <h3 className="text-xs font-bold uppercase tracking-widest text-steel-dark/70 mb-4 pb-2 border-b border-border/40">
                  Client Desk
                </h3>
                
                {/* Visual Identity Avatar Block */}
                <div className="flex items-center gap-3.5 mb-6">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-hyperblue to-blue-600 text-white font-bold text-xl shadow-md">
                    {contact?.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-black text-obsidian tracking-tight truncate leading-tight">
                      {contact?.name || "Anonymous Client"}
                    </h4>
                    {contact?.company && (
                      <Badge variant="outline" className="mt-1 border-border bg-surface-muted px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-steel">
                        {contact.company}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Email Address & Contact Fields */}
                <div className="space-y-5">
                  <div className="rounded-xl border border-border bg-surface-muted/30 p-3 space-y-1">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-steel">Client Email</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-obsidian tracking-tight break-all truncate block">
                        {contact?.email || 'Not disclosed'}
                      </span>
                      {contact?.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyEmail(contact.email)}
                          className="size-7 rounded-lg text-steel hover:text-obsidian hover:bg-card border border-transparent hover:border-border shrink-0"
                          title="Copy Email"
                        >
                          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contact CTAs */}
                  <div className="space-y-2.5 pt-2 border-t border-border/40">
                    {contact?.email && (
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${contact.email}&su=${encodeURIComponent("Regarding your inquiry on Finding Global")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl bg-obsidian py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-zinc-800 transition-all shadow-sm w-full text-center"
                      >
                        <Mail className="size-4" />
                        Send Email
                      </a>
                    )}

                    {!isDirect && (
                      <div className="w-full">
                        {lead.meetingBooked ? (
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-success/10 py-3 text-xs font-bold uppercase tracking-wider text-success border border-success/30 shadow-2xs">
                            <Check className="size-4 stroke-[3]" />
                            Meeting Booked
                          </div>
                        ) : lead.meetingRequested ? (
                          <div className="flex items-center justify-center gap-2 rounded-xl bg-hyperblue/5 py-3 text-xs font-bold uppercase tracking-wider text-hyperblue border border-hyperblue/20 shadow-2xs">
                            <Clock className="size-4 animate-pulse" />
                            Meeting Requested
                          </div>
                        ) : (
                          <Button
                            disabled={requestingMeeting}
                            onClick={async () => {
                              setRequestingMeeting(true);
                              try {
                                const { lead: updated } = await leadApi.update(lead._id, { meetingRequested: true });
                                setLead(updated);
                                router.invalidate();
                                toast.success("Meeting requested successfully!");
                              } catch (e) {
                                toast.error("Failed to request meeting");
                              } finally {
                                setRequestingMeeting(false);
                              }
                            }}
                            variant="outline"
                            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-5 text-xs font-black uppercase tracking-wider text-obsidian hover:bg-surface hover:border-obsidian hover:text-obsidian transition-colors w-full cursor-pointer shadow-2xs"
                          >
                            {requestingMeeting ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Requesting...
                              </>
                            ) : (
                              <>
                                <PhoneCall className="size-4" />
                                Schedule Call
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Conversion Tips Box */}
              <Card className="border-2 border-dashed border-border/80 bg-surface-muted/20 p-4 relative overflow-hidden shadow-2xs rounded-2xl">
                <div className="flex gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-hyperblue text-white shadow-md">
                    <Zap className="size-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-steel">Engagement Strategy</h5>
                    <p className="text-xs font-bold leading-normal text-obsidian mt-1">
                      Agencies responding within 4 hours have a 3x higher conversion rate. We recommend contacting the client early to schedule a brief discovery call.
                    </p>
                  </div>
                </div>
              </Card>

            </div>

          </div>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
