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
  { key: "lrecon", label: "Économique" },
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

  const fillColor = color + "33"; // 20% opacity hex

  return (
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[#161616]">
        Positionnement idéologique ({positioning.year})
      </h3>
      <ResponsiveContainer width="100%" height={360}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#e5e5e5" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#161616", fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            domain={[0, 10]}
            tickCount={6}
            tick={{ fill: "#929292", fontSize: 10 }}
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
              backgroundColor: "#ffffff",
              border: "1px solid #e5e5e5",
              borderRadius: "0",
              color: "#161616",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => [Number(value).toFixed(1), "Score"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
