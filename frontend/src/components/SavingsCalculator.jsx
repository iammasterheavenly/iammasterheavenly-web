import { useMemo, useState } from "react";
import { zar, toNumber, inputClass, labelClass } from "../lib/api.js";

// Monthly compounding. Contributions are made at the end of each month.
function project(initial, monthly, annualRatePct, years) {
  const r = annualRatePct / 100 / 12;
  const months = Math.round(years * 12);
  let balance = initial;
  let contributed = initial;
  const yearly = [];
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + r) + monthly;
    contributed += monthly;
    if (m % 12 === 0 || m === months) {
      yearly.push({ year: Math.ceil(m / 12), balance, contributed, growth: balance - contributed });
    }
  }
  return { balance, contributed, growth: balance - contributed, yearly };
}

function monthsToGoal(initial, monthly, annualRatePct, goal) {
  if (goal <= initial) return 0;
  const r = annualRatePct / 100 / 12;
  let balance = initial;
  for (let m = 1; m <= 1200; m++) {
    balance = balance * (1 + r) + monthly;
    if (balance >= goal) return m;
  }
  return null; // more than 100 years
}

function requiredMonthly(initial, annualRatePct, years, goal) {
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  if (n <= 0) return 0;
  const grownInitial = initial * Math.pow(1 + r, n);
  const remaining = goal - grownInitial;
  if (remaining <= 0) return 0;
  return r === 0 ? remaining / n : (remaining * r) / (Math.pow(1 + r, n) - 1);
}

const formatDuration = (m) => {
  if (m === null) return "100+ years";
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", mo ? `${mo} mo` : ""].filter(Boolean).join(" ") || "Already there";
};

export default function SavingsCalculator() {
  const [initial, setInitial] = useState("5000");
  const [monthly, setMonthly] = useState("1500");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("10");
  const [goal, setGoal] = useState("300000");

  const p = useMemo(
    () => project(toNumber(initial), toNumber(monthly), toNumber(rate), toNumber(years)),
    [initial, monthly, rate, years]
  );
  const goalNum = toNumber(goal);
  const toGoal = goalNum > 0 ? monthsToGoal(toNumber(initial), toNumber(monthly), toNumber(rate), goalNum) : null;
  const needed = goalNum > 0 ? requiredMonthly(toNumber(initial), toNumber(rate), toNumber(years), goalNum) : 0;
  const growthShare = p.balance > 0 ? (p.growth / p.balance) * 100 : 0;

  return (
    <div className="grid lg:grid-cols-5">
      <div className="space-y-5 p-6 lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="s-init" className={labelClass}>Starting amount (R)</label>
            <input id="s-init" type="number" inputMode="decimal" min="0" value={initial}
              onChange={(e) => setInitial(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="s-month" className={labelClass}>Monthly contribution (R)</label>
            <input id="s-month" type="number" inputMode="decimal" min="0" value={monthly}
              onChange={(e) => setMonthly(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="s-rate" className={labelClass}>Annual interest / return (%)</label>
            <input id="s-rate" type="number" inputMode="decimal" min="0" step="0.1" value={rate}
              onChange={(e) => setRate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="s-years" className={labelClass}>Time period (years)</label>
            <input id="s-years" type="number" inputMode="decimal" min="0" max="60" value={years}
              onChange={(e) => setYears(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="s-goal" className={labelClass}>Savings goal (R) — optional</label>
          <input id="s-goal" type="number" inputMode="decimal" min="0" value={goal}
            onChange={(e) => setGoal(e.target.value)} className={inputClass} />
        </div>

        {p.yearly.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-edge">
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-panel text-xs uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Year</th>
                    <th className="px-3 py-2 text-right font-medium">Contributed</th>
                    <th className="px-3 py-2 text-right font-medium">Growth</th>
                    <th className="px-3 py-2 text-right font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge bg-ink">
                  {p.yearly.map((row) => (
                    <tr key={row.year} className="text-zinc-300">
                      <td className="px-3 py-2">{row.year}</td>
                      <td className="px-3 py-2 text-right">R {zar.format(row.contributed)}</td>
                      <td className="px-3 py-2 text-right text-emerald-300">R {zar.format(row.growth)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-white">R {zar.format(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 border-t border-edge bg-gradient-to-br from-emerald-500/10 via-panel to-gold/10 p-6 lg:col-span-2 lg:border-l lg:border-t-0" aria-live="polite">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-400">Projected balance after {zar.format(toNumber(years))} years</p>
          <p className="text-4xl font-extrabold text-gold">R {zar.format(p.balance)}</p>
        </div>

        <div>
          <div className="flex h-3 overflow-hidden rounded-full bg-edge" role="img"
            aria-label={`${zar.format(100 - growthShare)}% contributions, ${zar.format(growthShare)}% growth`}>
            <div className="bg-zinc-400" style={{ width: `${100 - growthShare}%` }} />
            <div className="bg-emerald-400" style={{ width: `${growthShare}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs">
            <span className="text-zinc-300">● Contributed R {zar.format(p.contributed)}</span>
            <span className="text-emerald-300">● Growth R {zar.format(p.growth)}</span>
          </div>
        </div>

        {goalNum > 0 && (
          <div className="space-y-3 border-t border-edge pt-4 text-sm">
            <div className="flex justify-between gap-4 text-zinc-400">
              <span>Time to reach R {zar.format(goalNum)}</span>
              <span className="text-right font-semibold text-white">{formatDuration(toGoal)}</span>
            </div>
            <div className="flex justify-between gap-4 text-zinc-400">
              <span>Monthly needed to hit goal in {zar.format(toNumber(years))} yrs</span>
              <span className="text-right font-semibold text-white">R {zar.format(needed)}</span>
            </div>
          </div>
        )}
        <p className="mt-auto text-xs text-zinc-500">
          Illustration only, assuming a constant return compounded monthly. Not financial advice.
        </p>
      </div>
    </div>
  );
}
