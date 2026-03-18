from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.election import ElectionResult


class ElectionSource(ABC):
    @abstractmethod
    def get_elections(self, slug: str) -> list[ElectionResult]: ...
