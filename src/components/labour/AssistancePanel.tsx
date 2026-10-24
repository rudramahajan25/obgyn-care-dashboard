import {
  Accessibility,
  ArrowUpDown,
  BellRing,
  FlaskConical,
  Scan,
  Stethoscope,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../../context/AppContext";
import type { ShiftingEquipment, TransportPriority } from "../../types";

const labTests = ["CBC", "Blood group", "Coagulation", "RBS", "Urine routine", "Stat Hb"];

export function AssistancePanel() {
  const {
    patients,
    selectedPatientId,
    callOnDutyDoctor,
    callLaboratory,
    requestUltrasound,
    requestTransport,
    getUltrasoundOrder,
    remindUltrasound,
  } = useApp();

  const patient = patients.find((p) => p.id === selectedPatientId);
  const [equipment, setEquipment] = useState<ShiftingEquipment>("stretcher");
  const [shiftPriority, setShiftPriority] = useState<TransportPriority>("routine");
  const [selectedTests, setSelectedTests] = useState<string[]>(["CBC", "Blood group"]);

  const usgOrder = patient ? getUltrasoundOrder(patient.id) : undefined;

  if (!patient) return null;

  const callShifting = () => {
    const type = equipment === "wheelchair" ? "wheelchair" : "liftman";
    requestTransport({
      type,
      equipment,
      patientId: patient.id,
      fromLocation: `Labour Room — ${patient.bed}`,
      toLocation: equipment === "wheelchair" ? "Ultrasound / Ward" : "As directed",
      priority: shiftPriority,
    });
  };

  const toggleTest = (t: string) => {
    setSelectedTests((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-gray-900">Assistance — notifies departments</h3>
        <p className="mb-3 text-xs text-muted">LR · {patient.fullName ?? patient.name}</p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => callOnDutyDoctor(patient.id, "stat")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            <Stethoscope className="h-4 w-4" />
            Call on-duty doctor
            <Zap className="h-3.5 w-3.5" />
          </button>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
            <p className="mb-2 text-xs font-semibold text-amber-900">Call shifting / ward boy</p>
            <div className="mb-2 flex flex-wrap gap-1">
              {(
                [
                  ["stretcher", "With stretcher"],
                  ["wheelchair", "Wheelchair"],
                  ["without_equipment", "Without stretcher/chair"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEquipment(val)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                    equipment === val
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-700 ring-1 ring-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-2 flex gap-1">
              {(["routine", "urgent", "stat"] as TransportPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setShiftPriority(p)}
                  className={`flex-1 rounded py-1 text-[10px] font-medium capitalize ${
                    shiftPriority === p ? "bg-brand-600 text-white" : "bg-white ring-1 ring-border"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={callShifting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-800 py-2 text-xs font-semibold text-white"
            >
              {equipment === "wheelchair" ? (
                <Accessibility className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
              Alert shifting boy
            </button>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3">
            <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-blue-900">
              <FlaskConical className="h-3.5 w-3.5" />
              Call laboratory
            </p>
            <div className="mb-2 flex flex-wrap gap-1">
              {labTests.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTest(t)}
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    selectedTests.includes(t)
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 ring-1 ring-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => callLaboratory(patient.id, selectedTests, "urgent")}
              className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Call lab — {selectedTests.length} test(s)
            </button>
          </div>

          <button
            type="button"
            onClick={() => requestUltrasound(patient.id)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-500"
          >
            <Scan className="h-4 w-4" />
            Request ultrasound
          </button>
        </div>
      </section>

      {usgOrder ? (
        <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-3 text-xs text-amber-950">
          <p className="font-semibold">Ultrasound requested</p>
          <p className="mt-1 text-muted">
            Track status & DICOM on the main panel ←
          </p>
          <button
            type="button"
            onClick={() => remindUltrasound(usgOrder.id)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-amber-300 bg-white py-1.5 font-medium hover:bg-amber-50"
          >
            <BellRing className="h-3 w-3" />
            Remind team
          </button>
        </section>
      ) : (
        <p className="text-center text-[10px] text-muted">
          After you request ultrasound, images show in the main area when the scan is done.
        </p>
      )}
    </div>
  );
}
