"""Comparator service — compares N parties across all dimensions."""

from __future__ import annotations

from dataclasses import dataclass, field

from domain.models.party import PartyProfile


@dataclass
class ComparisonResult:
    parties: list[str]
    positioning_radar: dict[str, dict]
    finance_comparison: dict[str, dict]
    promise_themes: dict[str, list]
    parliamentary_activity: dict[str, dict]


class Comparator:
    def compare(self, profiles: list[PartyProfile]) -> ComparisonResult:
        slugs = [p.identity.slug for p in profiles]

        positioning_radar: dict[str, dict] = {}
        finance_comparison: dict[str, dict] = {}
        promise_themes: dict[str, list] = {}
        parliamentary_activity: dict[str, dict] = {}

        for p in profiles:
            slug = p.identity.slug

            if p.positioning:
                positioning_radar[slug] = {
                    "lrgen": p.positioning.lrgen,
                    "lrecon": p.positioning.lrecon,
                    "galtan": p.positioning.galtan,
                    "eu_position": p.positioning.eu_position,
                    "immigration": p.positioning.immigration,
                    "environment": p.positioning.environment,
                    "redistribution": p.positioning.redistribution,
                    "antielite": p.positioning.antielite,
                }

            if p.finance:
                finance_comparison[slug] = {
                    "total_revenue": p.finance.total_revenue,
                    "public_funding": p.finance.public_funding,
                    "private_donations": p.finance.private_donations,
                    "total_expenses": p.finance.total_expenses,
                }

            if p.promises:
                themes: dict[str, int] = {}
                total_cost = 0.0
                feasibility_scores = []
                for pr in p.promises:
                    themes[pr.theme] = themes.get(pr.theme, 0) + 1
                    if pr.cost_announced and isinstance(pr.cost_announced, dict):
                        amt = pr.cost_announced.get("amount_eur", 0)
                        if amt:
                            total_cost += amt
                    if pr.feasibility and isinstance(pr.feasibility, dict):
                        overall = pr.feasibility.get("overall")
                        if overall is not None:
                            feasibility_scores.append(overall)

                promise_themes[slug] = {
                    "count": len(p.promises),
                    "themes": themes,
                    "total_cost_eur": total_cost,
                    "avg_feasibility": (
                        sum(feasibility_scores) / len(feasibility_scores)
                        if feasibility_scores
                        else None
                    ),
                }

            if p.parliamentary:
                parliamentary_activity[slug] = {
                    "group_size": p.parliamentary.group_size,
                    "total_interventions": p.parliamentary.total_interventions,
                    "total_amendments": p.parliamentary.total_amendments,
                    "amendments_adopted_pct": p.parliamentary.amendments_adopted_pct,
                    "avg_presence_pct": p.parliamentary.avg_presence_pct,
                    "total_questions": p.parliamentary.total_questions,
                }

        return ComparisonResult(
            parties=slugs,
            positioning_radar=positioning_radar,
            finance_comparison=finance_comparison,
            promise_themes=promise_themes,
            parliamentary_activity=parliamentary_activity,
        )
