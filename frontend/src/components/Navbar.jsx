import { useState } from "react";

const LINKS = [
  { href: "#calculator", label: "Calculators" },
  { href: "#scripture", label: "Scripture" },
  { href: "#showcase", label: "Our Work" },
  { href: "#ai", label: "AI Assistants" },
  { href: "#ebooks", label: "E-Books" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-edge/70 bg-ink/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#home" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold font-black text-ink">
            M
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-widest text-white">
              I AM MASTER
            </span>
            <span className="block text-[11px] text-zinc-400">iammasterheavenly (Pty) Ltd</span>
          </span>
        </a>

        <ul className="hidden items-center gap-6 text-sm lg:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-zinc-300 transition hover:text-gold">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="rounded-md border border-edge p-2 text-zinc-300 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {open && (
        <ul className="space-y-1 border-t border-edge px-4 pb-4 pt-2 lg:hidden">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-zinc-300 hover:bg-panel hover:text-gold"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
