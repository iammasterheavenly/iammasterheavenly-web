# iammasterheavenly (Pty) Ltd — I AM MASTER

Website for **iammasterheavenly (Pty) Ltd**, a South African digital media company
(original music, e-books/PDFs and practical web tools). It includes a live
**South African Petrol & Trip Calculator**.

| Part | Stack | Deploys to |
| --- | --- | --- |
| `frontend/` | React + Vite + Tailwind CSS v4 | Cloudflare Pages (static `dist/`) |
| `backend/` | Python 3 + FastAPI | Render (free web service) |

No WordPress or CMS.

```
.
├── backend/
│   ├── main.py              # FastAPI app: /, /health, /api/fuel-prices
│   ├── requirements.txt
│   └── .python-version
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example         # VITE_API_URL
│   ├── public/              # favicon.svg, _redirects (Cloudflare SPA rule)
│   └── src/
│       ├── main.jsx
│       ├── index.css        # Tailwind + brand colours
│       ├── App.jsx
│       ├── pages/Home.jsx
│       └── components/      # Navbar, Footer, FuelCalculator
├── render.yaml              # Render Blueprint for the backend
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
uvicorn main:app --reload --port 8000
```

Check it: <http://localhost:8000/api/fuel-prices> · API docs: <http://localhost:8000/docs>

### Frontend (terminal 2)

```bash
cd frontend
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>. The badge on the calculator shows **Live prices** when
the backend answers, or **Using default prices** when it doesn't — the calculator works
either way.

---

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: I AM MASTER website"
git branch -M main
git remote add origin https://github.com/iammasterheavenly/iammasterheavenly.git
git push -u origin main
```

(Create the empty `iammasterheavenly` repository on GitHub first, without a README.)

---

## 3. Deploy the backend on Render

**Option A — Blueprint (uses `render.yaml`)**
1. Render dashboard → **New → Blueprint** → pick this GitHub repo → **Apply**.

**Option B — manual web service**
1. Render dashboard → **New → Web Service** → pick this repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. Environment variables:
   - `PYTHON_VERSION` = `3.12.7`
   - `ALLOWED_ORIGINS` = `https://iammasterheavenly.pages.dev` (add your custom domain too, comma-separated)

Your API will be at something like `https://iammasterheavenly-api.onrender.com`.
Free instances sleep after ~15 minutes idle and take up to a minute to wake; the
frontend shows default prices until then.

---

## 4. Deploy the frontend on Cloudflare Pages

**Option A — Git integration (recommended)**
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → pick this repo.
2. Build settings:
   - **Framework preset:** Vite (or None)
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. Environment variable (Production and Preview):
   - `VITE_API_URL` = your Render URL, e.g. `https://iammasterheavenly-api.onrender.com`
   - `NODE_VERSION` = `20`
4. **Save and Deploy.** Site goes live at `https://iammasterheavenly.pages.dev`.

**Option B — Wrangler CLI**

```bash
cd frontend
# Windows PowerShell: $env:VITE_API_URL="https://iammasterheavenly-api.onrender.com"; npm run build
VITE_API_URL=https://iammasterheavenly-api.onrender.com npm run build
npx wrangler pages deploy dist --project-name iammasterheavenly
```

If your Pages project gets a different name or you add a custom domain, add that
URL to `ALLOWED_ORIGINS` on Render.

---

## 5. Updating fuel prices each month

Edit `FUEL_PRICES` and `FUEL_PRICES_EFFECTIVE` in `backend/main.py` after the
monthly fuel price announcement (usually effective the first Wednesday of the month),
and mirror the numbers in `FALLBACK_PRICES` in
`frontend/src/components/FuelCalculator.jsx`. Commit and push — Render and
Cloudflare redeploy automatically.

The prices shipped in this repo are **indicative placeholders** — confirm them
against the official announcement before going live.

---

## Calculator maths

```
total_km   = distance × (2 if return trip else 1)
litres     = total_km × consumption_L_per_100km ÷ 100
cost (R)   = litres × price_per_litre
R per km   = cost ÷ total_km
```

© iammasterheavenly (Pty) Ltd. All rights reserved.
