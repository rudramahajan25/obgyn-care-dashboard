import { AlertTriangle, Bell, X, Zap } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { useApp } from "../../context/AppContext";
import { playAlarmTone } from "../../utils/alarmSound";
import type { TransportPriority, UserRole } from "../../types";

function roleMatchesTarget(role: UserRole, targets: (UserRole | "all_clinical")[]): boolean {
  if (targets.includes(role)) return true;
  if (
    targets.includes("all_clinical") &&
    ["nurse", "midwife", "doctor", "assistant_doctor"].includes(role)
  )
    return true;
  return false;
}

function priorityRank(p: TransportPriority): number {
  return p === "stat" ? 3 : p === "urgent" ? 2 : 1;
}

export function AlarmBanner() {
  const { user, alarms, dismissAlarm } = useApp();
  const heardAlarmIds = useRef<Set<string>>(new Set());

  const relevant = useMemo(() => {
    if (!user) return [];
    return alarms.filter(
      (a) => !a.acknowledged && roleMatchesTarget(user.role, a.targetRoles)
    );
  }, [user, alarms]);

  useEffect(() => {
    if (!user) return;

    const newlyArrived = relevant.filter((a) => !heardAlarmIds.current.has(a.id));
    if (newlyArrived.length === 0) return;

    newlyArrived.forEach((a) => heardAlarmIds.current.add(a.id));

    const top = newlyArrived.reduce((best, a) =>
      priorityRank(a.priority) > priorityRank(best.priority) ? a : best
    );

    if (top.priority === "stat" || top.priority === "urgent") {
      playAlarmTone(top.priority);
    }
  }, [relevant, user]);

  useEffect(() => {
    if (!user) heardAlarmIds.current.clear();
  }, [user]);

  if (!user || relevant.length === 0) return null;

  return (
    <div className="shrink-0 space-y-1 border-b border-red-200 bg-red-50 px-4 py-2">
      {relevant.slice(0, 3).map((alarm) => (
        <div
          key={alarm.id}
          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
            alarm.priority === "stat"
              ? "animate-pulse bg-red-600 text-white"
              : alarm.priority === "urgent"
                ? "bg-amber-500 text-white"
                : "bg-white text-gray-900 ring-1 ring-red-200"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {alarm.priority === "stat" ? (
              <Zap className="h-4 w-4 shrink-0" />
            ) : alarm.priority === "urgent" ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Bell className="h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{alarm.title}</p>
              <p className="truncate text-xs opacity-90">{alarm.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissAlarm(alarm.id)}
            className="shrink-0 rounded p-1 hover:bg-black/10"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
