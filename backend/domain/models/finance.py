from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PartyFinance:
    year: int
    total_revenue: float
    public_funding: float
    private_donations: float
    membership_fees: float
    total_expenses: float
    assets: float | None
