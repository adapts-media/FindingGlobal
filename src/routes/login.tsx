import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, memo } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { ApiError, authApi, getToken } from "@/lib/api";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context, search }) => {
    // If already logged in, skip straight to intended destination
    if (getToken() && !(search as Record<string, unknown>).redirect) {
      throw redirect({ to: "/dashboard" });
    }
  },
  validateSearch: (s: Record<string, unknown>): { redirect?: string; tab?: string; role?: string; name?: string; email?: string; company?: string } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    tab: typeof s.tab === "string" ? s.tab : undefined,
    role: typeof s.role === "string" ? s.role : undefined,
    name: typeof s.name === "string" ? s.name : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
    company: typeof s.company === "string" ? s.company : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Finding Global" },
      { name: "description", content: "Sign in to your Finding Global client or agency account." },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/login/" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const redirectTo = search.redirect;

  const [tab, setTab] = useState<"signin" | "signup" | "forgot" | "reset" | "verify">(
    search.tab === "signup" || search.tab === "signin" || search.tab === "forgot" || search.tab === "reset" || search.tab === "verify"
      ? (search.tab as any)
      : "signin"
  );
  const [role, setRole] = useState<"client" | "agency">(
    search.role === "client" || search.role === "agency" ? (search.role as any) : "client"
  );

  const [name, setName] = useState(search.name || "");
  const [email, setEmail] = useState(search.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [company, setCompany] = useState(search.company || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, login, register, verifyRegister, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // If we came from a protected route, go back there
      if (redirectTo) {
        navigate({ to: redirectTo as any });
        return;
      }
      const to =
        user.role === "agency"
          ? (user.agencySlug ? "/agency-dashboard" : "/agency-onboarding")
          : user.role === "admin"
            ? "/admin"
            : "/dashboard";
      navigate({ to: to as any });
    }
  }, [user, navigate, redirectTo]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === "signin") {
        await login(email, password);
      } else if (tab === "signup") {
        const res = await register({ email, password, name, role, company: company.trim() });
        if (res.requiresOtp) {
          toast.success("OTP sent to your email.");
          setTab("verify");
        }
      } else if (tab === "verify") {
        await verifyRegister(email, otp);
        toast.success("Account verified and created successfully.");
      } else if (tab === "forgot") {
        await authApi.forgotPassword({ email });
        toast.success("Verification code (OTP) sent to your email.");
        setTab("reset");
      } else if (tab === "reset") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setSubmitting(false);
          return;
        }
        await authApi.resetPassword({ email, otp, password });
        toast.success("Password reset successfully. You can now sign in.");
        setTab("signin");
        setPassword("");
        setConfirmPassword("");
        setOtp("");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <section className="relative flex flex-1 items-center justify-center px-6 py-16 overflow-hidden">
        {/* Soft radial background glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-hyperblue/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/[0.01] rounded-full blur-[100px] pointer-events-none" />
        <div className="architectural-grid pointer-events-none absolute inset-0 z-0 opacity-30" />

        <div className="relative z-10 w-full max-w-md rounded-2xl border border-border/60 bg-card p-8 shadow-elevated">

          {/* Switcher Tab */}
          {(tab === "signin" || tab === "signup") && (
            <div className="mb-8 grid grid-cols-2 rounded-xl bg-surface-muted p-1">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${tab === "signin" ? "bg-card text-obsidian shadow-xs" : "text-steel-dark hover:text-obsidian"
                  }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setTab("signup")}
                className={`rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${tab === "signup" ? "bg-card text-obsidian shadow-xs" : "text-steel-dark hover:text-obsidian"
                  }`}
              >
                Create account
              </button>
            </div>
          )}

          <div className="text-left mb-6">
            <h1 className="text-2xl font-black text-obsidian tracking-tight">
              {tab === "signin"
                ? "Welcome back"
                : tab === "signup"
                  ? "Get started"
                  : tab === "verify"
                    ? "Verify your email"
                    : tab === "forgot"
                      ? "Forgot password"
                      : "Reset password"}
            </h1>
            <p className="mt-2 text-sm font-semibold text-steel-dark leading-relaxed">
              {tab === "signin"
                ? "Access your dashboard, projects, and conversations."
                : tab === "signup"
                  ? "Choose how you'll use Finding Global."
                  : tab === "verify"
                    ? `We sent a 6-digit code to ${email}. Enter it below to verify your account.`
                    : tab === "forgot"
                      ? "Enter your email address and we'll send you a 6-digit OTP code to reset your password."
                      : `We sent a 6-digit code to ${email}. Enter it below along with your new password.`}
            </p>
          </div>

          {tab === "signup" && (
            <div className="mt-6 grid grid-cols-2 gap-3 mb-6">
              {(["client", "agency"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border py-3 px-4 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${role === r
                      ? "border-obsidian bg-obsidian text-white shadow-sm"
                      : "border-border/60 bg-card text-obsidian hover:border-obsidian hover:bg-surface-muted"
                    }`}
                >
                  I'm a {r}
                </button>
              ))}
            </div>
          )}

          <form className="space-y-5" onSubmit={onSubmit}>
            {tab === "signup" && (
              <>
                <Field
                  label="Full name"
                  type="text"
                  placeholder="Layla Hassan"
                  value={name}
                  onChange={setName}
                  required
                />
                 <Field
                  label="Company"
                  type="text"
                  placeholder="Your company"
                  value={company}
                  onChange={setCompany}
                  required
                />
              </>
            )}

            <Field
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={setEmail}
              required
              disabled={tab === "reset"}
            />

            {(tab === "signin" || tab === "signup") && (
              <Field
                label="Password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={setPassword}
                required
                minLength={tab === "signup" ? 8 : undefined}
              />
            )}

            {tab === "signin" && (
              <div className="flex justify-end -mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab("forgot");
                  }}
                  className="text-xs font-bold text-hyperblue hover:underline cursor-pointer bg-transparent border-0 outline-none p-0"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {tab === "verify" && (
              <Field
                label="Verification Code (OTP)"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={setOtp}
                required
                minLength={6}
              />
            )}

            {tab === "reset" && (
              <>
                <Field
                  label="Verification Code (OTP)"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={setOtp}
                  required
                  minLength={6}
                />
                <Field
                  label="New Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={setPassword}
                  required
                  minLength={8}
                />
                <Field
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  required
                  minLength={8}
                />
              </>
            )}

            {error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-obsidian py-4 px-6 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 hover:bg-obsidian/90 hover:shadow-md disabled:opacity-60 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Please wait…
                </>
              ) : tab === "signin" ? (
                "Sign in"
              ) : tab === "signup" ? (
                "Create account"
              ) : tab === "verify" ? (
                "Verify Account"
              ) : tab === "forgot" ? (
                "Send OTP Code"
              ) : (
                "Reset Password"
              )}
            </button>

            {tab === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setTab("signin");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background py-4 px-6 text-xs font-bold uppercase tracking-widest text-obsidian transition-all duration-200 hover:bg-surface-muted cursor-pointer"
              >
                Back to Sign in
              </button>
            )}

            {tab === "reset" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setSubmitting(true);
                    try {
                      await authApi.forgotPassword({ email });
                      toast.success("A new OTP has been sent to your email.");
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : "Failed to resend OTP");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="text-center text-xs font-bold text-hyperblue hover:underline cursor-pointer bg-transparent border-0 outline-none p-0 disabled:opacity-60"
                >
                  Resend OTP / Request new code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab("signin");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background py-4 px-6 text-xs font-bold uppercase tracking-widest text-obsidian transition-all duration-200 hover:bg-surface-muted cursor-pointer"
                >
                  Back to Sign in
                </button>
              </div>
            )}

            {tab === "verify" && (
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setSubmitting(true);
                    try {
                      await authApi.register({ email, password, name, role, company: company.trim() });
                      toast.success("A new OTP has been sent to your email.");
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : "Failed to resend OTP");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="text-center text-xs font-bold text-hyperblue hover:underline cursor-pointer bg-transparent border-0 outline-none p-0 disabled:opacity-60"
                >
                  Resend OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTab("signup");
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/80 bg-background py-4 px-6 text-xs font-bold uppercase tracking-widest text-obsidian transition-all duration-200 hover:bg-surface-muted cursor-pointer"
                >
                  Back to Sign up
                </button>
              </div>
            )}
          </form>

          {(tab === "signin" || tab === "signup") && (
            <>
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] font-black uppercase tracking-wider text-steel-dark/60">Or</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      try {
                        await loginWithGoogle(credentialResponse.credential, tab === "signup" ? role : undefined);
                        toast.success("Signed in successfully");
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Google login failed");
                      }
                    }
                  }}
                  onError={() => {
                    toast.error("Google login failed");
                  }}
                  theme="outline"
                  size="large"
                  width="320"
                  text="continue_with"
                  shape="circle"
                />
              </div>
            </>
          )}
          <Link to="/" className="sr-only">Home</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const Field = memo(function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  disabled,
}: {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  disabled?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <label className="flex flex-col gap-2 relative">
      <span className="eyebrow text-steel-dark/70 text-[9px]">{label}</span>
      <div className="relative">
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className="w-full rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-semibold text-obsidian placeholder:text-steel/50 outline-none focus:border-obsidian focus:ring-1 focus:ring-obsidian transition-all disabled:opacity-60 disabled:bg-surface-muted pr-10"
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-dark hover:text-obsidian outline-none"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </label>
  );
});
