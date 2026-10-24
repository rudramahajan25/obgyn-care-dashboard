import { Accessibility, ArrowUpDown, Check, Clock, MapPin, Play, X } from "lucide-react";
import { useMemo } from "react";
import { AlarmBanner } from "../components/alerts/AlarmBanner";
import { TopBar } from "../components/layout/TopBar";
import { useApp } from "../context/AppContext";
import { Badge } from "../components/ui/Badge";
import type { TransportRequest, TransportStatus } from "../types";

const priorityTone = {
  routine: "info" as const,
  urgent: "warning" as const,
  stat: "danger" as const,
};

export function TransportDashboard({ role }: { role: "liftman" | "wheelchair" }) {
  const { transportRequests, updateTransportStatus, showToast } = useApp();

  const filtered = useMemo(
    () =>
      transportRequests.filter(
        (r) => r.type === role && r.status !== "completed" && r.status !== "cancelled"
      ),
    [transportRequests, role]
  );

  const completed = useMemo(
    () =>
      transportRequests
        .filter((r) => r.type === role && r.status === "completed")
        .slice(0, 10),
    [transportRequests, role]
  );

  const title = role === "liftman" ? "Shifting / lift requests" : "Wheelchair requests";
  const Icon = role === "liftman" ? ArrowUpDown : Accessibility;

  const advance = (id: string, current: TransportStatus) => {
    const next: TransportStatus =
      current === "pending"
        ? "accepted"
        : current === "accepted"
          ? "in_transit"
          : "completed";
    updateTransportStatus(id, next);
    showToast(`Request marked as ${next.replace("_", " ")}`);
  };

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <AlarmBanner />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-brand-600 p-3 text-white">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-muted">
                {filtered.length} active · Respond from nurses / midwives on the ward
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <Clock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="font-medium text-gray-800">No pending requests</p>
              <p className="mt-1 text-sm text-muted">
                Open another tab as Nurse or Midwife and tap Call Lift / Call Wheelchair to test.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => (
                <RequestCard key={req.id} request={req} onAdvance={() => advance(req.id, req.status)} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="mt-10">
              <h3 className="mb-3 text-sm font-semibold text-muted">Recently completed</h3>
              <div className="space-y-2">
                {completed.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2 text-sm opacity-70"
                  >
                    <span>
                      {req.patientName} — {req.fromLocation} → {req.toLocation}
                    </span>
                    <Badge tone="success">Done</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestCard({
  request,
  onAdvance,
}: {
  request: TransportRequest;
  onAdvance: () => void;
}) {
  const actionLabel =
    request.status === "pending"
      ? "Accept"
      : request.status === "accepted"
        ? "Start trip"
        : "Complete";

  const ActionIcon =
    request.status === "pending" ? Check : request.status === "accepted" ? Play : Check;

  return (
    <article
      className={`rounded-2xl border bg-card p-5 shadow-sm ${
        request.priority === "stat" ? "border-red-300 ring-2 ring-red-100" : "border-border"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{request.patientName}</h3>
            <Badge tone="brand">{request.bed}</Badge>
            <Badge tone={priorityTone[request.priority]}>{request.priority.toUpperCase()}</Badge>
            {request.equipment && (
              <Badge tone="muted" className="capitalize">
                {request.equipment.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted">
            Requested by {request.requestedBy} · {formatTime(request.createdAt)}
          </p>
        </div>
        <Badge
          tone={
            request.status === "pending"
              ? "warning"
              : request.status === "in_transit"
                ? "info"
                : "success"
          }
        >
          {request.status.replace("_", " ")}
        </Badge>
      </div>

      <div className="mb-4 space-y-2 text-sm">
        <p className="flex items-start gap-2 text-gray-800">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <span>
            <strong>From:</strong> {request.fromLocation}
            <br />
            <strong>To:</strong> {request.toLocation}
          </span>
        </p>
        {request.notes && <p className="rounded-lg bg-surface px-3 py-2 text-xs">{request.notes}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdvance}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <ActionIcon className="h-4 w-4" />
          {actionLabel}
        </button>
        {request.status === "pending" && (
          <button
            type="button"
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-gray-600 hover:bg-surface"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
