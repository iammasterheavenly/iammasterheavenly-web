import { BACKDROP_ITEMS } from "../data/backdropVerses.js";

// Typographic looks, inspired by a mixed-font scripture collage.
const STYLES = {
  // Sized to the column width (cqi) so the longest anchor word ("Encouraged") always fits.
  bigSerif: "font-serif text-[min(12.5cqi,4.5rem)] leading-[0.9] uppercase text-zinc-100",
  serif: "font-serif text-[clamp(1.4rem,2.2vw,2rem)] leading-tight uppercase text-zinc-200",
  serifItalic: "font-serif italic text-[clamp(1.1rem,1.6vw,1.5rem)] leading-snug text-zinc-300",
  display: "font-display text-[clamp(2rem,3.4vw,3.25rem)] leading-[0.85] uppercase text-zinc-400",
  anton: "font-anton text-[clamp(1.8rem,3vw,2.9rem)] leading-[0.95] uppercase text-zinc-100 [text-shadow:4px_4px_0_rgb(82_82_91)]",
  wide: "font-wide font-light text-[clamp(0.85rem,1.2vw,1.15rem)] leading-relaxed tracking-[0.3em] uppercase text-zinc-300",
  script: "font-script text-[clamp(1.4rem,2vw,1.9rem)] leading-tight text-zinc-300",
  brush: "font-brush text-[clamp(1.4rem,2.1vw,2rem)] leading-tight text-zinc-200",
  marker: "font-marker text-[clamp(1.1rem,1.7vw,1.6rem)] leading-tight uppercase text-zinc-300",
};

function Deco({ kind }) {
  const common = "mx-auto my-2 text-zinc-300";
  switch (kind) {
    case "cross":
      return (
        <svg className={`${common} h-36 w-24`} viewBox="0 0 60 90" fill="currentColor">
          <rect x="24" y="0" width="12" height="90" />
          <rect x="4" y="22" width="52" height="12" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={`${common} h-14 w-14`} viewBox="0 0 48 48" fill="currentColor">
          <path d="M18 4c1.5 8 4 10.5 12 12-8 1.5-10.5 4-12 12-1.5-8-4-10.5-12-12 8-1.5 10.5-4 12-12Z" />
          <path d="M36 26c.9 4.5 2.4 6 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-1 6.1-2.5 7-7Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={`${common} h-24 w-16`} viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 78V10" />
          <path d="M20 30C8 24 6 12 8 4c8 4 12 14 12 26Z" />
          <path d="M20 48c12-6 14-18 12-26-8 4-12 14-12 26Z" />
          <path d="M20 64C10 60 7 50 8 42c8 4 12 12 12 22Z" />
        </svg>
      );
    case "squiggle":
      return (
        <svg className={`${common} h-16 w-40`} viewBox="0 0 160 60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M5 20c15-20 25-20 37 0s25 20 37 0 25-20 37 0 25 20 37 0" />
          <path d="M5 44c15-20 25-20 37 0s25 20 37 0 25-20 37 0 25 20 37 0" />
        </svg>
      );
    case "dots":
      return (
        <svg className={`${common} h-20 w-20`} viewBox="0 0 60 60" fill="currentColor">
          <ellipse cx="38" cy="8" rx="5" ry="8" transform="rotate(25 38 8)" />
          <ellipse cx="22" cy="20" rx="5" ry="8" transform="rotate(-20 22 20)" />
          <ellipse cx="40" cy="30" rx="5" ry="8" transform="rotate(30 40 30)" />
          <ellipse cx="18" cy="42" rx="5" ry="8" transform="rotate(-35 18 42)" />
          <ellipse cx="32" cy="54" rx="5" ry="7" transform="rotate(10 32 54)" />
        </svg>
      );
    default:
      return null;
  }
}

function Item({ item }) {
  if (item.deco) return <Deco kind={item.deco} />;

  const base = STYLES[item.style] || STYLES.serif;

  if (item.style === "stack") {
    return (
      <div className="flex items-start gap-3">
        <span className="font-display text-[clamp(2rem,3.2vw,3rem)] leading-[0.9] text-zinc-500 [writing-mode:vertical-rl] rotate-180">
          {item.prefix}
        </span>
        <div>
          <p className="font-serif text-[clamp(1.4rem,2.2vw,2rem)] leading-[1.05] whitespace-pre-line text-zinc-100">
            {item.text}
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">{item.ref}</p>
        </div>
      </div>
    );
  }

  // Big anchor words fill their column: shorter words get a bigger font.
  let style;
  if (item.style === "bigSerif") {
    const longest = Math.max(...item.text.split("\n").map((l) => l.length));
    style = { fontSize: `min(${(95 / (longest * 0.72)).toFixed(1)}cqi, 6rem)` };
  }

  return (
    <div>
      <p style={style} className={`whitespace-pre-line ${base}`}>{item.text}</p>
      {item.ref && <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-zinc-500">{item.ref}</p>}
    </div>
  );
}

/**
 * Fixed, full-viewport scripture collage that sits behind the whole site.
 * Purely decorative: hidden from screen readers and ignores pointer events.
 */
export default function ScriptureBackdrop({ full = false }) {
  return (
    <div aria-hidden={!full} className={`fixed inset-0 overflow-hidden bg-charcoal select-none ${full ? "" : "pointer-events-none -z-10"}`}>
      <div className={`backdrop-columns h-full px-6 py-8 ${full ? "" : "opacity-[0.22]"}`}>
        {BACKDROP_ITEMS.map((item, i) => (
          <div key={i} className="@container mb-8 break-inside-avoid">
            <Item item={item} />
          </div>
        ))}
      </div>
      {/* Soft vignette so page content stays readable */}
      {!full && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(10,10,15,0.25),rgba(10,10,15,0.75))]" />
      )}
    </div>
  );
}
