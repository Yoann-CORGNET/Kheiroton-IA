from __future__ import annotations

from dataclasses import dataclass, field

from domain.models.positioning import IdeologicalPosition
from domain.models.election import ElectionResult
from domain.models.finance import PartyFinance
from domain.models.promise import Promise
from domain.models.parliamentary import ParliamentaryActivity


@dataclass
class PartyIdentity:
    slug: str              # "renaissance", "rn", "lfi"
    name: str              # "Renaissance"
    short_name: str        # "REN"
    leader: str            # "Emmanuel Macron"
    founded: int           # 2016
    family: str            # "Liberal"
    nuance_mi: str         # "REN"
    color: str             # "#FFD600"
    ids: dict[str, str] = field(default_factory=dict)


@dataclass
class PartyProfile:
    identity: PartyIdentity
    positioning: IdeologicalPosition | None
    elections: list[ElectionResult] = field(default_factory=list)
    finance: PartyFinance | None = None
    promises: list[Promise] = field(default_factory=list)
    parliamentary: ParliamentaryActivity | None = None


@dataclass
class PartySummary:
    slug: str
    name: str
    short_name: str
    family: str
    color: str
    lrgen: float | None
    data_completeness: dict[str, bool] = field(default_factory=dict)
