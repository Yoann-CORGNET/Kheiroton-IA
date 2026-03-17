"""Comparison endpoint."""

from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, HTTPException, Query

from infrastructure.api.dependencies import get_aggregator, get_comparator

router = APIRouter()


@router.get("/compare")
def compare_parties(parties: str = Query(..., description="Comma-separated party slugs")) -> dict:
    slugs = [s.strip() for s in parties.split(",") if s.strip()]

    if len(slugs) < 2:
        raise HTTPException(status_code=400, detail="At least 2 parties required")
    if len(slugs) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 parties")

    agg = get_aggregator()
    profiles = []
    for slug in slugs:
        profile = agg.get_profile(slug)
        if profile is None:
            raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
        profiles.append(profile)

    comp = get_comparator()
    result = comp.compare(profiles)
    return asdict(result)
