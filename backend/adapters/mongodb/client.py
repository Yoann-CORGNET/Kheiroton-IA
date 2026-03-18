"""MongoDB connection config and async client for the MCP server.

- MONGODB_URI / MONGODB_DB: shared constants used by both the async MCP
  server (motor) and the sync API adapter (pymongo).
- get_db() / close_db(): motor (async) client used only by mcp_server.py.
- The API's MongoPromiseSource uses pymongo directly (sync).
"""

from __future__ import annotations

import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB = os.getenv("MONGODB_DB", "politiscale")

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_db() -> AsyncIOMotorDatabase:
    """Return the motor async database — for use in MCP server only."""
    global _client, _db
    if _db is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
        _db = _client[MONGODB_DB]
    return _db


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
