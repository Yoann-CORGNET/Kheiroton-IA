"use client";

import { Fragment } from "react";
import type { ComparisonResult, PartySummary } from "@/lib/api";

interface CompareTableProps {
  comparison: ComparisonResult;
  parties: PartySummary[];
}

interface RowDef {
  label: string;
  key: string;
  source: "positioning" | "parliamentary" | "promises";
  format?: (v: number | null | undefined) => string;
  max?: number;
}

const POSITIONING_ROWS: RowDef[] = [
  { label: "Gauche-Droite (lrgen)", key: "lrgen", source: "positioning" },
  { label: "Economique (lrecon)", key: "lrecon", source: "positioning" },
  { label: "GAL-TAN", key: "galtan", source: "positioning" },
  { label: "Pro-UE", key: "eu_position", source: "positioning" },
  { label: "Immigration", key: "immigration", source: "positioning" },
  { label: "Environnement", key: "environment", source: "positioning" },
  { label: "Redistribution", key: "redistribution", source: "positioning" },
  { label: "Anti-elites", key: "antielite", source: "positioning" },
];

const EXTRA_ROWS: RowDef[] = [
  {
    label: "Nb promesses",
    key: "count",
    source: "promises",
    format: (v) => (v != null ? String(Math.round(v)) : "-"),
    max: 100,
  },
  {
    label: "Faisabilite moy.",
    key: "avg_feasibility",
    source: "promises",
    format: (v) => (v != null ? v.toFixed(2) : "-"),
    max: 1,
  },
  {
    label: "Budget total (EUR)",
    key: "total_cost_eur",
    source: "promises",
    format: (v) => {
      if (v == null || v === 0) return "-";
      if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} Md`;
      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} M`;
      return v.toLocaleString("fr-FR");
    },
    max: 0, // no bar for budget
  },
  {
    label: "Groupe AN",
    key: "group_name",
    source: "parliamentary",
    format: (v) => (v != null ? String(v) : "-"),
    max: 0,
  },
  {
    label: "Presence moy. (%)",
    key: "avg_presence_pct",
    source: "parliamentary",
    format: (v) => (v != null ? `${v.toFixed(1)}%` : "-"),
    max: 100,
  },
];

function getValue(
  comparison: ComparisonResult,
  slug: string,
  row: RowDef
): number | null {
  if (row.source === "positioning") {
    return comparison.positioning_radar?.[slug]?.[row.key] ?? null;
  }
  if (row.source === "promises") {
    const promiseData = comparison.promise_themes?.[slug];
    if (!promiseData) return null;
    return (promiseData as unknown as Record<string, number>)[row.key] ?? null;
  }
  if (row.source === "parliamentary") {
    return comparison.parliamentary_activity?.[slug]?.[row.key] ?? null;
  }
  return null;
}

function BarCell({
  value,
  max,
  color,
  formatted,
}: {
  value: number | null;
  max: number;
  color: string;
  formatted: string;
}) {
  if (value == null || max <= 0) {
    return (
      <span className="text-sm text-zinc-400">{formatted}</span>
    );
  }

  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3 w-20 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-zinc-300 tabular-nums">{formatted}</span>
    </div>
  );
}

export default function CompareTable({ comparison, parties }: CompareTableProps) {
  const selectedParties = parties.filter((p) =>
    comparison.parties.includes(p.slug)
  );

  if (selectedParties.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-zinc-500">
        Aucune donnee de comparaison disponible.
      </div>
    );
  }

  const allRows = [...POSITIONING_ROWS, ...EXTRA_ROWS];

  // Filter extra rows: only show if at least one party has data
  const visibleRows = allRows.filter((row) => {
    if (POSITIONING_ROWS.includes(row)) return true;
    return selectedParties.some((p) => getValue(comparison, p.slug, row) != null);
  });

  return (
    <div className="w-full">
      <h2 className="mb-4 text-lg font-semibold text-zinc-100">
        Comparaison detaillee
      </h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-3 font-medium text-zinc-400">Dimension</th>
              {selectedParties.map((party) => (
                <th key={party.slug} className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="text-zinc-100">
                      {party.short_name || party.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => {
              const isPositioning = POSITIONING_ROWS.includes(row);
              // Show divider before the first non-positioning row
              const prevRow = idx > 0 ? visibleRows[idx - 1] : null;
              const showDivider =
                !isPositioning &&
                prevRow != null &&
                POSITIONING_ROWS.includes(prevRow);

              return (
                <Fragment key={row.key}>
                  {showDivider && (
                    <tr>
                      <td
                        colSpan={selectedParties.length + 1}
                        className="border-t border-zinc-700 bg-zinc-900/30 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500"
                      >
                        Donnees supplementaires
                      </td>
                    </tr>
                  )}
                  <tr
                    className="border-t border-zinc-800/50 transition-colors hover:bg-zinc-900/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                      {row.label}
                    </td>
                    {selectedParties.map((party) => {
                      const raw = getValue(comparison, party.slug, row);
                      const formatted = row.format
                        ? row.format(raw)
                        : raw != null
                          ? raw.toFixed(1)
                          : "-";
                      const max = row.max ?? 10;

                      return (
                        <td key={party.slug} className="px-4 py-3">
                          <BarCell
                            value={raw}
                            max={max}
                            color={party.color}
                            formatted={formatted}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
