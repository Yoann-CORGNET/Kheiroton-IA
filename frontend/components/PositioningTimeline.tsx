"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PositionSnapshot } from "@/lib/api";

interface PositioningTimelineProps {
  history: PositionSnapshot[];
  color: string;
}

export default function PositioningTimeline({ history, color }: PositioningTimelineProps) {
  const sorted = [...history].sort((a, b) => a.year - b.year);

  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Evolution ideologique
      </h3>
      <div className="mb-3 flex items-center gap-6 text-sm text-zinc-400">
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5"
            style={{ backgroundColor: color }}
          />
          lrgen (Gauche-Droite)
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-5 border-t-2 border-dashed"
            style={{ borderColor: color }}
          />
          galtan (GAL-TAN)
        </span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={sorted}>
          <XAxis
            dataKey="year"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={{ stroke: "#3f3f46" }}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            axisLine={{ stroke: "#3f3f46" }}
            tickLine={{ stroke: "#3f3f46" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#f4f4f5",
            }}
          />
          <Line
            type="monotone"
            dataKey="lrgen"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            name="lrgen"
          />
          <Line
            type="monotone"
            dataKey="galtan"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ fill: color, r: 3 }}
            name="galtan"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
