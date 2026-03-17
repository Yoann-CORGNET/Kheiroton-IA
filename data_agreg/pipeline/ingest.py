"""
Phase 1 — Ingestion: Load and normalize program data from JSON files.
"""

import json
import os
from pathlib import Path
from models import Promise, Quantification, CostEstimate


DATA_DIR = Path(__file__).parent.parent / "data"


def load_program(filepath: str) -> list[Promise]:
    """Load a single program JSON file and return list of Promise objects."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    candidate = data["candidate"]
    party = data["party"]
    program_id = Path(filepath).stem  # e.g. "macron_2022"

    promises = []
    for p in data["promises"]:
        quant = None
        if p.get("quantification"):
            quant = Quantification(
                value=p["quantification"].get("value"),
                unit=p["quantification"].get("unit"),
            )

        cost = None
        if p.get("cost_announced"):
            cost = CostEstimate(
                amount_eur=p["cost_announced"].get("amount_eur"),
                periodicity=p["cost_announced"].get("periodicity"),
                note=p["cost_announced"].get("note"),
            )

        promise = Promise(
            id=p["id"],
            program_id=program_id,
            candidate=candidate,
            party=party,
            raw_text=p["raw_text"],
            theme=p["theme"],
            action_verb=p["action_verb"],
            action_object=p["action_object"],
            quantification=quant,
            cost_announced=cost,
            funding_source=p.get("funding_source"),
            timeline=p.get("timeline"),
            target_population=p.get("target_population"),
            classification=p.get("classification", "PROMESSE_CONCRETE"),
            precision_level=p.get("precision_level", "precis"),
            source_url=p.get("source_url"),
            source_type=p.get("source_type"),
        )
        promises.append(promise)

    return promises


def load_all_programs() -> dict[str, list[Promise]]:
    """Load all programs from data/programs/ directory."""
    programs_dir = DATA_DIR / "programs"
    all_programs = {}

    for filepath in sorted(programs_dir.glob("*.json")):
        program_id = filepath.stem
        promises = load_program(str(filepath))
        all_programs[program_id] = promises
        print(f"  Loaded {program_id}: {len(promises)} promises")

    return all_programs


def load_context_data() -> dict:
    """Load all context data (economic, legal, precedents, evaluations)."""
    context = {}

    for category in ["economic", "legal", "precedents", "evaluations"]:
        category_dir = DATA_DIR / category
        context[category] = {}
        for filepath in sorted(category_dir.glob("*.json")):
            with open(filepath, "r", encoding="utf-8") as f:
                context[category][filepath.stem] = json.load(f)

    return context


def get_program_stats(promises: list[Promise]) -> dict:
    """Compute basic statistics for a list of promises."""
    concrete = [p for p in promises if p.classification == "PROMESSE_CONCRETE"]
    themes = sorted(set(p.theme for p in promises))

    total_spending = 0.0
    total_savings = 0.0
    for p in promises:
        if p.cost_announced and p.cost_announced.amount_eur:
            amt = p.cost_announced.amount_eur
            if amt > 0:
                total_spending += amt
            else:
                total_savings += abs(amt)

    return {
        "total_promises": len(promises),
        "concrete_promises": len(concrete),
        "vague_promises": len(promises) - len(concrete),
        "themes_covered": themes,
        "num_themes": len(themes),
        "total_spending_eur": total_spending,
        "total_savings_eur": total_savings,
        "net_balance_eur": total_savings - total_spending,
        "promises_with_cost": len([p for p in promises if p.cost_announced and p.cost_announced.amount_eur]),
        "promises_with_funding": len([p for p in promises if p.funding_source]),
        "promises_with_timeline": len([p for p in promises if p.timeline]),
        "precision_breakdown": {
            "tres_precis": len([p for p in promises if p.precision_level == "tres_precis"]),
            "precis": len([p for p in promises if p.precision_level == "precis"]),
            "vague": len([p for p in promises if p.precision_level == "vague"]),
        },
    }


if __name__ == "__main__":
    print("=== PolitiScale — Ingestion ===\n")

    programs = load_all_programs()
    print(f"\nLoaded {len(programs)} programs total\n")

    for program_id, promises in programs.items():
        stats = get_program_stats(promises)
        candidate = promises[0].candidate if promises else "Unknown"
        print(f"--- {candidate} ({program_id}) ---")
        print(f"  Promises: {stats['total_promises']} ({stats['concrete_promises']} concrete)")
        print(f"  Themes: {stats['num_themes']} ({', '.join(stats['themes_covered'])})")
        print(f"  Budget: +{stats['total_savings_eur']/1e9:.1f} Md EUR savings, "
              f"-{stats['total_spending_eur']/1e9:.1f} Md EUR spending")
        print(f"  Net: {stats['net_balance_eur']/1e9:.1f} Md EUR/an")
        print(f"  Precision: {stats['precision_breakdown']}")
        print(f"  With cost: {stats['promises_with_cost']}, "
              f"with funding: {stats['promises_with_funding']}, "
              f"with timeline: {stats['promises_with_timeline']}")
        print()

    print("=== Context Data ===\n")
    context = load_context_data()
    for category, files in context.items():
        print(f"  {category}: {list(files.keys())}")
