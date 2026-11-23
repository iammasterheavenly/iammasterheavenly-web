import { useMemo, useState } from "react";
import { zar, toNumber, inputClass, labelClass } from "../lib/api.js";

const VAT_RATE = 0.15;
const DEPOSIT_PRESETS = [30, 50, 100];

export default function QuoteCalculator() {
  const [rate, setRate] = useState("450");
  const [hours, setHours] = useState("40");
  const [expenses, setExpenses] = useState("0");
  const [contingency, setContingency] = useState("10");
  const [vatRegistered, setVatRegistered] = useState(true);
  const [deposit, setDeposit] = useState(50);
  const [customDeposit, setCustomDeposit] = useState("40");

  const depositPct = deposit === "custom" ? Math.min(toNumber(customDeposit), 100) : deposit;

  const q = useMemo(() => {
    const labour = toNumber(rate) * toNumber(hours);
    const buffer = labour * (toNumber(contingency) / 100);
    const subtotal = labour + buffer + toNumber(expenses);
    const vat = vatRegistered ? subtotal * VAT_RATE : 0;
    const total = subtotal + vat;
    const depositAmount = total * (depositPct / 100);
    return { labour, buffer, subtotal, vat, total, depositAmount, balance: total - depositAmount };
  }, [rate, hours, expenses, contingency, vatRegistered, depositPct]);

  return (
    <div className="grid lg:grid-cols-5">
      <div className="space-y-5 p-6 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="q-rate" className={labelClass}>Hourly rate (R)</label>
            <input id="q-rate" type="number" inputMode="decimal" min="0" value={rate}
              onChange={(e) => setRate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="q-hours" className={labelClass}>Estimated hours</label>
            <input id="q-hours" type="number" inputMode="decimal" min="0" value={hours}
              onChange={(e) => setHours(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="q-exp" className={labelClass}>Expenses / licences (R)</label>
            <input id="q-exp" type="number" inputMode="decimal" min="0" value={expenses}
              onChange={(e) => setExpenses(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="q-cont" className={labelClass}>Contingency buffer (%)</label>
            <input id="q-cont" type="number" inputMode="decimal" min="0" value={contingency}
              onChange={(e) => setContingency(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <span className={labelClass}>Deposit upfront</span>
          <div className="grid grid-cols-4 gap-2">
            {[...DEPOSIT_PRESETS, "custom"].map((d) => (
              <button key={d} type="button" onClick={() => setDeposit(d)} aria-pressed={deposit === d}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  deposit === d ? "border-gold bg-gold/10 text-white" : "border-edge bg-ink text-zinc-300 hover:border-zinc-500"
                }`}>
                {d === "custom" ? "Custom" : `${d}%`}
              </button>
            ))}
          </div>
          {deposit === "custom" && (
            <input type="number" inputMode="decimal" min="0" max="100" value={customDeposit}
              aria-label="Custom deposit percentage" onChange={(e) => setCustomDeposit(e.target.value)}
              className={`${inputClass} mt-3`} placeholder="Deposit %" />
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-edge bg-ink px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">VAT registered (15%)</p>
            <p className="text-xs text-zinc-400">
              {vatRegistered ? "VAT is added to the quote" : "No VAT charged"}
            </p>
          </div>
          <button type="button" role="switch" aria-checked={vatRegistered} aria-label="Toggle VAT"
            onClick={() => setVatRegistered((v) => !v)}
            className={`relative h-7 w-14 shrink-0 rounded-full transition ${vatRegistered ? "bg-gold" : "bg-edge"}`}>
            <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${vatRegistered ? "translate-x-7" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-edge bg-gradient-to-br from-gold/10 via-panel to-violet/10 p-6 lg:col-span-2 lg:border-l lg:border-t-0" aria-live="polite">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400">Project total {vatRegistered ? "(incl. VAT)" : ""}</p>
          <p className="text-4xl font-extrabold text-gold">R {zar.format(q.total)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-edge bg-ink/60 p-3">
            <p className="text-xs text-zinc-400">Deposit ({zar.format(depositPct)}%)</p>
            <p className="text-xl font-bold text-white">R {zar.format(q.depositAmount)}</p>
          </div>
          <div className="rounded-lg border border-edge bg-ink/60 p-3">
            <p className="text-xs text-zinc-400">Balance on delivery</p>
            <p className="text-xl font-bold text-white">R {zar.format(q.balance)}</p>
          </div>
        </div>
        <dl className="space-y-2 border-t border-edge pt-4 text-sm">
          {[
            ["Labour", q.labour],
            ["Contingency", q.buffer],
            ["Expenses", toNumber(expenses)],
            ["Subtotal (excl. VAT)", q.subtotal],
            ["VAT @ 15%", q.vat],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-zinc-400">
              <dt>{k}</dt>
              <dd className="text-zinc-200">R {zar.format(v)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
