"use client";

import type { Promise } from "@/lib/api";

interface PromiseListProps {
  promises: Promise[];
}

const fmt = new Intl.NumberFormat("fr-FR");

function feasibilityColor(score: number): string {
  if (score < 0.3) return "bg-red-500";
  if (score < 0.6) return "bg-orange-400";
  return "bg-green-500";
}

function feasibilityTextColor(score: number): string {
  if (score < 0.3) return "text-red-400";
  if (score < 0.6) return "text-orange-400";
  return "text-green-400";
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "...";
}

function formatCost(cost: Record<string, unknown> | null): string {
  if (!cost) return "-";
  const amount = cost.amount_eur ?? cost.amount ?? cost.value;
  if (typeof amount === "number") return fmt.format(amount) + " EUR";
  if (typeof amount === "string") return amount;
  const label = cost.label ?? cost.description;
  if (typeof label === "string") return label;
  return "-";
}

export default function PromiseList({ promises }: PromiseListProps) {
  const sorted = [...promises].sort((a, b) => a.theme.localeCompare(b.theme));

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl bg-zinc-900 p-6">
        <h3 className="mb-4 text-lg font-semibold text-zinc-100">Promesses</h3>
        <p className="text-zinc-400">Aucune promesse disponible.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-4 text-lg font-semibold text-zinc-100">
        Promesses ({sorted.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-zinc-400">
              <th className="pb-3 pr-4 font-medium">Theme</th>
              <th className="pb-3 pr-4 font-medium">Promesse</th>
              <th className="pb-3 pr-4 font-medium">Faisabilite</th>
              <th className="pb-3 font-medium">Cout</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const score = p.feasibility?.overall ?? null;
              return (
                <tr
                  key={p.id}
                  className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
                >
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                      {p.theme}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-zinc-200">
                    {truncate(p.raw_text, 100)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {score !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-700">
                          <div
                            className={`h-full rounded-full ${feasibilityColor(score)}`}
                            style={{ width: `${Math.round(score * 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${feasibilityTextColor(score)}`}
                        >
                          {Math.round(score * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500">N/A</span>
                    )}
                  </td>
                  <td className="py-3 text-zinc-300">
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
