from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.positioning import IdeologicalPosition


class PositioningSource(ABC):
    @abstractmethod
    def get_positioning(self, slug: str) -> IdeologicalPosition | None: ...
