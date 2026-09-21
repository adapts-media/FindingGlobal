import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { contactApi } from "@/lib/api";
import { toast } from "sonner";
import { Send, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/enterprise")({
  head: () => ({
    meta: [
      { title: "Enterprise Solutions — Finding Global" },
      { name: "description", content: "Custom solutions for large networks, agencies managing multiple geographical presences, or holding groups seeking custom procurement support." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/enterprise/" },
    ],
  }),
  component: EnterprisePage,
});

function EnterprisePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [requirements, setRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !requirements) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await contactApi.submitEnterprise({ name, email, company, phone, requirements });
      setSuccess(true);
      toast.success("Request sent successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to send request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-hyperblue/20">
      <SiteHeader />

      <section className="bg-background border-b border-border px-6 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-hyperblue/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-hyperblue/5 px-3 py-1 text-hyperblue mb-6">
            <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Enterprise Solutions</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-obsidian sm:text-6xl max-w-4xl mx-auto leading-[1.1]">
            Scale globally with <span className="text-transparent bg-clip-text bg-gradient-to-r from-obsidian via-hyperblue to-obsidian">custom support</span>
          </h1>
          <p className="mt-4 text-base md:text-lg font-medium text-steel-dark max-w-2xl mx-auto">
            Get personalized assistance, unlimited global listings, priority matches, and account management for your large-scale agency operations.
          </p>
        </div>
      </section>

      <section className="px-6 py-16 relative">
        <div className="mx-auto max-w-3xl">
          <div className="bg-card border border-border shadow-sm rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-hyperblue/[0.02] rounded-full blur-xl pointer-events-none" />

            {success ? (
              <div className="py-12 text-center max-w-md mx-auto">
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success/5 text-success border border-success/10">
                  <CheckCircle2 className="size-8" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight text-obsidian">Request Received</h3>
                <p className="mt-3 text-sm text-steel-dark leading-relaxed">
                  Thank you for your interest in our enterprise solutions. Our dedicated team will review your requirements and reach out within 1 business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-obsidian mb-1">Talk to our Enterprise Team</h3>
                  <p className="text-xs font-medium text-steel-dark">
                    Tell us about your setup and we'll craft the perfect plan for your agency network.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                      Work Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@agency.com"
                      required
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Agency Global Network"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="requirements" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                    Your Requirements <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Tell us about the number of locations, users, and any specific procurement needs..."
                    rows={5}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200 resize-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-obsidian hover:bg-hyperblue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-obsidian/10 hover:shadow-hyperblue/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                    <Send className="size-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
