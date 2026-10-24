import type { PatientHistory } from "../types";

/** OPD visits matching any of these are routine / normal — skip in summary. */
const ROUTINE_OPD =
  /routine|uncomplicated|normal|fundal height consistent|fetal movements good|counselled on labour signs|booking visit|first booking|baseline labs|tetanus|iron supplementation|anomaly scan discussed|antenatal visit|routine visit|awaiting growth scan|iron started/i;

/** Lab results that are informational / already in demographics — skip. */
const SKIP_LAB_TEST = /blood group|rh\b/i;
const NORMAL_SCREEN = /non-reactive|negative|normal/i;

/** Scan types that are routine / expected — skip unless abnormal. */
const ROUTINE_SCAN_TYPE = /dating scan/i;
const ABNORMAL_SCAN_FINDING =
  /meconium|oligo|poly|IUGR|growth restriction|abnormal|reduced|asymmetric|absent|reversed|low-lying|previa/i;

/** Keep only abnormal or management-changing records for AI summary input. */
export function filterSignificantHistory(history: PatientHistory) {
  /* --- OPD --- */
  const significantOpd = history.opdVisits.filter(
    (v) =>
      v.diagnosis?.toLowerCase().includes("high-risk") ||
      (!ROUTINE_OPD.test(v.summary) && !ROUTINE_OPD.test(v.diagnosis ?? ""))
  );

  /* --- Labs --- */
  const significantLabs = history.labReports.filter((l) => {
    // Skip blood-group (already in demographics header)
    if (SKIP_LAB_TEST.test(l.testName)) return false;

    // Screening panels: keep only if NOT normal/non-reactive
    if (/HIV|HBsAg|VDRL|antibody/i.test(l.testName)) {
      return !NORMAL_SCREEN.test(l.result);
    }

    // Hb: skip if ≥ 11
    if (/^Hb\b/i.test(l.testName)) {
      const hb = parseFloat(l.result);
      return !Number.isNaN(hb) && hb < 11;
    }

    // OGTT: skip if normal
    if (/OGTT/i.test(l.testName)) {
      return !/normal/i.test(l.result);
    }

    // Numeric result vs reference range
    if (l.reference) {
      const num = parseFloat(l.result);
      if (Number.isNaN(num)) {
        return /borderline|raised|elevated|positive/i.test(l.result);
      }
      const refParts = l.reference.match(/[\d.]+/g);
      if (refParts && refParts.length >= 2) {
        const low = parseFloat(refParts[0]);
        const high = parseFloat(refParts[1]);
        return num < low || num > high;
      }
    }

    // Qualitative results flagged as abnormal
    if (/borderline|raised|elevated|positive/i.test(l.result)) return true;

    return false;
  });

  /* --- Scans --- */
  const significantScans = history.ultrasoundReports.filter((u) => {
    // Always keep if abnormal finding
    if (ABNORMAL_SCAN_FINDING.test(u.summary)) return true;
    // Skip dating scans and normal scans
    if (ROUTINE_SCAN_TYPE.test(u.type)) return false;
    if (/no.+anomaly|normal|adequate/i.test(u.summary) && !/abnormal/i.test(u.summary))
      return false;
    return true;
  });

  // If no significant scans, include the most recent one for context
  const scans =
    significantScans.length > 0
      ? significantScans
      : history.ultrasoundReports.slice(-1);

  return { significantOpd, significantLabs, significantScans: scans };
}
