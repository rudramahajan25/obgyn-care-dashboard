import type { HospitalStaff } from "../types";

/**
 * O&G department roster — 40 staff (typical Indian L&D unit ratios).
 * 10 consultants · 3 assistants · 9 nurses · 4 midwives · 3 anesthesia
 * · 2 neonatology · 3 OT tech · 2 lab · 2 USG · 2 lift · 2 wheelchair
 */
export const hospitalRoster: HospitalStaff[] = [
  // —— Consultants (10) ——
  { id: "d01", employeeCode: "OG-101", name: "Dr. Ananya Sharma", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d02", employeeCode: "OG-102", name: "Dr. Rajesh Kapoor", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d03", employeeCode: "OG-103", name: "Dr. Priya Menon", category: "consultant", role: "Consultant Gynecologist", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d04", employeeCode: "OG-104", name: "Dr. Vikram Desai", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d05", employeeCode: "OG-105", name: "Dr. Sunita Iyer", category: "consultant", role: "Consultant — High-risk pregnancy", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d06", employeeCode: "OG-106", name: "Dr. Arjun Nambiar", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d07", employeeCode: "OG-107", name: "Dr. Kavitha Reddy", category: "consultant", role: "Consultant Gynecologist", department: "O&G", canWorkInOt: true, canStatCall: true, shiftNote: "OPD 2–5 PM" },
  { id: "d08", employeeCode: "OG-108", name: "Dr. Mohan Pillai", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d09", employeeCode: "OG-109", name: "Dr. Neha Bhat", category: "consultant", role: "Consultant — Fetal medicine", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d10", employeeCode: "OG-110", name: "Dr. Sanjay Grover", category: "consultant", role: "Consultant Obstetrician", department: "O&G", canWorkInOt: true, canStatCall: true },

  // —— Assistant doctors (3) ——
  { id: "d11", employeeCode: "OG-201", name: "Dr. Rahul Mehta", category: "assistant_doctor", role: "Senior Resident (O&G)", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d12", employeeCode: "OG-202", name: "Dr. Anita Joshi", category: "assistant_doctor", role: "Junior Resident (O&G)", department: "O&G", canWorkInOt: true, canStatCall: true },
  { id: "d13", employeeCode: "OG-203", name: "Dr. Karan Singh", category: "assistant_doctor", role: "Junior Resident (O&G)", department: "O&G", canWorkInOt: true, canStatCall: true },

  // —— Anesthetists (3) ——
  { id: "a01", employeeCode: "AN-01", name: "Dr. Ramesh Verma", category: "anesthetist", role: "Consultant Anesthetist", department: "Anesthesia", canWorkInOt: true, canStatCall: true },
  { id: "a02", employeeCode: "AN-02", name: "Dr. Lata Krishnan", category: "anesthetist", role: "Anesthetist", department: "Anesthesia", canWorkInOt: true, canStatCall: true },
  { id: "a03", employeeCode: "AN-03", name: "Dr. Imran Shaikh", category: "anesthetist", role: "Anesthetist", department: "Anesthesia", canWorkInOt: true, canStatCall: true },

  // —— Neonatologists (2) ——
  { id: "n01", employeeCode: "NEO-01", name: "Dr. Aditi Iyer", category: "neonatologist", role: "Neonatologist", department: "Neonatology", canWorkInOt: true, canStatCall: true },
  { id: "n02", employeeCode: "NEO-02", name: "Dr. Harish Chandran", category: "neonatologist", role: "Neonatologist", department: "Neonatology", canWorkInOt: true, canStatCall: true },

  // —— Nurses (9) ——
  { id: "nr01", employeeCode: "NR-01", name: "Nurse Priya Nair", category: "nurse", role: "Ward In-charge — L&D", department: "L&D", canWorkInOt: true, canStatCall: true },
  { id: "nr02", employeeCode: "NR-02", name: "Nurse Kavita Deshmukh", category: "nurse", role: "Scrub Nurse", department: "OT", canWorkInOt: true, canStatCall: true },
  { id: "nr03", employeeCode: "NR-03", name: "Nurse Rina Thomas", category: "nurse", role: "Circulator Nurse", department: "OT", canWorkInOt: true, canStatCall: true },
  { id: "nr04", employeeCode: "NR-04", name: "Nurse Smita Kulkarni", category: "nurse", role: "Labour Room Nurse", department: "L&D", canWorkInOt: true, canStatCall: true },
  { id: "nr05", employeeCode: "NR-05", name: "Nurse Anjali Rao", category: "nurse", role: "Postnatal Ward Nurse", department: "Ward B", canWorkInOt: false, canStatCall: true },
  { id: "nr06", employeeCode: "NR-06", name: "Nurse Deepa Nambiar", category: "nurse", role: "Scrub Nurse", department: "OT", canWorkInOt: true, canStatCall: true },
  { id: "nr07", employeeCode: "NR-07", name: "Nurse Meena Krishnan", category: "nurse", role: "Recovery Nurse", department: "OT", canWorkInOt: true, canStatCall: true },
  { id: "nr08", employeeCode: "NR-08", name: "Nurse Pooja Shah", category: "nurse", role: "Labour Room Nurse", department: "L&D", canWorkInOt: true, canStatCall: true, shiftNote: "Break 1–2 PM" },
  { id: "nr09", employeeCode: "NR-09", name: "Nurse Lakshmi V", category: "nurse", role: "Night Supervisor", department: "L&D", canWorkInOt: true, canStatCall: true },

  // —— Midwives (4) ——
  { id: "mw01", employeeCode: "MW-01", name: "Midwife Elena Costa", category: "midwife", role: "Senior Midwife", department: "L&D", canWorkInOt: false, canStatCall: true },
  { id: "mw02", employeeCode: "MW-02", name: "Midwife Grace D'Souza", category: "midwife", role: "Midwife", department: "L&D", canWorkInOt: false, canStatCall: true },
  { id: "mw03", employeeCode: "MW-03", name: "Midwife Fatima Khan", category: "midwife", role: "Midwife", department: "L&D", canWorkInOt: false, canStatCall: true },
  { id: "mw04", employeeCode: "MW-04", name: "Midwife Helen Joseph", category: "midwife", role: "Midwife", department: "L&D", canWorkInOt: false, canStatCall: true },

  // —— OT technicians (3) ——
  { id: "ot01", employeeCode: "OT-01", name: "Rajesh Patil", category: "ot_technician", role: "OT Technician", department: "OT", canWorkInOt: true, canStatCall: false },
  { id: "ot02", employeeCode: "OT-02", name: "Suresh Gowda", category: "ot_technician", role: "OT Technician", department: "OT", canWorkInOt: true, canStatCall: false },
  { id: "ot03", employeeCode: "OT-03", name: "Manoj Nair", category: "ot_technician", role: "OT Technician", department: "OT", canWorkInOt: true, canStatCall: false, shiftNote: "On break" },

  // —— Laboratory (2) ——
  { id: "lb01", employeeCode: "LAB-01", name: "Meena Krishnamurthy", category: "laboratory", role: "Lab In-charge", department: "Laboratory", canWorkInOt: false, canStatCall: false },
  { id: "lb02", employeeCode: "LAB-02", name: "Arun Pillai", category: "laboratory", role: "Lab Technician", department: "Laboratory", canWorkInOt: false, canStatCall: false },

  // —— Ultrasound (2) ——
  { id: "us01", employeeCode: "USG-01", name: "Sonographer Deepa S", category: "ultrasound", role: "Lead Sonographer", department: "Ultrasound", canWorkInOt: false, canStatCall: false },
  { id: "us02", employeeCode: "USG-02", name: "Sonographer Nisha R", category: "ultrasound", role: "Sonographer", department: "Ultrasound", canWorkInOt: false, canStatCall: false },

  // —— Transport (4) ——
  { id: "tr01", employeeCode: "TR-01", name: "Suresh Kumar", category: "transport", role: "Lift / Shifting", department: "Facility", canWorkInOt: false, canStatCall: false, transportType: "liftman" },
  { id: "tr02", employeeCode: "TR-02", name: "Ravi Shankar", category: "transport", role: "Lift / Shifting", department: "Facility", canWorkInOt: false, canStatCall: false, transportType: "liftman" },
  { id: "tr03", employeeCode: "TR-03", name: "Amit Patel", category: "transport", role: "Wheelchair Attendant", department: "Facility", canWorkInOt: false, canStatCall: false, transportType: "wheelchair" },
  { id: "tr04", employeeCode: "TR-04", name: "Vijay More", category: "transport", role: "Wheelchair Attendant", department: "Facility", canWorkInOt: false, canStatCall: false, transportType: "wheelchair" },
];

export const OT_PROCEDURES = [
  "Cesarean Section (LSCS)",
  "Emergency LSCS",
  "Normal Vaginal Delivery (assisted)",
  "Ectopic pregnancy surgery",
  "Hysterectomy",
  "D&C / Evacuation",
  "Tubal ligation",
  "Cervical cerclage",
  "Ovarian cystectomy",
  "Manual removal of placenta",
] as const;

export const OR_IDS = ["or1", "or2", "or3"] as const;

export const staffById = Object.fromEntries(hospitalRoster.map((s) => [s.id, s])) as Record<
  string,
  HospitalStaff
>;

export function staffName(id: string): string {
  return staffById[id]?.name ?? id;
}
