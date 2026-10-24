import { Activity, Droplets, Heart, Radio, Thermometer, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Vitals } from "../../types";

const items = [
  { key: "bp", label: "BP", unit: "mmHg", icon: Activity, color: "text-red-500" },
  { key: "pulse", label: "Pulse", unit: "bpm", icon: Heart, color: "text-red-500" },
  { key: "spo2", label: "SpO₂", unit: "%", icon: Droplets, color: "text-green-500" },
  { key: "respRate", label: "Resp. Rate", unit: "/min", icon: Wind, color: "text-green-500" },
  { key: "temp", label: "Temp.", unit: "°C", icon: Thermometer, color: "text-green-500" },
  { key: "fhr", label: "FHR", unit: "bpm", icon: Heart, color: "text-brand-600" },
] as const;

export function VitalsCard({
  vitals,
  live = false,
  liveRevision = 0,
}: {
  vitals: Vitals;
  live?: boolean;
  liveRevision?: number;
}) {
  const prevRef = useRef(vitals);
  const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    const changed = new Set<string>();
    for (const { key } of items) {
      if (prevRef.current[key] !== vitals[key]) changed.add(key);
    }
    prevRef.current = vitals;
    if (changed.size > 0) {
      setFlashKeys(changed);
      const t = window.setTimeout(() => setFlashKeys(new Set()), 600);
      return () => window.clearTimeout(t);
    }
  }, [vitals, liveRevision]);

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Multiparameter monitoring</h3>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map(({ key, label, unit, icon: Icon, color }) => {
          const value = vitals[key];
          const display =
            key === "bp" ? value : key === "temp" ? (value as number).toFixed(1) : value;
          const flash = flashKeys.has(key);

          return (
            <div
              key={key}
              className={`rounded-xl bg-surface p-3 transition-colors duration-300 ${
                flash ? "ring-2 ring-brand-300 bg-brand-50" : ""
              }`}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-muted">{label}</span>
              </div>
              <p
                className={`text-lg font-bold text-gray-900 tabular-nums ${
                  flash ? "animate-pulse" : ""
                }`}
              >
                {display}
                <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
