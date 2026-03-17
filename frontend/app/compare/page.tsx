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

  const selectedParties = parties.filter((p) => selected.has(p.slug));

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#161616]">Comparer les partis</h1>
          <p className="mt-1 text-sm text-[#666666]">
            Sélectionnez 2 à 4 partis pour les comparer
          </p>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-[#000091] transition-colors hover:text-[#1212FF]"
        >
          &larr; Retour
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 border-l-4 border-[#CE0500] bg-[#FEF4F4] px-4 py-3 text-sm text-[#CE0500]">
          {error}
        </div>
      )}

      {/* Party selection */}
      {loadingParties ? (
        <div className="flex h-24 items-center justify-center text-[#929292]">
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
                  className={`flex items-center gap-2 border px-4 py-2 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-[#000091] bg-[#000091] text-white"
                      : isDisabled
                        ? "cursor-not-allowed border-[#e5e5e5] bg-[#f6f6f6] text-[#929292]"
                        : "border-[#e5e5e5] bg-white text-[#3a3a3a] hover:border-[#000091] hover:text-[#000091]"
                  }`}
                >
                  <span
                    className="inline-block h-3 w-3 shrink-0"
                    style={{ backgroundColor: isSelected ? "white" : party.color }}
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
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                selected.size < 2
                  ? "cursor-not-allowed border border-[#e5e5e5] bg-[#f6f6f6] text-[#929292]"
                  : loadingComparison
                    ? "cursor-wait bg-[#000091]/70 text-white"
                    : "bg-[#000091] text-white hover:bg-[#1212FF]"
              }`}
            >
              {loadingComparison
                ? "Chargement..."
                : `Comparer (${selected.size} sélectionné${selected.size > 1 ? "s" : ""})`}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {comparison && (
        <div className="space-y-10">
          <section className="border border-[#e5e5e5] bg-white p-6">
            <CompareRadar
              data={comparison.positioning_radar}
              parties={selectedParties}
            />
          </section>

          <section className="border border-[#e5e5e5] bg-white p-6">
            <CompareTable
              comparison={comparison}
              parties={selectedParties}
            />
          </section>
        </div>
      )}

      {/* Empty state */}
      {!comparison && !loadingComparison && !loadingParties && (
        <div className="flex h-48 items-center justify-center border-2 border-dashed border-[#e5e5e5] text-[#929292]">
          {selected.size < 2
            ? "Sélectionnez au moins 2 partis pour lancer la comparaison"
            : "Cliquez sur \"Comparer\" pour voir les résultats"}
        </div>
      )}
    </main>
  );
}
