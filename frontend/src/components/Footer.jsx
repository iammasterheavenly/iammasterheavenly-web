export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-edge bg-panel/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold tracking-widest text-white">I AM MASTER</p>
          <p className="mt-1 text-sm text-zinc-400">iammasterheavenly (Pty) Ltd</p>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            A South African digital media company creating original music, e-books, PDFs and
            practical web tools.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li><a href="#calculator" className="hover:text-gold">Petrol &amp; Trip Calculator</a></li>
            <li><a href="#releases" className="hover:text-gold">Digital Releases</a></li>
            <li><a href="#home" className="hover:text-gold">Back to top</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li>Registered in the Republic of South Africa</li>
            <li>Private Company — (Pty) Ltd</li>
            <li>Registration No: [CIPC number]</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-edge">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-zinc-500 sm:px-6">
          © {year} iammasterheavenly (Pty) Ltd. All rights reserved. Fuel prices shown are
          indicative; always confirm the current official price at the pump.
        </p>
      </div>
    </footer>
  );
}
