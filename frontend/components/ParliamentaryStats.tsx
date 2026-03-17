"use client";

import type { ParliamentaryActivity } from "@/lib/api";

interface ParliamentaryStatsProps {
  parliamentary: ParliamentaryActivity;
}

const fmt = new Intl.NumberFormat("fr-FR");

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-zinc-800 p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-100">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}

export default function ParliamentaryStats({ parliamentary }: ParliamentaryStatsProps) {
  return (
    <div className="rounded-xl bg-zinc-900 p-6">
      <h3 className="mb-2 text-lg font-semibold text-zinc-100">
        Activite parlementaire
      </h3>
      <p className="mb-4 text-sm text-zinc-400">
        {parliamentary.group_name} &middot; Legislature {parliamentary.legislature}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Taille du groupe"
          value={fmt.format(parliamentary.group_size)}
          subtitle="deputes"
        />
        <MetricCard
          label="Interventions"
          value={fmt.format(parliamentary.total_interventions)}
        />
        <MetricCard
          label="Amendements deposes"
          value={fmt.format(parliamentary.total_amendments)}
        />
        <MetricCard
          label="Amendements adoptes"
          value={`${parliamentary.amendments_adopted_pct.toFixed(1)}%`}
        />
        <MetricCard
          label="Presence moyenne"
          value={`${parliamentary.avg_presence_pct.toFixed(1)}%`}
        />
        <MetricCard
          label="Questions posees"
          value={fmt.format(parliamentary.total_questions)}
        />
      </div>

      {parliamentary.top_themes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-400">Themes principaux</p>
          <div className="flex flex-wrap gap-2">
            {parliamentary.top_themes.map((theme) => (
              <span
                key={theme}
                className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
