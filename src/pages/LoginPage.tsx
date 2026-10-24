import { AlertCircle, Baby, Eye, EyeOff, Lock, LogIn, Sparkles, User } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";
import type { UserRole } from "../types";

const QUICK_DEMO_USERS: { role: UserRole; title: string; name: string; username: string }[] = [
  { role: "doctor", title: "Doctor", name: "Dr. Ananya Sharma", username: "ananya.sharma" },
  { role: "nurse", title: "Nurse", name: "Priya Nair", username: "priya.nair" },
  { role: "assistant_doctor", title: "Assistant Dr", name: "Dr. Rahul Mehta", username: "rahul.mehta" },
  { role: "midwife", title: "Midwife", name: "Elena Costa", username: "elena.costa" },
  { role: "ultrasound", title: "Ultrasound", name: "Deepa Iyer", username: "deepa.usg" },
  { role: "laboratory", title: "Laboratory", name: "Meena Rao", username: "meena.lab" },
  { role: "liftman", title: "Lift Operator", name: "Suresh Kumar", username: "suresh.kumar" },
  { role: "wheelchair", title: "Wheelchair", name: "Amit Patel", username: "amit.patel" },
];

export function LoginPage() {
  const { loginWithCredentials, loginAsRole } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    window.setTimeout(() => {
      const result = loginWithCredentials(username, password);
      if (!result.ok) setError(result.error ?? "Login failed");
      setLoading(false);
    }, 200);
  };

  const handleQuickLogin = (role: UserRole) => {
    setError(null);
    loginAsRole(role);
  };

  return (
    <div className="flex min-h-full">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-violet-700 p-10 text-white lg:flex">
        <div>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <Baby className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-bold">Obstetrics & Gynecology</p>
              <p className="text-sm text-white/80">Integrated care dashboard</p>
            </div>
          </div>
          <h1 className="max-w-md text-3xl font-bold leading-tight">
            Labour room, OT scheduling, and team coordination in one place.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
            Live vitals, DICOM ultrasound, AI patient summaries, STAT alarms to the right team,
            and a 40-person staff roster with OT booking.
          </p>
        </div>
        <p className="text-xs text-white/60">
          Demo credentials are listed in{" "}
          <code className="rounded bg-white/10 px-1">DEMO_CREDENTIALS.md</code>
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-surface p-6">
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Baby className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">O&G Care Dashboard</h1>
        </div>

        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
              <p className="mt-0.5 text-xs text-muted">Select a profile for 1-click login, or enter credentials</p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 border border-brand-200">
              <Sparkles className="h-3 w-3" />
              Demo Mode
            </span>
          </div>

          {/* Quick 1-Click Role Switcher */}
          <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-800">
              ⚡ 1-Click Quick Demo Sign-in
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_DEMO_USERS.map((u) => (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => handleQuickLogin(u.role)}
                  className="flex flex-col items-start rounded-lg border border-border bg-white p-2 text-left shadow-2xs transition hover:border-brand-400 hover:bg-brand-50/80 active:scale-95"
                >
                  <span className="text-xs font-bold text-gray-900">{u.title}</span>
                  <span className="truncate text-[10px] text-muted">{u.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted text-[10px]">Or sign in manually</span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <label className="block text-xs font-medium text-gray-700">
              Username
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ananya.sharma"
                  className="w-full rounded-xl border border-border py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </label>

            <label className="block text-xs font-medium text-gray-700">
              Password
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border py-2 pl-9 pr-9 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <LogIn className="h-3.5 w-3.5" />
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 border-t border-border pt-3 text-center text-[10px] leading-relaxed text-muted">
            All passwords and usernames are documented in{" "}
            <strong className="text-gray-700">DEMO_CREDENTIALS.md</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
