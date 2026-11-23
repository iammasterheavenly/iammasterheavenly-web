"""
iammasterheavenly (Pty) Ltd — API
FastAPI backend serving South African fuel price defaults for the
I AM MASTER Petrol & Trip Calculator.

Run locally:   uvicorn main:app --reload --port 8000
Run on Render: uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

APP_NAME = "iammasterheavenly (Pty) Ltd API"
APP_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Fuel prices (ZAR per litre)
# Indicative retail prices. Update these each month after the Department of
# Mineral and Petroleum Resources announces the official adjustment
# (usually effective the first Wednesday of the month).
# ---------------------------------------------------------------------------
FUEL_PRICES_EFFECTIVE = "2026-11-04"

FUEL_PRICES = [
    {
        "id": "inland-95",
        "label": "Inland 95 Unleaded",
        "price_per_litre": 21.62,
        "region": "Inland (Gauteng)",
    },
    {
        "id": "inland-93",
        "label": "Inland 93 Unleaded",
        "price_per_litre": 21.51,
        "region": "Inland (Gauteng)",
    },
    {
        "id": "coastal-95",
        "label": "Coastal 95 Unleaded",
        "price_per_litre": 20.79,
        "region": "Coastal",
    },
    {
        "id": "diesel-50ppm",
        "label": "Diesel 50ppm",
        "price_per_litre": 19.95,
        "region": "Inland (wholesale guide)",
    },
]

# ---------------------------------------------------------------------------
# App + CORS
# ALLOWED_ORIGINS: comma-separated list, e.g.
#   "https://iammasterheavenly.pages.dev,https://www.iammasterheavenly.co.za"
# Local Vite dev servers are always allowed.
# ---------------------------------------------------------------------------
LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

extra_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend for iammasterheavenly (Pty) Ltd — digital music, e-books and web tools.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_ORIGINS + extra_origins,
    # Any Cloudflare Pages preview/production deployment of the project.
    allow_origin_regex=r"https://([a-z0-9-]+\.)?iammasterheavenly\.pages\.dev",
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "ok",
        "endpoints": ["/health", "/api/fuel-prices"],
    }


@app.get("/health")
def health():
    """Lightweight endpoint for Render health checks and cold-start pings."""
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/fuel-prices")
def fuel_prices():
    """Default South African fuel prices in ZAR per litre."""
    return {
        "currency": "ZAR",
        "unit": "per_litre",
        "effective_date": FUEL_PRICES_EFFECTIVE,
        "source": "Indicative retail prices — confirm against the official monthly DMPR announcement.",
        "prices": FUEL_PRICES,
    }
