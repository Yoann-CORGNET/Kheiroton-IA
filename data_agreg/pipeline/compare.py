"""
Phase 6 — Comparison: Cross-program analysis and ranking.
"""

from collections import defaultdict
from models import Promise, FeasibilityScore, THEMES


def compare_by_theme(programs: dict[str, list[Promise]]) -> dict:
    """Compare programs theme by theme."""
    comparison = {}

    all_themes = set()
    for promises in programs.values():
        for p in promises:
            all_themes.add(p.theme)

    for theme in sorted(all_themes):
        comparison[theme] = {
            "label": THEMES.get(theme, theme),
            "candidates": {},
        }
        for prog_id, promises in programs.items():
            theme_promises = [p for p in promises if p.theme == theme]
            if not theme_promises:
                continue

            candidate = theme_promises[0].candidate
            scores = [p.feasibility.overall for p in theme_promises if p.feasibility]

            comparison[theme]["candidates"][candidate] = {
                "num_promises": len(theme_promises),
                "avg_feasibility": round(sum(scores) / len(scores), 3) if scores else None,
                "top_promise": max(theme_promises, key=lambda p: p.feasibility.overall if p.feasibility else 0).raw_text if theme_promises else None,
                "worst_promise": min(theme_promises, key=lambda p: p.feasibility.overall if p.feasibility else 1).raw_text if theme_promises else None,
            }

    return comparison


def compute_budget_summary(programs: dict[str, list[Promise]]) -> dict:
    """Compute budget summary for each program."""
    summaries = {}

    for prog_id, promises in programs.items():
        candidate = promises[0].candidate if promises else prog_id
        spending = 0.0
        savings = 0.0
        no_cost_count = 0

        for p in promises:
            if p.cost_announced and p.cost_announced.amount_eur:
                amt = p.cost_announced.amount_eur
                if amt > 0:
                    spending += amt
                else:
                    savings += abs(amt)
            else:
                no_cost_count += 1

        summaries[candidate] = {
            "total_spending_eur": spending,
            "total_savings_eur": savings,
            "net_balance_eur": savings - spending,
            "net_balance_gdp_pct": round((savings - spending) / 2.8e12 * 100, 2),  # ~2.8T GDP
            "promises_without_cost": no_cost_count,
            "avg_budget_feasibility": None,  # filled later
        }

        # Avg budget feasibility
        budget_scores = [
            p.feasibility.dimensions["budget"].score
            for p in promises
            if p.feasibility and "budget" in p.feasibility.dimensions
        ]
        if budget_scores:
            summaries[candidate]["avg_budget_feasibility"] = round(
                sum(budget_scores) / len(budget_scores), 3
            )

    return summaries


def compute_rankings(programs: dict[str, list[Promise]]) -> dict:
    """Rank programs by various criteria."""
    rankings = {}

    # Overall feasibility ranking
    program_scores = []
    for prog_id, promises in programs.items():
        candidate = promises[0].candidate if promises else prog_id
        scores = [p.feasibility.overall for p in promises if p.feasibility]
        if scores:
            avg = sum(scores) / len(scores)
            program_scores.append((candidate, round(avg, 3)))

    rankings["overall_feasibility"] = sorted(program_scores, key=lambda x: -x[1])

    # Budget credibility ranking
    budget_scores = []
    for prog_id, promises in programs.items():
        candidate = promises[0].candidate if promises else prog_id
        scores = [
            p.feasibility.dimensions["budget"].score
            for p in promises
            if p.feasibility and "budget" in p.feasibility.dimensions
        ]
        if scores:
            budget_scores.append((candidate, round(sum(scores) / len(scores), 3)))

    rankings["budget_credibility"] = sorted(budget_scores, key=lambda x: -x[1])

    # By theme
    rankings["by_theme"] = {}
    all_themes = set()
    for promises in programs.values():
        for p in promises:
            all_themes.add(p.theme)

    for theme in sorted(all_themes):
        theme_scores = []
        for prog_id, promises in programs.items():
            candidate = promises[0].candidate if promises else prog_id
            scores = [
                p.feasibility.overall
                for p in promises
                if p.feasibility and p.theme == theme
            ]
            if scores:
                theme_scores.append((candidate, round(sum(scores) / len(scores), 3)))
        rankings["by_theme"][theme] = sorted(theme_scores, key=lambda x: -x[1])

    # Most/least feasible promises across all programs
    all_promises = []
    for promises in programs.values():
        all_promises.extend(p for p in promises if p.feasibility)

    if all_promises:
        sorted_all = sorted(all_promises, key=lambda p: p.feasibility.overall, reverse=True)
        rankings["top_5_most_feasible"] = [
            {
                "candidate": p.candidate,
                "promise": p.raw_text[:100],
                "score": p.feasibility.overall,
                "label": p.feasibility.label,
            }
            for p in sorted_all[:5]
        ]
        rankings["top_5_least_feasible"] = [
            {
                "candidate": p.candidate,
                "promise": p.raw_text[:100],
                "score": p.feasibility.overall,
                "label": p.feasibility.label,
            }
            for p in sorted_all[-5:]
        ]

    return rankings


def detect_contradictions(programs: dict[str, list[Promise]]) -> list[dict]:
    """Detect potential contradictions within each program."""
    contradictions = []

    for prog_id, promises in programs.items():
        candidate = promises[0].candidate if promises else prog_id

        # Budget contradiction: total spending >> total savings
        spending = sum(
            p.cost_announced.amount_eur
            for p in promises
            if p.cost_announced and p.cost_announced.amount_eur and p.cost_announced.amount_eur > 0
        )
        savings = sum(
            abs(p.cost_announced.amount_eur)
            for p in promises
            if p.cost_announced and p.cost_announced.amount_eur and p.cost_announced.amount_eur < 0
        )

        if spending > 0 and savings > 0 and spending > savings * 2:
            contradictions.append({
                "candidate": candidate,
                "type": "budget_impossible",
                "severity": "forte",
                "description": (
                    f"Depenses ({spending/1e9:.1f} Md EUR) largement superieures "
                    f"aux economies ({savings/1e9:.1f} Md EUR). "
                    f"Deficit non finance de {(spending - savings)/1e9:.1f} Md EUR/an."
                ),
            })

        # Tax cut + spending increase = contradiction
        tax_cuts = [p for p in promises if p.action_verb.lower() in ["supprimer", "reduire", "baisser"]
                    and p.theme == "economie"
                    and p.cost_announced and p.cost_announced.amount_eur and p.cost_announced.amount_eur > 0]
        spending_increases = [p for p in promises if p.cost_announced
                             and p.cost_announced.amount_eur and p.cost_announced.amount_eur > 10e9]

        if tax_cuts and spending_increases:
            contradictions.append({
                "candidate": candidate,
                "type": "policy_conflict",
                "severity": "moderee",
                "description": (
                    f"Baisses d'impots ({len(tax_cuts)} mesures) et hausse massive "
                    f"des depenses ({len(spending_increases)} mesures > 10 Md EUR) simultanees."
                ),
            })

    return contradictions


def political_positioning(programs: dict[str, list[Promise]]) -> dict:
    """Estimate political positioning on 6 axes based on promise content."""
    positioning = {}

    # Simple keyword-based positioning (POC — production would use LLM)
    axes_keywords = {
        "economique": {
            "left": ["nationaliser", "planifier", "reguler", "taxer les riches",
                     "impot sur la fortune", "ISF", "prix maximum", "encadrer"],
            "right": ["privatiser", "dereglementater", "baisser les charges",
                      "competitivite", "liberaliser", "supprimer l'ISF", "flat tax"],
        },
        "societal": {
            "left": ["mariage", "PMA", "GPA", "diversite", "discrimination",
                     "egalite femmes-hommes", "parite"],
            "right": ["tradition", "famille", "identite", "assimilation",
                      "civilisation", "racines"],
        },
        "souverainete": {
            "left": ["Europe", "europeen", "multilateral", "cooperation",
                     "integration europeenne"],
            "right": ["souverainete", "Frexit", "national", "frontiere",
                      "protectionnisme", "patriotisme economique"],
        },
        "ecologie": {
            "left": ["renouvelable", "sortir du nucleaire", "climat",
                     "biodiversite", "decarboner", "transition"],
            "right": ["nucleaire", "croissance", "industrie", "competitivite",
                      "technologie", "innovation"],
        },
    }

    for prog_id, promises in programs.items():
        candidate = promises[0].candidate if promises else prog_id
        all_text = " ".join(p.raw_text.lower() for p in promises)

        pos = {}
        for axis, keywords in axes_keywords.items():
            left_count = sum(1 for kw in keywords["left"] if kw.lower() in all_text)
            right_count = sum(1 for kw in keywords["right"] if kw.lower() in all_text)
            total = left_count + right_count
            if total > 0:
                # 0 = fully left, 100 = fully right
                pos[axis] = round(right_count / total * 100)
            else:
                pos[axis] = 50  # neutral/unknown

        positioning[candidate] = pos

    return positioning
