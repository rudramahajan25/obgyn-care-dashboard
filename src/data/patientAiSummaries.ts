import { currentCtgSummary } from "../utils/summaryObservations";
import type { Patient, PatientHistory } from "../types";
import { getClinicalPriority } from "../utils/clinicalPriority";
import { filterSignificantHistory } from "../utils/historyFilter";

/**
 * LR clinical summary — field order matches handover sequence:
 *   condition → antenatal → admission → P/V → pelvis → labs → USG → CTG → treatment → risks → plan
 */
export interface PatientAiSummary {
  patientId: string;
  generatedAt: string;
  source: "ollama" | "fallback";
  conditionHighlight?: string;
  antenatalSummary: string;
  admissionHistory: string;
  admissionPvFindings: string;
  pelvisAssessment?: string;
  recentLabFindings: string;
  recentUsgFindings: string;
  ctgStatus: string;
  ongoingTreatment: string[];
  riskFactors: string[];
  immediatePlan: string[];
}

/* ------------------------------------------------------------------ */
/*  Curated synthetic demo narratives                                */
/* ------------------------------------------------------------------ */

/** Synthetic scenario details; not a validated clinical decision engine. */
const patientSummaryExtras: Record<
  string,
  Partial<
    Pick<
      PatientAiSummary,
      | "conditionHighlight"
      | "antenatalSummary"
      | "admissionHistory"
      | "recentLabFindings"
      | "recentUsgFindings"
      | "riskFactors"
      | "immediatePlan"
    >
  >
> = {
  // p1: Andrea Paul — G2P1, 32w4d, Stage 1 labour, returning patient
  p1: {
    antenatalSummary:
      "Prev NVD 3y ago · GBS negative · anomaly scan normal at 20w · OGTT normal · iron supplementation for borderline anaemia (Hb 11.2) · tetanus immunised · uncomplicated antenatal course.",
    admissionHistory:
      "Spontaneous onset of contractions since 6h · show present · SROM at 09:45 hrs, clear liquor · 3 contractions per 10 min, 35-40s, moderate intensity · vitals stable on admission.",
    recentLabFindings:
      "Hb 11.2 g/dL (borderline) · Plt 198K · Blood group B+ · antibody screen negative · HIV/HBsAg/VDRL non-reactive · OGTT normal · RBS 92 mg/dL · urine: no protein, no ketones.",
    recentUsgFindings:
      "EFW 1.82 kg · cephalic · AFI 12 · placenta anterior Grade II · BPP 8/8 · normal umbilical artery Doppler (S/D 2.3).",
    riskFactors: [
      "Advanced maternal age (35y)",
      "Borderline anaemia (Hb 11.2)",
      "Preterm 32w — NICU standby advisable",
    ],
    immediatePlan: [
      "Continue in LR · partogram initiated",
      "Hourly CTG monitoring in active labour",
      "Reassess P/V in 4h or if urge to push",
      "Cross-match B+ 2 units on standby",
    ],
  },

  // p2: Lyracia D'Souza — G1P0 (primigravida), 38w2d, non-reassuring CTG
  p2: {
    conditionHighlight:
      "Non-reassuring CTG — late decelerations with minimal variability — full trace review required",
    antenatalSummary:
      "Primigravida · penicillin allergy · gestational HTN on Labetalol 100mg BD since 34w · growth scan: EFW 3.1kg, normal Doppler · GBS status unknown · no GDM.",
    admissionHistory:
      "Admitted for antenatal monitoring — intermittent headaches reported · contractions irregular, not established · membranes intact · show absent · BP 118/72 on admission, subsequently stable.",
    recentLabFindings:
      "Hb 12.4 g/dL · Plt 185K · Blood group A+ · urine protein trace · LFT normal (AST 22, ALT 18) · no HELLP · RBS 88 mg/dL · coagulation normal.",
    recentUsgFindings:
      "EFW 3.1 kg · cephalic · AFI 10 · anterior placenta Grade III · BPP 6/8 (reduced FM) · UA Doppler: PI 0.95, normal.",
    riskFactors: [
      "Penicillin allergy — avoid amoxicillin/ampicillin",
      "Non-reassuring CTG — clinician review required",
      "Nullipara at term",
      "Gestational hypertension",
    ],
    immediatePlan: [
      "Continuous CTG — do not disconnect",
      "STAT obstetric review within 30 min",
      "Left lateral position, IV fluids, O₂ if needed",
      "Prepare for emergency LSCS if pattern persists",
    ],
  },

  // p3: Meera Krishnan — G3P2, postpartum Day 1
  p3: {
    antenatalSummary:
      "Grand multipara · prev 2 NVD (uncomplicated) · no antenatal complications · Hb adequate throughout · negative screening.",
    admissionHistory:
      "PP Day 1 · NVD yesterday at 36w1d · 3.2 kg male · Apgar 8/9 · 3rd stage complete, placenta delivered intact · EBL ~350mL · skin-to-skin initiated.",
    recentLabFindings:
      "Hb 10.8 g/dL (postpartum) · Plt 210K · Blood group B+ · RBS 95 · urine normal.",
    recentUsgFindings:
      "Postpartum bedside USG: uterus involuting, no retained products, endometrial cavity empty.",
    riskFactors: [
      "Grand multipara — PPH risk (uterine atony)",
      "Temperature 37.1°C — monitor for puerperal sepsis",
    ],
    immediatePlan: [
      "Postpartum observation chart 24h",
      "Fundal tone check q4h — ensure well-contracted",
      "Lactation support · breastfeeding on demand",
      "Discharge planning if stable by 48h",
    ],
  },

  // p4: Sofia Fernandes — G2P1, 39w, induction for post-dates
  p4: {
    antenatalSummary:
      "Prev NVD 2y ago (3.5 kg) · latex allergy · 39w, EFW 3.4 kg (large for dates) · OGTT normal · GBS negative · antenatal course uneventful except post-dates.",
    admissionHistory:
      "Admitted for induction at 39w — unfavourable cervix, Bishop score 4 · no contractions · membranes intact · show absent · vitals stable · planned misoprostol induction at 14:00.",
    recentLabFindings:
      "Hb 12.0 g/dL · Plt 245K · Blood group AB+ · GBS negative · infectious screen non-reactive · RBS 90 · coagulation normal · type & screen done.",
    recentUsgFindings:
      "EFW 3.4 kg · cephalic · AFI 9 (low-normal) · posterior placenta Grade III · BPP 8/8.",
    riskFactors: [
      "Latex allergy — latex-free protocol mandatory",
      "Large-for-dates EFW 3.4 kg — shoulder dystocia risk",
      "Post-dates — monitor for oligohydramnios",
    ],
    immediatePlan: [
      "Latex-free protocol in LR and OT",
      "Misoprostol 25mcg PV at 14:00 per induction protocol",
      "CTG 30 min pre-induction and 1h post each dose",
      "Reassess Bishop score 6h after first dose",
    ],
  },

  // p5: Priya Deshmukh — G1P0 (primigravida), 34w5d, CRITICAL — meconium, non-reassuring CTG
  p5: {
    conditionHighlight:
      "CRITICAL — thick meconium-stained liquor · non-reassuring CTG · perinatal asphyxia risk",
    antenatalSummary:
      "Primigravida · Rh-negative (O−) · CRP raised at 12 mg/L (infection?) · reduced fetal movements reported today · preterm 34w5d · steroids not yet complete.",
    admissionHistory:
      "Emergency admission — sudden reduction in FM since morning · SROM at 06:00 with thick meconium-stained liquor · contractions 4 in 10 min, 50s, strong · BP 130/85, pulse 102 (tachycardic), SpO₂ 94% (low), RR 22 · temp 37.4°C.",
    recentLabFindings:
      "Hb 10.5 g/dL · Plt 175K · Blood group O− · CRP 12 mg/L (raised) · coagulation: PT 12s, aPTT 30s, fibrinogen 280 · urine protein + · RBS 110 · type & cross 2 units O− PRBC.",
    recentUsgFindings:
      "EFW 2.1 kg · cephalic · AFI 6 (oligohydramnios) · anterior placenta Grade III · BPP 4/8 (absent FM, absent breathing) · UA Doppler: raised PI 1.4, absent end-diastolic flow.",
    riskFactors: [
      "Preterm 34w5d — NICU required",
      "Rh-negative O− — Anti-D post-delivery",
      "Thick meconium-stained liquor — MAS risk",
      "Non-reassuring CTG — clinician review required — fetal compromise",
    ],
    immediatePlan: [
      "STAT Category 1 Emergency LSCS — OR 3",
      "Neonatology team at delivery — MAS protocol",
      "Cross-match O− 2 units, blood bank alerted",
      "Anti-D immunoglobulin plan post-delivery",
    ],
  },

  // p6: Hannah Thomas — G2P0 (prev loss), 30w3d, high-risk thromboprophylaxis
  p6: {
    conditionHighlight:
      "High-risk pathway — thromboprophylaxis active · antiphospholipid workup borderline",
    antenatalSummary:
      "G2P0 — prev first-trimester loss · anti-cardiolipin antibodies borderline · on aspirin 150mg + LMWH (Enoxaparin 40mg OD) · Rh-negative A− · anomaly scan normal at 20w · growth scans serial — tracking 25th centile.",
    admissionHistory:
      "Elective admission for high-risk monitoring at 30w3d · no contractions · no leaking · no bleeding · membranes intact · cervix closed, long and thick · vitals stable.",
    recentLabFindings:
      "Hb 11.8 g/dL · Plt 205K · Blood group A− · anti-Xa level therapeutic (0.45 IU/mL) · coagulation normal · urine clear · LFT normal · RBS 85.",
    recentUsgFindings:
      "EFW 1.5 kg (25th centile) · cephalic · AFI 14 · posterior placenta Grade I · BPP 8/8 · UA Doppler normal (PI 0.82).",
    riskFactors: [
      "Thrombophilia (anti-cardiolipin borderline)",
      "Rh-negative A− — Anti-D at 28w due",
      "Previous pregnancy loss",
      "Preterm 30w — steroid cover if threatened preterm labour",
    ],
    immediatePlan: [
      "Twice-weekly CTG until 34w",
      "Continue LMWH — hold 12h before any regional anaesthesia",
      "Betamethasone if delivery anticipated within 7 days",
      "Growth scan in 2 weeks · reassess Doppler",
    ],
  },

  // p7: Fatima Sheikh — G4P3, 37w6d, awaiting growth scan
  p7: {
    antenatalSummary:
      "Grand multipara · 3 prev NVD (all uncomplicated, largest baby 3.6 kg) · GBS negative · no GDM · no HTN · Hb adequate · uncomplicated antenatal course.",
    admissionHistory:
      "Admitted for growth scan and assessment at 37w6d · not in labour · no contractions · no leaking · no bleeding · vitals stable · cervix closed and posterior.",
    recentLabFindings:
      "Hb 11.5 g/dL · Plt 230K · Blood group B+ · GBS negative · infectious screen non-reactive · RBS 88 · urine normal.",
    recentUsgFindings:
      "Scan pending today — prior scan at 34w: EFW 2.4 kg (50th centile), cephalic, AFI 15, placenta posterior Grade II, normal Doppler.",
    riskFactors: ["Grand multipara — PPH risk (uterine atony)"],
    immediatePlan: [
      "Complete growth scan + AFI today",
      "Group & screen + cross-match on admission if labour",
      "Counsel on labour signs — expect spontaneous onset near term",
      "Active management of 3rd stage planned (PPH prevention)",
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  Builder functions                                                  */
/* ------------------------------------------------------------------ */

/** Do not relabel live readings as admission observations. */
function buildAdmissionHistory(patient: Patient): string {
  return `${patient.status} · GA ${patient.gestationalAge} · Admission observations not separately recorded; see current maternal observations.`;
}

/** Recent significant lab results. */
function buildRecentLabFindings(history: PatientHistory | null): string {
  if (!history) return "No lab reports on file.";
  const { significantLabs } = filterSignificantHistory(history);

  if (significantLabs.length === 0) {
    const recent = history.labReports.slice(0, 3);
    if (recent.length === 0) return "No lab reports on file.";
    return recent
      .map(
        (l) =>
          `${l.testName}: ${l.result}${l.unit ? ` ${l.unit}` : ""}`
      )
      .join(" · ");
  }

  return significantLabs
    .map(
      (l) =>
        `${l.testName}: ${l.result}${l.unit ? ` ${l.unit}` : ""}${l.reference ? ` (ref ${l.reference})` : ""}`
    )
    .join(" · ");
}

/** Latest USG findings from current measurements + most recent scan. */
function buildRecentUsgFindings(
  patient: Patient,
  history: PatientHistory | null
): string {
  const parts: string[] = [];

  const m = patient.ultrasound.measurements;
  if (m.length > 0) {
    const measureLine = m
      .map((u) => `${u.label} ${u.value} (${u.ga})`)
      .join(" · ");
    parts.push(measureLine);
  }

  if (history && history.ultrasoundReports.length > 0) {
    const latest = history.ultrasoundReports[0];
    parts.push(`${latest.type} (${latest.date}): ${latest.summary}`);
  }

  return parts.length > 0 ? parts.join(" — ") : "No USG on file.";
}

/** Antenatal summary from history when no curated extra exists. */
function buildAntenatalFromHistory(history: PatientHistory | null): string {
  if (!history) return "No prior records at this facility.";
  const { significantOpd, significantScans } =
    filterSignificantHistory(history);
  const parts: string[] = [];

  significantOpd.forEach((v) => {
    parts.push(`${v.date}: ${v.diagnosis ?? v.summary}`);
  });
  significantScans.forEach((u) => {
    parts.push(`${u.type} — ${u.summary}`);
  });

  return parts.length > 0
    ? parts.join(" · ")
    : "Prior antenatal course unremarkable.";
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export function getPatientAiSummary(
  patient: Patient,
  history: PatientHistory | null
): PatientAiSummary {
  const now = new Date().toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const extras = patientSummaryExtras[patient.id];
  const priority = getClinicalPriority(patient);

  return {
    patientId: patient.id,
    generatedAt: now,
    source: "fallback",
    conditionHighlight:
      extras?.conditionHighlight ??
      (priority === "critical" ? `CRITICAL — ${patient.status}` : undefined),
    antenatalSummary:
      extras?.antenatalSummary ?? buildAntenatalFromHistory(history),
    admissionHistory:
      extras?.admissionHistory ?? buildAdmissionHistory(patient),
    admissionPvFindings: patient.admissionPvFindings,
    pelvisAssessment:
      patient.gravida === 1 ? patient.pelvisAssessment : undefined,
    recentLabFindings:
      extras?.recentLabFindings ?? buildRecentLabFindings(history),
    recentUsgFindings:
      extras?.recentUsgFindings ?? buildRecentUsgFindings(patient, history),
    ctgStatus: currentCtgSummary(patient),
    ongoingTreatment:
      patient.currentMedications.length > 0
        ? patient.currentMedications
        : ["No current medications"],
    riskFactors:
      extras?.riskFactors ??
      (patient.hasAlert ? ["Active alert on chart"] : []),
    immediatePlan:
      extras?.immediatePlan ?? ["Continue protocol-based observation"],
  };
}

/** Merge Ollama JSON into chart fallback — never leave empty sections. */
export function mergeOllamaSummary(
  fallback: PatientAiSummary,
  raw: Partial<PatientAiSummary>
): PatientAiSummary {
  return {
    ...fallback,
    source: "ollama",
    generatedAt: fallback.generatedAt,
    conditionHighlight:
      raw.conditionHighlight || fallback.conditionHighlight,
    antenatalSummary:
      raw.antenatalSummary || fallback.antenatalSummary,
    admissionHistory:
      raw.admissionHistory || fallback.admissionHistory,
    admissionPvFindings:
      fallback.admissionPvFindings,
    pelvisAssessment:
      fallback.pelvisAssessment,
    recentLabFindings:
      raw.recentLabFindings || fallback.recentLabFindings,
    recentUsgFindings:
      raw.recentUsgFindings || fallback.recentUsgFindings,
    ctgStatus: fallback.ctgStatus,
    ongoingTreatment:
      Array.isArray(raw.ongoingTreatment) && raw.ongoingTreatment.length > 0
        ? raw.ongoingTreatment
        : fallback.ongoingTreatment,
    riskFactors:
      Array.isArray(raw.riskFactors) && raw.riskFactors.length > 0
        ? raw.riskFactors
        : fallback.riskFactors,
    immediatePlan:
      Array.isArray(raw.immediatePlan) && raw.immediatePlan.length > 0
        ? raw.immediatePlan
        : fallback.immediatePlan,
  };
}
