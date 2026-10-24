import { AlertCircle, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useApp } from "../../context/AppContext";
import { getClinicalPriority } from "../../utils/clinicalPriority";

export function PatientSidebar({ showNewButton = true }: { showNewButton?: boolean }) {
  const { patients, selectedPatientId, setSelectedPatientId, isLiveMonitoring } = useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.bed.toLowerCase().includes(query.toLowerCase())
      ),
    [patients, query]
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Patients</h2>
            <p className="text-xs text-muted">{patients.length} Today</p>
          </div>
          {showNewButton && (
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search patients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.map((p) => {
          const active = p.id === selectedPatientId;
          const priority = getClinicalPriority(p);
          const isCritical = priority === "critical";
          const isElevated = priority === "elevated";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPatientId(p.id)}
              className={`mb-2 w-full rounded-xl border p-3 text-left transition ${
                isCritical
                  ? active
                    ? "critical-sidebar-active border-red-500 bg-red-50 shadow-md"
                    : "critical-sidebar-idle border-red-300 bg-red-50/60 hover:border-red-400"
                  : isElevated
                    ? active
                      ? "border-amber-400 bg-amber-50 shadow-sm"
                      : "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                    : active
                      ? "border-brand-300 bg-brand-50 shadow-sm"
                      : "border-transparent bg-white hover:border-border hover:bg-surface"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isCritical
                      ? "bg-red-600 text-white critical-icon-pulse"
                      : isElevated
                        ? "bg-amber-500 text-white"
                        : p.hasAlert
                          ? "bg-red-100 text-red-700"
                          : "bg-brand-100 text-brand-700"
                  }`}
                >
                  {p.bed}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                    {(p.hasAlert || isCritical) && (
                      <AlertCircle
                        className={`h-4 w-4 shrink-0 ${isCritical ? "text-red-600 animate-pulse" : "text-danger"}`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {p.age}y · G{p.gravida}P{p.para} · {p.gestationalAge}
                  </p>
                  <p
                    className={`mt-1 truncate text-xs font-medium ${
                      isCritical ? "text-red-700 font-bold" : isElevated ? "text-amber-800" : "text-brand-700"
                    }`}
                  >
                    {p.status}
                  </p>
                  {isLiveMonitoring && (
                    <p className="mt-1 font-mono text-[10px] text-gray-600">
                      BP {p.vitals.bp}
                      {p.vitals.fhr > 0 ? ` · FHR ${p.vitals.fhr}` : ""}
                    </p>
                  )}
                  <p
                    className={`mt-0.5 text-[10px] ${
                      p.lastUpdate === "Just now" ? "font-medium text-green-600" : "text-muted"
                    }`}
                  >
                    {p.lastUpdate}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-border p-3">
        <button type="button" className="w-full text-center text-xs font-medium text-brand-600 hover:underline">
          View all patients
        </button>
      </div>
    </aside>
  );
}
