from __future__ import annotations

from abc import ABC, abstractmethod

from domain.models.finance import PartyFinance


class FinanceSource(ABC):
    @abstractmethod
    def get_finance(self, slug: str) -> PartyFinance | None: ...
