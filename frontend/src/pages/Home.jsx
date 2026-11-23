import FuelCalculator from "../components/FuelCalculator.jsx";
import ToolsSuite from "../components/ToolsSuite.jsx";
import DailyScripture from "../components/DailyScripture.jsx";
import AIAssistants from "../components/AIAssistants.jsx";

const SHOWCASE = [
  {
    tag: "Live tool",
    title: "SA Petrol & Trip Calculator",
    blurb: "Live fuel prices from a FastAPI backend, vehicle presets and return-trip costing in Rands.",
    stack: ["React", "FastAPI", "Tailwind"],
    href: "#calculator",
  },
  {
    tag: "Live tool",
    title: "ZAR Hourly Rate & Quote Calculator",
    blurb: "Quotes with 15% VAT, contingency and deposit split for South African freelancers and clients.",
    stack: ["React", "Tailwind"],
    href: "#tools",
  },
  {
    tag: "Live tool",
    title: "Compound Savings & Goal Calculator",
    blurb: "Monthly compounding projections, a year-by-year table and time-to-goal in ZAR.",
    stack: ["React", "Tailwind"],
    href: "#tools",
  },
  {
    tag: "Live demo",
    title: "AI Chat Assistant",
    blurb: "A Python + LLM assistant wired into this website, ready for WhatsApp, Telegram, Messenger and Instagram.",
    stack: ["Python", "FastAPI", "Claude"],
    href: "#ai",
  },
  {
    tag: "Service",
    title: "Business Websites",
    blurb: "Fast, modern, mobile-first websites without WordPress: hosted cheaply on Cloudflare and Render.",
    stack: ["React", "Vite", "Cloudflare"],
    href: "#contact",
  },
  {
    tag: "Service",
    title: "Custom Web Apps & Dashboards",
    blurb: "Booking systems, portals, internal tools and calculators built around how your business works.",
    stack: ["React", "Python", "APIs"],
    href: "#contact",
  },
];

const PUBLICATIONS = [
  {
    type: "E-Book",
    title: "Rooted for Success",
    blurb: "31 days of scripture and practical steps for building your work and purpose on solid ground.",
    accent: "from-gold/40 to-gold/5",
    icon: "📖",
  },
  {
    type: "E-Book",
    title: "Faith at Work",
    blurb: "Encouragement for entrepreneurs and professionals on diligence, excellence and integrity.",
    accent: "from-violet/40 to-violet/5",
    icon: "✝",
  },
  {
    type: "PDF",
    title: "Daily Strength Scripture Cards",
    blurb: "Printable verse cards on strength, purpose and the goodness of God for your desk or fridge.",
    accent: "from-sky-500/40 to-sky-500/5",
    icon: "🕊",
  },
  {
    type: "PDF",
    title: "Freelancer's Quote & Budget Kit",
    blurb: "Printable templates for quoting, VAT, deposits and monthly budgeting in Rands.",
    accent: "from-emerald-500/40 to-emerald-500/5",
    icon: "🧾",
  },
];

function SectionHeading({ eyebrow, title, children }) {
  return (
    <div className="mb-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-gold">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {children && <p className="mt-3 max-w-2xl text-zinc-400">{children}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,197,66,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pt-28">
          <p className="mb-4 inline-block rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gold">
            Proudly South African
          </p>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
            iammasterheavenly <span className="text-gold">(Pty) Ltd</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            <span className="font-semibold text-white">I AM MASTER</span> is a full-stack software and
            web development studio. We build websites, web apps and calculators, create custom AI
            assistants for WhatsApp, Telegram, Messenger and Instagram, and publish faith-inspired
            e-books and PDFs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#ai" className="rounded-lg bg-gold px-5 py-3 font-semibold text-ink transition hover:bg-gold-dim">
              Try the AI Assistant
            </a>
            <a href="#calculator"
              className="rounded-lg border border-edge px-5 py-3 font-semibold text-white transition hover:border-gold hover:text-gold">
              Free Calculators
            </a>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-edge pt-6">
            {[
              ["Web Development", "React · Python"],
              ["AI Assistants", "4 platforms"],
              ["E-Books & PDFs", "Faith-inspired"],
            ].map(([a, b]) => (
              <div key={a}>
                <dt className="text-base font-bold text-white sm:text-lg">{a}</dt>
                <dd className="text-sm text-zinc-400">{b}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Flagship tool */}
      <section id="calculator" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Flagship Tool" title="How much will your trip cost?">
            Enter your distance, pick your vehicle and fuel grade, and get an instant estimate in Rands —
            one-way or return.
          </SectionHeading>
          <FuelCalculator />
        </div>
      </section>

      {/* Everyday tools */}
      <section id="tools" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Everyday Tools Suite" title="More free calculators">
            Practical money tools for South Africans: price your work properly and plan your savings.
          </SectionHeading>
          <ToolsSuite />
        </div>
      </section>

      {/* Scripture */}
      <section id="scripture" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionHeading eyebrow="Scripture of the Day" title="A word of encouragement" />
          <DailyScripture />
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Our Work" title="Full-Stack Web Apps & Calculators">
            Built with React, Tailwind and Python FastAPI — no WordPress, fast to load and cheap to host.
          </SectionHeading>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWCASE.map((item) => (
              <a key={item.title} href={item.href}
                className="group flex flex-col rounded-2xl border border-edge bg-panel p-6 transition hover:-translate-y-1 hover:border-gold/60">
                <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                  item.tag === "Service" ? "bg-violet/15 text-violet-300" : "bg-emerald-500/15 text-emerald-300"
                }`}>
                  {item.tag}
                </span>
                <h3 className="mt-4 text-lg font-bold text-white group-hover:text-gold">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">{item.blurb}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.stack.map((s) => (
                    <span key={s} className="rounded-md border border-edge bg-ink px-2 py-0.5 text-xs text-zinc-400">{s}</span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* AI assistants */}
      <section id="ai" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="AI Assistants Hub" title="Custom AI chat assistants for your business">
            Python-powered assistants on the platforms your customers already use. They answer questions,
            take bookings and capture leads around the clock.
          </SectionHeading>
          <AIAssistants />
        </div>
      </section>

      {/* Publications */}
      <section id="ebooks" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading eyebrow="Coming Soon" title="Digital E-Books & PDFs">
            Faith-inspired reading and practical printables on purpose, strength and building well.
          </SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PUBLICATIONS.map((item) => (
              <article key={item.title}
                className="group overflow-hidden rounded-2xl border border-edge bg-panel transition hover:-translate-y-1 hover:border-gold/60">
                <div className={`grid aspect-[4/3] place-items-center bg-gradient-to-br ${item.accent}`}>
                  <span className="text-6xl opacity-80 transition group-hover:scale-110" aria-hidden="true">{item.icon}</span>
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">{item.type}</span>
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

      {/* Contact CTA */}
      <section id="contact" className="scroll-mt-20 border-t border-edge/60 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Have a project in mind?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-zinc-400">
            Websites, web apps, calculators or an AI assistant for your business — tell the assistant
            what you need and we'll take it from there.
          </p>
          <a href="#ai" className="mt-8 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-ink transition hover:bg-gold-dim">
            Start a conversation
          </a>
        </div>
      </section>
    </>
  );
}
