"""data.gouv.fr adapter — parse legislative election results CSV.

Uses only the stdlib csv module (no pandas dependency).  Candidate blocks
in the wide-format CSV are discovered dynamically from the header row so
the parser tolerates a variable number of candidates per circumscription.
"""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from domain.models.election import ElectionResult
from domain.ports.election_source import ElectionSource

_ROOT = Path(__file__).resolve().parent.parent.parent  # backend/
_RAW_DATA = _ROOT / "scripts" / "raw_data"
_PARTY_MAPPING = _ROOT / "scripts" / "party_mapping.json"

# Regex to detect "Nuance candidat <N>" (with possible surrounding quotes)
_NUANCE_RE = re.compile(r"^Nuance candidat (\d+)$")

_CSV_FILES: list[dict[str, Any]] = [
    {
        "path": _RAW_DATA / "legislatives_2024_t1.csv",
        "election_type": "legislatives",
        "year": 2024,
        "round": 1,
    },
    {
        "path": _RAW_DATA / "legislatives_2024_t2.csv",
        "election_type": "legislatives",
        "year": 2024,
        "round": 2,
    },
]


def _strip_quotes(header: str) -> str:
    """Remove surrounding double-quotes from a header value."""
    if header.startswith('"') and header.endswith('"'):
        return header[1:-1]
    return header


def _find_candidate_blocks(headers: list[str]) -> list[dict[str, int]]:
    """Discover candidate blocks from the header row.

    Returns a list of dicts, each mapping canonical field names
    (``"nuance"``, ``"voix"``, ``"elu"``) to their column index.
    """
    cleaned = [_strip_quotes(h.strip()) for h in headers]

    # Locate all "Nuance candidat N" columns
    nuance_positions: list[tuple[int, int]] = []
    for idx, h in enumerate(cleaned):
        m = _NUANCE_RE.match(h)
        if m:
            nuance_positions.append((idx, int(m.group(1))))

    blocks: list[dict[str, int]] = []
    for _col_idx, n in nuance_positions:
        expected = {
            "nuance": f"Nuance candidat {n}",
            "voix": f"Voix {n}",
            "elu": f"Elu {n}",
        }
        block: dict[str, int] = {}
        for key, col_name in expected.items():
            try:
                block[key] = cleaned.index(col_name)
            except ValueError:
                break
        else:
            blocks.append(block)

    return blocks


def _parse_csv(path: Path) -> tuple[dict[str, int], dict[str, int]]:
    """Parse a single wide-format CSV.

    Returns
    -------
    votes_by_nuance : dict[str, int]
        Total votes per *nuance* code across all circumscriptions.
    seats_by_nuance : dict[str, int]
        Number of seats won per *nuance* code.
    """
    votes: dict[str, int] = {}
    seats: dict[str, int] = {}

    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh, delimiter=";")
        headers = next(reader)
        blocks = _find_candidate_blocks(headers)

        for row in reader:
            if not row:
                continue
            for block in blocks:
                nuance_idx = block["nuance"]
                voix_idx = block["voix"]
                elu_idx = block["elu"]

                # Guard against rows shorter than the block indices
                if max(nuance_idx, voix_idx, elu_idx) >= len(row):
                    continue

                nuance = row[nuance_idx].strip()
                voix_raw = row[voix_idx].strip()
                elu_raw = row[elu_idx].strip()

                if not nuance or not voix_raw:
                    continue

                try:
                    voix_val = int(voix_raw)
                except ValueError:
                    continue

                votes[nuance] = votes.get(nuance, 0) + voix_val

                if "élu" in elu_raw.lower():
                    seats[nuance] = seats.get(nuance, 0) + 1

    return votes, seats


class DataGouvAdapter(ElectionSource):
    """Adapter sourcing legislative election results from data.gouv.fr CSV exports."""

    def __init__(self) -> None:
        self._nuance_to_slug: dict[str, str] | None = None
        self._results_cache: dict[str, list[ElectionResult]] | None = None

    # ------------------------------------------------------------------
    # Party mapping
    # ------------------------------------------------------------------

    def _load_party_mapping(self) -> dict[str, str]:
        if self._nuance_to_slug is not None:
            return self._nuance_to_slug

        with open(_PARTY_MAPPING, encoding="utf-8") as fh:
            raw: dict[str, Any] = json.load(fh)

        mapping: dict[str, str] = {}
        for slug, meta in raw.items():
            nuance = meta.get("nuance_mi")
            if nuance:
                mapping[nuance] = slug

        # Coalition nuances used in 2024 legislatives
        # ENS (Ensemble) = Renaissance-led coalition
        mapping.setdefault("ENS", "renaissance")

        self._nuance_to_slug = mapping
        return mapping

    # ------------------------------------------------------------------
    # Aggregation
    # ------------------------------------------------------------------

    def _build_results(self) -> dict[str, list[ElectionResult]]:
        """Parse all configured CSVs and build per-slug result lists."""
        mapping = self._load_party_mapping()
        results: dict[str, list[ElectionResult]] = {}

        for cfg in _CSV_FILES:
            path: Path = cfg["path"]
            if not path.exists():
                continue

            votes_by_nuance, seats_by_nuance = _parse_csv(path)
            total_votes_all = sum(votes_by_nuance.values()) or 1

            for nuance, total_votes in votes_by_nuance.items():
                slug = mapping.get(nuance)
                if slug is None:
                    continue

                percentage = round(total_votes / total_votes_all * 100, 2)
                seat_count = seats_by_nuance.get(nuance, 0)

                results.setdefault(slug, []).append(
                    ElectionResult(
                        election_type=cfg["election_type"],
                        year=cfg["year"],
                        round=cfg["round"],
                        votes=total_votes,
                        percentage=percentage,
                        seats=seat_count,
                        candidate=None,
                    )
                )

        return results

    # ------------------------------------------------------------------
    # Port implementation
    # ------------------------------------------------------------------

    def get_elections(self, slug: str) -> list[ElectionResult]:
        if self._results_cache is None:
            self._results_cache = self._build_results()
        return self._results_cache.get(slug, [])
