"""
PolitiScale MCP Server — exposes tools for agents to push/pull data via MongoDB.

Collections:
  - programs:    One doc per candidate {party_slug, candidate, party, election, promises[]}
  - economic:    Reference data {type: "macro"|"budget"|"fiscal", ...}
  - legal:       Reference data {type: "constitutional"|"eu"|"procedures"|"parliamentary", ...}
  - precedents:  Reform precedents {type: "french"|"international", reforms[]}
  - evaluations: Independent evaluations {source, year, ...}
  - results:     Analysis output (the resultats.json contract)
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from mcp.server.fastmcp import FastMCP

from adapters.mongodb.client import get_db

mcp = FastMCP(
    "PolitiScale",
    instructions=(
        "MCP server for the PolitiScale political program analysis pipeline. "
        "Use the store_* tools to push collected data and the get_* tools to "
        "read reference data for analysis."
    ),
    transport_security={"enable_dns_rebinding_protection": False},
)


# ---------------------------------------------------------------------------
# WRITE TOOLS — agents push data
# ---------------------------------------------------------------------------


@mcp.tool()
async def store_program(
    party_slug: str,
    candidate: str,
    party: str,
    election: str,
    source_urls: list[str],
    promises: list[dict],
) -> str:
    """Store or replace a candidate's program with their promises.

    party_slug: MUST match the party_mapping keys used by the backend API.
      Valid values: ps, lr, rn, renaissance, lfi, eelv, pcf, modem,
      horizons, reconquete. Use the party slug, NOT the candidate name.

    Each promise dict must contain at minimum:
      id, raw_text, theme, action_verb, action_object, classification,
      precision_level, source_url.

    Optional fields: quantification, cost_announced, funding_source,
      timeline, target_population, source_type, source_orientation,
      funding_status, candidate_justification, sources_croisees.
    """
    db = get_db()
    doc = {
        "party_slug": party_slug,
        "candidate": candidate,
        "party": party,
        "election": election,
        "source_urls": source_urls,
        "promises": promises,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.programs.replace_one(
        {"party_slug": party_slug}, doc, upsert=True
    )
    n = len(promises)
    if result.upserted_id:
        return f"Created program for {candidate} ({party_slug}) with {n} promises."
    return f"Updated program for {candidate} ({party_slug}) with {n} promises."


@mcp.tool()
async def store_economic_data(
    data_type: str,
    data: dict,
) -> str:
    """Store economic reference data.

    data_type: one of "macro_indicators", "budget_structure", "fiscal_constraints"
    data: the full JSON object matching the schema for that type.
    """
    db = get_db()
    doc = {**data, "data_type": data_type, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.economic.replace_one({"data_type": data_type}, doc, upsert=True)
    return f"Stored economic data: {data_type}"


@mcp.tool()
async def store_legal_data(
    data_type: str,
    data: dict,
) -> str:
    """Store legal reference data.

    data_type: one of "constitutional_constraints", "eu_legal_constraints",
               "legislative_procedures", "parliamentary_arithmetic"
    data: the full JSON object matching the schema for that type.
    """
    db = get_db()
    doc = {**data, "data_type": data_type, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.legal.replace_one({"data_type": data_type}, doc, upsert=True)
    return f"Stored legal data: {data_type}"


@mcp.tool()
async def store_precedents(
    data_type: str,
    data: dict,
) -> str:
    """Store reform precedent data.

    data_type: one of "french_reforms", "international_precedents"
    data: the full JSON object with reforms array.
    """
    db = get_db()
    doc = {**data, "data_type": data_type, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.precedents.replace_one({"data_type": data_type}, doc, upsert=True)
    return f"Stored precedents: {data_type}"


@mcp.tool()
async def store_evaluation(
    source: str,
    year: int,
    data: dict,
) -> str:
    """Store an independent evaluation (Institut Montaigne, IFRAP, Cour des Comptes, etc.).

    source: base name WITHOUT year suffix. Must match what agents query.
      Valid: "institut_montaigne", "ifrap", "cour_des_comptes"
      Invalid: "institut_montaigne_2022" (year goes in the year param)
    year: e.g. 2022
    data: the full evaluation JSON.
    """
    db = get_db()
    doc = {**data, "source": source, "year": year, "updated_at": datetime.now(timezone.utc).isoformat()}
    await db.evaluations.replace_one(
        {"source": source, "year": year}, doc, upsert=True
    )
    return f"Stored evaluation: {source} {year}"


@mcp.tool()
async def store_results(
    metadata: dict,
    programs: dict,
    comparison: dict,
) -> str:
    """Store the final analysis results (the resultats.json contract).

    This is the output of Phase 2+3 consumed by the frontend/API.
    Root keys: metadata, programs, comparison (see CLAUDE.md for full schema).
    """
    db = get_db()
    doc = {
        "metadata": metadata,
        "programs": programs,
        "comparison": comparison,
        "stored_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.results.insert_one(doc)
    return f"Stored results ({sum(len(p.get('promises', [])) for p in programs.values())} promises across {len(programs)} programs)."


# ---------------------------------------------------------------------------
# READ TOOLS — agents pull data for analysis
# ---------------------------------------------------------------------------


@mcp.tool()
async def get_programs(party_slug: str | None = None) -> str:
    """Get candidate programs from the database.

    If party_slug is provided, return that candidate's program only.
    Otherwise return all programs.
    """
    db = get_db()
    if party_slug:
        doc = await db.programs.find_one(
            {"party_slug": party_slug}, {"_id": 0}
        )
        return json.dumps(doc, ensure_ascii=False, default=str) if doc else f"No program found for {party_slug}"

    cursor = db.programs.find({}, {"_id": 0})
    docs = await cursor.to_list(length=100)
    return json.dumps(docs, ensure_ascii=False, default=str)


@mcp.tool()
async def get_economic_data(data_type: str | None = None) -> str:
    """Get economic reference data.

    data_type: optionally filter by "macro_indicators", "budget_structure",
               or "fiscal_constraints". If None, returns all.
    """
    db = get_db()
    query = {"data_type": data_type} if data_type else {}
    cursor = db.economic.find(query, {"_id": 0})
    docs = await cursor.to_list(length=20)
    return json.dumps(docs, ensure_ascii=False, default=str)


@mcp.tool()
async def get_legal_data(data_type: str | None = None) -> str:
    """Get legal reference data.

    data_type: optionally filter by "constitutional_constraints",
               "eu_legal_constraints", "legislative_procedures",
               "parliamentary_arithmetic". If None, returns all.
    """
    db = get_db()
    query = {"data_type": data_type} if data_type else {}
    cursor = db.legal.find(query, {"_id": 0})
    docs = await cursor.to_list(length=20)
    return json.dumps(docs, ensure_ascii=False, default=str)


@mcp.tool()
async def get_precedents(data_type: str | None = None) -> str:
    """Get reform precedent data.

    data_type: optionally filter by "french_reforms" or
               "international_precedents". If None, returns all.
    """
    db = get_db()
    query = {"data_type": data_type} if data_type else {}
    cursor = db.precedents.find(query, {"_id": 0})
    docs = await cursor.to_list(length=20)
    return json.dumps(docs, ensure_ascii=False, default=str)


@mcp.tool()
async def get_evaluations(source: str | None = None) -> str:
    """Get independent evaluations.

    source: optionally filter by "institut_montaigne", "ifrap",
            "cour_des_comptes", etc. If None, returns all.
    """
    db = get_db()
    query = {"source": source} if source else {}
    cursor = db.evaluations.find(query, {"_id": 0})
    docs = await cursor.to_list(length=20)
    return json.dumps(docs, ensure_ascii=False, default=str)


@mcp.tool()
async def get_results() -> str:
    """Get the latest analysis results (resultats.json contract).

    Returns the most recent results document with metadata, programs,
    and comparison keys.
    """
    db = get_db()
    doc = await db.results.find_one(sort=[("_id", -1)], projection={"_id": 0})
    if doc is None:
        return "No results stored yet."
    return json.dumps(doc, ensure_ascii=False, default=str)


@mcp.tool()
async def list_collections() -> str:
    """List all collections and their document counts — useful to see what data is available."""
    db = get_db()
    names = ["programs", "economic", "legal", "precedents", "evaluations", "results"]
    counts = {}
    for name in names:
        counts[name] = await db[name].count_documents({})
    return json.dumps(counts)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    transport = os.environ.get("MCP_TRANSPORT", "stdio")
    if len(sys.argv) > 1:
        transport = sys.argv[1]

    # Allow overriding host/port for Docker
    host = os.environ.get("MCP_HOST")
    port = os.environ.get("MCP_PORT")
    if host:
        mcp.settings.host = host
    if port:
        mcp.settings.port = int(port)

    mcp.run(transport=transport)
