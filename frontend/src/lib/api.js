// Base URL of the FastAPI backend. Set VITE_API_URL in .env (local) or in
// Cloudflare Pages environment variables (production).
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

// South African Rand formatting, e.g. 1 234,56
export const zar = new Intl.NumberFormat("en-ZA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const toNumber = (value) => {
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export const inputClass =
  "w-full rounded-lg border border-edge bg-ink px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";

export const labelClass = "mb-2 block text-sm font-medium text-zinc-300";
