import {
  AlertTriangle,
  CheckCircle2,
  Printer,
  Radio,
  Share2,
  StickyNote,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/Badge";
import { CTGCard } from "./CTGCard";
import { PatientAiSummaryCard } from "./PatientAiSummaryCard";
import { VitalsCard } from "./VitalsCard";
import { UltrasoundWorkflowPanel } from "../labour/UltrasoundWorkflowPanel";

const tabs = ["Overview", "History", "Notes", "Reports", "Documents"] as const;

export function PatientDetail({
  showClinicalActions = true,
  alertCount = 2,
}: {
  showClinicalActions?: boolean;
  alertCount?: number;
}) {
  const { patients, selectedPatientId, isLiveMonitoring, liveRevision, getPatientUltrasoundOrder } =
    useApp();
  const patient = patients.find((p) => p.id === selectedPatientId);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");

  if (!patient) return null;

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="overflow-y-auto p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              <Badge tone="brand">{patient.bed}</Badge>
              <Badge tone={patient.hasAlert ? "danger" : "success"}>{patient.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {patient.age}y · G{patient.gravida}P{patient.para} · {patient.gestationalAge} · EDD{" "}
              {patient.edd} · {patient.bloodGroup} · Allergies: {patient.allergies}
            </p>
            <p className="mt-1 text-xs text-muted">
              {patient.status} since {patient.statusSince}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700">
              <Radio className="h-3 w-3 animate-pulse" />
              Live
            </span>
            <span className="text-muted">Last update: {patient.lastUpdate}</span>
          </div>
        </div>

        <div className="mb-4 flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-muted hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "Overview" ? (
          <div className="space-y-4">
            <PatientAiSummaryCard patientId={patient.id} />
            <VitalsCard
              vitals={patient.vitals}
              live={isLiveMonitoring}
              liveRevision={liveRevision}
            />
            <div className="grid gap-4 xl:grid-cols-2">
              <CTGCard ctg={patient.ctg} live={isLiveMonitoring} />
              {getPatientUltrasoundOrder(patient.id) ? (
                <UltrasoundWorkflowPanel patientId={patient.id} />
              ) : (
                <section className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm">
                  <p className="text-sm font-medium text-gray-700">No ultrasound requested</p>
                  <p className="mt-1 text-xs text-muted">
                    LR staff can request a scan from the labour room dashboard. Images appear here
                    after the ultrasound team completes the study.
                  </p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted">
            {activeTab} view — connect EHR / document store in production.
          </div>
        )}
      </div>

      {showClinicalActions && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <ActionButton icon={StickyNote} label="Add Note" />
            <ActionButton icon={AlertTriangle} label={`Alerts (${alertCount})`} highlight />
            <ActionButton icon={Printer} label="Print Report" />
            <ActionButton icon={Share2} label="Share" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            All Systems Normal
          </div>
        </div>
      )}
    </main>
  );
}

function ActionButton({
  icon: Icon,
  label,
  highlight,
}: {
  icon: typeof StickyNote;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
        highlight
          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "border-border bg-white text-gray-700 hover:bg-surface"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
