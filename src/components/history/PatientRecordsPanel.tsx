import { FileText, FlaskConical, Scan } from "lucide-react";
import { useState } from "react";
import { DicomViewerModal } from "../dicom/DicomViewerModal";
import { useApp } from "../../context/AppContext";

type Tab = "opd" | "lab" | "ultrasound";

export function PatientRecordsPanel() {
  const { patients, selectedPatientId, getPatientHistory } = useApp();
  const patient = patients.find((p) => p.id === selectedPatientId);
  const history = patient ? getPatientHistory(patient.id) : null;
  const [tab, setTab] = useState<Tab>("opd");
  const [open, setOpen] = useState(false);
  const [dicomPreview, setDicomPreview] = useState<{ url: string; label: string } | null>(null);

  if (!patient) return null;

  const tabs: { id: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { id: "opd", label: "OPD visits", icon: FileText, count: history?.opdVisits.length ?? 0 },
    { id: "lab", label: "Lab reports", icon: FlaskConical, count: history?.labReports.length ?? 0 },
    { id: "ultrasound", label: "Ultrasound", icon: Scan, count: history?.ultrasoundReports.length ?? 0 },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Prior records at this facility</h3>
          <p className="text-xs text-muted">
            {patient.registeredAtFacility
              ? "Returning patient — earlier OPD, lab & ultrasound on file"
              : "No prior visits on file at this hospital"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700"
        >
          {open ? "Hide history" : "View OPD, lab & USG history"}
        </button>
      </div>

      {open && (
        <>
          {!history ? (
            <p className="rounded-lg bg-surface p-4 text-sm text-muted">
              No previous OPD, laboratory, or ultrasound records on file for this patient. New
              registrations will build history from the first visit onward.
            </p>
          ) : (
            <>
              <div className="mb-3 flex gap-1 border-b border-border">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium ${
                      tab === t.id
                        ? "border-brand-600 text-brand-700"
                        : "border-transparent text-muted"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto">
                {tab === "opd" &&
                  history.opdVisits.map((v) => (
                    <article key={v.id} className="rounded-lg bg-surface p-3 text-xs">
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>{v.date}</span>
                        <span className="text-muted">{v.doctor}</span>
                      </div>
                      <p className="text-muted">{v.department}</p>
                      <p className="mt-1 text-gray-700">{v.summary}</p>
                      {v.diagnosis && (
                        <p className="mt-1 font-medium text-brand-700">Dx: {v.diagnosis}</p>
                      )}
                    </article>
                  ))}

                {tab === "lab" &&
                  history.labReports.map((r) => (
                    <article key={r.id} className="flex justify-between rounded-lg bg-surface p-3 text-xs">
                      <div>
                        <p className="font-semibold text-gray-900">{r.testName}</p>
                        <p className="text-muted">{r.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {r.result}
                          {r.unit ? ` ${r.unit}` : ""}
                        </p>
                        {r.reference && <p className="text-muted">Ref: {r.reference}</p>}
                      </div>
                    </article>
                  ))}

                {tab === "ultrasound" &&
                  history.ultrasoundReports.map((r) => (
                    <article key={r.id} className="rounded-lg bg-surface p-3 text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">{r.type}</span>
                        <span className="text-muted">{r.date} · GA {r.ga}</span>
                      </div>
                      <p className="mt-1 text-gray-700">{r.summary}</p>
                      {r.dicomUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setDicomPreview({ url: r.dicomUrl!, label: `${r.type} — ${r.date}` })
                          }
                          className="mt-2 font-medium text-brand-600 hover:underline"
                        >
                          Open {r.fileName ?? "DICOM study"}
                        </button>
                      )}
                    </article>
                  ))}
              </div>
            </>
          )}
        </>
      )}
      {dicomPreview && (
        <DicomViewerModal
          url={dicomPreview.url}
          label={dicomPreview.label}
          onClose={() => setDicomPreview(null)}
        />
      )}
    </section>
  );
}
