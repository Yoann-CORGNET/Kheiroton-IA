"use client";

import { useState } from "react";
import type { Promise, FeasibilityDimension } from "@/lib/api";

interface PromiseListProps {
  promises: Promise[];
}

const fmt = new Intl.NumberFormat("fr-FR");

/* ── Color helpers ── */

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

function feasibilityBg(score: number): string {
  if (score < 0.3) return "bg-[#FEF4F4]";
  if (score < 0.6) return "bg-[#FEF5EE]";
  return "bg-[#E8F5EE]";
}

const VERDICT_STYLES: Record<string, { label: string; cls: string }> = {
  essentiellement_vrai: { label: "Essentiellement vrai", cls: "border-[#18753C] text-[#18753C] bg-[#E8F5EE]" },
  partiellement_vrai: { label: "Partiellement vrai", cls: "border-[#B34000] text-[#B34000] bg-[#FEF5EE]" },
  partiellement_exact: { label: "Partiellement exact", cls: "border-[#B34000] text-[#B34000] bg-[#FEF5EE]" },
  non_verifie: { label: "Non vérifié", cls: "border-[#929292] text-[#929292] bg-[#f6f6f6]" },
  faux: { label: "Faux", cls: "border-[#CE0500] text-[#CE0500] bg-[#FEF4F4]" },
};

const ORIENTATION_LABELS: Record<string, string> = {
  liberal: "Libéral",
  gauche: "Gauche",
  neutre: "Neutre",
  institutionnel: "Institutionnel",
};

const FUNDING_STATUS_LABELS: Record<string, string> = {
  propose_vague: "Financement proposé (vague)",
  non_capture: "Non capturé dans nos données",
  non_propose: "Aucun financement proposé",
};

const DIMENSION_LABELS: Record<string, string> = {
  budget: "Budget",
  juridique: "Juridique",
  technique: "Technique",
  politique: "Politique",
  timeline: "Calendrier",
  social: "Acceptabilité sociale",
  impact: "Impact",
};

const DIMENSION_WEIGHTS: Record<string, number> = {
  budget: 25,
  juridique: 15,
  technique: 15,
  politique: 10,
  timeline: 10,
  social: 10,
  impact: 15,
};

/* ── Formatting ── */

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

/* ── Sub-components ── */

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-block border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {children}
    </span>
  );
}

function DimensionBar({ name, dim }: { name: string; dim: FeasibilityDimension }) {
  const pct = Math.round(dim.score * 100);
  const weight = DIMENSION_WEIGHTS[name];
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="w-36 shrink-0">
        <span className="text-xs font-medium text-[#3a3a3a]">
          {DIMENSION_LABELS[name] || name}
        </span>
        {weight != null && (
          <span className="ml-1 text-[10px] text-[#929292]">({weight}%)</span>
        )}
      </div>
      <div className="flex flex-1 items-center gap-2">
        <div className="h-2 w-24 bg-[#eeeeee]">
          <div
            className={`h-full ${feasibilityColor(dim.score)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={`text-xs font-bold tabular-nums ${feasibilityTextColor(dim.score)}`}>
          {pct}%
        </span>
        <span className="text-[10px] text-[#929292]">
          (confiance {Math.round(dim.confidence * 100)}%)
        </span>
      </div>
    </div>
  );
}

function ExpandedPanel({ p }: { p: Promise }) {
  const dims = p.feasibility?.dimensions;
  const mc = p.feasibility?.monte_carlo;
  const ci = p.feasibility?.ci_95;

  return (
    <div className="border-t border-[#e5e5e5] bg-[#f6f6f6] px-6 py-5">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {p.candidate_justification && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#666666] mb-1">Justification du candidat</p>
              <p className="text-sm text-[#3a3a3a] italic leading-relaxed">{p.candidate_justification}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {p.timeline && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292]">Calendrier</p>
                <p className="text-xs text-[#3a3a3a]">{p.timeline}</p>
              </div>
            )}
            {p.target_population && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292]">Population cible</p>
                <p className="text-xs text-[#3a3a3a]">{p.target_population}</p>
              </div>
            )}
            {p.funding_source && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292]">Source de financement</p>
                <p className="text-xs text-[#3a3a3a]">{p.funding_source}</p>
              </div>
            )}
            {p.cost_announced && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292]">Coût annoncé</p>
                <p className="text-xs font-mono text-[#3a3a3a]">{formatCost(p.cost_announced)}</p>
              </div>
            )}
          </div>

          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="border-[#000091] text-[#000091] bg-white">
              {p.classification === "PROMESSE_CONCRETE" ? "Concrète" : "Vague"}
            </Badge>
            <Badge className="border-[#666666] text-[#666666] bg-white">
              {p.precision_level === "tres_precis" ? "Très précis" : p.precision_level === "precis" ? "Précis" : "Vague"}
            </Badge>
            {p.funding_status && (
              <Badge className={
                p.funding_status === "non_propose"
                  ? "border-[#CE0500] text-[#CE0500] bg-[#FEF4F4]"
                  : p.funding_status === "non_capture"
                    ? "border-[#929292] text-[#929292] bg-white"
                    : "border-[#B34000] text-[#B34000] bg-[#FEF5EE]"
              }>
                {FUNDING_STATUS_LABELS[p.funding_status] || p.funding_status}
              </Badge>
            )}
          </div>

          {/* Sources */}
          {p.source_url && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292] mb-0.5">Source principale</p>
              <a
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#000091] underline break-all hover:text-[#1212FF]"
                onClick={(e) => e.stopPropagation()}
              >
                {p.source_url}
              </a>
            </div>
          )}
          {p.sources_croisees && p.sources_croisees.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292] mb-1">
                Sources croisées ({p.sources_croisees.length})
              </p>
              <ul className="space-y-1">
                {p.sources_croisees.map((src, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <Badge className="border-[#e5e5e5] text-[#666666] bg-white">
                      {ORIENTATION_LABELS[src.orientation] || src.orientation}
                    </Badge>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#000091] underline break-all hover:text-[#1212FF]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {src.type || "Lien"}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right column: feasibility breakdown */}
        {p.feasibility && (
          <div>
            <div className="mb-3 flex items-baseline gap-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#666666]">Analyse de faisabilité</p>
              {p.feasibility.label && (
                <Badge className={`${feasibilityBg(p.feasibility.overall)} ${feasibilityTextColor(p.feasibility.overall)} border-current`}>
                  {p.feasibility.label}
                </Badge>
              )}
            </div>

            <div className="mb-4 border border-[#e5e5e5] bg-white p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#161616]">
                  Score global : {Math.round(p.feasibility.overall * 100)}%
                </span>
                {ci && (
                  <span className="text-[11px] text-[#929292]">
                    IC 95% : [{Math.round(ci[0] * 100)}% — {Math.round(ci[1] * 100)}%]
                  </span>
                )}
              </div>
              <div className="h-3 w-full bg-[#eeeeee]">
                <div
                  className={`h-full ${feasibilityColor(p.feasibility.overall)}`}
                  style={{ width: `${Math.round(p.feasibility.overall * 100)}%` }}
                />
              </div>
              {mc && (
                <p className="mt-1 text-[10px] text-[#929292]">
                  Monte Carlo — moy: {(mc.mean * 100).toFixed(1)}%, ecart-type: {(mc.std * 100).toFixed(1)}%, P5: {(mc.p5 * 100).toFixed(1)}%, P95: {(mc.p95 * 100).toFixed(1)}%
                </p>
              )}
            </div>

            {dims && (
              <div className="border border-[#e5e5e5] bg-white p-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292] mb-2">
                  7 dimensions MCDA
                </p>
                {Object.entries(dims).map(([key, dim]) => (
                  <DimensionBar key={key} name={key} dim={dim as FeasibilityDimension} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function PromiseList({ promises }: PromiseListProps) {
  const sorted = [...promises].sort((a, b) => a.theme.localeCompare(b.theme));
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (sorted.length === 0) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-[#161616]">Promesses</h3>
        <p className="text-[#666666]">Aucune promesse disponible.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#e5e5e5] bg-white">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-lg font-bold text-[#161616]">
          Promesses ({sorted.length})
        </h3>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 border-b-2 border-[#000091] px-6 pb-3">
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Thème</span>
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Promesse</span>
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Faisabilité</span>
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Fact-check</span>
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Coût</span>
        <span className="text-xs font-bold uppercase tracking-wide text-[#161616]">Sources</span>
      </div>

      {/* Promise rows */}
      {sorted.map((p) => {
        const score = p.feasibility?.overall ?? null;
        const isExpanded = expandedId === p.id;

        return (
          <div key={p.id}>
            <div
              className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-6 py-3 border-b border-[#e5e5e5] cursor-pointer transition-colors hover:bg-[#f6f6f6] ${isExpanded ? "bg-[#f6f6f6]" : ""}`}
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
            >
              {/* Theme */}
              <span className="self-start whitespace-nowrap">
                <span className="bg-[#f6f6f6] border border-[#e5e5e5] px-2.5 py-1 text-xs font-medium text-[#3a3a3a]">
                  {p.theme}
                </span>
              </span>

              {/* Promise text */}
              <div className="self-start min-w-0">
                <p className={`text-sm text-[#3a3a3a] ${isExpanded ? "" : "line-clamp-2"}`}>{p.raw_text}</p>
                <span className="text-[10px] text-[#000091]">
                  {isExpanded ? "Replier \u25B2" : "Détails \u25BC"}
                </span>
              </div>

              {/* Feasibility */}
              <div className="self-start whitespace-nowrap">
                {score !== null ? (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-[#eeeeee]">
                        <div
                          className={`h-full ${feasibilityColor(score)}`}
                          style={{ width: `${Math.round(score * 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${feasibilityTextColor(score)}`}>
                        {Math.round(score * 100)}%
                      </span>
                    </div>
                    {p.feasibility?.label && (
                      <span className="text-[10px] text-[#666666]">{p.feasibility.label}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-[#929292]">N/A</span>
                )}
              </div>

              {/* Fact-check */}
              <div className="self-start whitespace-nowrap">
                {p.factcheck_verdict ? (
                  <Badge className={VERDICT_STYLES[p.factcheck_verdict]?.cls || "border-[#929292] text-[#929292]"}>
                    {VERDICT_STYLES[p.factcheck_verdict]?.label || p.factcheck_verdict}
                  </Badge>
                ) : (
                  <span className="text-xs text-[#929292]">-</span>
                )}
              </div>

              {/* Cost */}
              <span className="self-start font-mono text-sm text-[#3a3a3a] whitespace-nowrap">
                {formatCost(p.cost_announced)}
              </span>

              {/* Sources */}
              <div className="self-start flex items-center gap-2">
                {p.source_orientation && (
                  <Badge className="border-[#e5e5e5] text-[#666666] bg-white">
                    {ORIENTATION_LABELS[p.source_orientation] || p.source_orientation}
                  </Badge>
                )}
                {p.sources_croisees && p.sources_croisees.length > 0 && (
                  <span className="text-[10px] text-[#929292]">
                    +{p.sources_croisees.length}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded detail panel — directly below the row */}
            {isExpanded && <ExpandedPanel p={p} />}
          </div>
        );
      })}
    </div>
  );
}
