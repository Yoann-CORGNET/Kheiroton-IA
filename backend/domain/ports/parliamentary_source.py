from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.parliamentary import ParliamentaryActivity


class ParliamentarySource(ABC):
    @abstractmethod
    def get_parliamentary(self, slug: str) -> ParliamentaryActivity | None: ...
