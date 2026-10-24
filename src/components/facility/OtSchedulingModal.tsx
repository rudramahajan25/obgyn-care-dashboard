import { Calendar, Check, Play, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { OT_PROCEDURES } from "../../data/hospitalStaff";
import { useApp } from "../../context/AppContext";
import type { ScheduleOtInput } from "../../context/AppContext";
import { Badge } from "../ui/Badge";
import {
  CATEGORY_LABELS,
  getStaffAvailability,
  isStaffFreeForSlot,
  todayIso,
} from "../../utils/otScheduling";
import { staffName } from "../../data/hospitalStaff";

type Tab = "board" | "schedule" | "staff";

const emptyForm = (): ScheduleOtInput => ({
  orId: "or2",
  patientId: "",
  patientName: "",
  bed: "",
  procedure: OT_PROCEDURES[0],
  date: todayIso(),
  startTime: "14:00",
  endTime: "15:30",
  leadSurgeonId: "d01",
  anesthetistId: "a01",
  scrubNurseId: "nr02",
  circulatorNurseId: "nr04",
  neonatologistId: "n01",
  otTechnicianId: "ot01",
  priority: "elective",
  notes: "",
});

export function OtSchedulingModal({ onClose }: { onClose: () => void }) {
  const {
    patients,
    otBookings,
    operatingRooms,
    hospitalRoster,
    scheduleOtBooking,
    updateOtBookingStatus,
    cancelOtBooking,
  } = useApp();

  const [tab, setTab] = useState<Tab>("board");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const today = todayIso();
  const todayBookings = useMemo(
    () =>
      otBookings
        .filter((b) => b.date === today && b.status !== "cancelled")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [otBookings, today]
  );

  const otStaff = hospitalRoster.filter((s) => s.canWorkInOt);

  const consultants = otStaff.filter((s) => s.category === "consultant" || s.category === "assistant_doctor");
  const anesthetists = otStaff.filter((s) => s.category === "anesthetist");
  const nurses = otStaff.filter((s) => s.category === "nurse");
  const neonatologists = otStaff.filter((s) => s.category === "neonatologist");
  const otTechs = otStaff.filter((s) => s.category === "ot_technician");

  const availableCount = useMemo(() => {
    const otRelevant = hospitalRoster.filter(
      (s) => s.canWorkInOt || s.category === "consultant" || s.category === "assistant_doctor"
    );
    return otRelevant.filter(
      (s) => getStaffAvailability(s.id, otBookings).availability === "available"
    ).length;
  }, [hospitalRoster, otBookings]);

  const fillPatient = (patientId: string) => {
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;
    setForm((f) => ({
      ...f,
      patientId: p.id,
      patientName: p.fullName ?? p.name,
      bed: p.bed,
    }));
  };

  const submitSchedule = () => {
    setFormError(null);
    if (!form.patientName.trim()) {
      setFormError("Patient name is required");
      return;
    }
    const result = scheduleOtBooking({
      ...form,
      patientId: form.patientId || undefined,
    });
    if (!result.ok) {
      setFormError(result.error ?? "Could not schedule");
      return;
    }
    setForm(emptyForm());
    setTab("board");
  };

  const staffOption = (id: string) => {
    const free = isStaffFreeForSlot(
      id,
      form.orId,
      form.date,
      form.startTime,
      form.endTime,
      otBookings
    );
    return (
      <option key={id} value={id} disabled={!free}>
        {staffName(id)} {!free ? "— busy" : ""}
      </option>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">OT scheduling</h2>
            <p className="text-xs text-muted">
              {hospitalRoster.length} staff · {availableCount} available for OT now · {today}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex gap-1 border-b border-border px-5">
          {(
            [
              ["board", "Today's board"],
              ["schedule", "Book case"],
              ["staff", "Staff availability"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === id ? "border-brand-600 text-brand-700" : "border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "board" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {operatingRooms.map((or) => (
                  <div key={or.id} className="rounded-xl border border-border bg-surface p-3">
                    <div className="mb-2 flex justify-between">
                      <span className="font-semibold">{or.name}</span>
                      <Badge
                        tone={
                          or.status === "available"
                            ? "success"
                            : or.status === "scheduled"
                              ? "info"
                              : "danger"
                        }
                      >
                        {or.status === "in_use"
                          ? "In use"
                          : or.status === "scheduled"
                            ? "Scheduled"
                            : "Available"}
                      </Badge>
                    </div>
                    {or.procedure && (
                      <p className="text-xs text-gray-800">
                        {or.procedure}
                        <br />
                        {or.doctor}
                        <br />
                        {or.startedAt} – {or.endsAt}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold">All cases today</h3>
              <div className="space-y-2">
                {todayBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {b.orId.toUpperCase()} · {b.startTime}–{b.endTime} · {b.patientName}
                        {b.bed ? ` (${b.bed})` : ""}
                      </p>
                      <p className="text-xs text-muted">
                        {b.procedure} · {staffName(b.leadSurgeonId)} · {b.priority}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge
                        tone={
                          b.status === "in_progress"
                            ? "danger"
                            : b.status === "scheduled"
                              ? "warning"
                              : "success"
                        }
                      >
                        {b.status.replace("_", " ")}
                      </Badge>
                      {b.status === "scheduled" && (
                        <button
                          type="button"
                          onClick={() => updateOtBookingStatus(b.id, "in_progress")}
                          className="flex items-center gap-1 rounded-lg bg-brand-600 px-2 py-1 text-xs text-white"
                        >
                          <Play className="h-3 w-3" />
                          Start
                        </button>
                      )}
                      {b.status === "in_progress" && (
                        <button
                          type="button"
                          onClick={() => updateOtBookingStatus(b.id, "completed")}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs text-white"
                        >
                          <Check className="h-3 w-3" />
                          Complete
                        </button>
                      )}
                      {b.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => cancelOtBooking(b.id)}
                          className="rounded-lg border border-border p-1 text-muted hover:bg-surface"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "schedule" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-xs font-medium">
                  Patient
                  <select
                    className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
                    value={form.patientId}
                    onChange={(e) => fillPatient(e.target.value)}
                  >
                    <option value="">— Manual / walk-in —</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.bed})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-medium">
                  Patient name
                  <input
                    className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
                    value={form.patientName}
                    onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-medium">
                    OR
                    <select
                      className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={form.orId}
                      onChange={(e) => setForm((f) => ({ ...f, orId: e.target.value }))}
                    >
                      <option value="or1">OR 1</option>
                      <option value="or2">OR 2</option>
                      <option value="or3">OR 3</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium">
                    Priority
                    <select
                      className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={form.priority}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          priority: e.target.value as ScheduleOtInput["priority"],
                        }))
                      }
                    >
                      <option value="elective">Elective</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-medium">
                  Procedure
                  <select
                    className="mt-1 w-full rounded-lg border border-border px-2 py-2 text-sm"
                    value={form.procedure}
                    onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value }))}
                  >
                    {OT_PROCEDURES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs font-medium">
                    Start
                    <input
                      type="time"
                      className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    />
                  </label>
                  <label className="text-xs font-medium">
                    End
                    <input
                      type="time"
                      className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-800">Assign team (busy staff disabled)</p>
                <label className="block text-xs">
                  Lead surgeon
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.leadSurgeonId}
                    onChange={(e) => setForm((f) => ({ ...f, leadSurgeonId: e.target.value }))}
                  >
                    {consultants.map((s) => staffOption(s.id))}
                  </select>
                </label>
                <label className="block text-xs">
                  Anesthetist
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.anesthetistId}
                    onChange={(e) => setForm((f) => ({ ...f, anesthetistId: e.target.value }))}
                  >
                    {anesthetists.map((s) => staffOption(s.id))}
                  </select>
                </label>
                <label className="block text-xs">
                  Scrub nurse
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.scrubNurseId}
                    onChange={(e) => setForm((f) => ({ ...f, scrubNurseId: e.target.value }))}
                  >
                    {nurses.map((s) => staffOption(s.id))}
                  </select>
                </label>
                <label className="block text-xs">
                  Circulator
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.circulatorNurseId}
                    onChange={(e) => setForm((f) => ({ ...f, circulatorNurseId: e.target.value }))}
                  >
                    {nurses.map((s) => staffOption(s.id))}
                  </select>
                </label>
                <label className="block text-xs">
                  Neonatologist
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.neonatologistId}
                    onChange={(e) => setForm((f) => ({ ...f, neonatologistId: e.target.value }))}
                  >
                    <option value="">— Optional —</option>
                    {neonatologists.map((s) => staffOption(s.id))}
                  </select>
                </label>
                <label className="block text-xs">
                  OT technician
                  <select
                    className="mt-0.5 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    value={form.otTechnicianId}
                    onChange={(e) => setForm((f) => ({ ...f, otTechnicianId: e.target.value }))}
                  >
                    {otTechs.map((s) => staffOption(s.id))}
                  </select>
                </label>
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <button
                  type="button"
                  onClick={submitSchedule}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white"
                >
                  <Calendar className="h-4 w-4" />
                  Confirm booking
                </button>
              </div>
            </div>
          )}

          {tab === "staff" && (
            <div className="space-y-4">
              {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                const group = hospitalRoster.filter((s) => s.category === cat);
                if (!group.length) return null;
                const avail = group.filter(
                  (s) => getStaffAvailability(s.id, otBookings).availability === "available"
                ).length;
                return (
                  <div key={cat}>
                    <h4 className="mb-2 flex justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                      {label}
                      <span className="normal-case text-green-700">
                        {avail}/{group.length} available
                      </span>
                    </h4>
                    <div className="grid gap-1 sm:grid-cols-2">
                      {group.map((s) => {
                        const { availability, detail } = getStaffAvailability(s.id, otBookings);
                        return (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-lg border border-border px-2 py-1.5 text-xs"
                          >
                            <span>
                              <span className="font-medium text-gray-900">{s.name}</span>
                              <span className="ml-1 text-muted">{s.employeeCode}</span>
                            </span>
                            <Badge
                              tone={
                                availability === "available"
                                  ? "success"
                                  : availability === "on_break"
                                    ? "info"
                                    : "warning"
                              }
                            >
                              {detail}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
