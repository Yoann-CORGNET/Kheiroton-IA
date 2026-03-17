"""Data models for PolitiScale pipeline."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Quantification:
    value: Optional[float] = None
    unit: Optional[str] = None


@dataclass
class CostEstimate:
    amount_eur: Optional[float] = None
    periodicity: Optional[str] = None
    note: Optional[str] = None


@dataclass
class DimensionScore:
    score: float  # 0.0 - 1.0
    confidence: float  # 0.0 - 1.0
    justification: str = ""
    key_findings: list[str] = field(default_factory=list)
    risks: list[str] = field(default_factory=list)


@dataclass
class FeasibilityScore:
    overall: float
    uncertainty: float
    ci_95: tuple[float, float]
    dimensions: dict[str, DimensionScore]
    monte_carlo: Optional[dict] = None
    label: str = ""  # "Tres faisable", "Faisable", etc.


@dataclass
class Promise:
    id: str
    program_id: str
    candidate: str
    party: str
    raw_text: str
    theme: str
    action_verb: str
    action_object: str
    quantification: Optional[Quantification] = None
    cost_announced: Optional[CostEstimate] = None
    funding_source: Optional[str] = None
    timeline: Optional[str] = None
    target_population: Optional[str] = None
    classification: str = "PROMESSE_CONCRETE"
    precision_level: str = "precis"
    source_url: Optional[str] = None
    source_type: Optional[str] = None
    feasibility: Optional[FeasibilityScore] = None


@dataclass
class ProgramSummary:
    candidate: str
    party: str
    election: str
    total_promises: int
    concrete_promises: int
    themes_covered: list[str]
    total_spending_eur: float
    total_savings_eur: float
    net_balance_eur: float
    avg_feasibility: Optional[float] = None
    feasibility_ci: Optional[tuple[float, float]] = None


@dataclass
class ComparisonResult:
    election: str
    programs: list[ProgramSummary]
    theme_comparison: dict  # theme -> {candidate -> stats}
    rankings: dict  # category -> [(candidate, score)]
    contradictions: list[dict]
    political_positioning: dict  # candidate -> {axis -> score}


# Weights for MCDA scoring
MCDA_WEIGHTS = {
    "legal": 0.15,
    "budget": 0.25,
    "technical": 0.15,
    "political": 0.10,
    "timeline": 0.10,
    "social": 0.10,
    "impact": 0.15,
}

# Theme labels
THEMES = {
    "economie": "Economie et pouvoir d'achat",
    "emploi": "Emploi et travail",
    "retraites": "Retraites",
    "sante": "Sante et protection sociale",
    "education": "Education et recherche",
    "securite": "Securite et justice",
    "immigration": "Immigration",
    "environnement": "Environnement et energie",
    "logement": "Logement",
    "institutions": "Institutions et democratie",
    "international": "International et defense",
    "culture": "Culture et sport",
    "agriculture": "Agriculture et alimentation",
    "numerique": "Numerique et technologie",
}

FEASIBILITY_LABELS = [
    (0.80, "Tres faisable"),
    (0.60, "Faisable"),
    (0.40, "Partiellement faisable"),
    (0.20, "Difficilement faisable"),
    (0.00, "Irrealiste"),
]


def get_feasibility_label(score: float) -> str:
    for threshold, label in FEASIBILITY_LABELS:
        if score >= threshold:
            return label
    return "Irrealiste"
