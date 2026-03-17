"""Dependency injection — instantiate adapters and wire into services."""

from __future__ import annotations

from functools import lru_cache

from adapters.party_mapping.mapping import PartyMapping
from adapters.ches.ches_adapter import CHESAdapter
from adapters.parlgov.parlgov_adapter import ParlGovAdapter
from adapters.datagouv.datagouv_adapter import DataGouvAdapter
from adapters.cnccfp.cnccfp_adapter import CnccfpAdapter
from adapters.nosdeputes.nosdeputes_adapter import NosDeputesAdapter
from adapters.local_json.promises_adapter import LocalJsonPromiseSource
from domain.services.aggregator import Aggregator
from domain.services.comparator import Comparator


@lru_cache(maxsize=1)
def get_aggregator() -> Aggregator:
    party_repo = PartyMapping()

    # Enrich family from ParlGov
    parlgov = ParlGovAdapter()
    for slug in party_repo.get_all_slugs():
        identity = party_repo.get_identity(slug)
        if identity:
            family = parlgov.get_family(slug)
            if family:
                identity.family = family

    return Aggregator(
        party_repo=party_repo,
        positioning=CHESAdapter(),
        elections=DataGouvAdapter(),
        finance=CnccfpAdapter(),
        promises=LocalJsonPromiseSource(),
        parliamentary=NosDeputesAdapter(),
    )


@lru_cache(maxsize=1)
def get_comparator() -> Comparator:
    return Comparator()
