import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  Loader2,
  Pill,
  ScanLine,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { usePatientAiSummary } from "../../hooks/usePatientAiSummary";
import { getClinicalPriority } from "../../utils/clinicalPriority";
import { consentReminders, currentCtgSummary, maternalObservations } from "../../utils/summaryObservations";
import { getPatientAiSummary } from "../../data/patientAiSummaries";
import { Badge } from "../ui/Badge";

export function PatientAiSummaryCard({ patientId }: { patientId: string }) {
  const { patients, getPatientHistory } = useApp();
  const patient = patients.find((p) => p.id === patientId);
  const { summary, loading, ollamaAvailable, error, enhanceWithOllama } =
    usePatientAiSummary(patient, getPatientHistory);

  if (!patient || !summary || summary.patientId !== patient.id) return null;

  const priority = getClinicalPriority(patient);
  const isCritical = priority === "critical";
  const isElevated = priority === "elevated";
  const isPrimigravida = patient.gravida === 1;
  const chartPlan = getPatientAiSummary(patient, getPatientHistory(patient.id)).immediatePlan;

  const shellClass = isCritical
    ? "critical-summary-shell border-2 border-red-500 bg-gradient-to-br from-red-50 via-orange-50 to-red-100 shadow-lg shadow-red-200/50"
    : isElevated
      ? "border-2 border-amber-400 bg-gradient-to-br from-amber-50/90 to-white shadow-md"
      : "border border-brand-200 bg-gradient-to-br from-brand-50/80 to-white shadow-sm";

  return (
    <section className={`rounded-2xl p-4 ${shellClass}`}>
      {/* ── Condition highlight ── */}
      {(isCritical || isElevated) && summary.conditionHighlight && (
        <div
          className={`mb-3 rounded-xl px-3 py-2 ${
            isCritical
              ? "critical-banner bg-red-600 text-white"
              : "border border-amber-300 bg-amber-100 text-amber-950"
          }`}
        >
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
            <AlertTriangle className={`h-3.5 w-3.5 ${isCritical ? "animate-pulse" : ""}`} />
            {isCritical ? "Critical" : "Elevated surveillance"}
          </p>
          <p className="mt-0.5 text-sm font-semibold">{summary.conditionHighlight}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isCritical ? "bg-red-600 text-white" : "bg-brand-600 text-white"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">LR clinical summary</h3>
            <p className="text-[10px] text-muted">
              {summary.source === "ollama" ? "AI-enhanced" : "Chart summary"} · {summary.generatedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ollamaAvailable && (
            <button
              type="button"
              onClick={enhanceWithOllama}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg border border-brand-300 bg-white px-2.5 py-1 text-[10px] font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Bot className="h-3 w-3" />
              )}
              {loading ? "Enhancing…" : "Enhance with AI"}
            </button>
          )}
          <Badge tone={isCritical ? "danger" : isElevated ? "warning" : "success"}>
            {isCritical ? "Critical" : isElevated ? "Elevated" : "Stable"}
          </Badge>
        </div>
      </div>

      {error && (
        <p className="mb-2 rounded-lg bg-amber-50 px-2 py-1 text-[10px] text-amber-800 ring-1 ring-amber-200">
          {error}
        </p>
      )}

      {/* ── Clinical summary sections — handover sequence ── */}
      <div className="space-y-2.5 text-xs leading-relaxed text-gray-800">
        <div className="rounded-xl bg-white/90 p-3 ring-1 ring-black/5">
          <p className="font-semibold text-gray-900">
            {patient.fullName ?? patient.name} · {patient.age} years · G{patient.gravida}P{patient.para} · {patient.gestationalAge} · Bed {patient.bed}
          </p>
          <p>{patient.status} · Blood group {patient.bloodGroup} · Allergies: {patient.allergies}</p>
        </div>
        <div className="rounded-xl bg-white/90 p-3 ring-1 ring-brand-200">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <p className="flex items-center gap-1 font-semibold uppercase tracking-wide text-gray-700"><Activity className="h-3.5 w-3.5" /> Current maternal observations</p>
            <span className="text-[10px] text-muted">Simulated monitor · {patient.lastUpdate}</span>
          </div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
            {maternalObservations(patient).map((observation) => (
              <div key={observation.label} className="rounded-lg bg-brand-50/70 p-2">
                <dt className="text-[10px] text-gray-600">{observation.label}</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{observation.value} <span className="text-[10px] font-normal">{observation.unit}</span></dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[11px] text-gray-600">These are current readings, separate from the admission history. Oxygen support, urine output/fluid balance, pain score, consciousness and bleeding assessment are not recorded in this chart; confirm at bedside. Maternal trends are not available.</p>
        </div>
        {/* 1. Antenatal details */}
        <SummarySection
          title="Antenatal details"
          icon={Stethoscope}
          content={summary.antenatalSummary}
          muted
        />

        {/* 2. History on admission */}
        <SummarySection
          title="History on admission"
          icon={ClipboardList}
          content={summary.admissionHistory}
        />

        {/* 3. P/V findings on admission */}
        <SummarySection
          title="P/V on admission"
          icon={ClipboardList}
          highlight={isCritical}
          content={summary.admissionPvFindings}
        />

        {/* 4. Pelvis — primigravida only */}
        {isPrimigravida && summary.pelvisAssessment && (
          <SummarySection
            title="Pelvis assessment (primigravida)"
            icon={ClipboardList}
            content={summary.pelvisAssessment}
          />
        )}

        {/* 5. Recent lab & USG reports */}
        <SummarySection
          title="Recent lab reports"
          icon={FlaskConical}
          content={summary.recentLabFindings}
        />
        <SummarySection
          title="Recent USG findings"
          icon={ScanLine}
          content={summary.recentUsgFindings}
        />

        {/* 6. CTG */}
        <SummarySection
          title="Current fetal monitoring / CTG"
          icon={Activity}
          content={currentCtgSummary(patient)}
          highlight={isCritical}
        />

        {/* 7. Ongoing treatment */}
        <div className="rounded-lg bg-white/70 p-2.5 ring-1 ring-black/5">
          <p className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wide text-muted">
            <Pill className="h-3 w-3" />
            Ongoing treatment
          </p>
          <ul className="space-y-0.5">
            {summary.ongoingTreatment.map((m) => (
              <li key={m} className="flex gap-1.5">
                <span className="text-brand-600">·</span>
                {m}
              </li>
            ))}
          </ul>
        </div>

        {/* 8. Risk factors */}
        {summary.riskFactors.length > 0 && (
          <BulletSection title="Risk factors" icon={AlertTriangle} items={summary.riskFactors} />
        )}

        {/* 9. Plan of action */}
        <BulletSection
          title="Plan of action"
          icon={CheckCircle2}
          items={summary.immediatePlan}
          highlight={isCritical}
        />
        <BulletSection
          title="Consent and patient / relative counselling"
          icon={ClipboardList}
          items={consentReminders(patient, chartPlan)}
        />
      </div>

      <p className="mt-2 text-[10px] text-muted">
        Full OPD / lab / USG history in Prior records panel below.
      </p>
    </section>
  );
}

function SummarySection({
  title,
  content,
  icon: Icon,
  highlight,
  muted,
}: {
  title: string;
  content: string;
  icon?: typeof ClipboardList;
  highlight?: boolean;
  muted?: boolean;
}) {
  if (!content?.trim()) return null;
  return (
    <div
      className={`rounded-lg p-2.5 ring-1 ${
        highlight ? "bg-red-50/80 ring-red-200" : "bg-white/70 ring-black/5"
      }`}
    >
      <p className="mb-0.5 flex items-center gap-1 font-semibold uppercase tracking-wide text-muted">
        {Icon && <Icon className="h-3 w-3" />}
        {title}
      </p>
      <p className={muted ? "text-gray-700" : "font-medium text-gray-900"}>{content}</p>
    </div>
  );
}

function BulletSection({
  title,
  items,
  icon: Icon,
  highlight,
}: {
  title: string;
  items: string[];
  icon: typeof AlertTriangle;
  highlight?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-lg p-2.5 ${highlight ? "bg-red-50/60" : ""}`}>
      <p className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-3 w-3" />
        {title}
      </p>
      <ul className="list-inside list-disc space-y-0.5">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
