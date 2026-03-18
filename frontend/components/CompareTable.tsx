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
  { label: "Économique (lrecon)", key: "lrecon", source: "positioning" },
  { label: "GAL-TAN", key: "galtan", source: "positioning" },
  { label: "Pro-UE", key: "eu_position", source: "positioning" },
  { label: "Immigration", key: "immigration", source: "positioning" },
  { label: "Environnement", key: "environment", source: "positioning" },
  { label: "Redistribution", key: "redistribution", source: "positioning" },
  { label: "Anti-élites", key: "antielite", source: "positioning" },
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
    label: "Faisabilité moy.",
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
    max: 0,
  },
  {
    label: "Groupe AN",
    key: "group_name",
    source: "parliamentary",
    format: (v) => (v != null ? String(v) : "-"),
    max: 0,
  },
  {
    label: "Présence moy. (%)",
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
      <span className="text-sm text-[#666666]">{formatted}</span>
    );
  }

  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-3 w-20 overflow-hidden bg-[#eeeeee]">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-[#3a3a3a] tabular-nums">{formatted}</span>
    </div>
  );
}

export default function CompareTable({ comparison, parties }: CompareTableProps) {
  const selectedParties = parties.filter((p) =>
    comparison.parties.includes(p.slug)
  );

  if (selectedParties.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-[#929292]">
        Aucune donnée de comparaison disponible.
      </div>
    );
  }

  const allRows = [...POSITIONING_ROWS, ...EXTRA_ROWS];

  const visibleRows = allRows.filter((row) => {
    if (POSITIONING_ROWS.includes(row)) return true;
    return selectedParties.some((p) => getValue(comparison, p.slug, row) != null);
  });

  return (
    <div className="w-full">
      <h2 className="mb-4 text-lg font-bold text-[#161616]">
        Comparaison détaillée
      </h2>
      <div className="overflow-x-auto border border-[#e5e5e5]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b-2 border-[#000091] bg-[#f6f6f6]">
              <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#161616]">Dimension</th>
              {selectedParties.map((party) => (
                <th key={party.slug} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0"
                      style={{ backgroundColor: party.color }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">
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
                        className="border-t-2 border-[#000091] bg-[#f6f6f6] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#666666]"
                      >
                        Données supplémentaires
                      </td>
                    </tr>
                  )}
                  <tr
                    className="border-t border-[#e5e5e5] transition-colors hover:bg-[#f6f6f6]"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[#666666]">
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
