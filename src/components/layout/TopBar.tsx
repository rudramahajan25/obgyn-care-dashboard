import { Bell, Calendar, LogOut, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function TopBar() {
  const { user, logout } = useApp();
  if (!user) return null;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          O&G
        </div>
        <h1 className="text-base font-semibold text-gray-900">Obstetrics & Gynecology</h1>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
        <button type="button" className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>
        <button type="button" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Calendar">
          <Calendar className="h-5 w-5" />
        </button>

        <div className="mx-2 h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{user.name}</p>
            <p className="text-xs text-muted">{user.title}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user.avatarInitials}
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            title="Switch role"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
