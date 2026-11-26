"""
Vehicle database for the fuel calculator.

Two sources are merged:
  1. data/sa_vehicles.json — hand-made list of vehicles common in South Africa
     (incl. models never sold in the US) plus light, medium and heavy trucks and buses.
  2. US EPA fuel economy database (fueleconomy.gov) — every car, SUV, van and light
     pickup sold in the US since 1984 (~50,000 versions, ~145 makes). Downloaded at
     startup and refreshed every 24 hours so newly added models appear automatically.

Search matches every typed word (ignoring dashes/spaces, so "xtype" finds "X-Type").
"""

from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import re
import statistics
import time
import zipfile
from collections import defaultdict
from pathlib import Path

import httpx

log = logging.getLogger("iammaster.vehicles")

EPA_URL = "https://www.fueleconomy.gov/feg/epadata/vehicles.csv.zip"
REFRESH_SECONDS = 24 * 60 * 60
MPG_TO_L100 = 235.215  # US mpg -> litres per 100 km

_FUELS = {
    "Regular Gasoline": "petrol",
    "Premium Gasoline": "petrol",
    "Midgrade Gasoline": "petrol",
    "Diesel": "diesel",
}

_state: dict = {"vehicles": [], "makes": 0, "epa_count": 0, "updated_at": None, "loaded_at": 0.0, "loading": False}
_lock = asyncio.Lock()


def _compact(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def _entry(make, model, engine, fuel, l100, years="", source="SA", vtype="car") -> dict:
    text = f"{make} {model} {engine} {years} {fuel} {vtype}".lower()
    return {
        "make": make,
        "model": model,
        "engine": engine,
        "years": years,
        "fuel": fuel,
        "l100": l100,
        "type": vtype,
        "source": source,
        "name": " ".join(x for x in (make, model, engine) if x),
        "_text": text,
        "_compact": _compact(text),
    }


def _load_local() -> list[dict]:
    rows = json.loads((Path(__file__).parent / "data" / "sa_vehicles.json").read_text(encoding="utf-8"))
    return [
        _entry(r["make"], r["model"], r["engine"], r["fuel"], float(r["l100"]), "", "SA", r.get("type", "car"))
        for r in rows
    ]


def _parse_epa(zip_bytes: bytes) -> list[dict]:
    """Group EPA rows into one entry per make / model / engine size / fuel, with a year range."""
    groups: dict[tuple, dict] = defaultdict(lambda: {"years": set(), "mpg": [], "cyl": "", "hybrid": False, "vclass": ""})
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        name = next(n for n in zf.namelist() if n.endswith(".csv"))
        with zf.open(name) as f:
            for row in csv.DictReader(io.TextIOWrapper(f, encoding="utf-8", errors="replace")):
                fuel = _FUELS.get(row.get("fuelType1", ""))
                if not fuel or row.get("atvType") in ("EV", "FCV", "eFCV"):
                    continue
                try:
                    mpg = float(row["comb08"])
                    year = int(row["year"])
                except (KeyError, ValueError):
                    continue
                if mpg <= 0:
                    continue
                displ = row.get("displ") or ""
                key = (row["make"].strip(), row["model"].strip(), displ, fuel)
                g = groups[key]
                g["years"].add(year)
                g["mpg"].append(mpg)
                g["cyl"] = row.get("cylinders") or g["cyl"]
                g["hybrid"] = g["hybrid"] or row.get("atvType") in ("Hybrid", "Plug-in Hybrid")
                g["vclass"] = row.get("VClass") or g["vclass"]

    out = []
    for (make, model, displ, fuel), g in groups.items():
        y0, y1 = min(g["years"]), max(g["years"])
        years = str(y0) if y0 == y1 else f"{y0}–{y1}"
        engine = f"{displ}L" if displ else ""
        if g["cyl"]:
            engine += f" {g['cyl']}-cyl"
        if g["hybrid"]:
            engine += " hybrid"
        vclass = g["vclass"].lower()
        vtype = "truck" if "pickup" in vclass else "van" if "van" in vclass else "suv" if "sport utility" in vclass else "car"
        l100 = round(MPG_TO_L100 / statistics.median(g["mpg"]), 1)
        out.append(_entry(make, model, engine.strip(), fuel, l100, years, "EPA", vtype))
    return out


async def refresh(force: bool = False) -> None:
    """(Re)load both sources. Safe to call often; only downloads when the data is over 24h old."""
    if _lock.locked():
        return
    async with _lock:
        if not force and _state["vehicles"] and time.monotonic() - _state["loaded_at"] < REFRESH_SECONDS:
            return
        _state["loading"] = True
        local = _load_local()
        epa: list[dict] = []
        try:
            async with httpx.AsyncClient(timeout=60, follow_redirects=True) as http:
                r = await http.get(EPA_URL)
                r.raise_for_status()
            epa = await asyncio.to_thread(_parse_epa, r.content)
        except Exception as e:
            log.warning("EPA vehicle data unavailable (%s); keeping previous data", e)
            if _state["epa_count"]:
                epa = [v for v in _state["vehicles"] if v["source"] == "EPA"]
        vehicles = local + epa
        _state.update(
            vehicles=vehicles,
            makes=len({v["make"].lower() for v in vehicles}),
            epa_count=len(epa),
            updated_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            loaded_at=time.monotonic(),
            loading=False,
        )
        log.info("Vehicle database: %d entries (%d EPA), %d makes", len(vehicles), len(epa), _state["makes"])


async def refresh_forever() -> None:
    """Background task: load now, then every 24 hours."""
    while True:
        try:
            await refresh(force=True)
        except Exception:
            log.exception("Vehicle refresh failed")
        await asyncio.sleep(REFRESH_SECONDS)


def search(query: str, limit: int = 12) -> list[dict]:
    words = [w for w in query.lower().split() if w]
    if not words:
        return []
    vehicles = _state["vehicles"] or _load_local()
    compact_words = [_compact(w) for w in words]

    matches = []
    for v in vehicles:
        if all(w in v["_text"] or (cw and cw in v["_compact"]) for w, cw in zip(words, compact_words)):
            # Rank: SA list first, then make/model starting with the first word, then newest.
            make_model = _compact(v["make"] + v["model"])
            score = (
                0 if v["source"] == "SA" else 1,
                0 if make_model.startswith(compact_words[0]) or _compact(v["model"]).startswith(compact_words[0]) else 1,
                -int((v["years"] or "0")[-4:]) if v["years"] else 0,
            )
            matches.append((score, v))
    matches.sort(key=lambda m: m[0])
    return [{k: val for k, val in v.items() if not k.startswith("_")} for _, v in matches[:limit]]


def stats() -> dict:
    return {
        "total": len(_state["vehicles"]),
        "makes": _state["makes"],
        "epa_count": _state["epa_count"],
        "updated_at": _state["updated_at"],
        "loading": _state["loading"] or not _state["vehicles"],
        "sources": [
            "South African & heavy truck list (iammasterheavenly)",
            "US EPA fuel economy database (fueleconomy.gov), refreshed every 24 hours",
        ],
    }
