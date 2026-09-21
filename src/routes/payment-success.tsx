import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { agencyApi } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/payment-success")({
  validateSearch: (s: Record<string, unknown>): { payment_intent_id?: string } => ({
    payment_intent_id: typeof s.payment_intent_id === "string" ? s.payment_intent_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Payment Successful — Finding Global" },
      { name: "description", content: "Thank you for upgrading your plan." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/payment-success/" },
    ],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { payment_intent_id } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!payment_intent_id) {
      toast.error("Invalid payment reference.");
      setErrorMessage("No payment reference was found. Please check your dashboard to verify your plan.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 3;

    async function checkPayment() {
      try {
        if (!payment_intent_id) return;
        const res = await agencyApi.confirmPayment(payment_intent_id);
        
        if (!isMounted) return;

        if (res.success && res.status === "completed") {
          setStatus("completed");
          toast.success("Upgrade verified successfully!");
          setLoading(false);
        } else if (res.status === "pending" && attempts < maxAttempts) {
          // If it's still pending, retry after 2 seconds (handling minor webhook / payment delays)
          attempts++;
          setTimeout(checkPayment, 2500);
        } else {
          setStatus(res.status);
          setLoading(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Verification failed:", err);
        setErrorMessage(err.message || "An error occurred while verifying your payment.");
        setLoading(false);
      }
    }

    // Wait a brief moment before first verification check to let Ziina processing settle
    const timer = setTimeout(checkPayment, 1500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [payment_intent_id]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-hidden font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes modalScale {
            from { opacity: 0; transform: scale(0.96) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes floatBubble {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(3deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-modal-scale {
            animation: modalScale 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-float {
            animation: floatBubble 6s ease-in-out infinite;
          }
        `
      }} />

      {/* Floating gradient glow lights */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-hyperblue/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-hyperblue/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="architectural-grid pointer-events-none absolute inset-0 z-0 opacity-10" />

      <SiteHeader />

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden z-10">
        <div className="w-full max-w-[540px] animate-modal-scale">
          {loading ? (
            /* Loading / Verification View */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 md:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.08)] flex flex-col items-center text-center gap-6">
              <div className="relative size-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-hyperblue/10 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute inset-2 rounded-full border border-dashed border-hyperblue/30 animate-spin" style={{ animationDuration: "6s" }} />
                <div className="absolute inset-4 rounded-full bg-hyperblue/[0.05] flex items-center justify-center text-hyperblue">
                  <Loader2 className="size-6 animate-spin stroke-[2.5]" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-obsidian tracking-tight uppercase">Verifying Payment</h2>
                <p className="text-sm font-semibold text-slate-400 leading-relaxed max-w-[36ch] mx-auto">
                  Confirming your upgrade status with Ziina's payment gateway. This should only take a moment...
                </p>
              </div>
            </div>
          ) : errorMessage || status !== "completed" ? (
            /* Error / Failed View */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 md:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.08)] flex flex-col items-center text-center gap-6">
              <div className="size-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                <AlertCircle className="size-8 stroke-[2]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-obsidian tracking-tight uppercase">Payment Verification Failed</h2>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-[40ch] mx-auto">
                  {errorMessage || `We couldn't confirm a successful payment status. Current payment status is: ${status}`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3.5 w-full mt-2">
                <Link
                  to="/upgrade/"
                  className="flex-1 h-[48px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-obsidian text-[11px] font-bold uppercase tracking-wider hover:border-slate-300 transition-all duration-[250ms] cursor-pointer flex items-center justify-center"
                >
                  Retry Upgrade
                </Link>
                <Link
                  to="/agency-dashboard/"
                  className="flex-1 h-[48px] rounded-xl bg-obsidian text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all duration-[250ms] cursor-pointer flex items-center justify-center"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            /* Success View */
            <div className="bg-white rounded-3xl border border-black/[0.06] p-8 md:p-10 shadow-[0_40px_120px_rgba(0,0,0,0.08)] flex flex-col items-center text-center relative overflow-hidden">
              {/* Celebrate Sparkles Background effect */}
              <div className="absolute -top-12 -left-12 size-40 bg-slate-200/50 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 size-40 bg-hyperblue/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="size-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 mb-2 animate-float shadow-sm">
                <CheckCircle2 className="size-8 stroke-[2.5]" />
              </div>

              <span className="rounded-full bg-slate-900/10 border border-slate-900/20 px-3 py-1 text-[9px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                <Sparkles className="size-3 animate-pulse" />
                Plan Activated
              </span>

              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-black text-obsidian tracking-tighter leading-tight">
                  Welcome to FindingGlobal+
                </h2>
                <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-[42ch] mx-auto">
                  Your payment has been securely processed by Ziina. Your agency profile has been upgraded, unlocking priority rankings and unlimited leads!
                </p>
              </div>

              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-slate-100 to-transparent my-6" />

              <div className="w-full">
                <Link
                  to="/agency-dashboard/"
                  style={{ background: "var(--obsidian)" }}
                  className="w-full h-[52px] rounded-xl text-white text-[11px] font-bold uppercase tracking-wider hover:scale-[1.01] active:scale-98 transition-all duration-[250ms] cursor-pointer flex items-center justify-center gap-2 group shadow-md"
                >
                  Enter Your Dashboard
                  <ArrowRight className="size-3.5 stroke-[3] transform transition-transform duration-[250ms] group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
