import { Calendar, ChevronRight, Users, Zap } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/Badge";
import { OtSchedulingModal } from "./OtSchedulingModal";

export function FacilitySidebar({
  showStatCalls = true,
  showTransportStaff = true,
}: {
  showStatCalls?: boolean;
  showTransportStaff?: boolean;
}) {
  const { operatingRooms, staffMembers, triggerStatCall, hospitalRoster } = useApp();
  const [showOtModal, setShowOtModal] = useState(false);
  const [staffExpanded, setStaffExpanded] = useState(false);

  const clinicalStaff = staffMembers.filter((s) => !s.transportType);
  const transportStaff = staffMembers.filter((s) => s.transportType);
  const otCapableIds = new Set(
    hospitalRoster.filter((s) => s.canWorkInOt).map((s) => s.id)
  );
  const otTeam = staffMembers.filter((s) => otCapableIds.has(s.id));
  const availableOt = otTeam.filter((s) => s.availability === "available").length;

  const displayStaff = staffExpanded ? clinicalStaff : clinicalStaff.slice(0, 8);

  return (
    <>
      <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border bg-card p-4">
        <section className="rounded-2xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Operating rooms</h3>
            <button
              type="button"
              onClick={() => setShowOtModal(true)}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-brand-700"
            >
              <Calendar className="h-3 w-3" />
              Schedule
            </button>
          </div>
          <div className="space-y-3">
            {operatingRooms.map((or) => (
              <div key={or.id} className="rounded-xl bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{or.name}</span>
                  <Badge
                    tone={
                      or.status === "available"
                        ? "success"
                        : or.status === "scheduled"
                          ? "info"
                          : "danger"
                    }
                  >
                    {or.status === "available"
                      ? "Available"
                      : or.status === "scheduled"
                        ? "Scheduled"
                        : "In use"}
                  </Badge>
                </div>
                {or.procedure && (
                  <div className="mt-2 text-xs text-muted">
                    <p className="font-medium text-gray-800">{or.procedure}</p>
                    <p>{or.doctor}</p>
                    <p>
                      {or.startedAt} → {or.endsAt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowOtModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 py-2 text-xs font-medium text-brand-800 hover:bg-brand-100"
          >
            Open OT board & book cases
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </section>

        <section className="rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Staff roster</h3>
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <Users className="h-3 w-3" />
              {hospitalRoster.length}
            </span>
          </div>
          <p className="mb-3 text-[10px] text-muted">
            {availableOt} of {otTeam.length} OT-capable staff available now
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Status</th>
                  {showStatCalls && <th className="pb-2 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {displayStaff.map((s) => (
                  <tr key={s.id} className="border-t border-border/60">
                    <td className="py-2 pr-1">
                      <p className="font-medium text-gray-800">{s.name}</p>
                      <p className="text-[10px] text-muted">{s.role}</p>
                    </td>
                    <td className="py-2">
                      <Badge
                        tone={
                          s.statusTone === "success"
                            ? "success"
                            : s.statusTone === "warning"
                              ? "warning"
                              : "info"
                        }
                      >
                        {s.status}
                      </Badge>
                    </td>
                    {showStatCalls && (
                      <td className="py-2 text-right">
                        {s.canStatCall && (
                          <button
                            type="button"
                            onClick={() => triggerStatCall(s.id, s.role)}
                            className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white"
                          >
                            <Zap className="inline h-2.5 w-2.5" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clinicalStaff.length > 8 && (
            <button
              type="button"
              onClick={() => setStaffExpanded(!staffExpanded)}
              className="mt-2 w-full text-center text-xs font-medium text-brand-600 hover:underline"
            >
              {staffExpanded ? "Show less" : `View all ${clinicalStaff.length} staff`}
            </button>
          )}
        </section>

        {showTransportStaff && transportStaff.length > 0 && (
          <section className="rounded-2xl border border-border p-4">
            <p className="mb-2 text-xs font-semibold text-gray-800">Transport ({transportStaff.length})</p>
            {transportStaff.map((s) => (
              <div
                key={s.id}
                className="mb-1 flex items-center justify-between rounded-lg bg-surface px-2 py-1.5 text-xs"
              >
                <span className="text-gray-800">{s.name}</span>
                <Badge tone="success">{s.status}</Badge>
              </div>
            ))}
          </section>
        )}
      </aside>

      {showOtModal && <OtSchedulingModal onClose={() => setShowOtModal(false)} />}
    </>
  );
}
