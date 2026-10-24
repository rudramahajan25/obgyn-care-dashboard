import { AlarmBanner } from "../components/alerts/AlarmBanner";
import { PatientRecordsPanel } from "../components/history/PatientRecordsPanel";
import { TopBar } from "../components/layout/TopBar";
import { PatientSidebar } from "../components/layout/PatientSidebar";
import { AssistancePanel } from "../components/labour/AssistancePanel";
import { LabourRoomChecklist } from "../components/labour/LabourRoomChecklist";
import { UltrasoundWorkflowPanel } from "../components/labour/UltrasoundWorkflowPanel";
import { PatientAiSummaryCard } from "../components/patient/PatientAiSummaryCard";
import { CTGCard } from "../components/patient/CTGCard";
import { VitalsCard } from "../components/patient/VitalsCard";
import { useApp } from "../context/AppContext";
import { Badge } from "../components/ui/Badge";
import { Radio } from "lucide-react";

export function LabourRoomDashboard() {
  const { patients, selectedPatientId, isLiveMonitoring, liveRevision, getPatientUltrasoundOrder } =
    useApp();
  const patient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <AlarmBanner />
      <div className="flex min-h-0 flex-1">
        <PatientSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-5">
          {patient && (
            <header className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {patient.fullName ?? patient.name} — {patient.age} yrs
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {patient.pregnancyDurationLabel ?? patient.gestationalAge} ·{" "}
                    <span className="font-semibold text-red-600">{patient.bloodGroup}</span> · G
                    {patient.gravida}P{patient.para}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="brand">{patient.bed} · Labour Room</Badge>
                  <Badge tone={patient.hasAlert ? "danger" : "success"}>{patient.status}</Badge>
                  {isLiveMonitoring && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700">
                      <Radio className="h-3 w-3 animate-pulse" />
                      Live · {patient.lastUpdate}
                    </span>
                  )}
                </div>
              </div>
            </header>
          )}

          <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <PatientAiSummaryCard patientId={patient?.id ?? selectedPatientId} />
              <PatientRecordsPanel />
              <LabourRoomChecklist />
              {patient && (
                <>
                  <VitalsCard
                    vitals={patient.vitals}
                    live={isLiveMonitoring}
                    liveRevision={liveRevision}
                  />
                  {patient.ctg.points.length > 0 && (
                    <CTGCard ctg={patient.ctg} live={isLiveMonitoring} />
                  )}
                  {getPatientUltrasoundOrder(patient.id) && (
                    <UltrasoundWorkflowPanel patientId={patient.id} />
                  )}
                </>
              )}
            </div>
            <AssistancePanel />
          </div>
        </div>
      </div>
    </div>
  );
}
