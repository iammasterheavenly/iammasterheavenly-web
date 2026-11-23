import { useState } from "react";
import QuoteCalculator from "./QuoteCalculator.jsx";
import SavingsCalculator from "./SavingsCalculator.jsx";

const TABS = [
  {
    id: "quote",
    label: "Hourly Rate & Quote",
    title: "ZAR Hourly Rate & Project Quote",
    blurb: "Price a project in Rands with 15% VAT and a deposit split, for freelancers and clients.",
    Component: QuoteCalculator,
  },
  {
    id: "savings",
    label: "Savings & Goals",
    title: "Compound Savings & Goal Calculator",
    blurb: "See how monthly contributions grow over time and what it takes to hit your goal.",
    Component: SavingsCalculator,
  },
];

export default function ToolsSuite() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active);

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/40">
      <div role="tablist" aria-label="Everyday tools" className="flex gap-1 overflow-x-auto border-b border-edge bg-ink/40 p-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setActive(t.id)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              active === t.id ? "bg-gold text-ink" : "text-zinc-300 hover:bg-panel hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="border-b border-edge px-6 py-5">
        <h3 className="text-xl font-bold text-white">{tab.title}</h3>
        <p className="text-sm text-zinc-400">{tab.blurb}</p>
      </div>
      <div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`}>
        <tab.Component />
      </div>
    </div>
  );
}
