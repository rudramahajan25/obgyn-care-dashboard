import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { patientHistories } from "../data/patientHistory";
import { hospitalRoster } from "../data/hospitalStaff";
import { createSeedOtBookings } from "../data/otScheduleSeed";
import { authenticateUser } from "../data/userAccounts";
import { patients as initialPatients } from "../data/mockData";
import type {
  ActiveAlarm,
  AlarmTargetRole,
  FacilityCall,
  FacilityCallType,
  LabourChecklistState,
  PatientHistory,
  ShiftingEquipment,
  StatCall,
  TransportPriority,
  TransportRequest,
  TransportStatus,
  TransportType,
  UltrasoundOrder,
  OperatingRoom,
  OtBooking,
  OtBookingStatus,
  StaffMember,
  UltrasoundWorkflowStatus,
  UserProfile,
  UserRole,
} from "../types";
import { useLivePatients } from "../hooks/useLivePatients";
import type { OtCasePriority, Patient } from "../types";
import {
  buildOperatingRooms,
  isOrFreeForSlot,
  isStaffFreeForSlot,
  rosterToStaffMembers,
  timeToMinutes,
} from "../utils/otScheduling";

/** Map facility STAT target to login roles that should ring. */
function statCallRecipientRoles(staffRole: string): AlarmTargetRole[] {
  const r = staffRole.toLowerCase();
  if (r.includes("nurse") || r.includes("midwife")) return ["nurse", "midwife"];
  if (r.includes("neonatologist") || r.includes("anesthetist") || r.includes("doctor"))
    return ["doctor", "assistant_doctor"];
  if (r.includes("lift") || r.includes("transport")) return ["liftman"];
  if (r.includes("wheelchair")) return ["wheelchair"];
  return ["doctor", "assistant_doctor"];
}

const STORAGE_KEY = "obgyn-care-state-v3";

interface PersistedState {
  transportRequests: TransportRequest[];
  statCalls: StatCall[];
  facilityCalls: FacilityCall[];
  ultrasoundOrders: UltrasoundOrder[];
  otBookings: OtBooking[];
  checklists: Record<string, LabourChecklistState>;
  alarms: ActiveAlarm[];
}

export type ScheduleOtInput = {
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
  notes?: string;
};

const defaultChecklist = (): LabourChecklistState => ({
  multiparameter: { bp: false, pulse: false, ecg: false, spo2: false },
  ctg: { uterineContraction: false, fetalHeartRate: false },
});

interface AppContextValue {
  user: UserProfile | null;
  loginWithCredentials: (username: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  patients: Patient[];
  liveRevision: number;
  isLiveMonitoring: boolean;
  getPatientHistory: (patientId: string) => PatientHistory | null;
  transportRequests: TransportRequest[];
  statCalls: StatCall[];
  facilityCalls: FacilityCall[];
  ultrasoundOrders: UltrasoundOrder[];
  getChecklist: (patientId: string) => LabourChecklistState;
  updateChecklist: (patientId: string, checklist: LabourChecklistState) => void;
  requestTransport: (params: {
    type: TransportType;
    equipment: ShiftingEquipment;
    patientId: string;
    fromLocation: string;
    toLocation: string;
    priority: TransportPriority;
    notes?: string;
  }) => void;
  updateTransportStatus: (id: string, status: TransportStatus) => void;
  callOnDutyDoctor: (patientId: string, priority?: TransportPriority) => void;
  callLaboratory: (patientId: string, testsRequested: string[], priority?: TransportPriority) => void;
  requestUltrasound: (patientId: string) => void;
  updateUltrasoundStatus: (orderId: string, status: UltrasoundWorkflowStatus, reportFileName?: string) => void;
  remindUltrasound: (orderId: string) => void;
  /** Pending order only (not yet Ready) — for reminders. */
  getUltrasoundOrder: (patientId: string) => UltrasoundOrder | undefined;
  /** Latest request for this patient (any status), after nurse taps Request. */
  getPatientUltrasoundOrder: (patientId: string) => UltrasoundOrder | undefined;
  acknowledgeFacilityCall: (id: string) => void;
  completeFacilityCall: (id: string) => void;
  triggerStatCall: (staffId: string, staffRole: string) => void;
  alarms: ActiveAlarm[];
  dismissAlarm: (id: string) => void;
  otBookings: OtBooking[];
  operatingRooms: OperatingRoom[];
  staffMembers: StaffMember[];
  hospitalRoster: typeof hospitalRoster;
  scheduleOtBooking: (input: ScheduleOtInput) => { ok: boolean; error?: string };
  updateOtBookingStatus: (id: string, status: OtBookingStatus) => void;
  cancelOtBooking: (id: string) => void;
  toast: string | null;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      return { ...parsed, alarms: parsed.alarms ?? [] };
    }
    const legacy = localStorage.getItem("obgyn-care-state-v1");
    if (legacy) {
      const old = JSON.parse(legacy) as { transportRequests?: TransportRequest[]; statCalls?: StatCall[] };
      return {
        transportRequests: (old.transportRequests ?? []).map((r) => ({
          ...r,
          equipment: "without_equipment" as ShiftingEquipment,
        })),
        statCalls: (old.statCalls ?? []).map((s) => ({ ...s, priority: "stat" as TransportPriority })),
        facilityCalls: [],
        ultrasoundOrders: [],
        otBookings: createSeedOtBookings(),
        checklists: {},
        alarms: [],
      };
    }
    const v2 = localStorage.getItem("obgyn-care-state-v2");
    if (v2) {
      const old = JSON.parse(v2) as PersistedState;
      return { ...old, otBookings: old.otBookings ?? createSeedOtBookings(), alarms: old.alarms ?? [] };
    }
  } catch {
    /* ignore */
  }
  return {
    transportRequests: [],
    statCalls: [],
    facilityCalls: [],
    ultrasoundOrders: [],
    otBookings: createSeedOtBookings(),
    checklists: {},
    alarms: [],
  };
}

function savePersisted(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Only the transport role being called — not nurses who initiated the request. */
function targetsForTransport(type: TransportType): AlarmTargetRole[] {
  return [type];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const clinicalRoles: UserRole[] = [
    "doctor",
    "assistant_doctor",
    "nurse",
    "midwife",
  ];
  const isLiveMonitoring = !!user && clinicalRoles.includes(user.role);
  const { patients, liveRevision } = useLivePatients(isLiveMonitoring);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0].id);
  const [transportRequests, setTransportRequests] = useState<TransportRequest[]>([]);
  const [statCalls, setStatCalls] = useState<StatCall[]>([]);
  const [facilityCalls, setFacilityCalls] = useState<FacilityCall[]>([]);
  const [ultrasoundOrders, setUltrasoundOrders] = useState<UltrasoundOrder[]>([]);
  const [checklists, setChecklists] = useState<Record<string, LabourChecklistState>>({});
  const [otBookings, setOtBookings] = useState<OtBooking[]>(createSeedOtBookings);
  const [alarms, setAlarms] = useState<ActiveAlarm[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPersisted();
    setTransportRequests(p.transportRequests);
    setStatCalls(p.statCalls);
    setFacilityCalls(p.facilityCalls);
    setUltrasoundOrders(p.ultrasoundOrders ?? []);
    setOtBookings(p.otBookings?.length ? p.otBookings : createSeedOtBookings());
    setChecklists(p.checklists);
    setAlarms(p.alarms ?? []);
  }, []);

  useEffect(() => {
    savePersisted({
      transportRequests,
      statCalls,
      facilityCalls,
      ultrasoundOrders,
      otBookings,
      checklists,
      alarms,
    });
  }, [transportRequests, statCalls, facilityCalls, ultrasoundOrders, otBookings, checklists, alarms]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const p = JSON.parse(e.newValue) as PersistedState;
          setTransportRequests((prev) => JSON.stringify(prev) !== JSON.stringify(p.transportRequests) ? p.transportRequests : prev);
          setStatCalls((prev) => JSON.stringify(prev) !== JSON.stringify(p.statCalls) ? p.statCalls : prev);
          setFacilityCalls((prev) => JSON.stringify(prev) !== JSON.stringify(p.facilityCalls) ? p.facilityCalls : prev);
          setUltrasoundOrders((prev) => JSON.stringify(prev) !== JSON.stringify(p.ultrasoundOrders) ? (p.ultrasoundOrders ?? []) : prev);
          setOtBookings((prev) => JSON.stringify(prev) !== JSON.stringify(p.otBookings) ? p.otBookings : prev);
          setChecklists((prev) => JSON.stringify(prev) !== JSON.stringify(p.checklists) ? p.checklists : prev);
          setAlarms((prev) => JSON.stringify(prev) !== JSON.stringify(p.alarms) ? (p.alarms ?? []) : prev);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const operatingRooms = useMemo(() => buildOperatingRooms(otBookings), [otBookings]);
  const staffMembers = useMemo(
    () => rosterToStaffMembers(hospitalRoster, otBookings),
    [otBookings]
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const pushAlarm = useCallback(
    (alarm: Omit<ActiveAlarm, "id" | "createdAt" | "acknowledged">) => {
      const entry: ActiveAlarm = {
        ...alarm,
        id: `al-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
        acknowledged: false,
      };
      setAlarms((prev) => [entry, ...prev].slice(0, 20));
      // Sound plays only on recipient dashboards — see AlarmBanner.tsx
    },
    []
  );

  const dismissAlarm = useCallback((id: string) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const loginWithCredentials = useCallback((username: string, password: string) => {
    const account = authenticateUser(username, password);
    if (!account) {
      return { ok: false, error: "Invalid username or password. Check docs/Demo_User_Credentials.docx" };
    }
    setUser(account.profile);
    return { ok: true };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const getPatientHistory = useCallback(
    (patientId: string) => patientHistories[patientId] ?? null,
    []
  );

  const getChecklist = useCallback(
    (patientId: string) => checklists[patientId] ?? defaultChecklist(),
    [checklists]
  );

  const updateChecklist = useCallback((patientId: string, checklist: LabourChecklistState) => {
    setChecklists((prev) => ({ ...prev, [patientId]: checklist }));
  }, []);

  const requestTransport = useCallback(
    (params: {
      type: TransportType;
      equipment: ShiftingEquipment;
      patientId: string;
      fromLocation: string;
      toLocation: string;
      priority: TransportPriority;
      notes?: string;
    }) => {
      if (!user) return;
      const patient = patients.find((p) => p.id === params.patientId);
      if (!patient) return;

      const equipmentNote =
        params.equipment === "stretcher"
          ? "With stretcher"
          : params.equipment === "wheelchair"
            ? "Wheelchair required"
            : "Without stretcher/wheelchair";

      const request: TransportRequest = {
        id: `tr-${Date.now()}`,
        type: params.type,
        equipment: params.equipment,
        priority: params.priority,
        status: "pending",
        patientId: patient.id,
        patientName: patient.fullName ?? patient.name,
        bed: patient.bed,
        fromLocation: params.fromLocation,
        toLocation: params.toLocation,
        requestedBy: user.name,
        requestedByRole: user.role,
        notes: [equipmentNote, params.notes].filter(Boolean).join(" · "),
        createdAt: new Date().toISOString(),
      };

      setTransportRequests((prev) => [request, ...prev]);
      pushAlarm({
        title: params.priority === "stat" ? "STAT — Shifting" : "Shifting requested",
        message: `${patient.name} (${patient.bed}): ${equipmentNote} → ${params.toLocation}`,
        priority: params.priority,
        targetRoles: targetsForTransport(params.type),
      });
      showToast(`Shifting boy notified — ${equipmentNote}`);
    },
    [user, patients, showToast, pushAlarm]
  );

  const updateTransportStatus = useCallback((id: string, status: TransportStatus) => {
    setTransportRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        return {
          ...r,
          status,
          acceptedAt:
            status === "accepted" || status === "in_transit" ? r.acceptedAt ?? now : r.acceptedAt,
          completedAt: status === "completed" ? now : r.completedAt,
        };
      })
    );
  }, []);

  const addFacilityCall = useCallback(
    (
      type: FacilityCallType,
      patientId: string,
      opts: { priority?: TransportPriority; notes?: string; testsRequested?: string[] }
    ) => {
      if (!user) return;
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;
      const priority = opts.priority ?? (type === "on_duty_doctor" ? "stat" : "urgent");

      const call: FacilityCall = {
        id: `fc-${Date.now()}`,
        type,
        priority,
        status: "pending",
        patientId: patient.id,
        patientName: patient.fullName ?? patient.name,
        bed: patient.bed,
        requestedBy: user.name,
        requestedByRole: user.role,
        notes: opts.notes,
        testsRequested: opts.testsRequested,
        createdAt: new Date().toISOString(),
      };

      setFacilityCalls((prev) => [call, ...prev]);

      const targetRoles: AlarmTargetRole[] =
        type === "laboratory"
          ? ["laboratory"]
          : type === "ultrasound_request"
            ? ["ultrasound"]
            : ["doctor", "assistant_doctor"];

      const titles: Record<FacilityCallType, string> = {
        laboratory: priority === "stat" ? "STAT — Lab call" : "Laboratory called",
        on_duty_doctor: "STAT — On-duty doctor",
        ultrasound_request: "Ultrasound requested",
      };

      pushAlarm({
        title: titles[type],
        message: `${patient.name} (${patient.bed}) — ${opts.testsRequested?.join(", ") ?? opts.notes ?? "See LR dashboard"}`,
        priority,
        targetRoles,
      });
      showToast(titles[type] + ` for ${patient.name}`);
    },
    [user, patients, showToast, pushAlarm]
  );

  const callOnDutyDoctor = useCallback(
    (patientId: string, priority: TransportPriority = "stat") => {
      addFacilityCall("on_duty_doctor", patientId, { priority, notes: "Labour room — immediate review" });
      const patient = patients.find((p) => p.id === patientId);
      setStatCalls((prev) => [
        {
          id: `sc-${Date.now()}`,
          staffId: "duty",
          staffRole: "On-duty Obstetrician",
          patientId,
          patientName: patient?.name ?? "",
          calledBy: user?.name ?? "",
          createdAt: new Date().toISOString(),
          priority,
        },
        ...prev,
      ]);
    },
    [addFacilityCall, user, patients]
  );

  const callLaboratory = useCallback(
    (patientId: string, testsRequested: string[], priority: TransportPriority = "urgent") => {
      addFacilityCall("laboratory", patientId, { priority, testsRequested });
    },
    [addFacilityCall]
  );

  const requestUltrasound = useCallback(
    (patientId: string) => {
      if (!user) return;
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;

      const existing = ultrasoundOrders.find(
        (o) => o.patientId === patientId && o.status !== "ready"
      );
      if (existing) {
        showToast("Ultrasound already requested for this patient");
        return;
      }

      const order: UltrasoundOrder = {
        id: `us-${Date.now()}`,
        patientId,
        patientName: patient.fullName ?? patient.name,
        bed: patient.bed,
        status: "yet_to_record",
        requestedBy: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUltrasoundOrders((prev) => [order, ...prev]);
      addFacilityCall("ultrasound_request", patientId, { priority: "urgent" });
    },
    [user, patients, ultrasoundOrders, addFacilityCall, showToast]
  );

  const updateUltrasoundStatus = useCallback(
    (orderId: string, status: UltrasoundWorkflowStatus, reportFileName?: string) => {
      setUltrasoundOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status,
                reportFileName: reportFileName ?? o.reportFileName,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
      if (status === "ready") {
        pushAlarm({
          title: "Ultrasound report ready",
          message: `Report available — ${reportFileName ?? "uploaded"}`,
          priority: "routine",
          targetRoles: ["nurse", "midwife", "doctor"],
        });
      }
    },
    [pushAlarm]
  );

  const remindUltrasound = useCallback(
    (orderId: string) => {
      const order = ultrasoundOrders.find((o) => o.id === orderId);
      if (!order || order.status === "ready") return;
      pushAlarm({
        title: "Reminder — Ultrasound pending",
        message: `${order.patientName} (${order.bed}) — status: ${order.status.replace(/_/g, " ")}`,
        priority: "urgent",
        targetRoles: ["ultrasound"],
      });
      showToast("Reminder sent to ultrasound team");
    },
    [ultrasoundOrders, pushAlarm, showToast]
  );

  const getPatientUltrasoundOrder = useCallback(
    (patientId: string) =>
      [...ultrasoundOrders]
        .filter((o) => o.patientId === patientId)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0],
    [ultrasoundOrders]
  );

  const getUltrasoundOrder = useCallback(
    (patientId: string) => {
      const order = getPatientUltrasoundOrder(patientId);
      return order && order.status !== "ready" ? order : undefined;
    },
    [getPatientUltrasoundOrder]
  );

  const acknowledgeFacilityCall = useCallback((id: string) => {
    setFacilityCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "acknowledged" as const } : c))
    );
  }, []);

  const completeFacilityCall = useCallback((id: string) => {
    setFacilityCalls((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "completed" as const } : c))
    );
  }, []);

  const scheduleOtBooking = useCallback(
    (input: ScheduleOtInput): { ok: boolean; error?: string } => {
      if (!user) return { ok: false, error: "Not signed in" };
      if (timeToMinutes(input.endTime) <= timeToMinutes(input.startTime)) {
        return { ok: false, error: "End time must be after start time" };
      }
      if (
        !isOrFreeForSlot(
          input.orId,
          input.date,
          input.startTime,
          input.endTime,
          otBookings
        )
      ) {
        return { ok: false, error: "Operating room is not free for this slot" };
      }

      const staffIds = [
        input.leadSurgeonId,
        input.anesthetistId,
        input.scrubNurseId,
        input.circulatorNurseId,
        input.neonatologistId,
        input.otTechnicianId,
      ].filter((id): id is string => Boolean(id));

      for (const sid of staffIds) {
        if (
          !isStaffFreeForSlot(
            sid,
            input.orId,
            input.date,
            input.startTime,
            input.endTime,
            otBookings
          )
        ) {
          const name = hospitalRoster.find((s) => s.id === sid)?.name ?? sid;
          return { ok: false, error: `${name} is not available for this slot` };
        }
      }

      const booking: OtBooking = {
        ...input,
        id: `otb-${Date.now()}`,
        status: "scheduled",
        createdBy: user.name,
      };
      setOtBookings((prev) => [...prev, booking].sort((a, b) => a.startTime.localeCompare(b.startTime)));
      showToast(`Scheduled ${input.procedure} in ${input.orId.toUpperCase()}`);
      return { ok: true };
    },
    [user, otBookings, showToast]
  );

  const updateOtBookingStatus = useCallback((id: string, status: OtBookingStatus) => {
    setOtBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    showToast(`Case marked ${status.replace("_", " ")}`);
  }, [showToast]);

  const cancelOtBooking = useCallback((id: string) => {
    setOtBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "cancelled" as const } : b))
    );
    showToast("OT booking cancelled");
  }, [showToast]);

  const triggerStatCall = useCallback(
    (staffId: string, staffRole: string) => {
      if (!user) return;
      const patient = patients.find((p) => p.id === selectedPatientId);
      const call: StatCall = {
        id: `sc-${Date.now()}`,
        staffId,
        staffRole,
        patientId: patient?.id ?? "",
        patientName: patient?.name ?? "Unknown",
        calledBy: user.name,
        createdAt: new Date().toISOString(),
        priority: "stat",
      };
      setStatCalls((prev) => [call, ...prev]);
      pushAlarm({
        title: "STAT call",
        message: `${staffRole} — ${patient?.name ?? "patient"} (${patient?.bed ?? ""})`,
        priority: "stat",
        targetRoles: statCallRecipientRoles(staffRole),
      });
      showToast(`STAT call sent to ${staffRole}`);
    },
    [user, patients, selectedPatientId, showToast, pushAlarm]
  );

  const value = useMemo(
    () => ({
      user,
      loginWithCredentials,
      logout,
      selectedPatientId,
      setSelectedPatientId,
      patients,
      liveRevision,
      isLiveMonitoring,
      getPatientHistory,
      transportRequests,
      statCalls,
      facilityCalls,
      ultrasoundOrders,
      getChecklist,
      updateChecklist,
      requestTransport,
      updateTransportStatus,
      callOnDutyDoctor,
      callLaboratory,
      requestUltrasound,
      updateUltrasoundStatus,
      remindUltrasound,
      getUltrasoundOrder,
      getPatientUltrasoundOrder,
      acknowledgeFacilityCall,
      completeFacilityCall,
      triggerStatCall,
      otBookings,
      operatingRooms,
      staffMembers,
      hospitalRoster,
      scheduleOtBooking,
      updateOtBookingStatus,
      cancelOtBooking,
      alarms,
      dismissAlarm,
      toast,
      showToast,
    }),
    [
      user,
      loginWithCredentials,
      logout,
      selectedPatientId,
      patients,
      liveRevision,
      isLiveMonitoring,
      getPatientHistory,
      transportRequests,
      statCalls,
      facilityCalls,
      ultrasoundOrders,
      getChecklist,
      updateChecklist,
      requestTransport,
      updateTransportStatus,
      callOnDutyDoctor,
      callLaboratory,
      requestUltrasound,
      updateUltrasoundStatus,
      remindUltrasound,
      getUltrasoundOrder,
      getPatientUltrasoundOrder,
      acknowledgeFacilityCall,
      completeFacilityCall,
      triggerStatCall,
      otBookings,
      operatingRooms,
      staffMembers,
      scheduleOtBooking,
      updateOtBookingStatus,
      cancelOtBooking,
      alarms,
      dismissAlarm,
      toast,
      showToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
