from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from domain.models.positioning import IdeologicalPosition, PositionSnapshot
from domain.ports.positioning_source import PositioningSource

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_RAW_DATA_DIR = _BACKEND_DIR / "scripts" / "raw_data"
_MAPPING_PATH = _BACKEND_DIR / "scripts" / "party_mapping.json"

_CHES_2024_PATH = _RAW_DATA_DIR / "ches_2024.csv"
_CHES_TREND_PATH = _RAW_DATA_DIR / "ches_trend.csv"

_FRANCE_COUNTRY_CODE = 6


class CHESAdapter(PositioningSource):
    """``PositioningSource`` backed by CHES 2024 expert survey and trend data."""

    def __init__(
        self,
        mapping_path: Path = _MAPPING_PATH,
        ches_2024_path: Path = _CHES_2024_PATH,
        ches_trend_path: Path = _CHES_TREND_PATH,
    ) -> None:
        self._mapping_path = mapping_path
        self._ches_2024_path = ches_2024_path
        self._ches_trend_path = ches_trend_path

        # Lazily loaded caches
        self._id_to_slug: dict[int, str] | None = None
        self._slug_to_id: dict[str, int] | None = None
        self._ches_2024: pd.DataFrame | None = None
        self._ches_trend: pd.DataFrame | None = None

    # --- lazy loading ---------------------------------------------------------

    def _ensure_mapping(self) -> None:
        if self._id_to_slug is not None:
            return
        with open(self._mapping_path, encoding="utf-8") as fh:
            raw: dict = json.load(fh)
        self._id_to_slug = {}
        self._slug_to_id = {}
        for slug, entry in raw.items():
            ches_id = entry.get("ches_party_id")
            if ches_id is not None:
                self._id_to_slug[int(ches_id)] = slug
                self._slug_to_id[slug] = int(ches_id)

    def _ensure_ches_2024(self) -> None:
        if self._ches_2024 is not None:
            return
        df = pd.read_csv(self._ches_2024_path)
        self._ches_2024 = df[df["country"] == _FRANCE_COUNTRY_CODE].copy()

    def _ensure_ches_trend(self) -> None:
        if self._ches_trend is not None:
            return
        df = pd.read_csv(self._ches_trend_path)
        self._ches_trend = df[df["country"] == _FRANCE_COUNTRY_CODE].copy()

    def _load_all(self) -> None:
        self._ensure_mapping()
        self._ensure_ches_2024()
        self._ensure_ches_trend()

    # --- PositioningSource interface ------------------------------------------

    def get_positioning(self, slug: str) -> IdeologicalPosition | None:
        self._load_all()
        assert self._slug_to_id is not None
        assert self._ches_2024 is not None
        assert self._ches_trend is not None

        ches_id = self._slug_to_id.get(slug)
        if ches_id is None:
            return None

        # Current position from CHES 2024
        current = self._ches_2024[self._ches_2024["party_id"] == ches_id]
        if current.empty:
            return None
        row = current.iloc[0]

        # Historical snapshots from trend data
        history_df = self._ches_trend[self._ches_trend["party_id"] == ches_id]
        history: list[PositionSnapshot] = []
        for _, h_row in history_df.sort_values("year").iterrows():
            lrgen = h_row.get("lrgen")
            lrecon = h_row.get("lrecon")
            galtan = h_row.get("galtan")
            if pd.notna(lrgen) and pd.notna(lrecon) and pd.notna(galtan):
                history.append(
                    PositionSnapshot(
                        year=int(h_row["year"]),
                        lrgen=float(lrgen),
                        lrecon=float(lrecon),
                        galtan=float(galtan),
                    )
                )

        return IdeologicalPosition(
            year=int(row.get("electionyear", 2024)),
            lrgen=float(row["lrgen"]),
            lrecon=float(row["lrecon"]),
            galtan=float(row["galtan"]),
            eu_position=float(row["eu_position"]),
            immigration=float(row["immigrate_policy"]),
            environment=float(row["environment"]),
            redistribution=float(row["redistribution"]),
            antielite=float(row["people_v_elite"]),
            history=history,
        )
