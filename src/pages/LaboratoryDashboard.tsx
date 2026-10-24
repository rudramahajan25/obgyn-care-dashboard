import { Check, FlaskConical, Zap } from "lucide-react";
import { useMemo } from "react";
import { AlarmBanner } from "../components/alerts/AlarmBanner";
import { TopBar } from "../components/layout/TopBar";
import { useApp } from "../context/AppContext";
import { Badge } from "../components/ui/Badge";

export function LaboratoryDashboard() {
  const { facilityCalls, acknowledgeFacilityCall, completeFacilityCall } = useApp();

  const labCalls = useMemo(
    () =>
      facilityCalls.filter(
        (c) => c.type === "laboratory" && c.status !== "completed"
      ),
    [facilityCalls]
  );

  const done = useMemo(
    () => facilityCalls.filter((c) => c.type === "laboratory" && c.status === "completed").slice(0, 8),
    [facilityCalls]
  );

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <AlarmBanner />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3 text-white">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Laboratory — incoming calls</h2>
              <p className="text-sm text-muted">From labour room & wards · sample pickup</p>
            </div>
          </div>

          {labCalls.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted">
              No pending lab calls. Nurses can tap &quot;Call laboratory&quot; from the LR dashboard.
            </p>
          ) : (
            <div className="space-y-3">
              {labCalls.map((call) => (
                <article
                  key={call.id}
                  className={`rounded-2xl border bg-card p-4 shadow-sm ${
                    call.priority === "stat" ? "border-red-400 ring-2 ring-red-100" : "border-border"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-gray-900">
                      {call.patientName} ({call.bed})
                    </h3>
                    <Badge tone={call.priority === "stat" ? "danger" : "warning"}>
                      {call.priority === "stat" && <Zap className="mr-0.5 inline h-3 w-3" />}
                      {call.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted">From {call.requestedBy}</p>
                  {call.testsRequested && (
                    <p className="mt-2 text-sm font-medium text-gray-800">
                      Tests: {call.testsRequested.join(", ")}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {call.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => acknowledgeFacilityCall(call.id)}
                        className="flex-1 rounded-lg border border-border py-2 text-xs font-medium"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => completeFacilityCall(call.id)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Sample collected / done
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {done.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-2 text-sm font-semibold text-muted">Completed today</h3>
              {done.map((c) => (
                <p key={c.id} className="text-xs text-gray-600">
                  {c.patientName} — {c.testsRequested?.join(", ")}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
