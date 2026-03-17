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
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[#161616]">
        Résultats électoraux
      </h3>
      {data.length === 0 ? (
        <p className="text-[#666666]">Aucun résultat électoral disponible.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 50)}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis
              type="number"
              tick={{ fill: "#666666", fontSize: 12 }}
              axisLine={{ stroke: "#e5e5e5" }}
              tickLine={{ stroke: "#e5e5e5" }}
              tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={220}
              tick={{ fill: "#3a3a3a", fontSize: 11 }}
              axisLine={{ stroke: "#e5e5e5" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e5e5",
                borderRadius: "0",
                color: "#161616",
                boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
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
              radius={[0, 0, 0, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
