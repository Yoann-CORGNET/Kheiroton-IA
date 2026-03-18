from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ElectionResult:
    election_type: str     # "presidentielle", "legislatives", "europeennes"
    year: int
    round: int
    votes: int
    percentage: float
    seats: int | None
    candidate: str | None
