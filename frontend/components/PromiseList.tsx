"use client";

import type { Promise } from "@/lib/api";

interface PromiseListProps {
  promises: Promise[];
}

const fmt = new Intl.NumberFormat("fr-FR");

function feasibilityColor(score: number): string {
  if (score < 0.3) return "bg-[#CE0500]";
  if (score < 0.6) return "bg-[#B34000]";
  return "bg-[#18753C]";
}

function feasibilityTextColor(score: number): string {
  if (score < 0.3) return "text-[#CE0500]";
  if (score < 0.6) return "text-[#B34000]";
  return "text-[#18753C]";
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

function formatCost(cost: Record<string, unknown> | null): string {
  if (!cost) return "-";
  const amount = cost.amount_eur ?? cost.amount ?? cost.value;
  if (typeof amount === "number") {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? "-" : "+";
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)} Md\u00a0\u20ac`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(0)} M\u00a0\u20ac`;
    if (abs >= 1_000) return `${sign}${fmt.format(abs)} \u20ac`;
    return `${sign}${abs} \u20ac`;
  }
  if (typeof amount === "string") return amount;
  const label = cost.label ?? cost.description;
  if (typeof label === "string") return label;
  return "-";
}

export default function PromiseList({ promises }: PromiseListProps) {
  const sorted = [...promises].sort((a, b) => a.theme.localeCompare(b.theme));

  if (sorted.length === 0) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-[#161616]">Promesses</h3>
        <p className="text-[#666666]">Aucune promesse disponible.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-4 text-lg font-bold text-[#161616]">
        Promesses ({sorted.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#000091] text-[#161616]">
              <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide">Thème</th>
              <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide">Promesse</th>
              <th className="pb-3 pr-4 text-xs font-bold uppercase tracking-wide">Faisabilité</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wide">Coût</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const score = p.feasibility?.overall ?? null;
              return (
                <tr
                  key={p.id}
                  className="border-b border-[#e5e5e5] transition-colors hover:bg-[#f6f6f6]"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="bg-[#f6f6f6] border border-[#e5e5e5] px-2.5 py-1 text-xs font-medium text-[#3a3a3a]">
                      {p.theme}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-[#3a3a3a]">
                    {truncate(p.raw_text, 100)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden bg-[#eeeeee]">
                          <div
                            className={`h-full ${feasibilityColor(score)}`}
                            style={{ width: `${Math.round(score * 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-bold ${feasibilityTextColor(score)}`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#929292]">N/A</span>
                    )}
                  </td>
                  <td className="py-3 font-mono text-[#3a3a3a]">
                    {formatCost(p.cost_announced)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
