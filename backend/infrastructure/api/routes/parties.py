"""Party endpoints."""

from __future__ import annotations

from dataclasses import asdict

from fastapi import APIRouter, HTTPException

from infrastructure.api.dependencies import get_aggregator

router = APIRouter()


@router.get("/parties")
def list_parties() -> list[dict]:
    agg = get_aggregator()
    summaries = agg.get_all_summaries()
    return [asdict(s) for s in summaries]


@router.get("/parties/{slug}")
def get_party(slug: str) -> dict:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    return asdict(profile)


@router.get("/parties/{slug}/positioning")
def get_positioning(slug: str) -> dict:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    if profile.positioning is None:
        return {"detail": "No positioning data available"}
    return asdict(profile.positioning)


@router.get("/parties/{slug}/elections")
def get_elections(slug: str) -> list[dict]:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    return [asdict(e) for e in profile.elections]


@router.get("/parties/{slug}/finance")
def get_finance(slug: str) -> dict:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    if profile.finance is None:
        return {"detail": "No finance data available"}
    return asdict(profile.finance)


@router.get("/parties/{slug}/promises")
def get_promises(slug: str) -> list[dict]:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    return [asdict(p) for p in profile.promises]


@router.get("/parties/{slug}/parliamentary")
def get_parliamentary(slug: str) -> dict:
    agg = get_aggregator()
    profile = agg.get_profile(slug)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Party '{slug}' not found")
    if profile.parliamentary is None:
        return {"detail": "No parliamentary data available"}
    return asdict(profile.parliamentary)
