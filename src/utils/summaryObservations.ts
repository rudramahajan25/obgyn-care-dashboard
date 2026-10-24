import type { Patient } from "../types";

/** Display observations, not a diagnostic score or treatment recommendation. */
export function maternalObservations(patient: Patient) {
  const v = patient.vitals;
  return [
    { label: "Blood pressure", value: v.bp, unit: "mmHg" },
    { label: "Maternal pulse", value: String(v.pulse), unit: "bpm" },
    { label: "Oxygen saturation", value: String(v.spo2), unit: "%" },
    { label: "Respiratory rate", value: String(v.respRate), unit: "/min" },
    { label: "Temperature", value: v.temp.toFixed(1), unit: "°C" },
  ];
}

/** No consent records exist yet: these are reminders, never completed actions. */
export function consentReminders(patient: Patient, documentedPlan: string[]): string[] {
  const plannedCare = `${patient.status} ${documentedPlan.join(" ")}`;
  const reminders = [
    "Consent status not recorded — verify the clinical record before any procedure. Explain the indication, expected benefit, material risks, alternatives and consequences of declining; check understanding and document the patient's decision.",
    "Obtain and document permission before each P/V or other intimate examination; offer a chaperone and respect a request to stop.",
  ];
  if (/LSCS|caesarean|cesarean/i.test(plannedCare)) {
    reminders.push("If operative delivery is confirmed by the obstetrician, obtain procedure-specific consent and anaesthetic consent; discuss relevant maternal and neonatal risks and possible blood transfusion, documenting acceptance or refusal.");
  } else if (/induction|misoprostol/i.test(plannedCare)) {
    reminders.push("Before a planned induction, discuss the method, monitoring, alternatives and possibility of further intervention; document the patient's informed decision.");
  }
  reminders.push(
    "With the patient's permission, counsel the chosen relative/support person on the current condition and proposed care; record their name, relationship and the discussion. A relative's signature does not replace the consent of a patient who has capacity.",
    "If the patient cannot consent, escalate to the responsible clinician to assess capacity and follow applicable law and hospital policy for an authorised representative or emergency decision; document the basis and urgency.",
    "Record the date/time, consenting clinician, interpreter or witness where needed, questions answered and any limits or refusal. For neonatal care, arrange counselling and consent from the appropriate parent/guardian as required.",
  );
  return reminders;
}

/** Preserve recorded features without inventing accelerations or a CTG category. */
export function currentCtgSummary(patient: Patient): string {
  if (patient.vitals.fhr === 0 && patient.ctg.points.length === 0) {
    return /postpartum/i.test(patient.status)
      ? "Postpartum — CTG not applicable."
      : "Fetal heart rate and CTG not recorded.";
  }
  return `FHR ${patient.vitals.fhr > 0 ? `${patient.vitals.fhr} bpm` : "not recorded"} · baseline ${patient.ctg.baseline} · variability: ${patient.ctg.variability} · decelerations: ${patient.ctg.decelerations}. Accelerations and contraction frequency are not captured in the structured CTG summary; review the full trace with the clinical picture before assigning a category.`;
}
