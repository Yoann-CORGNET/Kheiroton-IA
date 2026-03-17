#!/usr/bin/env python3
"""
PolitiScale Pipeline — POC
===========================
Runs the full pipeline on aggregated data:
1. Ingest programs + context data
2. Analyze each promise (feasibility scoring)
3. Compare programs
4. Generate report

Usage: python run_pipeline.py
"""

import json
import sys
import time
from pathlib import Path
from datetime import datetime

from ingest import load_all_programs, load_context_data, get_program_stats
from analyze import FeasibilityAnalyzer
from compare import (
    compare_by_theme,
    compute_budget_summary,
    compute_rankings,
    detect_contradictions,
    political_positioning,
)
from models import THEMES, get_feasibility_label

OUTPUT_DIR = Path(__file__).parent.parent / "output"


def run():
    start = time.time()
    print("=" * 70)
    print("  PolitiScale — Pipeline d'analyse de faisabilite (POC)")
    print("=" * 70)
    print()

    # ── Step 1: Ingest ──────────────────────────────────────────────────
    print("[1/4] Ingestion des programmes...")
    programs = load_all_programs()
    context = load_context_data()
    print(f"  → {len(programs)} programmes charges")
    print(f"  → {sum(len(p) for p in programs.values())} promesses totales")
    print(f"  → Contexte : {sum(len(v) for v in context.values())} fichiers\n")

    # ── Step 2: Analyze ─────────────────────────────────────────────────
    print("[2/4] Analyse de faisabilite...")
    analyzer = FeasibilityAnalyzer(context)

    total_promises = 0
    for prog_id, promises in programs.items():
        for promise in promises:
            promise.feasibility = analyzer.analyze_promise(promise)
            total_promises += 1
        candidate = promises[0].candidate if promises else prog_id
        avg = sum(p.feasibility.overall for p in promises) / len(promises)
        print(f"  → {candidate}: {len(promises)} promesses analysees "
              f"(score moyen: {avg:.2f} — {get_feasibility_label(avg)})")

    print(f"  → {total_promises} promesses analysees au total\n")

    # ── Step 3: Compare ─────────────────────────────────────────────────
    print("[3/4] Comparaison cross-programmes...")
    theme_comparison = compare_by_theme(programs)
    budget_summary = compute_budget_summary(programs)
    rankings = compute_rankings(programs)
    contradictions = detect_contradictions(programs)
    positioning = political_positioning(programs)

    print(f"  → {len(theme_comparison)} themes compares")
    print(f"  → {len(contradictions)} contradictions detectees")
    print(f"  → Positionnement politique calcule pour {len(positioning)} candidats\n")

    # ── Step 4: Generate Report ─────────────────────────────────────────
    print("[4/4] Generation du rapport...")
    OUTPUT_DIR.mkdir(exist_ok=True)

    report = generate_report(programs, theme_comparison, budget_summary,
                             rankings, contradictions, positioning)

    # Write Markdown report
    report_path = OUTPUT_DIR / "rapport_faisabilite.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"  → Rapport Markdown : {report_path}")

    # Write JSON data
    json_data = generate_json_output(programs, theme_comparison, budget_summary,
                                      rankings, contradictions, positioning)
    json_path = OUTPUT_DIR / "resultats.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2, default=str)
    print(f"  → Donnees JSON : {json_path}")

    elapsed = time.time() - start
    print(f"\n{'=' * 70}")
    print(f"  Pipeline terminee en {elapsed:.1f}s")
    print(f"{'=' * 70}")


def generate_report(programs, theme_comparison, budget_summary,
                    rankings, contradictions, positioning) -> str:
    """Generate the full Markdown report."""
    lines = []
    w = lines.append

    w("# PolitiScale — Rapport de faisabilite comparative")
    w(f"\n*Genere le {datetime.now().strftime('%Y-%m-%d %H:%M')} — Version POC*\n")
    w("> **Disclaimer** : Cette analyse est produite par un systeme automatise.")
    w("> Les scores sont des estimations heuristiques (version POC).")
    w("> En production, chaque dimension serait evaluee par un agent IA specialise avec RAG.\n")

    # ── Executive Summary ───────────────────────────────────────────────
    w("## 1. Resume executif\n")
    w("### Classement global par faisabilite\n")
    w("| Rang | Candidat | Score moyen | Label |")
    w("|------|----------|------------|-------|")
    for i, (candidate, score) in enumerate(rankings["overall_feasibility"], 1):
        label = get_feasibility_label(score)
        w(f"| {i} | {candidate} | {score:.3f} | {label} |")

    w("\n### Credibilite budgetaire\n")
    w("| Candidat | Depenses | Economies | Solde net | Score budget |")
    w("|----------|---------|-----------|-----------|-------------|")
    for candidate, data in sorted(budget_summary.items(),
                                   key=lambda x: x[1].get("avg_budget_feasibility", 0) or 0,
                                   reverse=True):
        w(f"| {candidate} "
          f"| {data['total_spending_eur']/1e9:.1f} Md EUR "
          f"| {data['total_savings_eur']/1e9:.1f} Md EUR "
          f"| {data['net_balance_eur']/1e9:.1f} Md EUR "
          f"| {data.get('avg_budget_feasibility', 'N/A')} |")

    # ── Top/Bottom Promises ─────────────────────────────────────────────
    w("\n### Promesses les plus faisables\n")
    w("| Candidat | Promesse | Score |")
    w("|----------|---------|-------|")
    for item in rankings.get("top_5_most_feasible", []):
        w(f"| {item['candidate']} | {item['promise']} | {item['score']:.3f} |")

    w("\n### Promesses les moins faisables\n")
    w("| Candidat | Promesse | Score |")
    w("|----------|---------|-------|")
    for item in rankings.get("top_5_least_feasible", []):
        w(f"| {item['candidate']} | {item['promise']} | {item['score']:.3f} |")

    # ── Theme Comparison ────────────────────────────────────────────────
    w("\n## 2. Comparaison par theme\n")
    for theme, data in sorted(theme_comparison.items()):
        theme_label = data.get("label", theme)
        w(f"### {theme_label}\n")
        w("| Candidat | Nb promesses | Faisabilite moy. | Meilleure promesse |")
        w("|----------|-------------|------------------|-------------------|")
        for candidate, cdata in sorted(data["candidates"].items(),
                                        key=lambda x: x[1].get("avg_feasibility") or 0,
                                        reverse=True):
            top = (cdata.get("top_promise") or "N/A")[:80]
            w(f"| {candidate} "
              f"| {cdata['num_promises']} "
              f"| {cdata.get('avg_feasibility', 'N/A')} "
              f"| {top} |")
        w("")

    # ── Contradictions ──────────────────────────────────────────────────
    w("\n## 3. Contradictions detectees\n")
    if not contradictions:
        w("Aucune contradiction majeure detectee.\n")
    else:
        for c in contradictions:
            w(f"**{c['candidate']}** — *{c['type']}* (severite: {c['severity']})")
            w(f"> {c['description']}\n")

    # ── Political Positioning ───────────────────────────────────────────
    w("\n## 4. Positionnement politique\n")
    w("*(0 = gauche/progressiste/internationaliste/ecologiste, "
      "100 = droite/conservateur/souverainiste/productiviste)*\n")
    w("| Candidat | Economique | Societal | Souverainete | Ecologie |")
    w("|----------|-----------|---------|-------------|---------|")
    for candidate, pos in sorted(positioning.items()):
        w(f"| {candidate} "
          f"| {pos.get('economique', 50)} "
          f"| {pos.get('societal', 50)} "
          f"| {pos.get('souverainete', 50)} "
          f"| {pos.get('ecologie', 50)} |")

    # ── Detailed Scores ─────────────────────────────────────────────────
    w("\n## 5. Fiches detaillees par candidat\n")
    for prog_id, promises in sorted(programs.items()):
        candidate = promises[0].candidate if promises else prog_id
        stats = get_program_stats(promises)
        w(f"### {candidate}\n")
        w(f"- **Parti** : {promises[0].party}")
        w(f"- **Promesses totales** : {stats['total_promises']} "
          f"({stats['concrete_promises']} concretes)")
        w(f"- **Themes couverts** : {stats['num_themes']}")
        w(f"- **Budget** : {stats['total_spending_eur']/1e9:.1f} Md EUR de depenses, "
          f"{stats['total_savings_eur']/1e9:.1f} Md EUR d'economies")
        w(f"- **Solde net** : {stats['net_balance_eur']/1e9:.1f} Md EUR/an\n")

        w("| # | Promesse | Theme | Score | Label | Budget | Juridique | Politique |")
        w("|---|---------|-------|-------|-------|--------|-----------|-----------|")
        for p in sorted(promises, key=lambda x: x.feasibility.overall if x.feasibility else 0, reverse=True):
            if not p.feasibility:
                continue
            f = p.feasibility
            text = p.raw_text[:70].replace("|", "/")
            w(f"| {p.id} | {text} | {p.theme} "
              f"| {f.overall:.2f} | {f.label} "
              f"| {f.dimensions['budget'].score:.2f} "
              f"| {f.dimensions['legal'].score:.2f} "
              f"| {f.dimensions['political'].score:.2f} |")
        w("")

    # ── Methodology ─────────────────────────────────────────────────────
    w("\n## 6. Methodologie\n")
    w("### Grille de scoring MCDA\n")
    w("| Critere | Poids |")
    w("|---------|-------|")
    from models import MCDA_WEIGHTS
    for dim, weight in MCDA_WEIGHTS.items():
        w(f"| {dim} | {weight*100:.0f}% |")

    w("\n### Echelle de notation\n")
    w("| Score | Label |")
    w("|-------|-------|")
    w("| 0.80+ | Tres faisable |")
    w("| 0.60-0.79 | Faisable |")
    w("| 0.40-0.59 | Partiellement faisable |")
    w("| 0.20-0.39 | Difficilement faisable |")
    w("| <0.20 | Irrealiste |")

    w("\n### Limites de la version POC\n")
    w("- Scoring heuristique (regles) au lieu d'agents LLM specialises")
    w("- Pas de RAG : les donnees contextuelles sont utilisees partiellement")
    w("- Pas de Monte Carlo pour les IC (simplification)")
    w("- Positionnement politique par mots-cles (production : LLM avec correlation >0.90)")
    w("- Pas de detection fine des contradictions inter-promesses")

    return "\n".join(lines)


def generate_json_output(programs, theme_comparison, budget_summary,
                          rankings, contradictions, positioning) -> dict:
    """Generate structured JSON output."""
    programs_data = {}
    for prog_id, promises in programs.items():
        programs_data[prog_id] = {
            "candidate": promises[0].candidate if promises else prog_id,
            "party": promises[0].party if promises else "",
            "stats": get_program_stats(promises),
            "promises": [
                {
                    "id": p.id,
                    "raw_text": p.raw_text,
                    "theme": p.theme,
                    "action": f"{p.action_verb} {p.action_object}",
                    "cost_eur": p.cost_announced.amount_eur if p.cost_announced else None,
                    "classification": p.classification,
                    "source_url": p.source_url,
                    "source_type": p.source_type,
                    "feasibility": {
                        "overall": p.feasibility.overall,
                        "label": p.feasibility.label,
                        "ci_95": list(p.feasibility.ci_95),
                        "dimensions": {
                            dim: {
                                "score": ds.score,
                                "confidence": ds.confidence,
                                "justification": ds.justification,
                            }
                            for dim, ds in p.feasibility.dimensions.items()
                        },
                        "monte_carlo": p.feasibility.monte_carlo,
                    } if p.feasibility else None,
                }
                for p in promises
            ],
        }

    return {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "pipeline_version": "POC-1.0",
            "methodology": "Rule-based heuristics (production: LLM multi-agent + RAG)",
        },
        "programs": programs_data,
        "comparison": {
            "theme_comparison": theme_comparison,
            "budget_summary": budget_summary,
            "rankings": rankings,
            "contradictions": contradictions,
            "political_positioning": positioning,
        },
    }


if __name__ == "__main__":
    run()
