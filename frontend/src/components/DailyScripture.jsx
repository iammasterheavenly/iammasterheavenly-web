import { useEffect, useState } from "react";
import { API_URL } from "../lib/api.js";
import { todaysVerse } from "../lib/scripture.js";

export default function DailyScripture() {
  const [verse, setVerse] = useState(todaysVerse);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/scripture/today`, { signal: AbortSignal.timeout(30000) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!cancelled && data?.text) setVerse(data);
      })
      .catch(() => {}); // keep the instant local verse
    return () => {
      cancelled = true;
    };
  }, []);

  const shareText = `"${verse.text}" — ${verse.reference} (${verse.translation})\n\n${verse.reflection}\n\nScripture of the Day · I AM MASTER`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/15 via-panel to-violet/15 p-8 sm:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-semibold uppercase tracking-widest text-gold">
            {verse.theme}
          </span>
          <span className="text-zinc-400">{today}</span>
        </div>

        <blockquote className="mt-6">
          <p className="font-serif text-2xl leading-relaxed text-white sm:text-3xl">“{verse.text}”</p>
          <footer className="mt-4 text-lg font-semibold text-gold">
            {verse.reference} <span className="text-sm font-normal text-zinc-400">({verse.translation})</span>
          </footer>
        </blockquote>

        <div className="mt-8 rounded-2xl border border-edge bg-ink/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Encouraging reflection</p>
          <p className="mt-2 leading-relaxed text-zinc-200">{verse.reflection}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={copy}
            className="rounded-lg bg-gold px-5 py-3 font-semibold text-ink transition hover:bg-gold-dim">
            {copied ? "Copied ✓" : "Copy Verse"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3Z" />
            </svg>
            Share on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
