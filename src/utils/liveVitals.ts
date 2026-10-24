import type { CTGPoint, Patient, Vitals } from "../types";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Small step from current values — feels like a real monitor refresh. */
export function jitterVitals(current: Vitals, hasFetal: boolean): Vitals {
  const [sys, dia] = current.bp.split("/").map(Number);

  return {
    bp: `${clamp(Math.round(sys + randBetween(-4, 4)), 95, 150)}/${clamp(Math.round(dia + randBetween(-3, 3)), 55, 100)}`,
    pulse: clamp(Math.round(current.pulse + randBetween(-5, 5)), 58, 120),
    spo2: clamp(Math.round(current.spo2 + randBetween(-1, 1)), 91, 100),
    respRate: clamp(Math.round(current.respRate + randBetween(-2, 2)), 11, 26),
    temp: Math.round(clamp(current.temp + randBetween(-0.12, 0.12), 36.2, 37.8) * 10) / 10,
    fhr: hasFetal
      ? clamp(Math.round(current.fhr + randBetween(-7, 7)), 108, 168)
      : 0,
  };
}

export function patientHasFetalMonitoring(patient: Patient): boolean {
  return patient.ctg.points.length > 0 || patient.vitals.fhr > 0;
}

export function generateLiveCTG(tick: number, baselineFhr: number, inLabor: boolean): CTGPoint[] {
  const points: CTGPoint[] = [];
  const phase = tick * 0.4;

  for (let i = 0; i <= 50; i += 2) {
    const t = i;
    const wave = Math.sin(phase + t / 7);
    const contraction =
      inLabor && t > 8
        ? Math.max(0, Math.sin(phase * 1.3 + t / 5) * 42 + randBetween(0, 18))
        : 0;

    points.push({
      time: t,
      fhr: Math.round(
        clamp(baselineFhr + wave * 11 + randBetween(-4, 4), 90, 185)
      ),
      uc: Math.round(contraction),
      fm: Math.random() > 0.94 ? 1 : 0,
    });
  }
  return points;
}

export function summarizeCTG(points: CTGPoint[]): Pick<Patient["ctg"], "baseline" | "variability" | "decelerations"> {
  if (!points.length) {
    return { baseline: "—", variability: "—", decelerations: "—" };
  }

  const fhrValues = points.map((p) => p.fhr);
  const baseline = Math.round(fhrValues.reduce((a, b) => a + b, 0) / fhrValues.length);
  const min = Math.min(...fhrValues);
  const max = Math.max(...fhrValues);
  const spread = max - min;

  let variability = "Moderate";
  if (spread < 8) variability = "Minimal";
  else if (spread > 22) variability = "Marked";

  const drops = fhrValues.filter((v, i) => i > 0 && fhrValues[i - 1] - v > 15).length;
  const decelerations =
    drops === 0 ? "None" : drops === 1 ? "Variable (1)" : `Variable (${drops})`;

  return {
    baseline: `${baseline} bpm`,
    variability,
    decelerations,
  };
}

export function formatLastUpdate(secondsAgo: number): string {
  if (secondsAgo < 5) return "Just now";
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const mins = Math.floor(secondsAgo / 60);
  return mins === 1 ? "1 min ago" : `${mins} min ago`;
}

export function tickPatientLive(patient: Patient, tick: number): Patient {
  const hasFetal = patientHasFetalMonitoring(patient);
  const vitals = jitterVitals(patient.vitals, hasFetal);
  const inLabor = hasFetal && patient.status.toLowerCase().includes("labor");

  const points = hasFetal
    ? generateLiveCTG(tick, vitals.fhr, inLabor)
    : patient.ctg.points;

  const ctgSummary = summarizeCTG(points);

  return {
    ...patient,
    vitals,
    lastUpdate: "Just now",
    ctg: {
      ...patient.ctg,
      ...ctgSummary,
      points,
    },
  };
}

export function tickAllPatients(patients: Patient[], tick: number): Patient[] {
  return patients.map((p) => tickPatientLive(p, tick + p.id.charCodeAt(1)));
}
