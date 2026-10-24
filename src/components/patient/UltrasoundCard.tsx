import { useEffect, useState } from "react";
import { DicomViewer } from "../dicom/DicomViewer";
import { DicomViewerModal } from "../dicom/DicomViewerModal";
import { getDicomSeriesForPatient } from "../../data/dicomStudies";
import type { Patient } from "../../types";

export function UltrasoundCard({
  ultrasound,
  patientId,
}: {
  ultrasound: Patient["ultrasound"];
  patientId?: string;
}) {
  const series = getDicomSeriesForPatient(patientId ?? "p1");
  const [activeId, setActiveId] = useState(series[0]?.id ?? "");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setActiveId(getDicomSeriesForPatient(patientId ?? "p1")[0]?.id ?? "");
  }, [patientId]);

  const active = series.find((f) => f.id === activeId) ?? series[0];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Ultrasound (DICOM)</h3>
        <button
          type="button"
          onClick={() => active && setFullscreen(true)}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          View full study
        </button>
      </div>

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
            onClick={() => setActiveId(frame.id)}
            className={`rounded-lg border px-3 py-2 text-left text-xs transition ${
              frame.id === active?.id
                ? "border-brand-500 bg-brand-50 ring-2 ring-brand-200"
                : "border-border bg-surface hover:border-brand-300"
            }`}
          >
            <span className="block font-semibold text-gray-800">{frame.label}</span>
            <span className="text-[10px] text-muted">.dcm</span>
          </button>
        ))}
      </div>

      {ultrasound.measurements.length > 0 ? (
        <table className="mt-4 w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="pb-2 font-medium">Measurement</th>
              <th className="pb-2 font-medium">Value</th>
              <th className="pb-2 font-medium">GA</th>
            </tr>
          </thead>
          <tbody>
            {ultrasound.measurements.map((m) => (
              <tr key={m.label} className="border-b border-border/60">
                <td className="py-2 font-medium text-gray-800">{m.label}</td>
                <td className="py-2 text-gray-700">{m.value}</td>
                <td className="py-2 text-muted">{m.ga}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-3 text-xs text-muted">No recent measurements on file.</p>
      )}

      {fullscreen && active && (
        <DicomViewerModal
          url={active.url}
          label={active.label}
          onClose={() => setFullscreen(false)}
        />
      )}
    </section>
  );
}
