import { Check, Scan, Upload } from "lucide-react";
import { useState } from "react";
import { AlarmBanner } from "../components/alerts/AlarmBanner";
import { DicomViewer } from "../components/dicom/DicomViewer";
import { TopBar } from "../components/layout/TopBar";
import { demoDicomSeries } from "../data/dicomStudies";
import { useApp } from "../context/AppContext";
import { Badge } from "../components/ui/Badge";
import type { UltrasoundWorkflowStatus } from "../types";

const steps: { status: UltrasoundWorkflowStatus; label: string }[] = [
  { status: "yet_to_record", label: "Yet to record" },
  { status: "waiting_for_patient", label: "Waiting for patient" },
  { status: "under_review", label: "Under review" },
  { status: "ready", label: "Ready — push report" },
];

export function UltrasoundDashboard() {
  const { ultrasoundOrders, updateUltrasoundStatus } = useApp();
  const [fileName, setFileName] = useState("Andrea_LR_scan.dcm");
  const [previewFrame, setPreviewFrame] = useState(0);

  const active = ultrasoundOrders.filter((o) => o.status !== "ready");
  const frame = demoDicomSeries[previewFrame] ?? demoDicomSeries[0];

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <AlarmBanner />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-amber-500 p-3 text-white">
              <Scan className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ultrasound suite</h2>
              <p className="text-sm text-muted">
                Acquire scan · review in DICOM viewer · push .dcm report to labour room
              </p>
            </div>
          </div>

          <section className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Acquisition preview (DICOM)</h3>
            {frame && <DicomViewer url={frame.url} label={frame.label} height={300} />}
            <div className="mt-2 flex gap-2">
              {demoDicomSeries.map((f, i) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPreviewFrame(i)}
                  className={`rounded-lg px-2 py-1 text-xs ${
                    i === previewFrame ? "bg-brand-600 text-white" : "bg-surface ring-1 ring-border"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {active.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted">
              No pending requests. LR staff use &quot;Request ultrasound&quot; when needed.
            </p>
          ) : (
            <div className="space-y-4">
              {active.map((order) => (
                <article key={order.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="mb-3 flex justify-between">
                    <h3 className="font-bold">
                      {order.patientName} ({order.bed})
                    </h3>
                    <Badge tone="warning">{order.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="mb-3 text-xs text-muted">Requested by {order.requestedBy}</p>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {steps.map((s) => (
                      <button
                        key={s.status}
                        type="button"
                        onClick={() =>
                          updateUltrasoundStatus(
                            order.id,
                            s.status,
                            s.status === "ready" ? fileName : undefined
                          )
                        }
                        className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                          order.status === s.status
                            ? "bg-brand-600 text-white"
                            : "bg-surface text-gray-700 ring-1 ring-border"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {order.status === "under_review" && (
                    <div className="space-y-3">
                      <DicomViewer url={frame.url} label="Study under review" height={220} />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                          placeholder="Report filename (.dcm)"
                        />
                        <button
                          type="button"
                          onClick={() => updateUltrasoundStatus(order.id, "ready", fileName)}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Push DICOM report
                        </button>
                      </div>
                    </div>
                  )}

                  {order.status !== "ready" && order.status !== "under_review" && (
                    <button
                      type="button"
                      onClick={() => updateUltrasoundStatus(order.id, "under_review")}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Mark scan complete → under review
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}

          <p className="mt-6 flex items-center gap-1 text-xs text-muted">
            <Check className="h-3.5 w-3.5 text-green-600" />
            When status is Ready, nurses see the DICOM study on the LR / doctor dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
