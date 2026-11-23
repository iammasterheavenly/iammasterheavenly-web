import { useMemo } from "react";
import { THEMES, ACCENT_WORDS, DECORATIONS } from "../data/backdropVerses.js";

/*
 * Scripture "scribble board" background.
 * - Every verse gets a random-looking (but stable) font, size, shade, tilt and alignment.
 * - The verse list is cycled several times with different looks so the board covers the
 *   whole length of the page; scrolling keeps revealing new scripture.
 * - A faint handwritten layer of continuous scripture fills every gap underneath.
 */

// Sizes use container units (cqi) so text always fits its column.
const STYLES = {
  serif: "font-serif uppercase leading-tight text-[min(9cqi,2.2rem)]",
  serifItalic: "font-serif italic leading-snug text-[min(7.5cqi,1.6rem)]",
  display: "font-display uppercase leading-[0.85] text-[min(15cqi,3.6rem)]",
  anton: "font-anton uppercase leading-[0.95] text-[min(11cqi,3rem)] [text-shadow:4px_4px_0_rgb(82_82_91)]",
  outline: "font-anton uppercase leading-[0.95] text-[min(12cqi,3.2rem)] !text-transparent [-webkit-text-stroke:1.5px_rgb(212_212_216)]",
  wide: "font-wide font-light uppercase tracking-[0.3em] leading-relaxed text-[min(5cqi,1.1rem)]",
  script: "font-script leading-tight text-[min(10cqi,2.2rem)]",
  bigScript: "font-script leading-none text-[min(16cqi,4rem)]",
  brush: "font-brush leading-tight text-[min(9cqi,2.1rem)]",
  marker: "font-marker uppercase leading-tight text-[min(7.5cqi,1.7rem)]",
  typewriter: "font-mono uppercase tracking-widest leading-relaxed text-[min(4.5cqi,0.95rem)]",
  highlight: "font-wide font-semibold uppercase leading-[1.9] text-[min(5.5cqi,1.1rem)]",
  boxed: "font-display uppercase leading-none text-[min(10cqi,2.4rem)]",
  lead: "", // special layout: first word huge, rest small italic
};

const BY_LENGTH = {
  short: ["display", "anton", "outline", "bigScript", "boxed", "serif", "brush", "lead", "marker"],
  medium: ["serif", "script", "brush", "marker", "anton", "highlight", "lead", "serifItalic", "wide", "display"],
  long: ["serifItalic", "wide", "typewriter", "script", "marker", "highlight", "brush"],
};

const SHADES = ["text-zinc-50", "text-zinc-200", "text-zinc-300", "text-zinc-400", "text-zinc-500"];
const ALIGN = ["text-left", "text-center", "text-right"];
const PASSES = 3; // how many times the verse list repeats down the page

// Small seeded random generator so the board looks random but is identical on every visit.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

function buildBoard() {
  const themes = Object.values(THEMES);
  const items = [];

  for (let pass = 0; pass < PASSES; pass++) {
    const rand = seeded(1234 + pass * 977);
    // Interleave themes so every part of the board mixes all six.
    const max = Math.max(...themes.map((t) => t.verses.length));
    const offset = pass * 3; // shift each pass so verses land in new spots
    let count = 0;

    for (let i = 0; i < max; i++) {
      themes.forEach((theme, ti) => {
        const v = theme.verses[(i + offset + ti) % theme.verses.length];
        const [text, ref] = v;

        // Anchor words: one per theme early in each pass, then occasionally again.
        if (i === ti || (i > 8 && rand() < 0.03)) {
          items.push({ kind: "anchor", text: theme.anchor, style: pick(rand, ["bigSerif", "bigOutline", "bigDisplay"]), shade: pick(rand, SHADES.slice(0, 3)) });
        }

        const len = text.length;
        const bucket = len <= 28 ? "short" : len <= 60 ? "medium" : "long";
        let style = pick(rand, BY_LENGTH[bucket]);
        // "lead" makes the first word huge; only do that when it's a strong word.
        const firstWord = text.split(/[\s\n]/)[0].replace(/[^A-Za-z]/g, "");
        if (style === "lead" && firstWord.length < 5) style = "display";
        items.push({
          kind: "verse",
          text,
          ref,
          style,
          shade: pick(rand, SHADES),
          align: pick(rand, ALIGN),
          tilt: rand() < 0.3 ? Math.round((rand() * 8 - 4) * 10) / 10 : 0,
          showRef: rand() < 0.85,
        });

        count++;
        if (count % 9 === 0) {
          const [w, r] = pick(rand, ACCENT_WORDS);
          items.push({ kind: "verse", text: w, ref: r, style: pick(rand, BY_LENGTH.short), shade: pick(rand, SHADES), align: pick(rand, ALIGN), tilt: Math.round((rand() * 10 - 5) * 10) / 10, showRef: false });
        }
        if (count % 13 === 0) items.push({ kind: "deco", deco: pick(rand, DECORATIONS) });
      });
    }
  }
  return items;
}

// Continuous handwritten scripture used to fill every gap.
function buildTexture() {
  const all = Object.values(THEMES)
    .flatMap((t) => t.verses.map(([text, ref]) => `${text.replace(/\n/g, " ")} (${ref})`))
    .join("  ✦  ");
  return Array.from({ length: 10 }, () => all).join("  ✦  ");
}

function Deco({ kind }) {
  const common = "mx-auto my-1 text-zinc-300";
  switch (kind) {
    case "cross":
      return (
        <svg className={`${common} h-32 w-20`} viewBox="0 0 60 90" fill="currentColor">
          <rect x="24" y="0" width="12" height="90" />
          <rect x="4" y="22" width="52" height="12" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className={`${common} h-12 w-12`} viewBox="0 0 48 48" fill="currentColor">
          <path d="M18 4c1.5 8 4 10.5 12 12-8 1.5-10.5 4-12 12-1.5-8-4-10.5-12-12 8-1.5 10.5-4 12-12Z" />
          <path d="M36 26c.9 4.5 2.4 6 7 7-4.6.9-6.1 2.4-7 7-.9-4.6-2.4-6.1-7-7 4.6-1 6.1-2.5 7-7Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={`${common} h-20 w-14`} viewBox="0 0 40 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20 78V10" />
          <path d="M20 30C8 24 6 12 8 4c8 4 12 14 12 26Z" />
          <path d="M20 48c12-6 14-18 12-26-8 4-12 14-12 26Z" />
          <path d="M20 64C10 60 7 50 8 42c8 4 12 12 12 22Z" />
        </svg>
      );
    case "squiggle":
      return (
        <svg className={`${common} h-12 w-36`} viewBox="0 0 160 60" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M5 20c15-20 25-20 37 0s25 20 37 0 25-20 37 0 25 20 37 0" />
          <path d="M5 44c15-20 25-20 37 0s25 20 37 0 25-20 37 0 25 20 37 0" />
        </svg>
      );
    case "dots":
      return (
        <svg className={`${common} h-16 w-16`} viewBox="0 0 60 60" fill="currentColor">
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

const Ref = ({ children }) => (
  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">{children}</p>
);

function Verse({ item }) {
  const { text, ref, style, shade, align, tilt, showRef } = item;
  const rotate = tilt ? { transform: `rotate(${tilt}deg)` } : undefined;

  if (style === "lead") {
    const [first, ...rest] = text.replace(/\n/g, " ").split(" ");
    return (
      <div className={align} style={rotate}>
        <p className={`font-display uppercase leading-[0.85] text-[min(16cqi,3.8rem)] ${shade}`}>{first}</p>
        {rest.length > 0 && <p className={`font-serif italic leading-snug text-[min(7cqi,1.5rem)] ${shade}`}>{rest.join(" ")}</p>}
        {showRef && <Ref>{ref}</Ref>}
      </div>
    );
  }

  let body = <p className={`whitespace-pre-line ${STYLES[style]} ${shade}`}>{text}</p>;
  if (style === "highlight") {
    body = (
      <p className={STYLES.highlight}>
        <span className="bg-zinc-200 px-1.5 text-charcoal [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">{text}</span>
      </p>
    );
  } else if (style === "boxed") {
    body = (
      <p className={`inline-block border-2 border-current px-3 py-1.5 ${STYLES.boxed} ${shade}`}>{text}</p>
    );
  }

  return (
    <div className={align} style={rotate}>
      {body}
      {showRef && <Ref>{ref}</Ref>}
    </div>
  );
}

function Anchor({ item }) {
  const longest = Math.max(...item.text.split("\n").map((l) => l.length));
  const size = { fontSize: `min(${(95 / (longest * 0.72)).toFixed(1)}cqi, 6rem)` };
  const cls = {
    bigSerif: "font-serif uppercase leading-[0.9]",
    bigOutline: "font-anton uppercase leading-[0.95] !text-transparent [-webkit-text-stroke:2px_rgb(228_228_231)]",
    bigDisplay: "font-display uppercase leading-[0.85]",
  }[item.style];
  return (
    <p style={size} className={`whitespace-pre-line ${cls} ${item.shade}`}>
      {item.text}
    </p>
  );
}

/**
 * `full` renders the board on its own (the /?wallpaper view).
 * Otherwise it sits behind the whole site and scrolls with the page.
 */
export default function ScriptureBackdrop({ full = false }) {
  const items = useMemo(buildBoard, []);
  const texture = useMemo(buildTexture, []);

  return (
    <div
      aria-hidden="true"
      className={`select-none overflow-hidden bg-charcoal ${
        full ? "relative min-h-screen" : "pointer-events-none absolute inset-0 -z-10"
      }`}
    >
      {/* Gap filler: continuous handwritten scripture */}
      <p
        className={`absolute inset-0 break-words p-2 font-script text-[15px] leading-[1.15] text-zinc-400 ${
          full ? "opacity-[0.28]" : "opacity-[0.10]"
        }`}
      >
        {texture}
      </p>

      <div className={`relative backdrop-columns px-3 py-4 ${full ? "" : "opacity-[0.24]"}`}>
        {items.map((item, i) => (
          <div key={i} className="@container mb-3 break-inside-avoid break-words px-1.5">
            {item.kind === "deco" && <Deco kind={item.deco} />}
            {item.kind === "anchor" && <Anchor item={item} />}
            {item.kind === "verse" && <Verse item={item} />}
          </div>
        ))}
      </div>

      {/* Slight darkening so page content stays readable */}
      {!full && <div className="absolute inset-0 bg-ink/25" />}
    </div>
  );
}
