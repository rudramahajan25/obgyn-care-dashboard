import { Radio } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Patient } from "../../types";

export function CTGCard({ ctg, live = false }: { ctg: Patient["ctg"]; live?: boolean }) {
  if (!ctg.points.length) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900">CTG monitoring</h3>
        <p className="mt-4 text-sm text-muted">No active CTG — postpartum or not indicated.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">CTG monitoring</h3>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1 text-xs font-medium text-green-700">
              <Radio className="h-3 w-3 animate-pulse" />
              Streaming
            </span>
          )}
          <button type="button" className="text-xs font-medium text-brand-600 hover:underline">
            View full CTG
          </button>
        </div>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={ctg.points} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf3" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }} unit=" min" />
            <YAxis yAxisId="fhr" domain={[80, 200]} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="uc" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} hide />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              yAxisId="fhr"
              type="monotone"
              dataKey="fhr"
              name="FHR"
              stroke="#5b3fd4"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Line
              yAxisId="uc"
              type="monotone"
              dataKey="uc"
              name="UC"
              stroke="#16a34a"
              dot={false}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Line
              yAxisId="fhr"
              type="monotone"
              dataKey="fm"
              name="FM"
              stroke="#2563eb"
              dot={false}
              strokeWidth={1}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-lg bg-surface p-2">
          <p className="text-muted">Baseline</p>
          <p className="font-semibold tabular-nums text-gray-900">{ctg.baseline}</p>
        </div>
        <div className="rounded-lg bg-surface p-2">
          <p className="text-muted">Variability</p>
          <p className="font-semibold text-gray-900">{ctg.variability}</p>
        </div>
        <div className="rounded-lg bg-surface p-2">
          <p className="text-muted">Decelerations</p>
          <p className="font-semibold text-gray-900">{ctg.decelerations}</p>
        </div>
      </div>
    </section>
  );
}
