from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any

import httpx

from domain.models.parliamentary import ParliamentaryActivity
from domain.ports.parliamentary_source import ParliamentarySource

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.nosdeputes.fr"
_MAPPING_PATH = (
    Path(__file__).resolve().parent.parent.parent / "scripts" / "party_mapping.json"
)
_CACHE_DIR = (
    Path(__file__).resolve().parent.parent.parent
    / "infrastructure"
    / "cache"
    / "nosdeputes"
)
_CACHE_MAX_AGE_S = 24 * 60 * 60  # 24 hours
_REQUEST_DELAY_S = 0.2  # 200 ms between API calls
_REQUEST_TIMEOUT_S = 15


class NosDeputesAdapter(ParliamentarySource):
    """Concrete ``ParliamentarySource`` backed by the NosDeputes.fr public API."""

    def __init__(
        self,
        mapping_path: Path = _MAPPING_PATH,
        cache_dir: Path = _CACHE_DIR,
    ) -> None:
        with open(mapping_path, encoding="utf-8") as fh:
            self._mapping: dict[str, dict[str, Any]] = json.load(fh)
        self._cache_dir = cache_dir
        self._cache_dir.mkdir(parents=True, exist_ok=True)

    # --- ParliamentarySource interface ----------------------------------------

    def get_parliamentary(self, slug: str) -> ParliamentaryActivity | None:
        """Return aggregated parliamentary activity for *slug*, or *None*."""
        entry = self._mapping.get(slug)
        if entry is None:
            logger.warning("Party slug %r not found in mapping", slug)
            return None

        sigle: str | None = entry.get("nosdeputes_group")
        if sigle is None:
            logger.info(
                "Party %r has no NosDeputes group (nosdeputes_group is null)", slug
            )
            return None

        # Check cache first
        cached = self._read_cache(slug)
        if cached is not None:
            return cached

        try:
            result = self._fetch_and_aggregate(sigle)
        except Exception:
            logger.exception("Failed to fetch NosDeputes data for %r (%s)", slug, sigle)
            return None

        if result is not None:
            self._write_cache(slug, result)
        return result

    # --- private: fetching & aggregation --------------------------------------

    def _fetch_and_aggregate(self, sigle: str) -> ParliamentaryActivity | None:
        """Fetch group info, member list, individual stats and aggregate."""

        # 1. Fetch group list to get group name and member count
        groups_data = self._api_get(f"/organismes/groupe/json")
        if groups_data is None:
            return None

        group_info = self._find_group(groups_data, sigle)
        if group_info is None:
            logger.warning("Group %r not found in NosDeputes group list", sigle)
            return None

        group_name: str = group_info.get("nom", sigle)
        group_size: int = int(group_info.get("nombre_membres", 0))

        # 2. Fetch member list
        time.sleep(_REQUEST_DELAY_S)
        members_data = self._api_get(f"/groupe/{sigle}/json")
        if members_data is None:
            return None

        deputy_slugs = self._extract_deputy_slugs(members_data)
        if not deputy_slugs:
            logger.warning("No deputies found for group %r", sigle)
            return None

        # 3. Fetch individual stats for each deputy
        total_interventions = 0
        total_amendments = 0
        total_amendments_adopted = 0
        total_questions = 0
        presence_values: list[float] = []

        for dep_slug in deputy_slugs:
            time.sleep(_REQUEST_DELAY_S)
            dep_data = self._api_get(f"/{dep_slug}/json")
            if dep_data is None:
                continue

            dep = dep_data.get("depute", {})

            interventions = _safe_int(dep.get("interventions_courtes", 0))
            amendements_proposes = _safe_int(dep.get("amendements_proposes", 0))
            amendements_adoptes = _safe_int(dep.get("amendements_adoptes", 0))
            questions_ecrites = _safe_int(dep.get("questions_ecrites", 0))
            questions_orales = _safe_int(dep.get("questions_orales", 0))
            semaines_presence = _safe_int(dep.get("semaines_presence", 0))
            commission_presences = _safe_int(dep.get("commission_presences", 0))

            total_interventions += interventions
            total_amendments += amendements_proposes
            total_amendments_adopted += amendements_adoptes
            total_questions += questions_ecrites + questions_orales

            # Presence heuristic: average of semaines_presence and
            # commission_presences (both are raw counts, not percentages).
            # We just collect them; we'll normalise below.
            presence_values.append(semaines_presence + commission_presences)

        # Compute averages
        amendments_adopted_pct = (
            (total_amendments_adopted / total_amendments * 100.0)
            if total_amendments > 0
            else 0.0
        )
        avg_presence_raw = (
            (sum(presence_values) / len(presence_values))
            if presence_values
            else 0.0
        )
        # NosDeputes returns raw counts, not percentages.  We store the
        # average raw value; downstream consumers should interpret accordingly.
        avg_presence_pct = round(avg_presence_raw, 2)

        return ParliamentaryActivity(
            legislature=17,
            group_name=group_name,
            group_size=group_size,
            total_interventions=total_interventions,
            total_amendments=total_amendments,
            amendments_adopted_pct=round(amendments_adopted_pct, 2),
            avg_presence_pct=avg_presence_pct,
            total_questions=total_questions,
            top_themes=[],
            key_votes=[],
        )

    @staticmethod
    def _find_group(
        data: dict[str, Any], sigle: str
    ) -> dict[str, Any] | None:
        """Locate a group entry in the /organismes/groupe/json response."""
        for item in data.get("organismes", []):
            org = item.get("organisme", {})
            acronyme = org.get("acronyme", "")
            if acronyme and acronyme.upper() == sigle.upper():
                return org
        return None

    @staticmethod
    def _extract_deputy_slugs(data: dict[str, Any]) -> list[str]:
        """Extract deputy slugs from the /groupe/{sigle}/json response."""
        slugs: list[str] = []
        # The API may return deputies under various keys; try common shapes.
        deputies = data.get("deputes", [])
        for item in deputies:
            dep = item.get("depute", item)
            slug = dep.get("slug")
            if slug:
                slugs.append(slug)
        return slugs

    # --- private: HTTP --------------------------------------------------------

    def _api_get(self, path: str) -> dict[str, Any] | None:
        """Perform a GET request against the NosDeputes API and return JSON."""
        url = f"{_BASE_URL}{path}"
        try:
            response = httpx.get(url, timeout=_REQUEST_TIMEOUT_S, follow_redirects=True)
            response.raise_for_status()
            return response.json()  # type: ignore[no-any-return]
        except httpx.HTTPStatusError as exc:
            logger.warning(
                "NosDeputes HTTP %s for %s", exc.response.status_code, url
            )
        except httpx.RequestError as exc:
            logger.warning("NosDeputes request error for %s: %s", url, exc)
        except Exception as exc:
            logger.warning("NosDeputes unexpected error for %s: %s", url, exc)
        return None

    # --- private: caching -----------------------------------------------------

    def _cache_path(self, slug: str) -> Path:
        return self._cache_dir / f"{slug}.json"

    def _read_cache(self, slug: str) -> ParliamentaryActivity | None:
        """Return cached result if it exists and is fresh enough."""
        path = self._cache_path(slug)
        if not path.exists():
            return None

        age_s = time.time() - path.stat().st_mtime
        if age_s > _CACHE_MAX_AGE_S:
            logger.debug("Cache expired for %r (%.0f s old)", slug, age_s)
            return None

        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
            return ParliamentaryActivity(**data)
        except Exception:
            logger.warning("Failed to read cache for %r, ignoring", slug)
            return None

    def _write_cache(self, slug: str, activity: ParliamentaryActivity) -> None:
        """Write result to the cache directory as JSON."""
        path = self._cache_path(slug)
        try:
            payload = {
                "legislature": activity.legislature,
                "group_name": activity.group_name,
                "group_size": activity.group_size,
                "total_interventions": activity.total_interventions,
                "total_amendments": activity.total_amendments,
                "amendments_adopted_pct": activity.amendments_adopted_pct,
                "avg_presence_pct": activity.avg_presence_pct,
                "total_questions": activity.total_questions,
                "top_themes": activity.top_themes,
                "key_votes": activity.key_votes,
            }
            with open(path, "w", encoding="utf-8") as fh:
                json.dump(payload, fh, ensure_ascii=False, indent=2)
        except Exception:
            logger.warning("Failed to write cache for %r", slug)


# --- helpers ------------------------------------------------------------------


def _safe_int(value: Any) -> int:
    """Coerce *value* to int, returning 0 on failure."""
    if value is None:
        return 0
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0
