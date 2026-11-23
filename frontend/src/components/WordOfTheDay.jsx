import { todaysVerse } from "../lib/scripture.js";

// Slim bar at the very top of the site with today's verse.
export default function WordOfTheDay() {
  const verse = todaysVerse();

  return (
    <a
      href="#scripture"
      className="group block border-b border-gold/30 bg-gradient-to-r from-gold/20 via-ink to-gold/20 px-4 py-2.5 sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 text-sm">
        <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-ink">
          Word of the Day
        </span>
        <p className="min-w-0 flex-1 truncate text-zinc-200 sm:whitespace-normal sm:[display:-webkit-box] sm:[-webkit-line-clamp:2] sm:[-webkit-box-orient:vertical]">
          <span className="font-serif italic">“{verse.text}”</span>{" "}
          <span className="font-semibold text-gold">— {verse.reference}</span>
        </p>
        <span className="hidden shrink-0 text-xs font-semibold text-gold group-hover:underline md:inline">
          Reflect →
        </span>
      </div>
    </a>
  );
}
