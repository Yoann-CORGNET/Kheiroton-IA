"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PartySummary, ComparisonResult } from "@/lib/api";
import CompareRadar from "@/components/CompareRadar";
import CompareTable from "@/components/CompareTable";

export default function ComparePage() {
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loadingParties, setLoadingParties] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch party list on mount
  useEffect(() => {
    let cancelled = false;
    api
      .getParties()
      .then((data) => {
        if (!cancelled) setParties(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingParties(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggle party selection (clamp to 4)
  const toggleParty = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else if (next.size < 4) {
        next.add(slug);
      }
      return next;
    });
  }, []);

  // Fetch comparison when clicking the button
  const handleCompare = useCallback(async () => {
    const slugs = Array.from(selected);
    if (slugs.length < 2) return;

    setLoadingComparison(true);
    setError(null);
    setComparison(null);

    try {
      const result = await api.compare(slugs);
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la comparaison");
    } finally {
      setLoadingComparison(false);
    }
  }, [selected]);

  // Selected parties metadata (for child components)
  const selectedParties = parties.filter((p) => selected.has(p.slug));

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comparer les partis</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Selectionnez 2 a 4 partis pour les comparer
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-zinc-400 transition-colors hover:text-white"
        >
          &larr; Retour
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Party selection */}
      {loadingParties ? (
        <div className="flex h-24 items-center justify-center text-zinc-500">
          Chargement des partis...
        </div>
      ) : (
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {parties.map((party) => {
              const isSelected = selected.has(party.slug);
              const isDisabled = !isSelected && selected.size >= 4;

              return (
                <button
                  key={party.slug}
                  onClick={() => toggleParty(party.slug)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-zinc-500 bg-zinc-800 text-white"
                      : isDisabled
                        ? "cursor-not-allowed border-zinc-800 bg-zinc-900/30 text-zinc-600"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: party.color }}
                  />
                  {party.short_name || party.name}
                </button>
              );
            })}
          </div>

          {/* Compare button */}
          <div className="mt-5">
            <button
              onClick={handleCompare}
              disabled={selected.size < 2 || loadingComparison}
              className={`rounded-lg px-6 py-2.5 text-sm font-semibold transition-all ${
                selected.size < 2
                  ? "cursor-not-allowed bg-zinc-800 text-zinc-600"
                  : loadingComparison
                    ? "cursor-wait bg-zinc-700 text-zinc-300"
                    : "bg-white text-zinc-950 hover:bg-zinc-200"
              }`}
            >
              {loadingComparison
                ? "Chargement..."
                : `Comparer (${selected.size} selectionne${selected.size > 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {comparison && (
        <div className="space-y-10">
          {/* Radar chart */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <CompareRadar
              data={comparison.positioning_radar}
              parties={selectedParties}
            />
          </section>

          {/* Comparison table */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
            <CompareTable
              comparison={comparison}
              parties={selectedParties}
            />
          </section>
        </div>
      )}

      {/* Empty state when no comparison yet */}
      {!comparison && !loadingComparison && !loadingParties && (
        <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-800 text-zinc-600">
          {selected.size < 2
            ? "Selectionnez au moins 2 partis pour lancer la comparaison"
            : "Cliquez sur \"Comparer\" pour voir les resultats"}
        </div>
      )}
    </main>
  );
}
