import { useEffect, useRef, useState } from "react";
import { API_URL } from "../lib/api.js";

// Launch links come from environment variables so you can switch each channel
// "live" without touching code. Leave a variable empty to show "Coming soon".
const env = import.meta.env;

const CHANNELS = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    desc: "24/7 customer support, bookings and lead capture on the app South Africa uses most.",
    handle: env.VITE_WHATSAPP_NUMBER, // digits only, e.g. 27821234567
    href: (h) => `https://wa.me/${h.replace(/\D/g, "")}`,
    color: "text-emerald-300 border-emerald-500/40 bg-emerald-500/10",
    icon: "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z",
  },
  {
    id: "telegram",
    name: "Telegram",
    desc: "Fast bots for communities, channels, notifications and automated Q&A.",
    handle: env.VITE_TELEGRAM_BOT, // bot username without @
    href: (h) => `https://t.me/${h.replace(/^@/, "")}`,
    color: "text-sky-300 border-sky-500/40 bg-sky-500/10",
    icon: "M21.5 3.5 2.8 10.7c-1 .4-1 1.6 0 1.9l4.7 1.5 1.8 5.6c.2.7 1.1.9 1.6.4l2.6-2.5 4.8 3.6c.6.4 1.4.1 1.6-.6l3.2-15.6c.2-1-.7-1.8-1.6-1.5Z",
  },
  {
    id: "messenger",
    name: "Facebook Messenger",
    desc: "Instant replies to your Facebook Page visitors, enquiries and orders.",
    handle: env.VITE_MESSENGER_PAGE, // Facebook Page username
    href: (h) => `https://m.me/${h}`,
    color: "text-blue-300 border-blue-500/40 bg-blue-500/10",
    icon: "M12 2C6.5 2 2 6.1 2 11.3c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2Zm1 12.4-2.5-2.7-5 2.7 5.5-5.8 2.6 2.7 4.9-2.7-5.5 5.8Z",
  },
  {
    id: "instagram",
    name: "Instagram DMs",
    desc: "Turn DMs and story replies into conversations and sales, automatically.",
    handle: env.VITE_INSTAGRAM_HANDLE, // Instagram username without @
    href: (h) => `https://ig.me/m/${h.replace(/^@/, "")}`,
    color: "text-pink-300 border-pink-500/40 bg-pink-500/10",
    icon: "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm5 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm5.5-3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z",
  },
];

const GREETING = {
  role: "assistant",
  content: "Hi! 👋 I'm the I AM MASTER assistant. Ask me about websites, AI chatbots, our calculators or e-books.",
};

const SUGGESTIONS = [
  "Can you build a WhatsApp bot for my business?",
  "How much does a website cost?",
  "What tools do you offer?",
];

function ChatWidget() {
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState(null); // "live" | "demo" | "offline"
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Skip the local greeting; the API conversation must start with the user.
        body: JSON.stringify({ messages: next.slice(1).slice(-20) }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
      setMode(data.mode);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMode("offline");
      const msg = String(err?.message || "");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: msg.includes("Too many")
            ? msg
            : "I couldn't reach the server. It may be waking up (free hosting sleeps when idle). Please try again in about 30 seconds.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const badge = {
    live: ["AI live", "bg-emerald-400"],
    demo: ["Demo mode", "bg-amber-400"],
    offline: ["Offline", "bg-red-400"],
  }[mode] || ["Ready", "bg-zinc-400"];

  return (
    <div className="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between border-b border-edge px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold font-black text-ink">M</span>
          <div>
            <p className="font-semibold text-white">I AM MASTER Assistant</p>
            <p className="text-xs text-zinc-400">Python · FastAPI · Claude</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-edge px-3 py-1 text-xs text-zinc-300">
          <span className={`h-2 w-2 rounded-full ${badge[1]}`} />
          {badge[0]}
        </span>
      </div>

      <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
              m.role === "user" ? "rounded-br-sm bg-gold text-ink" : "rounded-bl-sm bg-ink text-zinc-200"
            }`}>
              {m.content}
            </p>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm bg-ink px-4 py-3 text-sm text-zinc-400">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
              </span>
            </p>
          </div>
        )}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}
                className="rounded-full border border-edge px-3 py-1.5 text-xs text-zinc-300 transition hover:border-gold hover:text-gold">
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="flex gap-2 border-t border-edge p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={2000}
          placeholder="Type your message…"
          aria-label="Message the AI assistant"
          className="flex-1 rounded-lg border border-edge bg-ink px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-gold"
        />
        <button type="submit" disabled={sending || !input.trim()}
          className="rounded-lg bg-gold px-5 font-semibold text-ink transition hover:bg-gold-dim disabled:cursor-not-allowed disabled:opacity-40">
          Send
        </button>
      </form>
    </div>
  );
}

export default function AIAssistants() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-2">
        {CHANNELS.map((c) => {
          const live = Boolean(c.handle);
          return (
            <article key={c.id} className="flex flex-col rounded-2xl border border-edge bg-panel p-5 transition hover:border-gold/50">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl border ${c.color}`}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={c.icon} fillRule="evenodd" />
                  </svg>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  live ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                }`}>
                  {live ? "● Live" : "Coming soon"}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-white">{c.name}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-zinc-400">{c.desc}</p>
              {live ? (
                <a href={c.href(c.handle)} target="_blank" rel="noopener noreferrer"
                  className="mt-4 rounded-lg bg-gold px-4 py-2 text-center text-sm font-semibold text-ink transition hover:bg-gold-dim">
                  Launch on {c.name.split(" ")[0]}
                </a>
              ) : (
                <span className="mt-4 rounded-lg border border-edge px-4 py-2 text-center text-sm text-zinc-500">
                  Launching soon
                </span>
              )}
            </article>
          );
        })}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-bold text-white">Test the AI Assistant Live</h3>
        <ChatWidget />
      </div>
    </div>
  );
}
