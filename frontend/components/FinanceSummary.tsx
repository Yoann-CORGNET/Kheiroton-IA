"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { PartyFinance } from "@/lib/api";

interface FinanceSummaryProps {
  finance: PartyFinance;
}

const fmt = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

const LABELS: { key: keyof PartyFinance; label: string }[] = [
  { key: "public_funding", label: "Financement public" },
  { key: "private_donations", label: "Dons prives" },
  { key: "membership_fees", label: "Cotisations" },
];

export default function FinanceSummary({ finance }: FinanceSummaryProps) {
  const slices = LABELS.map((item) => ({
    name: item.label,
    value: finance[item.key] as number,
  }));

  const knownTotal = slices.reduce((sum, s) => sum + s.value, 0);
  const other = Math.max(0, finance.total_revenue - knownTotal);
  if (other > 0) {
    slices.push({ name: "Autres", value: other });
  }

  const balance = finance.total_revenue - finance.total_expenses;

  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Finances ({finance.year})
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie chart */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-400">Repartition des revenus</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={2}
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name ?? ""} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#27272a",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  color: "#f4f4f5",
                }}
                formatter={(value) => [fmt.format(Number(value)), "Montant"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary text */}
        <div className="flex flex-col justify-center gap-4">
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Revenus totaux</p>
            <p className="text-xl font-bold text-zinc-100">
              {fmt.format(finance.total_revenue)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Depenses totales</p>
            <p className="text-xl font-bold text-zinc-100">
              {fmt.format(finance.total_expenses)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800 p-4">
            <p className="text-sm text-zinc-400">Solde</p>
            <p
              className={`text-xl font-bold ${
                balance >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {fmt.format(balance)}
            </p>
          </div>
          {finance.assets !== null && (
            <div className="rounded-lg bg-zinc-800 p-4">
              <p className="text-sm text-zinc-400">Patrimoine</p>
              <p className="text-xl font-bold text-zinc-100">
                {fmt.format(finance.assets)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
