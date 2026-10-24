import { AlertCircle, Baby, Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export function LoginPage() {
  const { loginWithCredentials } = useApp();
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
    }, 400);
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
          <code className="rounded bg-white/10 px-1">docs/Demo_User_Credentials.docx</code>
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center bg-surface p-6">
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Baby className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">O&G Care Dashboard</h1>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use your hospital username and password</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Username</span>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ananya.sharma"
                  className="w-full rounded-xl border border-border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-gray-700">Password</span>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border py-2.5 pl-10 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in…" : "Sign in to dashboard"}
            </button>
          </form>

          <p className="mt-6 border-t border-border pt-4 text-center text-[11px] leading-relaxed text-muted">
            Demo only — not for production. Open{" "}
            <strong className="text-gray-700">docs/Demo_User_Credentials.docx</strong> for all
            sample usernames and passwords.
          </p>
        </div>
      </div>
    </div>
  );
}
