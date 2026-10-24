import { BellRing, Clock, Scan } from "lucide-react";
import { useEffect, useState } from "react";
import { getDicomSeriesForPatient } from "../../data/dicomStudies";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/Badge";
import { DicomViewer } from "../dicom/DicomViewer";
import { DicomViewerModal } from "../dicom/DicomViewerModal";
import type { UltrasoundWorkflowStatus } from "../../types";

const statusLabels: Record<UltrasoundWorkflowStatus, string> = {
  yet_to_record: "Yet to record",
  waiting_for_patient: "Waiting for patient",
  under_review: "Under review",
  ready: "Ready",
};

const statusTone: Record<
  UltrasoundWorkflowStatus,
  "success" | "warning" | "info" | "muted"
> = {
  ready: "success",
  yet_to_record: "muted",
  waiting_for_patient: "warning",
  under_review: "info",
};

const steps: UltrasoundWorkflowStatus[] = [
  "yet_to_record",
  "waiting_for_patient",
  "under_review",
  "ready",
];

export function UltrasoundWorkflowPanel({ patientId }: { patientId: string }) {
  const {
    getPatientUltrasoundOrder,
    remindUltrasound,
    patients,
  } = useApp();

  const order = getPatientUltrasoundOrder(patientId);
  const patient = patients.find((p) => p.id === patientId);
  const series = getDicomSeriesForPatient(patientId);
  const [activeFrameId, setActiveFrameId] = useState(series[0]?.id ?? "");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setActiveFrameId(series[0]?.id ?? "");
  }, [patientId, series]);

  if (!order) return null;

  const active = series.find((f) => f.id === activeFrameId) ?? series[0];
  const canViewDicom =
    order.status === "under_review" || order.status === "ready";
  const stepIndex = steps.indexOf(order.status);

  return (
    <section className="rounded-2xl border border-amber-200 bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Scan className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">Requested ultrasound</h3>
        </div>
        <Badge tone={statusTone[order.status]}>{statusLabels[order.status]}</Badge>
      </div>

      <p className="mb-3 text-xs text-muted">
        Requested by {order.requestedBy} · {formatWhen(order.createdAt)}
        {order.reportFileName && order.status === "ready" && (
          <span className="ml-2 text-brand-600">{order.reportFileName}</span>
        )}
      </p>

      <div className="mb-4 flex gap-1">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              i <= stepIndex ? "bg-amber-500" : "bg-gray-200"
            }`}
            title={statusLabels[step]}
          />
        ))}
      </div>

      {!canViewDicom ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-10 text-center">
          <Clock className="mb-2 h-8 w-8 text-amber-500" />
          <p className="text-sm font-medium text-gray-800">
            {order.status === "yet_to_record"
              ? "Ultrasound team notified — scan not started"
              : "Waiting for patient in ultrasound room"}
          </p>
          <p className="mt-1 max-w-xs text-xs text-muted">
            DICOM images will appear here once the sonographer completes the scan and pushes
            the report.
          </p>
          <button
            type="button"
            onClick={() => remindUltrasound(order.id)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-50"
          >
            <BellRing className="h-3.5 w-3.5" />
            Remind ultrasound team
          </button>
        </div>
      ) : (
        <>
          {order.status === "under_review" && (
            <p className="mb-2 text-xs font-medium text-blue-700">
              Scan acquired — preview below. Report will lock when marked Ready.
            </p>
          )}
          {active && (
            <DicomViewer
              url={active.url}
              label={active.label}
              height={280}
              onOpenFullscreen={() => setFullscreen(true)}
            />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {series.map((frame) => (
              <button
                key={frame.id}
                type="button"
                onClick={() => setActiveFrameId(frame.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  frame.id === active?.id
                    ? "border-brand-500 bg-brand-50 font-semibold text-brand-800"
                    : "border-border bg-surface text-gray-700"
                }`}
              >
                {frame.label}
              </button>
            ))}
          </div>
        </>
      )}

      {patient && patient.ultrasound.measurements.length > 0 && order.status === "ready" && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold text-gray-800">Measurements (from report)</p>
          <ul className="grid grid-cols-2 gap-1 text-xs text-gray-700">
            {patient.ultrasound.measurements.map((m) => (
              <li key={m.label}>
                {m.label}: {m.value} <span className="text-muted">({m.ga})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fullscreen && active && (
        <DicomViewerModal
          url={active.url}
          label={`${patient?.name ?? "Patient"} — ${active.label}`}
          onClose={() => setFullscreen(false)}
        />
      )}
    </section>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
