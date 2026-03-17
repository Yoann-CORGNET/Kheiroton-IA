from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.party import PartyIdentity


class PartyRepository(ABC):
    @abstractmethod
    def get_all_slugs(self) -> list[str]: ...

    @abstractmethod
    def get_identity(self, slug: str) -> PartyIdentity | None: ...
