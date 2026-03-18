"""FastAPI application — wires adapters into services and exposes API."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from infrastructure.api.routes.parties import router as parties_router
from infrastructure.api.routes.compare import router as compare_router
from infrastructure.api.routes.health import router as health_router

app = FastAPI(
    title="PolitiScale API",
    description="Profils agrégés des partis politiques français",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(parties_router, prefix="/api")
app.include_router(compare_router, prefix="/api")
