import { CheckSquare, Square } from "lucide-react";
import { useApp } from "../../context/AppContext";
import type { LabourChecklistState } from "../../types";

function CheckItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
        checked ? "border-green-300 bg-green-50 text-green-900" : "border-border bg-white text-gray-800"
      }`}
    >
      {checked ? (
        <CheckSquare className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Square className="h-4 w-4 shrink-0 text-gray-400" />
      )}
      {label}
    </button>
  );
}

export function LabourRoomChecklist() {
  const { patients, selectedPatientId, getChecklist, updateChecklist } = useApp();
  const patient = patients.find((p) => p.id === selectedPatientId);
  if (!patient) return null;

  const checklist = getChecklist(patient.id);

  const patch = (partial: Partial<LabourChecklistState>) => {
    updateChecklist(patient.id, {
      ...checklist,
      ...partial,
      multiparameter: { ...checklist.multiparameter, ...partial.multiparameter },
      ctg: { ...checklist.ctg, ...partial.ctg },
    });
  };

  const mpDone = Object.values(checklist.multiparameter).filter(Boolean).length;
  const ctgDone = Object.values(checklist.ctg).filter(Boolean).length;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Labour room checklist</h3>
          <p className="text-xs text-muted">Track path of care — multiparameter & CTG</p>
        </div>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-800">
          LR
        </span>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          General checkup — multiparameter ({mpDone}/4)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckItem
            label="BP"
            checked={checklist.multiparameter.bp}
            onChange={(bp) => patch({ multiparameter: { ...checklist.multiparameter, bp } })}
          />
          <CheckItem
            label="Pulse rate"
            checked={checklist.multiparameter.pulse}
            onChange={(pulse) => patch({ multiparameter: { ...checklist.multiparameter, pulse } })}
          />
          <CheckItem
            label="ECG"
            checked={checklist.multiparameter.ecg}
            onChange={(ecg) => patch({ multiparameter: { ...checklist.multiparameter, ecg } })}
          />
          <CheckItem
            label="Oxygen saturation"
            checked={checklist.multiparameter.spo2}
            onChange={(spo2) => patch({ multiparameter: { ...checklist.multiparameter, spo2 } })}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          CTG ({ctgDone}/2)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckItem
            label="Uterine contraction"
            checked={checklist.ctg.uterineContraction}
            onChange={(uterineContraction) =>
              patch({ ctg: { ...checklist.ctg, uterineContraction } })
            }
          />
          <CheckItem
            label="Fetal heart rate"
            checked={checklist.ctg.fetalHeartRate}
            onChange={(fetalHeartRate) => patch({ ctg: { ...checklist.ctg, fetalHeartRate } })}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Current medications
        </p>
        <ul className="rounded-lg bg-surface p-3 text-sm text-gray-800">
          {patient.currentMedications.length > 0 ? (
            patient.currentMedications.map((m) => (
              <li key={m} className="list-inside list-disc text-xs leading-relaxed">
                {m}
              </li>
            ))
          ) : (
            <li className="text-xs text-muted">None documented</li>
          )}
        </ul>
      </div>
    </section>
  );
}
