import type { ClinicalPriority, Patient } from "../types";

export function getClinicalPriority(patient: Patient): ClinicalPriority {
  if (patient.clinicalPriority) return patient.clinicalPriority;
  const status = patient.status.toLowerCase();
  if (
    status.includes("asphyxia") ||
    status.includes("emergency") ||
    status.includes("stat")
  ) {
    return "critical";
  }
  if (patient.hasAlert) return "elevated";
  return "routine";
}

export function isCriticalPatient(patient: Patient): boolean {
  return getClinicalPriority(patient) === "critical";
}
