"""
iammasterheavenly (Pty) Ltd — API

FastAPI backend for the I AM MASTER website:
  * GET  /api/fuel-prices        South African fuel price defaults (ZAR/L)
  * GET  /api/scripture/today    Scripture of the Day + reflection (rotates daily, SAST)
  * POST /api/chat               Website AI assistant (Claude via the Anthropic SDK)
  * GET/POST /webhooks/meta      WhatsApp Cloud API, Messenger and Instagram DMs
  * POST /webhooks/telegram      Telegram bot

Run locally:   uvicorn main:app --reload --port 8000
Run on Render: uvicorn main:app --host 0.0.0.0 --port $PORT

Environment variables (all optional — the site works without them):
  ALLOWED_ORIGINS           Comma-separated extra CORS origins
  LLM_API_KEY               Anthropic API key. Without it, /api/chat runs in demo mode.
  LLM_MODEL                 Claude model ID (default: claude-opus-5-5)
  TELEGRAM_BOT_TOKEN        From @BotFather
  TELEGRAM_WEBHOOK_SECRET   Any random string; also passed to setWebhook as secret_token
  META_VERIFY_TOKEN         Any random string; entered in the Meta app's webhook settings
  META_APP_SECRET           Meta app secret, used to verify X-Hub-Signature-256
  META_PAGE_ACCESS_TOKEN    Page access token (Messenger + Instagram DMs)
  WHATSAPP_ACCESS_TOKEN     WhatsApp Cloud API token
  GRAPH_API_VERSION         Meta Graph API version (default: v21.0)
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import time
from collections import defaultdict, deque
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

import asyncio
from contextlib import asynccontextmanager

import anthropic
import httpx
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from dotenv import load_dotenv
from pydantic import BaseModel, Field

import vehicles

load_dotenv()  # reads backend/.env locally; on Render, env vars come from the dashboard

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("iammaster")

APP_NAME = "iammasterheavenly (Pty) Ltd API"
APP_VERSION = "2.0.0"
SAST = timezone(timedelta(hours=2))  # South Africa has no daylight saving

# ---------------------------------------------------------------------------
# Fuel prices (ZAR per litre) — live official prices
# South African fuel prices are regulated and change monthly (usually the first
# Wednesday). We read the official figures published by the Automobile
# Association of South Africa (aa.co.za/fuel-pricing), cache them for a few
# hours, and fall back to the last known prices below if AA can't be reached.
# Keep FALLBACK_* in sync with FALLBACK_PRICES in FuelCalculator.jsx.
# ---------------------------------------------------------------------------
AA_FUEL_URL = "https://aa.co.za/wp-admin/admin-ajax.php"
FUEL_CACHE_SECONDS = 6 * 60 * 60

# (id, label, region, fuel, AA field name)
FUEL_GRADES = [
    ("inland-95", "Unleaded 95", "inland", "95", "unleaded95Inland"),
    ("inland-93", "Unleaded 93", "inland", "93", "unleaded93Inland"),
    ("inland-d50", "Diesel 50ppm", "inland", "d50", "diesel50Inland"),
    ("inland-d500", "Diesel 500ppm", "inland", "d500", "diesel500Inland"),
    ("coastal-95", "Unleaded 95", "coastal", "95", "unleaded95Coast"),
    ("coastal-93", "Unleaded 93", "coastal", "93", "unleaded93Coast"),
    ("coastal-d50", "Diesel 50ppm", "coastal", "d50", "diesel50Coast"),
    ("coastal-d500", "Diesel 500ppm", "coastal", "d500", "diesel500Coast"),
]

FALLBACK_EFFECTIVE = "2026-11-04"
FALLBACK_PRICES = {
    "unleaded95Inland": 30.24, "unleaded93Inland": 29.87, "diesel50Inland": 31.60, "diesel500Inland": 30.85,
    "unleaded95Coast": 29.37, "unleaded93Coast": 29.08, "diesel50Coast": 30.83, "diesel500Coast": 29.98,
}

_fuel_cache: dict = {"data": None, "fetched": 0.0}


def _build_fuel_payload(current: dict, previous: dict | None, effective: str, live: bool) -> dict:
    prices = []
    for gid, label, region, fuel, field in FUEL_GRADES:
        price = float(current[field])
        change = round(price - float(previous[field]), 2) if previous and previous.get(field) else None
        prices.append({
            "id": gid,
            "label": label,
            "region": region,
            "fuel": fuel,
            "price_per_litre": price,
            "change_from_last_month": change,
        })
    return {
        "currency": "ZAR",
        "unit": "per_litre",
        "effective_date": effective,
        "live": live,
        "source": "Automobile Association of South Africa (aa.co.za) — official regulated prices"
        if live else "Last known official prices (live source unavailable)",
        "note": "Petrol prices are regulated retail prices. Diesel figures are official wholesale prices; pumps may differ slightly.",
        "prices": prices,
    }


async def get_fuel_prices() -> dict:
    now = time.monotonic()
    if _fuel_cache["data"] and now - _fuel_cache["fetched"] < FUEL_CACHE_SECONDS:
        return _fuel_cache["data"]
    try:
        async with httpx.AsyncClient(timeout=15, headers={"User-Agent": "iammasterheavenly-fuel-calculator/1.0"}) as http:
            r = await http.post(AA_FUEL_URL, data={"action": "getFuelPricesStart"})
            r.raise_for_status()
            rows = r.json()[0]["prices"]["fuelPrices"]
        rows = sorted(rows, key=lambda row: row["updatedOn"], reverse=True)
        current, previous = rows[0], (rows[1] if len(rows) > 1 else None)
        payload = _build_fuel_payload(current, previous, current["updatedOn"], live=True)
        _fuel_cache.update(data=payload, fetched=now)
        return payload
    except Exception as e:  # network error, layout change, etc.
        log.warning("Live fuel prices unavailable, using fallback: %s", e)
        if _fuel_cache["data"]:
            return _fuel_cache["data"]  # last successful live fetch
        return _build_fuel_payload(FALLBACK_PRICES, None, FALLBACK_EFFECTIVE, live=False)

# ---------------------------------------------------------------------------
# Scripture of the Day
# The same list lives in frontend/src/data/scriptures.json so the page can
# show today's verse instantly. Keep both files identical.
# ---------------------------------------------------------------------------
SCRIPTURES: list[dict] = json.loads(
    (Path(__file__).parent / "data" / "scriptures.json").read_text(encoding="utf-8")
)
SCRIPTURE_TRANSLATION = "KJV"


def scripture_for(day: date) -> tuple[int, dict]:
    """Deterministic daily pick: days since 1970-01-01 modulo list length."""
    index = (day - date(1970, 1, 1)).days % len(SCRIPTURES)
    return index, SCRIPTURES[index]


# ---------------------------------------------------------------------------
# AI assistant
# ---------------------------------------------------------------------------
LLM_API_KEY = os.getenv("LLM_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "claude-opus-5-5").strip()

SYSTEM_PROMPT = """You are the friendly AI assistant for iammasterheavenly (Pty) Ltd, \
also known as I AM MASTER, a South African company.

What the company does:
- Full-stack software and web development: websites, web apps and online calculators \
built with React and Python (FastAPI).
- Custom AI chat assistants for WhatsApp, Telegram, Facebook Messenger, Instagram DMs \
and websites, built with Python and large language models.
- Faith-inspired digital publishing: e-books and PDF guides.
- Free everyday tools on the website: a South African petrol & trip calculator, a ZAR \
hourly rate & project quote calculator (with 15% VAT and deposit split), and a compound \
savings & goal calculator.

How to reply:
- Be warm, encouraging and concise: 1-4 short paragraphs, plain text, no markdown headings.
- Use South African context: Rands (R), km, 15% VAT.
- If someone wants a quote or to start a project, ask about their goals, timeline and \
budget, and invite them to leave their contact details or use the contact options on the site.
- Never invent prices, client names or guarantees. If you don't know, say so.
- If asked about faith, be respectful and encouraging without pressuring anyone."""

llm_client: anthropic.AsyncAnthropic | None = (
    anthropic.AsyncAnthropic(api_key=LLM_API_KEY, timeout=60.0, max_retries=2)
    if LLM_API_KEY
    else None
)


async def ask_llm(messages: list[dict]) -> str:
    """Send a conversation to Claude and return the reply text."""
    if llm_client is None:
        return demo_reply(messages[-1]["content"] if messages else "")

    try:
        response = await llm_client.beta.messages.create(
            model=LLM_MODEL,
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages,
            output_config={"effort": "low"},  # short chat replies; raise for harder tasks
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",  # retry on a fallback model if a request is declined
        )
    except anthropic.AuthenticationError:
        log.error("LLM_API_KEY was rejected by the Anthropic API.")
        return "The assistant isn't configured correctly yet. Please try again later."
    except anthropic.RateLimitError:
        return "I'm getting a lot of messages right now. Please try again in a minute."
    except anthropic.APIStatusError as e:
        log.error("Anthropic API error %s: %s", e.status_code, e.message)
        return "Sorry, something went wrong on my side. Please try again shortly."
    except anthropic.APIConnectionError:
        log.error("Could not reach the Anthropic API.")
        return "I can't connect right now. Please try again shortly."

    if response.stop_reason == "refusal":
        return "I'm not able to help with that one, but I'm happy to help with anything else."

    text = "".join(block.text for block in response.content if block.type == "text").strip()
    return text or "Sorry, I didn't catch that. Could you rephrase?"


def demo_reply(message: str) -> str:
    """Keyword replies used until LLM_API_KEY is set, so the widget always works."""
    m = message.lower()
    if any(w in m for w in ("price", "cost", "quote", "how much", "rate")):
        return ("Every project is quoted individually. Try the Hourly Rate & Project Quote "
                "calculator on this page for a ballpark (it includes 15% VAT and a deposit split), "
                "then share your goals, timeline and budget and we'll send a proper quote.")
    if any(w in m for w in ("whatsapp", "telegram", "messenger", "instagram", "bot", "assistant", "ai")):
        return ("We build custom AI assistants for WhatsApp, Telegram, Facebook Messenger, "
                "Instagram DMs and websites, using Python and large language models. They can "
                "answer FAQs, take bookings and capture leads 24/7. What would you like yours to do?")
    if any(w in m for w in ("website", "web app", "app", "develop", "build", "react", "python")):
        return ("We design and build full-stack websites and web apps with React and Python "
                "(FastAPI), from landing pages to calculators and dashboards. Tell me a bit about "
                "your project and I'll point you in the right direction.")
    if any(w in m for w in ("book", "ebook", "e-book", "pdf", "guide")):
        return ("Our faith-inspired e-books and PDF guides are on the way. Check the Digital "
                "E-Books & PDFs section on this page for what's coming.")
    if any(w in m for w in ("fuel", "petrol", "diesel", "trip")):
        return ("Use the SA Petrol & Trip Calculator at the top of the page: enter your distance, "
                "vehicle and fuel grade to see litres needed, total Rand cost and cost per km.")
    if any(w in m for w in ("hello", "hi", "hey", "sawubona", "molo", "dumela", "howzit")):
        return "Hello! 👋 I'm the I AM MASTER assistant. How can I help you today?"
    return ("Thanks for your message! I can tell you about our web development, AI assistants, "
            "e-books and free calculators. (Demo mode: the full AI assistant goes live once the "
            "API key is connected.)")


# Simple in-memory rate limit for the public chat endpoint (per IP).
CHAT_LIMIT = 20
CHAT_WINDOW_SECONDS = 600
_chat_hits: dict[str, deque] = defaultdict(deque)


def check_rate_limit(key: str) -> None:
    now = time.monotonic()
    hits = _chat_hits[key]
    while hits and now - hits[0] > CHAT_WINDOW_SECONDS:
        hits.popleft()
    if len(hits) >= CHAT_LIMIT:
        raise HTTPException(status_code=429, detail="Too many messages. Please wait a few minutes.")
    hits.append(now)


# Short per-user history for messaging platforms (lost on restart; use a DB for production).
_platform_history: dict[str, deque] = defaultdict(lambda: deque(maxlen=10))


async def platform_reply(user_key: str, text: str) -> str:
    history = _platform_history[user_key]
    history.append({"role": "user", "content": text[:2000]})
    reply = await ask_llm(list(history))
    history.append({"role": "assistant", "content": reply})
    return reply


# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
LOCAL_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]
extra_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Load the vehicle database in the background (so startup stays fast) and refresh it every 24h.
    task = asyncio.create_task(vehicles.refresh_forever())
    yield
    task.cancel()


app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="Backend for iammasterheavenly (Pty) Ltd — web development, AI assistants and digital publishing.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_ORIGINS + extra_origins,
    allow_origin_regex=r"https://([a-z0-9-]+\.)?iammasterheavenly(-web)?\.pages\.dev",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "ok",
        "ai_mode": "live" if llm_client else "demo",
        "endpoints": ["/health", "/api/fuel-prices", "/api/vehicles/search?q=", "/api/scripture/today", "/api/chat"],
    }


@app.get("/health")
def health():
    """Lightweight endpoint for Render health checks and cold-start pings."""
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


@app.get("/api/fuel-prices")
async def fuel_prices():
    """Current official South African fuel prices in ZAR per litre (inland and coastal)."""
    return await get_fuel_prices()


@app.get("/api/vehicles/search")
async def vehicle_search(
    background: BackgroundTasks,
    q: str = Query(default="", max_length=80),
    limit: int = Query(default=12, ge=1, le=30),
):
    """Search cars, bakkies, SUVs, vans, trucks and buses with their fuel consumption (L/100km)."""
    background.add_task(vehicles.refresh)  # no-op unless the data is over 24h old (e.g. after a long sleep)
    return {"results": vehicles.search(q, limit), **vehicles.stats()}


@app.get("/api/vehicles/stats")
def vehicle_stats():
    return vehicles.stats()


@app.get("/api/scripture/today")
def scripture_today():
    """Scripture of the Day, rotating at midnight South African time."""
    today = datetime.now(SAST).date()
    index, verse = scripture_for(today)
    return {
        "date": today.isoformat(),
        "index": index,
        "total": len(SCRIPTURES),
        "translation": SCRIPTURE_TRANSLATION,
        **verse,
    }


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)


@app.post("/api/chat")
async def chat(body: ChatRequest, request: Request):
    """Website chat widget. Send the conversation so far; returns the assistant's reply."""
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (
        request.client.host if request.client else "unknown"
    )
    check_rate_limit(client_ip)

    messages = [m.model_dump() for m in body.messages][-20:]
    # The API requires the conversation to start with a user turn.
    while messages and messages[0]["role"] != "user":
        messages.pop(0)
    if not messages or messages[-1]["role"] != "user":
        raise HTTPException(status_code=400, detail="The last message must be from the user.")

    reply = await ask_llm(messages)
    return {"reply": reply, "mode": "live" if llm_client else "demo"}


# ---------------------------------------------------------------------------
# Telegram webhook
# Register with:
#   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<API_URL>/webhooks/telegram&secret_token=<SECRET>
# ---------------------------------------------------------------------------
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_WEBHOOK_SECRET = os.getenv("TELEGRAM_WEBHOOK_SECRET", "").strip()


async def telegram_send(chat_id: int, text: str) -> None:
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.post(
            f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": chat_id, "text": text[:4096]},
        )
        if r.status_code != 200:
            log.error("Telegram sendMessage failed: %s %s", r.status_code, r.text)


async def handle_telegram(chat_id: int, text: str) -> None:
    if text.strip() == "/start":
        reply = "Hello! 👋 I'm the I AM MASTER assistant. Ask me about websites, AI assistants or our e-books."
    else:
        reply = await platform_reply(f"tg:{chat_id}", text)
    await telegram_send(chat_id, reply)


@app.post("/webhooks/telegram")
async def telegram_webhook(
    request: Request,
    background: BackgroundTasks,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    if not TELEGRAM_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram is not configured (TELEGRAM_BOT_TOKEN).")
    if TELEGRAM_WEBHOOK_SECRET and not hmac.compare_digest(
        x_telegram_bot_api_secret_token or "", TELEGRAM_WEBHOOK_SECRET
    ):
        raise HTTPException(status_code=403, detail="Invalid secret token.")

    update = await request.json()
    message = update.get("message") or update.get("edited_message") or {}
    text = message.get("text")
    chat_id = (message.get("chat") or {}).get("id")
    if text and chat_id:
        background.add_task(handle_telegram, chat_id, text)
    return {"ok": True}  # acknowledge fast; reply is sent in the background


# ---------------------------------------------------------------------------
# Meta webhook: WhatsApp Cloud API, Facebook Messenger and Instagram DMs
# In the Meta developer dashboard set the callback URL to <API_URL>/webhooks/meta
# and the verify token to META_VERIFY_TOKEN.
# ---------------------------------------------------------------------------
META_VERIFY_TOKEN = os.getenv("META_VERIFY_TOKEN", "").strip()
META_APP_SECRET = os.getenv("META_APP_SECRET", "").strip()
META_PAGE_ACCESS_TOKEN = os.getenv("META_PAGE_ACCESS_TOKEN", "").strip()
WHATSAPP_ACCESS_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION", "v21.0").strip()
GRAPH_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"


@app.get("/webhooks/meta", response_class=PlainTextResponse)
def meta_verify(
    hub_mode: str = Query(default="", alias="hub.mode"),
    hub_verify_token: str = Query(default="", alias="hub.verify_token"),
    hub_challenge: str = Query(default="", alias="hub.challenge"),
):
    """Meta's one-time webhook verification handshake."""
    if META_VERIFY_TOKEN and hub_mode == "subscribe" and hmac.compare_digest(hub_verify_token, META_VERIFY_TOKEN):
        return hub_challenge
    raise HTTPException(status_code=403, detail="Verification failed.")


async def whatsapp_send(phone_number_id: str, to: str, text: str) -> None:
    if not WHATSAPP_ACCESS_TOKEN:
        log.warning("WHATSAPP_ACCESS_TOKEN not set; cannot reply on WhatsApp.")
        return
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.post(
            f"{GRAPH_URL}/{phone_number_id}/messages",
            headers={"Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}"},
            json={"messaging_product": "whatsapp", "to": to, "type": "text", "text": {"body": text[:4096]}},
        )
        if r.status_code >= 300:
            log.error("WhatsApp send failed: %s %s", r.status_code, r.text)


async def page_send(recipient_id: str, text: str) -> None:
    """Messenger and Instagram DMs both reply through the Page's Send API."""
    if not META_PAGE_ACCESS_TOKEN:
        log.warning("META_PAGE_ACCESS_TOKEN not set; cannot reply on Messenger/Instagram.")
        return
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.post(
            f"{GRAPH_URL}/me/messages",
            params={"access_token": META_PAGE_ACCESS_TOKEN},
            json={"recipient": {"id": recipient_id}, "messaging_type": "RESPONSE", "message": {"text": text[:2000]}},
        )
        if r.status_code >= 300:
            log.error("Messenger/Instagram send failed: %s %s", r.status_code, r.text)


async def handle_whatsapp(phone_number_id: str, sender: str, text: str) -> None:
    reply = await platform_reply(f"wa:{sender}", text)
    await whatsapp_send(phone_number_id, sender, reply)


async def handle_page_message(platform: str, sender: str, text: str) -> None:
    reply = await platform_reply(f"{platform}:{sender}", text)
    await page_send(sender, reply)


@app.post("/webhooks/meta")
async def meta_webhook(
    request: Request,
    background: BackgroundTasks,
    x_hub_signature_256: str | None = Header(default=None),
):
    raw = await request.body()
    if META_APP_SECRET:
        expected = "sha256=" + hmac.new(META_APP_SECRET.encode(), raw, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(x_hub_signature_256 or "", expected):
            raise HTTPException(status_code=403, detail="Invalid signature.")

    payload = json.loads(raw or b"{}")
    obj = payload.get("object")

    for entry in payload.get("entry", []):
        # WhatsApp Cloud API
        if obj == "whatsapp_business_account":
            for change in entry.get("changes", []):
                value = change.get("value", {})
                phone_number_id = (value.get("metadata") or {}).get("phone_number_id")
                for msg in value.get("messages", []):
                    if msg.get("type") == "text" and phone_number_id:
                        background.add_task(handle_whatsapp, phone_number_id, msg["from"], msg["text"]["body"])

        # Facebook Messenger ("page") and Instagram DMs ("instagram")
        elif obj in ("page", "instagram"):
            for event in entry.get("messaging", []):
                message = event.get("message") or {}
                if message.get("is_echo") or not message.get("text"):
                    continue
                sender = (event.get("sender") or {}).get("id")
                if sender:
                    background.add_task(handle_page_message, obj, sender, message["text"])

    return {"status": "received"}  # Meta expects a fast 200
