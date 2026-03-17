"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ElectionResult } from "@/lib/api";

interface ElectionResultsProps {
  elections: ElectionResult[];
  color: string;
}

const fmt = new Intl.NumberFormat("fr-FR");

export default function ElectionResults({ elections, color }: ElectionResultsProps) {
  const data = elections.map((e) => ({
    label: `${e.election_type} ${e.year} (T${e.round})`,
    votes: e.votes,
    percentage: e.percentage,
    candidate: e.candidate,
    seats: e.seats,
  }));

  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Resultats electoraux
      </h3>
      {data.length === 0 ? (
        <p className="text-zinc-400">Aucun resultat electoral disponible.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: "#a1a1aa", fontSize: 12 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={{ stroke: "#3f3f46" }}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={220}
              tick={{ fill: "#a1a1aa", fontSize: 11 }}
              axisLine={{ stroke: "#3f3f46" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#27272a",
                border: "1px solid #3f3f46",
                borderRadius: "8px",
                color: "#f4f4f5",
              }}
              formatter={(value, name) => {
                const v = Number(value);
                if (name === "percentage") return [`${v.toFixed(2)}%`, "Pourcentage"];
                return [fmt.format(v), "Votes"];
              }}
              labelFormatter={(label) => String(label)}
            />
            <Bar
              dataKey="percentage"
              fill={color}
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
