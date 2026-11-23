export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id="about" className="border-t border-edge bg-panel/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="text-lg font-extrabold tracking-widest text-white">I AM MASTER</p>
          <p className="mt-1 text-sm text-zinc-400">iammasterheavenly (Pty) Ltd</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
            A South African full-stack software and web development studio, AI assistant builder and
            faith-inspired digital publisher.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li><a href="#calculator" className="hover:text-gold">Petrol &amp; Trip Calculator</a></li>
            <li><a href="#tools" className="hover:text-gold">Quote &amp; Savings Calculators</a></li>
            <li><a href="#scripture" className="hover:text-gold">Scripture of the Day</a></li>
            <li><a href="#showcase" className="hover:text-gold">Web Apps Showcase</a></li>
            <li><a href="#ai" className="hover:text-gold">AI Assistants</a></li>
            <li><a href="#ebooks" className="hover:text-gold">E-Books &amp; PDFs</a></li>
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
          © {year} iammasterheavenly (Pty) Ltd. All rights reserved. Calculator results are estimates
          only and not financial advice. Fuel prices are indicative; confirm the official price at the pump.
          Scripture quotations from the King James Version (public domain).
        </p>
      </div>
    </footer>
  );
}
