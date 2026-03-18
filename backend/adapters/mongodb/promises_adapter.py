"""PromiseSource backed by MongoDB — reads programs stored by MCP agents."""

from __future__ import annotations

from typing import Any

from pymongo import MongoClient

from domain.models.promise import Promise
from domain.ports.promise_source import PromiseSource
from adapters.mongodb.client import MONGODB_URI, MONGODB_DB


class MongoPromiseSource(PromiseSource):
    """Read promises from the ``programs`` and ``results`` MongoDB collections.

    Uses pymongo (sync) instead of motor (async) because the Aggregator
    interface is synchronous and FastAPI sync routes run in a threadpool
    without an event loop.
    """

    def __init__(self) -> None:
        self._client = MongoClient(MONGODB_URI)
        self._db = self._client[MONGODB_DB]

    def get_promises(self, slug: str) -> list[Promise]:
        program = self._db.programs.find_one({"party_slug": slug})
        if program is None:
            return []

        feasibility_index, factcheck_index = self._load_results_index()

        candidate: str = program.get("candidate", "")
        promises: list[dict[str, Any]] = program.get("promises", [])

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
                feasibility=p.get("feasibility") or feasibility_index.get(p["id"]),
                source_url=p.get("source_url"),
                source_type=p.get("source_type"),
                source_orientation=p.get("source_orientation"),
                funding_status=p.get("funding_status"),
                candidate_justification=p.get("candidate_justification"),
                sources_croisees=p.get("sources_croisees"),
                factcheck_verdict=p.get("factcheck_verdict") or factcheck_index.get(p["id"]),
            )
            for p in promises
        ]

    def _load_results_index(self) -> tuple[dict[str, dict], dict[str, str]]:
        results = self._db.results.find_one(sort=[("_id", -1)])
        if results is None:
            return {}, {}

        feasibility_index: dict[str, dict] = {}
        factcheck_index: dict[str, str] = {}
        for prog in results.get("programs", {}).values():
            for p in prog.get("promises", []):
                pid = p.get("id")
                if not pid:
                    continue
                feas = p.get("feasibility")
                if feas:
                    feasibility_index[pid] = feas
                verdict = p.get("factcheck_verdict")
                if verdict:
                    factcheck_index[pid] = verdict
        return feasibility_index, factcheck_index
