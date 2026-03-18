"""Seed MongoDB from existing data_agreg/data/ JSON files.

Usage:
    MONGODB_URI=mongodb://localhost:27017 python scripts/seed_mongo.py
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "politiscale")

BASE = Path(__file__).resolve().parent.parent.parent / "data_agreg" / "data"
OUTPUT = Path(__file__).resolve().parent.parent.parent / "data_agreg" / "output"
MAPPING_PATH = Path(__file__).resolve().parent / "party_mapping.json"


def load_json(path: Path) -> dict | None:
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def build_filename_to_slug_map() -> dict[str, str]:
    """Build reverse map: local_json filename → party slug.

    party_mapping.json has {"renaissance": {"local_json": "macron"}, ...}
    We need {"macron": "renaissance", "le_pen": "rn", ...}
    """
    mapping = load_json(MAPPING_PATH)
    if not mapping:
        return {}
    return {
        entry["local_json"]: slug
        for slug, entry in mapping.items()
        if entry.get("local_json")
    }


# Known evaluation source names — maps filenames to canonical source names
# used by agent queries.  Entries without a year suffix get year from data.
_EVALUATION_SOURCE_MAP: dict[str, str] = {
    "cour_des_comptes_key_findings": "cour_des_comptes",
}


def parse_evaluation_source(filename: str) -> tuple[str, int]:
    """Extract source name and year from evaluation filename.

    "institut_montaigne_2022" → ("institut_montaigne", 2022)
    "ifrap_2022"              → ("ifrap", 2022)
    "cour_des_comptes_key_findings" → ("cour_des_comptes", 0)  (via map)
    """
    # Check explicit overrides first
    if filename in _EVALUATION_SOURCE_MAP:
        return _EVALUATION_SOURCE_MAP[filename], 0

    # Try to split trailing year
    match = re.match(r"^(.+?)_(\d{4})$", filename)
    if match:
        return match.group(1), int(match.group(2))
    return filename, 0


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB]
    now = datetime.now(timezone.utc).isoformat()
    filename_to_slug = build_filename_to_slug_map()

    # --- Programs ---
    programs_dir = BASE / "programs"
    if programs_dir.exists():
        for f in programs_dir.glob("*.json"):
            data = load_json(f)
            if not data:
                continue
            # Map filename to party slug (e.g. "macron" → "renaissance")
            slug = filename_to_slug.get(f.stem, f.stem)
            doc = {
                "party_slug": slug,
                "candidate": data.get("candidate", ""),
                "party": data.get("party", ""),
                "election": data.get("election", ""),
                "source_urls": data.get("source_urls", []),
                "promises": data.get("promises", []),
                "updated_at": now,
            }
            await db.programs.replace_one({"party_slug": slug}, doc, upsert=True)
            print(f"  programs: {f.stem} → {slug} ({len(doc['promises'])} promises)")

    # --- Economic ---
    economic_dir = BASE / "economic"
    if economic_dir.exists():
        for f in economic_dir.glob("*.json"):
            data = load_json(f)
            if not data:
                continue
            data_type = f.stem
            doc = {"data_type": data_type, **data, "updated_at": now}
            await db.economic.replace_one({"data_type": data_type}, doc, upsert=True)
            print(f"  economic: {data_type}")

    # --- Legal ---
    legal_dir = BASE / "legal"
    if legal_dir.exists():
        for f in legal_dir.glob("*.json"):
            data = load_json(f)
            if not data:
                continue
            data_type = f.stem
            doc = {"data_type": data_type, **data, "updated_at": now}
            await db.legal.replace_one({"data_type": data_type}, doc, upsert=True)
            print(f"  legal: {data_type}")

    # --- Precedents ---
    precedents_dir = BASE / "precedents"
    if precedents_dir.exists():
        for f in precedents_dir.glob("*.json"):
            data = load_json(f)
            if not data:
                continue
            data_type = f.stem
            doc = {"data_type": data_type, **data, "updated_at": now}
            await db.precedents.replace_one({"data_type": data_type}, doc, upsert=True)
            print(f"  precedents: {data_type}")

    # --- Evaluations ---
    evaluations_dir = BASE / "evaluations"
    if evaluations_dir.exists():
        for f in evaluations_dir.glob("*.json"):
            data = load_json(f)
            if not data:
                continue
            source, year = parse_evaluation_source(f.stem)
            # Use year from data if available, fallback to filename
            year = data.get("year", year)
            doc = {"source": source, "year": year, **data, "updated_at": now}
            await db.evaluations.replace_one(
                {"source": source, "year": year}, doc, upsert=True
            )
            print(f"  evaluations: {source} (year={year})")

    # --- Results ---
    resultats_path = OUTPUT / "resultats.json"
    if resultats_path.exists():
        data = load_json(resultats_path)
        if data:
            doc = {
                "metadata": data.get("metadata", {}),
                "programs": data.get("programs", {}),
                "comparison": data.get("comparison", {}),
                "stored_at": now,
            }
            await db.results.insert_one(doc)
            print("  results: resultats.json")

    client.close()
    print("\nSeed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
