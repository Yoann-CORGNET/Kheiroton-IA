FROM python:3.11-slim AS base

WORKDIR /app

# System deps for httpx/uvicorn
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy source
COPY . .

# Download external data sources (CSV files from CHES, ParlGov, CNCCFP, data.gouv)
RUN python scripts/download_sources.py

# Create cache directories
RUN mkdir -p infrastructure/cache/aggregated infrastructure/cache/nosdeputes

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["uvicorn", "infrastructure.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
