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
  elections: "Elections",
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
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <div className="h-1.5 flex-1 rounded-full bg-zinc-800" />
        <span>--</span>
      </div>
    );
  }
  const pct = (value / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 flex-1 rounded-full bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #ef4444 0%, #eab308 50%, #3b82f6 100%)`,
          }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-white shadow"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      <span className="min-w-[2rem] text-right font-mono text-xs text-zinc-300">
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
    <div className="flex items-center gap-1">
      {DIMENSIONS.map((dim) => (
        <div
          key={dim}
          title={DIMENSION_LABELS[dim]}
          className={`h-2 w-2 rounded-full ${
            completeness[dim] ? "bg-emerald-500" : "bg-zinc-700"
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
      className="group flex flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-all hover:border-zinc-600 hover:bg-zinc-800/80"
      style={{ borderLeftColor: party.color, borderLeftWidth: "3px" }}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white group-hover:text-zinc-50">
            {party.name}
          </h2>
          <p className="text-sm text-zinc-400">{party.short_name}</p>
        </div>
        <span
          className="ml-2 inline-block h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: party.color }}
          title={party.color}
        />
      </div>

      <p className="text-xs text-zinc-500">{party.family}</p>

      <div className="mt-auto flex flex-col gap-2">
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Gauche-Droite
            </span>
          </div>
          <LrgenBar value={party.lrgen} />
        </div>

        <div className="flex items-center justify-between pt-1">
          <CompletenessIndicator completeness={party.data_completeness} />
          {promiseCount && (
            <span className="text-xs text-zinc-500">
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
          className="flex h-48 flex-col gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-4"
        >
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800" />
          <div className="mt-auto h-2 w-full animate-pulse rounded bg-zinc-800" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={j}
                className="h-2 w-2 animate-pulse rounded-full bg-zinc-800"
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
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Partis politiques
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            {loading
              ? "Chargement..."
              : `${parties.length} partis classes de gauche a droite`}
          </p>
        </div>
        <Link
          href="/compare"
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          Comparer
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
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
