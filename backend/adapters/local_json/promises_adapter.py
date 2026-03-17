from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from domain.models.promise import Promise
from domain.ports.promise_source import PromiseSource

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_PROGRAMS_DIR = _BACKEND_DIR.parent / "data_agreg" / "data" / "programs"
_RESULTATS_PATH = _BACKEND_DIR.parent / "data_agreg" / "output" / "resultats.json"
_PARTY_MAPPING_PATH = _BACKEND_DIR / "scripts" / "party_mapping.json"


def _load_party_mapping() -> dict[str, str | None]:
    """Return ``{slug: local_json_filename_or_None}`` from party_mapping.json."""
    with open(_PARTY_MAPPING_PATH, encoding="utf-8") as fh:
        raw: dict[str, dict[str, Any]] = json.load(fh)
    return {slug: entry.get("local_json") for slug, entry in raw.items()}


def _load_feasibility_index() -> dict[str, dict]:
    """Load feasibility scores from resultats.json, keyed by promise id."""
    if not _RESULTATS_PATH.exists():
        return {}
    with open(_RESULTATS_PATH, encoding="utf-8") as fh:
        data = json.load(fh)
    index: dict[str, dict] = {}
    for prog in data.get("programs", {}).values():
        for p in prog.get("promises", []):
            feas = p.get("feasibility")
            if feas and p.get("id"):
                index[p["id"]] = feas
    return index


class LocalJsonPromiseSource(PromiseSource):
    """``PromiseSource`` implementation reading from local JSON program files."""

    def __init__(self) -> None:
        self._slug_to_filename: dict[str, str | None] = _load_party_mapping()
        self._feasibility_index: dict[str, dict] = _load_feasibility_index()

    def get_promises(self, slug: str) -> list[Promise]:
        filename = self._slug_to_filename.get(slug)
        if filename is None:
            return []

        json_path = _PROGRAMS_DIR / f"{filename}.json"
        if not json_path.exists():
            return []

        with open(json_path, encoding="utf-8") as fh:
            data: dict[str, Any] = json.load(fh)

        candidate: str = data.get("candidate", "")
        promises: list[dict[str, Any]] = data.get("promises", [])

        return [
            Promise(
                id=p["id"],
                party_slug=slug,
                candidate=candidate,
                raw_text=p["raw_text"],
                theme=p["theme"],
                action_verb=p["action_verb"],
                action_object=p["action_object"],
                quantification=p.get("quantification"),
                cost_announced=p.get("cost_announced"),
                funding_source=p.get("funding_source"),
                timeline=p.get("timeline"),
                target_population=p.get("target_population"),
                classification=p["classification"],
                precision_level=p["precision_level"],
                feasibility=p.get("feasibility") or self._feasibility_index.get(p["id"]),
            )
            for p in promises
        ]
