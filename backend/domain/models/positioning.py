from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PositionSnapshot:
    year: int
    lrgen: float
    lrecon: float
    galtan: float


@dataclass
class IdeologicalPosition:
    year: int
    lrgen: float
    lrecon: float
    galtan: float
    eu_position: float
    immigration: float
    environment: float
    redistribution: float
    antielite: float
    history: list[PositionSnapshot] = field(default_factory=list)
