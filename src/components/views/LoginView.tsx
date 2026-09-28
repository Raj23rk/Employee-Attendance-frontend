import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/ui/Logo";
import { Eye, EyeOff, LogIn, ShieldCheck } from "lucide-react";

function LoginForm() {
  const { login, isAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token") || localStorage.getItem("wg_token");
      if (token && isAuthenticated) {
        window.location.replace("/dashboard");
      }
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const lookupId = identifier.trim();

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }

    const result = await login(lookupId, password);
    setIsLoading(false);

    if (result.success) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("wg_greeting_played");
        window.location.replace("/dashboard");
      }
    } else {
      setError(result.error || "Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ── Left Branding & Mascot Panel ── */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-[#0A1633] px-8 py-10 lg:w-1/2 lg:px-14 lg:py-12 text-white">
        {/* Subtle background grid / dots */}
        <div 
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#60A5FA 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        
        {/* Ambient glow blobs */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#EA6118]/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#1D4ED8]/20 blur-[100px] pointer-events-none" />

        {/* 1. Header / Logo with Mascot */}
        <div className="relative z-10">
          <Logo variant="light" />
        </div>

        {/* 2. Mascot & Value Proposition Center */}
        <div className="relative z-10 my-auto flex flex-col items-center text-center py-6">
          {/* 3D Mascot Character */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="relative h-64 w-64 sm:h-72 sm:w-72 transition-transform duration-300 hover:scale-[1.02]">
              <img
                src="/bdt_mascot.webp"
                alt="WeGrow Mascot"
                className="h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>

          {/* Console Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <span className="text-[11px] font-bold tracking-wider text-[#CBD5E1] uppercase">
              HR &amp; PAYROLL CONSOLE
            </span>
          </div>

          {/* Headline */}
          <h1 className="max-w-xl font-heading text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
            Payroll, leave, attendance and performance — for every employee and manager.
          </h1>

          {/* Subtext */}
          <p className="mt-3.5 max-w-md text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
            Run payroll and credit salaries, approve leave, monitor attendance and keep performance reviews on track, all from one place.
          </p>
        </div>

        {/* 3. Footer */}
        <div className="relative z-10 pt-4 text-xs font-normal text-[#64748B]">
          © {new Date().getFullYear()} WeGrow Skill Campus &amp; B School
        </div>
      </div>

      {/* ── Right Sign In Panel ── */}
      <div className="flex flex-1 flex-col justify-center bg-white px-6 py-12 lg:w-1/2 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8 space-y-1.5 text-left">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#0F172A]">
              Sign In
            </h2>
            <p className="text-sm text-[#64748B]">
              Enter your work credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-600 animate-in fade-in">
                {error}
              </div>
            )}

            {/* Work Email / Employee ID */}
            <div className="space-y-1.5">
              <label 
                htmlFor="identifier"
                className="block text-xs font-semibold text-[#334155]"
              >
                Work Email / Employee ID
              </label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or employee ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:border-[#EA6118] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA6118]/20"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password"
                className="block text-xs font-semibold text-[#334155]"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 pr-11 text-sm text-[#0F172A] placeholder-[#94A3B8] transition-colors focus:border-[#EA6118] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EA6118]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#334155] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#EA6118] focus:ring-[#EA6118] accent-[#EA6118]"
                />
                <span className="text-xs font-medium text-[#475569]">Remember me</span>
              </label>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); alert("Please contact your HR administrator or IT helpdesk to reset your password."); }}
                className="text-xs font-semibold text-[#EA6118] hover:text-[#D9520A] transition-colors"
              >
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#EA6118] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#D9520A] active:scale-[0.99] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* HR-level access notice */}
          <div className="mt-8 flex items-start gap-2.5 text-left">
            <ShieldCheck className="h-4 w-4 text-[#64748B] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[#64748B]">
              HR-level access — payroll and personal data are restricted to this role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginView() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
export default LoginView;
