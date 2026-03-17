from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.promise import Promise


class PromiseSource(ABC):
    @abstractmethod
    def get_promises(self, slug: str) -> list[Promise]: ...
