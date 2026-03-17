#!/usr/bin/env python3
"""Download external data sources for PolitiScale.

Sources:
- CHES 2024: Chapel Hill Expert Survey positioning data
- CHES Trend 1999-2024: Historical positioning evolution
- ParlGov: Party identity and family classification
- CNCCFP: Party financial accounts (via data.gouv.fr)
- data.gouv: Election results (législatives 2024)

NosDeputes is a live API — no pre-download needed.
"""

from __future__ import annotations

import sys
from pathlib import Path

import httpx

RAW_DATA_DIR = Path(__file__).resolve().parent / "raw_data"

SOURCES: list[dict] = [
    {
        "name": "CHES 2024",
        "filename": "ches_2024.csv",
        "url": "https://www.chesdata.eu/s/CHES_2024_final_v2.csv",
    },
    {
        "name": "CHES Trend 1999-2024",
        "filename": "ches_trend.csv",
        "url": "https://www.chesdata.eu/s/1999-2024_CHES_dataset_meansV2-3k4l.csv",
    },
    {
        "name": "ParlGov parties",
        "filename": "parlgov_parties.csv",
        "url": "https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_party.csv",
    },
    {
        "name": "CNCCFP comptes des partis 2024",
        "filename": "cnccfp_comptes.csv",
        "url": "https://static.data.gouv.fr/resources/comptes-des-partis-et-groupements-politiques/20260210-110641/comptes-partis-exercice-2024.csv",
    },
    {
        "name": "Législatives 2024 T1 (par circonscription)",
        "filename": "legislatives_2024_t1.csv",
        "url": "https://www.data.gouv.fr/api/1/datasets/r/5163f2e3-1362-4c35-89a0-1934bb74f2d9",
    },
    {
        "name": "Législatives 2024 T2 (par circonscription)",
        "filename": "legislatives_2024_t2.csv",
        "url": "https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-2nd-tour/20240710-170728/resultats-definitifs-par-circonscription.csv",
    },
]


def is_valid_csv(path: Path) -> bool:
    """Check if file exists and is actually CSV (not HTML error page)."""
    if not path.exists() or path.stat().st_size == 0:
        return False
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        first_line = f.readline()
    return not first_line.strip().startswith("<")


def download(source: dict, force: bool = False) -> bool:
    path = RAW_DATA_DIR / source["filename"]
    if not force and is_valid_csv(path):
        print(f"  [SKIP] {source['name']} — already exists")
        return True

    print(f"  [GET]  {source['name']} → {source['filename']}")
    try:
        with httpx.Client(follow_redirects=True, timeout=60) as client:
            resp = client.get(source["url"])
            resp.raise_for_status()

        content = resp.text
        if content.strip().startswith("<!") or content.strip().startswith("<html"):
            print(f"  [FAIL] {source['name']} — got HTML instead of CSV")
            return False

        path.write_text(content, encoding="utf-8")
        print(f"  [OK]   {source['name']} ({path.stat().st_size:,} bytes)")
        return True
    except Exception as e:
        print(f"  [ERR]  {source['name']} — {e}")
        return False


def main() -> None:
    RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
    force = "--force" in sys.argv

    print("PolitiScale — Downloading data sources\n")
    results = []
    for source in SOURCES:
        ok = download(source, force=force)
        results.append((source["name"], ok))

    print("\n--- Summary ---")
    for name, ok in results:
        status = "OK" if ok else "MISSING"
        print(f"  {status:7s}  {name}")

    failures = sum(1 for _, ok in results if not ok)
    if failures:
        print(f"\n{failures} source(s) failed. Re-run with --force to retry all.")


if __name__ == "__main__":
    main()
