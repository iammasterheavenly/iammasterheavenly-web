import FuelCalculator from "../components/FuelCalculator.jsx";

const RELEASES = [
  {
    type: "Music",
    title: "Debut Single",
    blurb: "Original digital music from I AM MASTER. Streaming and download links coming soon.",
    accent: "from-violet/40 to-violet/5",
    icon: "♪",
  },
  {
    type: "E-Book",
    title: "First E-Book",
    blurb: "A practical, South African-focused e-book in development. Join us at launch.",
    accent: "from-gold/40 to-gold/5",
    icon: "📖",
  },
  {
    type: "PDF",
    title: "Printable Guides",
    blurb: "Downloadable PDF guides, templates and worksheets to get things done.",
    accent: "from-sky-500/40 to-sky-500/5",
    icon: "📄",
  },
  {
    type: "Web Tool",
    title: "More Calculators",
    blurb: "More free everyday tools for South Africans, built after the fuel calculator.",
    accent: "from-emerald-500/40 to-emerald-500/5",
    icon: "⚙",
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,66,0.15),transparent_60%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="mb-4 inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
            Proudly South African
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
            iammasterheavenly <span className="text-gold">(Pty) Ltd</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            <span className="font-semibold text-white">I AM MASTER</span> is a hub for original
            digital music, e-books and PDFs, and practical web tools built for everyday South
            Africans.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#calculator"
              className="rounded-lg bg-gold px-5 py-3 font-semibold text-ink transition hover:bg-gold-dim"
            >
              Try the Fuel Calculator
            </a>
            <a
              href="#releases"
              className="rounded-lg border border-edge px-5 py-3 font-semibold text-white transition hover:border-gold hover:text-gold"
            >
              Upcoming Releases
            </a>
          </div>

          <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-edge pt-6">
            {[
              ["Music", "Original"],
              ["E-Books", "& PDFs"],
              ["Web Tools", "Free"],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="text-lg font-bold text-white">{a}</dt>
                <dd className="text-sm text-zinc-400">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Calculator */}
      <section id="calculator" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Free Web Tool</p>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              How much will your trip cost?
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-400">
              Enter your distance, pick your vehicle and fuel grade, and get an instant estimate in
              Rands — one-way or return.
            </p>
          </div>
          <FuelCalculator />
        </div>
      </section>

      {/* Releases */}
      <section id="releases" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">Coming Soon</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Digital Releases</h2>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Music, e-books and PDFs from I AM MASTER are on the way.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RELEASES.map((item) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-edge bg-panel transition hover:-translate-y-1 hover:border-gold/60"
              >
                <div className={`grid aspect-square place-items-center bg-gradient-to-br ${item.accent}`}>
                  <span className="text-6xl opacity-80 transition group-hover:scale-110" aria-hidden="true">
                    {item.icon}
                  </span>
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {item.type}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.blurb}</p>
                  <span className="mt-4 inline-block rounded-full border border-edge px-3 py-1 text-xs text-zinc-400">
                    Coming soon
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
