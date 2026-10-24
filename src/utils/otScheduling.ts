import type {
  HospitalStaff,
  OperatingRoom,
  OtBooking,
  StaffAvailability,
  StaffMember,
} from "../types";
import { staffById, staffName } from "../data/hospitalStaff";

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a0 = timeToMinutes(startA);
  const a1 = timeToMinutes(endA);
  const b0 = timeToMinutes(startB);
  const b1 = timeToMinutes(endB);
  return a0 < b1 && b0 < a1;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Demo "current" time for scheduling conflicts — afternoon shift. */
export function demoNowTime(): string {
  return "11:30";
}

export function bookingStaffIds(b: OtBooking): string[] {
  return [
    b.leadSurgeonId,
    b.anesthetistId,
    b.scrubNurseId,
    b.circulatorNurseId,
    b.neonatologistId,
    b.otTechnicianId,
  ].filter((id): id is string => Boolean(id));
}

export function getStaffAvailability(
  staffId: string,
  bookings: OtBooking[],
  nowTime = demoNowTime(),
  date = todayIso()
): { availability: StaffAvailability; detail: string; orId?: string } {
  const person = staffById[staffId];
  if (person?.shiftNote?.toLowerCase().includes("break")) {
    return { availability: "on_break", detail: person.shiftNote };
  }
  if (person?.shiftNote?.toLowerCase().includes("off")) {
    return { availability: "off_duty", detail: person.shiftNote };
  }

  const today = bookings.filter(
    (b) => b.date === date && b.status !== "cancelled" && bookingStaffIds(b).includes(staffId)
  );

  const inProgress = today.find((b) => b.status === "in_progress");
  if (inProgress) {
    return {
      availability: "in_ot",
      detail: `In ${inProgress.orId.toUpperCase().replace("OR", "OR ")}`,
      orId: inProgress.orId,
    };
  }

  const nowMins = timeToMinutes(nowTime);
  const activeNow = today.find(
    (b) =>
      b.status === "scheduled" &&
      timeToMinutes(b.startTime) <= nowMins &&
      nowMins < timeToMinutes(b.endTime)
  );
  if (activeNow) {
    return {
      availability: "in_ot",
      detail: `In ${activeNow.orId.toUpperCase().replace("OR", "OR ")}`,
      orId: activeNow.orId,
    };
  }

  const upcoming = today.find(
    (b) => b.status === "scheduled" && timeToMinutes(b.startTime) > nowMins
  );
  if (upcoming) {
    return {
      availability: "scheduled",
      detail: `${upcoming.orId.toUpperCase()} ${upcoming.startTime}`,
      orId: upcoming.orId,
    };
  }

  return { availability: "available", detail: "Available" };
}

export function isStaffFreeForSlot(
  staffId: string,
  _orId: string,
  date: string,
  startTime: string,
  endTime: string,
  bookings: OtBooking[],
  excludeBookingId?: string
): boolean {
  const relevant = bookings.filter(
    (b) =>
      b.id !== excludeBookingId &&
      b.date === date &&
      b.status !== "cancelled" &&
      bookingStaffIds(b).includes(staffId)
  );
  return !relevant.some((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
}

export function isOrFreeForSlot(
  orId: string,
  date: string,
  startTime: string,
  endTime: string,
  bookings: OtBooking[],
  excludeBookingId?: string
): boolean {
  const relevant = bookings.filter(
    (b) =>
      b.id !== excludeBookingId &&
      b.orId === orId &&
      b.date === date &&
      b.status !== "cancelled"
  );
  return !relevant.some((b) => rangesOverlap(startTime, endTime, b.startTime, b.endTime));
}

export function buildOperatingRooms(
  bookings: OtBooking[],
  date = todayIso()
): OperatingRoom[] {
  const orNames: Record<string, string> = { or1: "OR 1", or2: "OR 2", or3: "OR 3" };
  const today = bookings.filter((b) => b.date === date && b.status !== "cancelled");

  return (["or1", "or2", "or3"] as const).map((id) => {
    const inProgress = today.find((b) => b.orId === id && b.status === "in_progress");
    if (inProgress) {
      return {
        id,
        name: orNames[id],
        status: "in_use" as const,
        procedure: inProgress.procedure,
        doctor: staffName(inProgress.leadSurgeonId),
        startedAt: inProgress.startTime,
        endsAt: inProgress.endTime,
      };
    }

    const next = today
      .filter((b) => b.orId === id && b.status === "scheduled")
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];

    if (next) {
      const now = timeToMinutes(demoNowTime());
      if (timeToMinutes(next.startTime) > now) {
        return {
          id,
          name: orNames[id],
          status: "scheduled" as const,
          procedure: next.procedure,
          doctor: staffName(next.leadSurgeonId),
          startedAt: next.startTime,
          endsAt: next.endTime,
          nextBookingId: next.id,
        };
      }
    }

    return { id, name: orNames[id], status: "available" as const };
  });
}

export function rosterToStaffMembers(
  roster: HospitalStaff[],
  bookings: OtBooking[]
): StaffMember[] {
  return roster.map((s) => {
    const { availability, detail, orId } = getStaffAvailability(s.id, bookings);
    const tone =
      availability === "available"
        ? "success"
        : availability === "on_break" || availability === "off_duty"
          ? "info"
          : "warning";

    return {
      id: s.id,
      name: s.name,
      role: s.role,
      status: detail,
      statusTone: tone,
      canStatCall: s.canStatCall,
      transportType: s.transportType,
      category: s.category,
      availability,
      assignedOrId: orId,
    };
  });
}

export const CATEGORY_LABELS: Record<string, string> = {
  consultant: "Consultants",
  assistant_doctor: "Assistant doctors",
  anesthetist: "Anesthetists",
  neonatologist: "Neonatologists",
  nurse: "Nurses",
  midwife: "Midwives",
  ot_technician: "OT technicians",
  laboratory: "Laboratory",
  ultrasound: "Ultrasound",
  transport: "Transport",
};
