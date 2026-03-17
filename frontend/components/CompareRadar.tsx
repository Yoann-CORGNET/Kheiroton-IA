"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { PartySummary } from "@/lib/api";

const AXES = [
  "lrecon",
  "galtan",
  "eu_position",
  "immigration",
  "environment",
  "redistribution",
] as const;

const AXIS_LABELS: Record<string, string> = {
  lrecon: "Economique",
  galtan: "GAL-TAN",
  eu_position: "Pro-UE",
  immigration: "Immigration",
  environment: "Environnement",
  redistribution: "Redistribution",
};

interface CompareRadarProps {
  data: Record<string, Record<string, number>>;
  parties: PartySummary[];
}

export default function CompareRadar({ data, parties }: CompareRadarProps) {
  const selectedParties = parties.filter((p) => p.slug in data);

  const radarData = AXES.map((axis) => ({
    axis: AXIS_LABELS[axis],
    ...Object.fromEntries(
      selectedParties.map((p) => [p.slug, data[p.slug]?.[axis] ?? 0])
    ),
  }));

  if (selectedParties.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        Aucune donnee de positionnement disponible.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">
        Positionnement ideologique
      </h2>
      <ResponsiveContainer width="100%" height={420}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
          />
          {selectedParties.map((party) => (
            <Radar
              key={party.slug}
              name={party.short_name || party.name}
              dataKey={party.slug}
              stroke={party.color}
              fill={party.color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ color: "#d4d4d8", fontSize: 13 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #3f3f46",
              borderRadius: "8px",
              color: "#e4e4e7",
              fontSize: 13,
            }}
            formatter={(value) => Number(value).toFixed(1)}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
