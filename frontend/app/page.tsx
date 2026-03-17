"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PartySummary } from "@/lib/api";

const DIMENSIONS = [
  "positioning",
  "elections",
  "finance",
  "promises",
  "parliamentary",
] as const;

const DIMENSION_LABELS: Record<string, string> = {
  positioning: "Positionnement",
  elections: "Élections",
  finance: "Finances",
  promises: "Promesses",
  parliamentary: "Parlementaire",
};

function formatScore(value: number | null): string {
  if (value === null) return "--";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function LrgenBar({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2 text-xs text-[#929292]">
        <div className="h-1.5 flex-1 bg-[#eeeeee]" />
        <span>--</span>
      </div>
    );
  }
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 bg-[#eeeeee]">
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #CE0500 0%, #B34000 50%, #000091 100%)`,
          }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 border-2 border-white bg-[#161616] shadow-sm"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <span className="min-w-[2rem] text-right font-mono text-xs text-[#3a3a3a]">
        {formatScore(value)}
      </span>
    </div>
  );
}

function CompletenessIndicator({
  completeness,
}: {
  completeness: Record<string, boolean>;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {DIMENSIONS.map((dim) => (
        <div
          key={dim}
          title={DIMENSION_LABELS[dim]}
          className={`h-2 w-2 ${
            completeness[dim] ? "bg-[#18753C]" : "bg-[#eeeeee]"
          }`}
        />
      ))}
    </div>
  );
}

function PartyCard({ party }: { party: PartySummary }) {
  const promiseCount =
    party.data_completeness["promises"] ? "oui" : null;

  return (
    <Link
      href={`/parties/${party.slug}`}
      className="group flex flex-col gap-3 border border-[#e5e5e5] bg-white p-5 transition-all hover:border-[#000091] hover:shadow-[inset_0_0_0_1px_#000091]"
      style={{ borderLeftColor: party.color, borderLeftWidth: "3px" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-[#161616] group-hover:text-[#000091]">
            {party.name}
          </h2>
          <p className="text-sm text-[#666666]">{party.short_name}</p>
        </div>
        <span
          className="ml-2 inline-block h-3 w-3 shrink-0"
          style={{ backgroundColor: party.color }}
        />
      </div>

      <p className="text-xs text-[#929292] uppercase tracking-wide">{party.family}</p>

      <div className="mt-auto flex flex-col gap-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-[#666666]">
              Gauche — Droite
            </span>
          </div>
          <LrgenBar value={party.lrgen} />
        </div>

        <div className="flex items-center justify-between border-t border-[#e5e5e5] pt-2">
          <CompletenessIndicator completeness={party.data_completeness} />
          {promiseCount && (
            <span className="text-[11px] text-[#666666]">
              Promesses disponibles
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="flex h-48 flex-col gap-3 border border-[#e5e5e5] bg-white p-5"
        >
          <div className="h-5 w-3/4 animate-pulse bg-[#eeeeee]" />
          <div className="h-4 w-1/3 animate-pulse bg-[#eeeeee]" />
          <div className="h-3 w-1/2 animate-pulse bg-[#eeeeee]" />
          <div className="mt-auto h-2 w-full animate-pulse bg-[#eeeeee]" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-2 w-2 animate-pulse bg-[#eeeeee]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [parties, setParties] = useState<PartySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getParties()
      .then((data) => {
        const sorted = [...data].sort((a, b) => {
          if (a.lrgen === null && b.lrgen === null) return 0;
          if (a.lrgen === null) return 1;
          if (b.lrgen === null) return -1;
          return a.lrgen - b.lrgen;
        });
        setParties(sorted);
      })
      .catch((err) => {
        setError(err.message || "Erreur lors du chargement des partis");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#161616]">
            Partis politiques
          </h1>
          <p className="mt-1 text-sm text-[#666666]">
            {loading
              ? "Chargement..."
              : `${parties.length} partis classés de gauche à droite`}
          </p>
        </div>
        <Link
          href="/compare"
          className="border border-[#000091] bg-[#000091] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1212FF]"
        >
          Comparer
        </Link>
      </div>

      {error && (
        <div className="mb-6 border-l-4 border-[#CE0500] bg-[#FEF4F4] p-4 text-sm text-[#CE0500]">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {parties.map((party) => (
            <PartyCard key={party.slug} party={party} />
          ))}
        </div>
      )}
    </main>
  );
}
