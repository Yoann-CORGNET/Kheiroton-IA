"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { IdeologicalPosition } from "@/lib/api";

interface PositioningRadarProps {
  positioning: IdeologicalPosition;
  color: string;
}

const AXES = [
  { key: "lrecon", label: "Economique" },
  { key: "galtan", label: "GAL-TAN" },
  { key: "eu_position", label: "Pro-UE" },
  { key: "immigration", label: "Immigration" },
  { key: "environment", label: "Environnement" },
  { key: "redistribution", label: "Redistribution" },
] as const;

export default function PositioningRadar({ positioning, color }: PositioningRadarProps) {
  const data = AXES.map((axis) => ({
    axis: axis.label,
    value: positioning[axis.key] ?? 0,
  }));

  const fillColor = color + "4D"; // 30% opacity hex

  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Positionnement ideologique ({positioning.year})
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Position"
            dataKey="value"
            stroke={color}
            fill={fillColor}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#27272a",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#f4f4f5",
            }}
            formatter={(value) => [Number(value).toFixed(1), "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
