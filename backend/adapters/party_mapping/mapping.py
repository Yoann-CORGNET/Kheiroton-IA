from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from domain.models.party import PartyIdentity
from domain.ports.party_repository import PartyRepository

_JSON_PATH = Path(__file__).resolve().parent.parent.parent / "scripts" / "party_mapping.json"


class PartyMapping(PartyRepository):
    """Concrete ``PartyRepository`` backed by the static JSON mapping file."""

    def __init__(self, path: Path = _JSON_PATH) -> None:
        with open(path, encoding="utf-8") as fh:
            self._data: dict[str, dict[str, Any]] = json.load(fh)
        self._identity_cache: dict[str, PartyIdentity] = {}

    # --- PartyRepository interface -------------------------------------------

    def get_all_slugs(self) -> list[str]:
        """Return every party slug present in the mapping."""
        return list(self._data.keys())

    def get_identity(self, slug: str) -> PartyIdentity | None:
        """Build a ``PartyIdentity`` from the mapping data, or *None*."""
        if slug in self._identity_cache:
            return self._identity_cache[slug]

        entry = self._data.get(slug)
        if entry is None:
            return None

        ids: dict[str, str] = {
            "ches": str(entry["ches_party_id"]),
            "parlgov": str(entry["parlgov_id"]),
            "cnccfp": entry["cnccfp_name"],
        }

        identity = PartyIdentity(
            slug=slug,
            name=entry["name"],
            short_name=entry["short_name"],
            leader=entry["leader"],
            founded=entry["founded"],
            family="",
            nuance_mi=entry["nuance_mi"],
            color=entry["color"],
            ids=ids,
        )
        self._identity_cache[slug] = identity
        return identity

    # --- extra helper --------------------------------------------------------

    def get_mapping(self, slug: str) -> dict[str, Any] | None:
        """Return the raw mapping dict for *slug*, or *None*."""
        return self._data.get(slug)
