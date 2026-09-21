import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { agencyApi, type ApiAgency } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Mail, User, Building2, Wallet, Inbox, ChevronLeft, ArrowRight } from "lucide-react";
import { LoadingScreen } from "@/components/loading-screen";

export const Route = createFileRoute("/agency-inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Finding Global" },
      { name: "description", content: "Manage your direct messages from clients." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/agency-inbox/" },
    ],
  }),
  component: AgencyInbox,
});

function AgencyInbox() {
  const { user, initialized } = useAuth();
  const navigate = useNavigate();
  const [agency, setAgency] = useState<ApiAgency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && (!user || (user.role !== "agency" && user.role !== "admin"))) {
      navigate({ to: "/login" });
    }
  }, [initialized, user, navigate]);

  useEffect(() => {
    if (!initialized || !user || user.role !== "agency" || !user.agencySlug) {
      setLoading(false);
      return;
    }
    agencyApi.get(user.agencySlug)
      .then(r => setAgency(r.agency))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, initialized]);

  if (!initialized || loading) {
    return <LoadingScreen />;
  }

  if (!user || !agency) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md bg-obsidian/5 px-2.5 py-1 text-obsidian mb-4">
                <Inbox className="size-3.5" strokeWidth={2} />
                <span className="text-[9px] font-bold uppercase tracking-widest">Direct Messages</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-obsidian sm:text-5xl">Your Inbox</h1>
              <p className="mt-2 text-sm font-medium text-steel-dark">Direct inquiries from the contact form on your profile.</p>
            </div>
            <Link 
              to="/agency-dashboard" 
              className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-steel-dark hover:text-obsidian transition-colors"
            >
              <ChevronLeft className="size-3 transition-transform group-hover:-translate-x-0.5" strokeWidth={2.5} />
              Back to dashboard
            </Link>
          </div>

          <div className="space-y-6">
            {(!agency.messages || agency.messages.length === 0) ? (
              <div className="rounded-3xl border border-dashed border-border bg-surface/50 p-24 text-center">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-white border border-border text-obsidian shadow-sm">
                  <Mail className="size-8" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-obsidian">No messages yet</h3>
                <p className="mt-3 text-sm text-steel-dark font-medium leading-relaxed max-w-sm mx-auto">When clients contact you through your profile, direct inquiries will appear here for you to respond.</p>
              </div>
            ) : (
              agency.messages.slice().reverse().map((msg, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-border bg-white p-6 transition-all hover:border-obsidian/20 hover:shadow-sm">
                  <div className="absolute top-0 right-0 size-32 bg-obsidian/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-obsidian/8 transition-colors" />
                  
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-obsidian/5 border border-obsidian/10 text-base font-bold text-obsidian">
                        {msg.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-base font-extrabold tracking-tight text-obsidian uppercase">{msg.name}</div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-steel-dark mt-1 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><Mail className="size-3" /> {msg.email}</span>
                          {msg.company && (
                            <>
                              <span className="text-steel/30">/</span>
                              <span className="flex items-center gap-1.5"><Building2 className="size-3" /> {msg.company}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold text-steel uppercase tracking-wider">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </div>
                  </div>
                  
                  {msg.budget && (
                    <div className="mt-3.5 flex flex-wrap gap-4 relative z-10">
                      <div className="inline-flex items-center gap-1.5 rounded bg-obsidian/5 border border-obsidian/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-obsidian">
                        <Wallet className="size-3" strokeWidth={2.5} />
                        Budget: {msg.budget}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 bg-zinc-50 border border-border/40 p-4.5 rounded-xl relative z-10">
                    <p className="text-[13px] leading-relaxed text-obsidian font-semibold italic">
                      "{msg.message}"
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end relative z-10">
                    <a 
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${msg.email}&su=${encodeURIComponent(`Regarding your inquiry to ${agency.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1.5 rounded-xl bg-obsidian px-5 py-2.5 text-[9px] font-black uppercase tracking-wider text-white transition-all hover:bg-hyperblue active:scale-95 shadow-sm"
                    >
                      Reply via Email
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
