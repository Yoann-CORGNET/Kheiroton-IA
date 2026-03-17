from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ParliamentaryActivity:
    legislature: int
    group_name: str
    group_size: int
    total_interventions: int
    total_amendments: int
    amendments_adopted_pct: float
    avg_presence_pct: float
    total_questions: int
    top_themes: list[str] = field(default_factory=list)
    key_votes: list[dict] = field(default_factory=list)
