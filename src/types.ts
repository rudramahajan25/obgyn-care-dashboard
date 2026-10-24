export type UserRole =
  | "doctor"
  | "assistant_doctor"
  | "nurse"
  | "midwife"
  | "liftman"
  | "wheelchair"
  | "laboratory"
  | "ultrasound";

export type TransportType = "liftman" | "wheelchair";

export type ShiftingEquipment = "stretcher" | "wheelchair" | "without_equipment";

export type TransportPriority = "routine" | "urgent" | "stat";

export type TransportStatus = "pending" | "accepted" | "in_transit" | "completed" | "cancelled";

export type FacilityCallType = "laboratory" | "on_duty_doctor" | "ultrasound_request";

export type FacilityCallStatus = "pending" | "acknowledged" | "completed";

export type UltrasoundWorkflowStatus =
  | "yet_to_record"
  | "waiting_for_patient"
  | "under_review"
  | "ready";

export type AlarmTargetRole = UserRole | "all_clinical";

export type StaffCategory =
  | "consultant"
  | "assistant_doctor"
  | "anesthetist"
  | "neonatologist"
  | "nurse"
  | "midwife"
  | "ot_technician"
  | "laboratory"
  | "ultrasound"
  | "transport";

export type StaffAvailability = "available" | "in_ot" | "scheduled" | "on_break" | "off_duty";

export type OtBookingStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export type OtCasePriority = "elective" | "urgent" | "emergency";

export type ClinicalPriority = "routine" | "elevated" | "critical";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  avatarInitials: string;
}

export interface Vitals {
  bp: string;
  pulse: number;
  spo2: number;
  respRate: number;
  temp: number;
  fhr: number;
}

export interface CTGPoint {
  time: number;
  fhr: number;
  uc: number;
  fm: number;
}

export interface UltrasoundMeasurement {
  label: string;
  value: string;
  ga: string;
}

export interface Patient {
  id: string;
  bed: string;
  name: string;
  fullName?: string;
  age: number;
  gravida: number;
  para: number;
  gestationalAge: string;
  pregnancyDurationLabel?: string;
  edd: string;
  bloodGroup: string;
  allergies: string;
  status: string;
  statusSince: string;
  hasAlert: boolean;
  clinicalPriority?: ClinicalPriority;
  lastUpdate: string;
  registeredAtFacility?: boolean;
  vitals: Vitals;
  ctg: {
    baseline: string;
    variability: string;
    decelerations: string;
    points: CTGPoint[];
  };
  ultrasound: {
    measurements: UltrasoundMeasurement[];
  };
  currentMedications: string[];
  /** Per vaginal examination on admission to LR. */
  admissionPvFindings: string;
  /** Pelvis assessment — documented for primigravida (para === 0). */
  pelvisAssessment?: string;
}

export interface OpdVisit {
  id: string;
  date: string;
  doctor: string;
  department: string;
  facility: string;
  summary: string;
  diagnosis?: string;
}

export interface LabReport {
  id: string;
  date: string;
  testName: string;
  result: string;
  unit?: string;
  reference?: string;
  facility: string;
}

export interface UltrasoundReport {
  id: string;
  date: string;
  type: string;
  ga: string;
  summary: string;
  fileName?: string;
  dicomUrl?: string;
  facility: string;
}

export interface PatientHistory {
  patientId: string;
  opdVisits: OpdVisit[];
  labReports: LabReport[];
  ultrasoundReports: UltrasoundReport[];
}

export interface LabourChecklistState {
  multiparameter: {
    bp: boolean;
    pulse: boolean;
    ecg: boolean;
    spo2: boolean;
  };
  ctg: {
    uterineContraction: boolean;
    fetalHeartRate: boolean;
  };
}

export interface OperatingRoom {
  id: string;
  name: string;
  status: "available" | "in_use" | "scheduled";
  procedure?: string;
  doctor?: string;
  startedAt?: string;
  endsAt?: string;
  nextBookingId?: string;
}

/** Full hospital roster entry (~40 staff). */
export interface HospitalStaff {
  id: string;
  employeeCode: string;
  name: string;
  category: StaffCategory;
  role: string;
  department: string;
  canWorkInOt: boolean;
  canStatCall: boolean;
  transportType?: TransportType;
  /** Static shift note for demo (e.g. night off). */
  shiftNote?: string;
}

export interface StaffMember {
  id: string;
  role: string;
  name: string;
  status: string;
  statusTone: "success" | "warning" | "info" | "muted";
  canStatCall: boolean;
  transportType?: TransportType;
  category?: StaffCategory;
  availability?: StaffAvailability;
  assignedOrId?: string;
}

export interface OtBooking {
  id: string;
  orId: string;
  patientId?: string;
  patientName: string;
  bed?: string;
  procedure: string;
  date: string;
  startTime: string;
  endTime: string;
  leadSurgeonId: string;
  anesthetistId: string;
  scrubNurseId?: string;
  circulatorNurseId?: string;
  neonatologistId?: string;
  otTechnicianId?: string;
  priority: OtCasePriority;
  status: OtBookingStatus;
  notes?: string;
  createdBy: string;
}

export interface TransportRequest {
  id: string;
  type: TransportType;
  equipment: ShiftingEquipment;
  priority: TransportPriority;
  status: TransportStatus;
  patientId: string;
  patientName: string;
  bed: string;
  fromLocation: string;
  toLocation: string;
  requestedBy: string;
  requestedByRole: UserRole;
  notes?: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export interface FacilityCall {
  id: string;
  type: FacilityCallType;
  priority: TransportPriority;
  status: FacilityCallStatus;
  patientId: string;
  patientName: string;
  bed: string;
  requestedBy: string;
  requestedByRole: UserRole;
  notes?: string;
  testsRequested?: string[];
  createdAt: string;
}

export interface UltrasoundOrder {
  id: string;
  patientId: string;
  patientName: string;
  bed: string;
  status: UltrasoundWorkflowStatus;
  requestedBy: string;
  reportFileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StatCall {
  id: string;
  staffId: string;
  staffRole: string;
  patientId: string;
  patientName: string;
  calledBy: string;
  createdAt: string;
  priority: TransportPriority;
}

export interface ActiveAlarm {
  id: string;
  title: string;
  message: string;
  priority: TransportPriority;
  targetRoles: AlarmTargetRole[];
  createdAt: string;
  acknowledged: boolean;
}
