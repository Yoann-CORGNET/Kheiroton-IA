from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_CSV_PATH = _BACKEND_DIR / "scripts" / "raw_data" / "parlgov_parties.csv"
_MAPPING_PATH = _BACKEND_DIR / "scripts" / "party_mapping.json"


class ParlGovAdapter:
    """Enrich :class:`PartyIdentity` with the ``family`` field from ParlGov.

    This adapter does **not** implement a port directly.  It loads the
    ParlGov CSV and the party-mapping JSON, then exposes a single lookup
    method that returns the ``family_name`` for a given party slug.

    Data is loaded lazily on first access and cached for the lifetime of
    the instance.
    """

    def __init__(
        self,
        csv_path: Path = _CSV_PATH,
        mapping_path: Path = _MAPPING_PATH,
    ) -> None:
        self._csv_path = csv_path
        self._mapping_path = mapping_path

        # Lazy-loaded caches
        self._slug_to_family: dict[str, str] | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_family(self, slug: str) -> str | None:
        """Return the ParlGov ``family_name`` for a party *slug*.

        Returns ``None`` when the slug is absent from the mapping or when
        no matching row exists in the ParlGov CSV.
        """
        if self._slug_to_family is None:
            self._load()
        assert self._slug_to_family is not None  # noqa: S101 – guarded above
        return self._slug_to_family.get(slug)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _load(self) -> None:
        """Build the ``slug -> family_name`` lookup from both data files."""

        # 1. party_mapping.json  -->  parlgov_id -> slug
        with open(self._mapping_path, encoding="utf-8") as fh:
            mapping: dict[str, dict] = json.load(fh)

        parlgov_id_to_slug: dict[int, str] = {}
        for slug, entry in mapping.items():
            pid = entry.get("parlgov_id")
            if pid is not None:
                parlgov_id_to_slug[int(pid)] = slug

        # 2. ParlGov CSV  -->  filter French parties, index by party_id
        df = pd.read_csv(self._csv_path)
        df_fra = df.loc[df["country_name_short"] == "FRA"]

        # 3. Join: for each parlgov_id in the mapping, find the family_name
        self._slug_to_family = {}
        for _, row in df_fra.iterrows():
            party_id = int(row["party_id"])
            slug = parlgov_id_to_slug.get(party_id)
            if slug is not None:
                family = row["family_name"]
                if pd.notna(family):
                    self._slug_to_family[slug] = str(family)
