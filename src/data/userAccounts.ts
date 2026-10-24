import { roleProfiles } from "./mockData";
import type { UserProfile, UserRole } from "../types";

export interface UserAccount {
  username: string;
  password: string;
  role: UserRole;
  profile: UserProfile;
  department: string;
}

/** Demo login accounts — see docs/Demo_User_Credentials.docx */
export const userAccounts: UserAccount[] = [
  {
    username: "ananya.sharma",
    password: "Doctor@2025",
    role: "doctor",
    profile: roleProfiles.doctor,
    department: "Obstetrics & Gynecology",
  },
  {
    username: "rahul.mehta",
    password: "Resident@2025",
    role: "assistant_doctor",
    profile: roleProfiles.assistant_doctor,
    department: "Obstetrics & Gynecology",
  },
  {
    username: "priya.nair",
    password: "Nurse@2025",
    role: "nurse",
    profile: roleProfiles.nurse,
    department: "Labour & Delivery",
  },
  {
    username: "elena.costa",
    password: "Midwife@2025",
    role: "midwife",
    profile: roleProfiles.midwife,
    department: "Labour Room",
  },
  {
    username: "suresh.kumar",
    password: "Lift@2025",
    role: "liftman",
    profile: roleProfiles.liftman,
    department: "Patient Transport",
  },
  {
    username: "amit.patel",
    password: "Wheelchair@2025",
    role: "wheelchair",
    profile: roleProfiles.wheelchair,
    department: "Patient Transport",
  },
  {
    username: "meena.lab",
    password: "Laboratory@2025",
    role: "laboratory",
    profile: roleProfiles.laboratory,
    department: "Central Laboratory",
  },
  {
    username: "deepa.usg",
    password: "Ultrasound@2025",
    role: "ultrasound",
    profile: roleProfiles.ultrasound,
    department: "Ultrasound Suite",
  },
];

export function authenticateUser(
  username: string,
  password: string
): UserAccount | null {
  const normalizedUser = username.trim().toLowerCase();
  const normalizedPass = password.trim().toLowerCase();
  return (
    userAccounts.find(
      (a) =>
        a.username.toLowerCase() === normalizedUser &&
        (a.password === password.trim() || a.password.toLowerCase() === normalizedPass)
    ) ?? null
  );
}
