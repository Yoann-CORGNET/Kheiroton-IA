"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { PartyProfile } from "@/lib/api";
import PositioningRadar from "@/components/PositioningRadar";
import PositioningTimeline from "@/components/PositioningTimeline";
import ElectionResults from "@/components/ElectionResults";
import FinanceSummary from "@/components/FinanceSummary";
import PromiseList from "@/components/PromiseList";
import ParliamentaryStats from "@/components/ParliamentaryStats";

const TABS = [
  { id: "positionnement", label: "Positionnement" },
  { id: "elections", label: "Élections" },
  { id: "finance", label: "Finance" },
  { id: "promesses", label: "Promesses" },
  { id: "parlement", label: "Parlement" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PartyPage({
  params,
}: {
  params: globalThis.Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [party, setParty] = useState<PartyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("positionnement");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .getParty(slug)
      .then((data) => {
        if (!cancelled) {
          setParty(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || "Erreur lors du chargement");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 animate-spin border-2 border-[#e5e5e5] border-t-[#000091]" />
          <span className="ml-3 text-[#666666]">Chargement...</span>
        </div>
      </main>
    );
  }

  if (error || !party) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#000091] transition-colors hover:text-[#1212FF]"
        >
          &larr; Retour aux partis
        </Link>
        <div className="border border-[#e5e5e5] bg-white p-8 text-center">
          <p className="text-lg font-semibold text-[#CE0500]">
            {error || "Parti introuvable"}
          </p>
          <p className="mt-2 text-sm text-[#666666]">
            Impossible de charger le profil du parti.
          </p>
        </div>
      </main>
    );
  }

  const { identity } = party;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#000091] transition-colors hover:text-[#1212FF]"
      >
        &larr; Retour aux partis
      </Link>

      {/* Party header */}
      <div className="mb-8 border border-[#e5e5e5] bg-white p-6">
        <div className="flex items-start gap-4">
          <div
            className="mt-1 h-4 w-4 shrink-0"
            style={{ backgroundColor: identity.color }}
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#161616]">
              {identity.name}
              <span className="ml-2 text-lg font-normal text-[#666666]">
                ({identity.short_name})
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#666666]">
              <span>
                Leader : <span className="font-medium text-[#161616]">{identity.leader}</span>
              </span>
              <span>
                Fondé en :{" "}
                <span className="font-medium text-[#161616]">{identity.founded}</span>
              </span>
              <span>
                Famille :{" "}
                <span className="font-medium text-[#161616]">{identity.family}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-0 overflow-x-auto border-b-2 border-[#e5e5e5]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-[3px] border-[#000091] text-[#000091] -mb-[2px]"
                : "text-[#666666] hover:text-[#161616] hover:bg-[#f6f6f6]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === "positionnement" && (
          <>
            {party.positioning ? (
              <>
                <PositioningRadar
                  positioning={party.positioning}
                  color={identity.color}
                />
                {party.positioning.history.length > 0 && (
                  <PositioningTimeline
                    history={party.positioning.history}
                    color={identity.color}
                  />
                )}
              </>
            ) : (
              <div className="border border-[#e5e5e5] bg-white p-6">
                <p className="text-[#666666]">
                  Données de positionnement non disponibles.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "elections" && (
          <ElectionResults
            elections={party.elections}
            color={identity.color}
          />
        )}

        {activeTab === "finance" && (
          <>
            {party.finance ? (
              <FinanceSummary finance={party.finance} />
            ) : (
              <div className="border border-[#e5e5e5] bg-white p-6">
                <p className="text-[#666666]">
                  Données financières non disponibles.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "promesses" && (
          <PromiseList promises={party.promises} />
        )}

        {activeTab === "parlement" && (
          <>
            {party.parliamentary ? (
              <ParliamentaryStats parliamentary={party.parliamentary} />
            ) : (
              <div className="border border-[#e5e5e5] bg-white p-6">
                <p className="text-[#666666]">
                  Données parlementaires non disponibles.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
