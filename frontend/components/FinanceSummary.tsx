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

const COLORS = ["#000091", "#18753C", "#B34000", "#A558A0"];

const LABELS: { key: keyof PartyFinance; label: string }[] = [
  { key: "public_funding", label: "Financement public" },
  { key: "private_donations", label: "Dons privés" },
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
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[#161616]">
        Finances ({finance.year})
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie chart */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#666666]">Répartition des revenus</p>
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
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "0",
                  color: "#161616",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
                formatter={(value) => [fmt.format(Number(value)), "Montant"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards */}
        <div className="flex flex-col justify-center gap-4">
          <div className="border border-[#e5e5e5] bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">Revenus totaux</p>
            <p className="mt-1 text-xl font-bold text-[#161616]">
              {fmt.format(finance.total_revenue)}
            </p>
          </div>
          <div className="border border-[#e5e5e5] bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">Dépenses totales</p>
            <p className="mt-1 text-xl font-bold text-[#161616]">
              {fmt.format(finance.total_expenses)}
            </p>
          </div>
          <div className="border border-[#e5e5e5] bg-[#f6f6f6] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">Solde</p>
            <p
              className={`mt-1 text-xl font-bold ${
                balance >= 0 ? "text-[#18753C]" : "text-[#CE0500]"
              }`}
            >
              {balance >= 0 ? "+" : ""}
              {fmt.format(balance)}
            </p>
          </div>
          {finance.assets !== null && (
            <div className="border border-[#e5e5e5] bg-[#f6f6f6] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">Patrimoine</p>
              <p className="mt-1 text-xl font-bold text-[#161616]">
                {fmt.format(finance.assets)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
