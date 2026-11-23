# iammasterheavenly (Pty) Ltd — I AM MASTER

Website for **iammasterheavenly (Pty) Ltd**, a South African **full-stack software &
web development studio**, **AI assistant builder** and **faith-inspired digital publisher**.

| Part | Stack | Deploys to |
| --- | --- | --- |
| `frontend/` | React + Vite + Tailwind CSS v4 | Cloudflare Pages (static `dist/`) |
| `backend/` | Python 3 + FastAPI + Anthropic SDK | Render (free web service) |

No WordPress or CMS.

## What's on the homepage

- **SA Petrol & Trip Calculator** (flagship) — live fuel prices from `GET /api/fuel-prices`, with built-in fallback prices.
- **Everyday Tools Suite** (tabs) — ZAR Hourly Rate & Project Quote (15% VAT, contingency, deposit split) and Compound Savings & Goal calculator.
- **Scripture of the Day** — 35 KJV verses on success, purpose, strength and the goodness of God, with a reflection, Copy Verse and Share on WhatsApp. Rotates at midnight SA time via `GET /api/scripture/today`; the page shows the same verse instantly from a local copy.
- **Full-Stack Web Apps & Calculators showcase**.
- **AI Assistants Hub** — WhatsApp, Telegram, Messenger and Instagram cards (Live / Coming soon from env vars) and a live web chat widget wired to `POST /api/chat`.
- **Digital E-Books & PDFs** — upcoming faith-inspired publications.

```
.
├── backend/
│   ├── main.py              # FastAPI: fuel prices, scripture, chat, webhooks
│   ├── data/scriptures.json # verse list (keep identical to frontend copy)
│   ├── requirements.txt
│   ├── .env.example
│   └── .python-version
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   ├── public/              # favicon.svg, _redirects
│   └── src/
│       ├── main.jsx, App.jsx, index.css
│       ├── lib/api.js       # API URL + shared helpers
│       ├── data/scriptures.json
│       ├── pages/Home.jsx
│       └── components/      # Navbar, Footer, FuelCalculator, ToolsSuite,
│                            # QuoteCalculator, SavingsCalculator,
│                            # DailyScripture, AIAssistants
├── render.yaml
└── README.md
```

---

## 1. Run locally

Requirements: **Node.js 20+**, **Python 3.10+**, **Git**.

### Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
uvicorn main:app --reload --port 8000
```

Check: <http://localhost:8000/api/scripture/today> · API docs: <http://localhost:8000/docs>

### Frontend (terminal 2)

```bash
cd frontend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>.

---

## 2. Environment variables

### Backend (`backend/.env` locally, Render → Environment in production)

| Variable | Purpose |
| --- | --- |
| `ALLOWED_ORIGINS` | Extra CORS origins, comma-separated (your Pages URL / custom domain) |
| `LLM_API_KEY` | Anthropic API key for the AI assistant. **Empty = demo mode** (keyword replies) |
| `LLM_MODEL` | Claude model ID (default `claude-opus-5-5`) |
| `TELEGRAM_BOT_TOKEN` | From [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Any random string; Telegram sends it back on every webhook call |
| `META_VERIFY_TOKEN` | Any random string; entered in the Meta app's webhook settings |
| `META_APP_SECRET` | Meta app secret; verifies `X-Hub-Signature-256` |
| `META_PAGE_ACCESS_TOKEN` | Page token for Messenger and Instagram DMs |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API token |
| `GRAPH_API_VERSION` | Meta Graph API version (default `v21.0`) |

### Frontend (`frontend/.env` locally, Cloudflare Pages → Settings → Variables)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend URL, e.g. `https://iammasterheavenly-api.onrender.com` |
| `VITE_WHATSAPP_NUMBER` | e.g. `27821234567` — turns the WhatsApp card **Live** |
| `VITE_TELEGRAM_BOT` | Bot username |
| `VITE_MESSENGER_PAGE` | Facebook Page username |
| `VITE_INSTAGRAM_HANDLE` | Instagram username |

Vite bakes `VITE_*` values in at build time, so redeploy after changing them.
Never put secrets in `VITE_*` variables — they are visible in the browser.

---

## 3. Connect the AI assistant and messaging platforms

**Website chat:** set `LLM_API_KEY` on Render. The chat badge switches from *Demo mode* to *AI live*.
The public endpoint is rate-limited to 20 messages per 10 minutes per IP.

**Telegram:**
1. Create a bot with @BotFather; set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` on Render.
2. Register the webhook (open in a browser, replacing the values):
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-api>.onrender.com/webhooks/telegram&secret_token=<SECRET>`

**WhatsApp / Messenger / Instagram (Meta):**
1. Create an app at developers.facebook.com and add the WhatsApp, Messenger and/or Instagram products.
2. Webhook callback URL: `https://<your-api>.onrender.com/webhooks/meta`, verify token = `META_VERIFY_TOKEN`.
3. Subscribe to `messages` (WhatsApp) and `messages` (Page / Instagram).
4. Set `META_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN` and/or `META_PAGE_ACCESS_TOKEN` on Render.

Conversation memory for messaging platforms is kept in memory (last 10 messages per user) and
resets when the server restarts. Use a database for production history.

---

## 4. Push to GitHub

```bash
git add .
git commit -m "Describe your change"
git push
```

Repository: <https://github.com/iammasterheavenly/iammasterheavenly-web>

---

## 5. Deploy the backend on Render

**Blueprint:** Render → **New → Blueprint** → pick this repo → fill in the secret values → **Apply**.

**Manual:** **New → Web Service** → this repo, then:
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Env: `PYTHON_VERSION=3.12.7` plus the variables in section 2.

Free instances sleep after ~15 minutes idle and take up to a minute to wake. The calculators and
scripture work instantly from built-in data; the chat shows a "waking up" message until the API answers.

---

## 6. Deploy the frontend on Cloudflare Pages

**Git integration:** Workers & Pages → Create → Pages → Connect to Git → this repo:
- Root directory: `frontend`
- Build command: `npm run build`
- Build output directory: `dist`
- Variables: `VITE_API_URL`, `NODE_VERSION=20`, and the optional `VITE_*` launch links.

**Wrangler CLI:**

```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name iammasterheavenly-web
```

Add the final Pages URL (and any custom domain) to `ALLOWED_ORIGINS` on Render.

---

## 7. Monthly / content updates

- **Fuel prices:** edit `FUEL_PRICES` + `FUEL_PRICES_EFFECTIVE` in `backend/main.py` and `FALLBACK_PRICES` in `frontend/src/components/FuelCalculator.jsx`. The shipped prices are indicative placeholders.
- **Scripture list:** edit `backend/data/scriptures.json`, then copy it to `frontend/src/data/scriptures.json` so both pick the same verse each day.
- **E-books:** edit `PUBLICATIONS` in `frontend/src/pages/Home.jsx`.

© iammasterheavenly (Pty) Ltd. All rights reserved.
