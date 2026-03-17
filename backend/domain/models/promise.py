from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Promise:
    id: str
    party_slug: str
    candidate: str
    raw_text: str
    theme: str
    action_verb: str
    action_object: str
    quantification: dict | None
    cost_announced: dict | None
    funding_source: str | None
    timeline: str | None
    target_population: str | None
    classification: str
    precision_level: str
    feasibility: dict | None
