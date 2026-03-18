from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from domain.models.finance import PartyFinance
from domain.ports.finance_source import FinanceSource

_BASE = Path(__file__).resolve().parent.parent.parent  # backend/
_CSV_PATH = _BASE / "scripts" / "raw_data" / "cnccfp_comptes.csv"
_MAPPING_PATH = _BASE / "scripts" / "party_mapping.json"


class CnccfpAdapter(FinanceSource):
    """``FinanceSource`` backed by CNCCFP party-account CSV data."""

    def __init__(
        self,
        csv_path: Path = _CSV_PATH,
        mapping_path: Path = _MAPPING_PATH,
    ) -> None:
        self._csv_path = csv_path
        self._mapping_path = mapping_path

        # Lazy-loaded caches
        self._slug_by_cnccfp: dict[str, str] | None = None
        self._df: pd.DataFrame | None = None

    # --- lazy loaders --------------------------------------------------------

    def _load_mapping(self) -> dict[str, str]:
        """Build a ``cnccfp_name -> slug`` lookup from party_mapping.json."""
        if self._slug_by_cnccfp is not None:
            return self._slug_by_cnccfp

        with open(self._mapping_path, encoding="utf-8") as fh:
            raw: dict[str, dict[str, Any]] = json.load(fh)

        self._slug_by_cnccfp = {
            entry["cnccfp_name"]: slug
            for slug, entry in raw.items()
            if entry.get("cnccfp_name")
        }
        return self._slug_by_cnccfp

    def _load_csv(self) -> pd.DataFrame:
        """Load and lightly clean the CNCCFP CSV (semicolon-separated, BOM)."""
        if self._df is not None:
            return self._df

        df = pd.read_csv(self._csv_path, sep=";", encoding="utf-8-sig")

        # Coerce numeric columns used for scoring
        numeric_cols = [
            "Exercice",
            "Cotisations_des_adherents",
            "Cotisations_des_elus",
            "Aide_publique_1ere_fraction",
            "Aide_publique_2nde_fraction",
            "Autres_aides_publiques",
            "Dons_de_personne_physique",
            "Total_des_produits_I_+_III_+_V",
            "Total_des_charges_II_+_IV_+VI_+_VII_+_VIII_+_IX",
        ]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        self._df = df
        return self._df

    # --- FinanceSource interface ---------------------------------------------

    def get_finance(self, slug: str) -> PartyFinance | None:
        """Return the most recent :class:`PartyFinance` for *slug*, or *None*."""
        mapping = self._load_mapping()
        df = self._load_csv()

        # Reverse lookup: slug -> cnccfp_name
        cnccfp_name: str | None = None
        for name, s in mapping.items():
            if s == slug:
                cnccfp_name = name
                break

        if cnccfp_name is None:
            return None

        rows = df[df["Nom_du_parti"] == cnccfp_name]
        if rows.empty:
            return None

        # Most recent fiscal year
        latest = rows.loc[rows["Exercice"].idxmax()]

        def _val(col: str) -> float:
            """Extract a float value, defaulting to 0.0 on NaN/missing."""
            v = latest.get(col)
            if v is None or pd.isna(v):
                return 0.0
            return float(v)

        return PartyFinance(
            year=int(_val("Exercice")),
            total_revenue=_val("Total_des_produits_I_+_III_+_V"),
            public_funding=(
                _val("Aide_publique_1ere_fraction")
                + _val("Aide_publique_2nde_fraction")
                + _val("Autres_aides_publiques")
            ),
            private_donations=_val("Dons_de_personne_physique"),
            membership_fees=(
                _val("Cotisations_des_adherents")
                + _val("Cotisations_des_elus")
            ),
            total_expenses=_val("Total_des_charges_II_+_IV_+VI_+_VII_+_VIII_+_IX"),
            assets=None,
        )
