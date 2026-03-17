"""Aggregator service — combines data from all sources into PartyProfile."""

from __future__ import annotations

from domain.models.party import PartyIdentity, PartyProfile, PartySummary
from domain.ports.party_repository import PartyRepository
from domain.ports.positioning_source import PositioningSource
from domain.ports.election_source import ElectionSource
from domain.ports.finance_source import FinanceSource
from domain.ports.promise_source import PromiseSource
from domain.ports.parliamentary_source import ParliamentarySource


class Aggregator:
    def __init__(
        self,
        party_repo: PartyRepository,
        positioning: PositioningSource,
        elections: ElectionSource,
        finance: FinanceSource,
        promises: PromiseSource,
        parliamentary: ParliamentarySource,
    ) -> None:
        self._party_repo = party_repo
        self._positioning = positioning
        self._elections = elections
        self._finance = finance
        self._promises = promises
        self._parliamentary = parliamentary

    def get_profile(self, slug: str) -> PartyProfile | None:
        identity = self._party_repo.get_identity(slug)
        if identity is None:
            return None

        return PartyProfile(
            identity=identity,
            positioning=self._positioning.get_positioning(slug),
            elections=self._elections.get_elections(slug),
            finance=self._finance.get_finance(slug),
            promises=self._promises.get_promises(slug),
            parliamentary=self._parliamentary.get_parliamentary(slug),
        )

    def get_all_profiles(self) -> list[PartyProfile]:
        profiles = []
        for slug in self._party_repo.get_all_slugs():
            profile = self.get_profile(slug)
            if profile is not None:
                profiles.append(profile)
        return profiles

    def get_all_summaries(self) -> list[PartySummary]:
        summaries = []
        for slug in self._party_repo.get_all_slugs():
            identity = self._party_repo.get_identity(slug)
            if identity is None:
                continue

            pos = self._positioning.get_positioning(slug)
            summaries.append(
                PartySummary(
                    slug=identity.slug,
                    name=identity.name,
                    short_name=identity.short_name,
                    family=identity.family,
                    color=identity.color,
                    lrgen=pos.lrgen if pos else None,
                    data_completeness={
                        "positioning": pos is not None,
                        "elections": len(self._elections.get_elections(slug)) > 0,
                        "finance": self._finance.get_finance(slug) is not None,
                        "promises": len(self._promises.get_promises(slug)) > 0,
                        "parliamentary": self._parliamentary.get_parliamentary(slug) is not None,
                    },
                )
            )
        return summaries
