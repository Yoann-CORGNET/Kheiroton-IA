"""Dependency injection — instantiate adapters and wire into services."""

from __future__ import annotations

from adapters.party_mapping.mapping import PartyMapping
from adapters.ches.ches_adapter import CHESAdapter
from adapters.parlgov.parlgov_adapter import ParlGovAdapter
from adapters.datagouv.datagouv_adapter import DataGouvAdapter
from adapters.cnccfp.cnccfp_adapter import CnccfpAdapter
from adapters.nosdeputes.nosdeputes_adapter import NosDeputesAdapter
from adapters.mongodb.promises_adapter import MongoPromiseSource
from domain.services.aggregator import Aggregator
from domain.services.comparator import Comparator


_aggregator: Aggregator | None = None
_comparator: Comparator | None = None


def get_aggregator() -> Aggregator:
    global _aggregator
    if _aggregator is not None:
        return _aggregator

    party_repo = PartyMapping()

    # Enrich family from ParlGov
    parlgov = ParlGovAdapter()
    for slug in party_repo.get_all_slugs():
        identity = party_repo.get_identity(slug)
        if identity:
            family = parlgov.get_family(slug)
            if family:
                identity.family = family

    _aggregator = Aggregator(
        party_repo=party_repo,
        positioning=CHESAdapter(),
        elections=DataGouvAdapter(),
        finance=CnccfpAdapter(),
        promises=MongoPromiseSource(),
        parliamentary=NosDeputesAdapter(),
    )
    return _aggregator


def get_comparator() -> Comparator:
    global _comparator
    if _comparator is None:
        _comparator = Comparator()
    return _comparator
