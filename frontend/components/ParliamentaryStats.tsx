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
    <div className="border border-[#e5e5e5] bg-[#f6f6f6] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#161616]">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-[#929292]">{subtitle}</p>}
    </div>
  );
}

export default function ParliamentaryStats({ parliamentary }: ParliamentaryStatsProps) {
  return (
    <div className="border border-[#e5e5e5] bg-white p-6">
      <h3 className="mb-2 text-lg font-bold text-[#161616]">
        Activité parlementaire
      </h3>
      <p className="mb-4 text-sm text-[#666666]">
        {parliamentary.group_name} &middot; Législature {parliamentary.legislature}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Taille du groupe"
          value={fmt.format(parliamentary.group_size)}
          subtitle="députés"
        />
        <MetricCard
          label="Interventions"
          value={fmt.format(parliamentary.total_interventions)}
        />
        <MetricCard
          label="Amendements déposés"
          value={fmt.format(parliamentary.total_amendments)}
        />
        <MetricCard
          label="Amendements adoptés"
          value={`${parliamentary.amendments_adopted_pct.toFixed(1)}%`}
        />
        <MetricCard
          label="Présence moyenne"
          value={`${parliamentary.avg_presence_pct.toFixed(1)}%`}
        />
        <MetricCard
          label="Questions posées"
          value={fmt.format(parliamentary.total_questions)}
        />
      </div>

      {parliamentary.top_themes.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#666666]">Thèmes principaux</p>
          <div className="flex flex-wrap gap-2">
            {parliamentary.top_themes.map((theme) => (
              <span
                key={theme}
                className="border border-[#e5e5e5] bg-[#f6f6f6] px-3 py-1 text-xs font-medium text-[#3a3a3a]"
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
