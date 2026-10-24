import type { Patient, PatientHistory } from "../types";
import { getClinicalPriority } from "./clinicalPriority";
import { filterSignificantHistory } from "./historyFilter";

/** Compact chart payload for Ollama — includes USG + labs separately. */
export function buildPatientChartContext(
  patient: Patient,
  history: PatientHistory | null
): string {
  const priority = getClinicalPriority(patient);
  const filtered = history ? filterSignificantHistory(history) : null;


  const chart: Record<string, unknown> = {
    name: patient.fullName ?? patient.name,
    age: patient.age,
    gp: `G${patient.gravida}P${patient.para}`,
    ga: patient.gestationalAge,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    status: patient.status,
    pvOnAdmission: patient.admissionPvFindings,
    pelvis: patient.gravida === 1 ? patient.pelvisAssessment : undefined,
    currentMaternalVitals: {
      bloodPressure: `${patient.vitals.bp} mmHg`,
      pulse: `${patient.vitals.pulse} bpm`,
      spo2: `${patient.vitals.spo2}%`,
      respiratoryRate: `${patient.vitals.respRate}/min`,
      temperature: `${patient.vitals.temp} °C`,
      lastUpdate: patient.lastUpdate,
      source: "simulated current monitor; not admission observations",
    },
    missingObservations: ["oxygen support", "urine output", "fluid balance", "pain score", "consciousness", "bleeding assessment", "maternal vital trends"],
    consentStatus: "not recorded; do not infer consent or family counselling completed",
    ctg: {
      baseline: patient.ctg.baseline,
      variability: patient.ctg.variability,
      decelerations: patient.ctg.decelerations,
      accelerations: "not documented",
      category: "not assigned; requires full trace review",
    },
    fhr: patient.vitals.fhr,
    meds: patient.currentMedications,
    priority,
  };

  // Current USG measurements
  if (patient.ultrasound.measurements.length > 0) {
    chart.usgMeasurements = patient.ultrasound.measurements.map(
      (m) => `${m.label} ${m.value} (${m.ga})`
    );
  }

  // Recent significant history — split labs and scans for Ollama
  if (filtered) {
    const antenatal: Record<string, unknown>[] = [];
    filtered.significantOpd.forEach((v) =>
      antenatal.push({ d: v.date, note: v.diagnosis ?? v.summary })
    );
    if (antenatal.length > 0) chart.significantAntenatal = antenatal;

    const labs: Record<string, unknown>[] = [];
    filtered.significantLabs.forEach((l) =>
      labs.push({ date: l.date, test: l.testName, r: l.result, unit: l.unit, ref: l.reference })
    );
    if (labs.length > 0) chart.recentLabs = labs;

    const scans: Record<string, unknown>[] = [];
    filtered.significantScans.forEach((u) =>
      scans.push({ scan: u.type, note: u.summary })
    );
    if (scans.length > 0) chart.recentScans = scans;
  }

  // Most recent scan report from history (may not be in significantScans)
  if (history && history.ultrasoundReports.length > 0) {
    const latest = history.ultrasoundReports[0];
    chart.latestScanReport = `${latest.type} (${latest.date}): ${latest.summary}`;
  }

  // Compact JSON — no pretty-printing to save tokens
  return JSON.stringify(chart);
}
