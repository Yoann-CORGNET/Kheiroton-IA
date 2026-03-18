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
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[#161616]">
        Évolution idéologique
      </h3>
      <div className="mb-3 flex items-center gap-6 text-sm text-[#666666]">
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
            tick={{ fill: "#666666", fontSize: 12 }}
            axisLine={{ stroke: "#e5e5e5" }}
            tickLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fill: "#666666", fontSize: 12 }}
            axisLine={{ stroke: "#e5e5e5" }}
            tickLine={{ stroke: "#e5e5e5" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "0",
              color: "#161616",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
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
