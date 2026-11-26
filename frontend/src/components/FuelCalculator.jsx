import { useEffect, useId, useMemo, useRef, useState } from "react";
import { API_URL, zar, toNumber } from "../lib/api.js";
import { VEHICLES, searchVehicles } from "../data/vehicles.js";

// Last known official prices (effective 4 Nov 2026). Shown instantly and kept if
// the free-tier backend is asleep or unreachable. Keep in sync with backend/main.py.
const FALLBACK = {
  effective_date: "2026-11-04",
  prices: [
    { id: "inland-95", label: "Unleaded 95", region: "inland", fuel: "95", price_per_litre: 30.24 },
    { id: "inland-93", label: "Unleaded 93", region: "inland", fuel: "93", price_per_litre: 29.87 },
    { id: "inland-d50", label: "Diesel 50ppm", region: "inland", fuel: "d50", price_per_litre: 31.6 },
    { id: "inland-d500", label: "Diesel 500ppm", region: "inland", fuel: "d500", price_per_litre: 30.85 },
    { id: "coastal-95", label: "Unleaded 95", region: "coastal", fuel: "95", price_per_litre: 29.37 },
    { id: "coastal-93", label: "Unleaded 93", region: "coastal", fuel: "93", price_per_litre: 29.08 },
    { id: "coastal-d50", label: "Diesel 50ppm", region: "coastal", fuel: "d50", price_per_litre: 30.83 },
    { id: "coastal-d500", label: "Diesel 500ppm", region: "coastal", fuel: "d500", price_per_litre: 29.98 },
  ],
};

const FUELS = [
  { id: "95", label: "Unleaded 95" },
  { id: "93", label: "Unleaded 93" },
  { id: "d50", label: "Diesel 50ppm" },
  { id: "d500", label: "Diesel 500ppm" },
  { id: "custom", label: "Custom price" },
];

const DEFAULT_VEHICLE = VEHICLES.find((v) => v.make === "Volkswagen" && v.model === "Polo Vivo");

const inputClass =
  "w-full rounded-lg border border-edge bg-ink px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

const formatDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

export default function FuelCalculator() {
  const [priceData, setPriceData] = useState(FALLBACK);
  const [priceStatus, setPriceStatus] = useState("loading"); // loading | live | stale

  const [distance, setDistance] = useState("100");
  const [vehicle, setVehicle] = useState(DEFAULT_VEHICLE);
  const [consumption, setConsumption] = useState(String(DEFAULT_VEHICLE.l100));
  const [region, setRegion] = useState("inland");
  const [fuel, setFuel] = useState("95");
  const [customPrice, setCustomPrice] = useState("30.00");
  const [returnTrip, setReturnTrip] = useState(false);

  // Fetch current official prices from the backend. Render's free tier can take
  // ~50s to wake, so each attempt waits up to 30s and we retry once.
  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    const load = async (attempt = 1) => {
      try {
        const res = await fetch(`${API_URL}/api/fuel-prices`, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.prices) && data.prices.some((p) => p.region)) {
          setPriceData(data);
          setPriceStatus(data.live ? "live" : "stale");
        } else {
          setPriceStatus("stale");
        }
      } catch {
        if (cancelled) return;
        if (attempt < 2) retryTimer = setTimeout(() => !cancelled && load(attempt + 1), 3000);
        else setPriceStatus("stale");
      }
    };
    load();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  const pickVehicle = (v) => {
    setVehicle(v);
    setConsumption(String(v.l100));
    // Match the fuel to the vehicle.
    if (v.fuel === "diesel" && !fuel.startsWith("d")) setFuel("d50");
    if (v.fuel === "petrol" && fuel.startsWith("d")) setFuel("95");
  };

  const grade = priceData.prices.find((p) => p.region === region && p.fuel === fuel);
  const pricePerLitre = fuel === "custom" ? toNumber(customPrice) : grade?.price_per_litre ?? 0;
  const l100 = toNumber(consumption);

  const results = useMemo(() => {
    const oneWay = toNumber(distance);
    const totalKm = returnTrip ? oneWay * 2 : oneWay;
    const litres = (totalKm * l100) / 100;
    const cost = litres * pricePerLitre;
    return { totalKm, litres, cost, perKm: totalKm > 0 ? cost / totalKm : 0 };
  }, [distance, returnTrip, l100, pricePerLitre]);

  const fuelMismatch =
    vehicle && fuel !== "custom" && (vehicle.fuel === "diesel") !== fuel.startsWith("d");

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-2 border-b border-edge px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">SA Petrol &amp; Trip Calculator</h3>
          <p className="text-sm text-zinc-400">Estimate litres and Rand cost for any trip.</p>
        </div>
        <PriceBadge status={priceStatus} effectiveDate={priceData.effective_date} />
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-6 p-6 lg:col-span-3">
          <div>
            <label htmlFor="distance" className={labelClass}>Distance to travel (km)</label>
            <input id="distance" type="number" inputMode="decimal" min="0" step="1" value={distance}
              onChange={(e) => setDistance(e.target.value)} placeholder="e.g. 560" className={inputClass} />
          </div>

          <div>
            <VehicleSearch selected={vehicle} onSelect={pickVehicle} />
            <div className="mt-3 flex items-center gap-3">
              <label htmlFor="consumption" className="shrink-0 text-sm text-zinc-400">Consumption</label>
              <div className="relative flex-1">
                <input id="consumption" type="number" inputMode="decimal" min="0" step="0.1" value={consumption}
                  onChange={(e) => setConsumption(e.target.value)} className={`${inputClass} pr-24`} />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-zinc-500">L/100km</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Approximate official figure — real-world use varies (trucks depend heavily on load). Adjust it to match your vehicle.
            </p>
          </div>

          <div>
            <span className={labelClass}>Where are you filling up?</span>
            <div className="grid grid-cols-2 gap-2">
              {[["inland", "Inland (e.g. Gauteng)"], ["coastal", "Coastal (e.g. Durban, Cape Town)"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setRegion(id)} aria-pressed={region === id}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    region === id ? "border-gold bg-gold/10 text-white" : "border-edge bg-ink text-zinc-300 hover:border-zinc-500"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="fuel" className={labelClass}>Fuel</label>
            <select id="fuel" value={fuel} onChange={(e) => setFuel(e.target.value)} className={inputClass}>
              {FUELS.map((f) => {
                const p = priceData.prices.find((x) => x.region === region && x.fuel === f.id);
                return (
                  <option key={f.id} value={f.id}>
                    {f.label}{p ? ` — R${zar.format(p.price_per_litre)}/L` : ""}
                  </option>
                );
              })}
            </select>
            {fuel === "custom" ? (
              <input type="number" inputMode="decimal" min="0" step="0.01" aria-label="Custom fuel price in Rand per litre"
                value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="R per litre"
                className={`${inputClass} mt-3`} />
            ) : (
              grade?.change_from_last_month != null && grade.change_from_last_month !== 0 && (
                <p className={`mt-2 text-xs ${grade.change_from_last_month > 0 ? "text-red-300" : "text-emerald-300"}`}>
                  {grade.change_from_last_month > 0 ? "▲ Up" : "▼ Down"} R{zar.format(Math.abs(grade.change_from_last_month))}/L since last month
                </p>
              )
            )}
            {fuelMismatch && (
              <p className="mt-2 text-xs text-amber-300">
                Heads up: your {vehicle.make} {vehicle.model} uses {vehicle.fuel}.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-edge bg-ink px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">{returnTrip ? "Return Trip" : "One-Way"}</p>
              <p className="text-xs text-zinc-400">{returnTrip ? "Distance is doubled" : "Single journey distance"}</p>
            </div>
            <button type="button" role="switch" aria-checked={returnTrip} aria-label="Toggle return trip"
              onClick={() => setReturnTrip((v) => !v)}
              className={`relative h-7 w-14 shrink-0 rounded-full transition ${returnTrip ? "bg-gold" : "bg-edge"}`}>
              <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${returnTrip ? "translate-x-7" : ""}`} />
            </button>
          </div>
        </div>

        {/* Outputs */}
        <div className="flex flex-col justify-between gap-6 border-t border-edge bg-gradient-to-br from-gold/10 via-panel to-violet/10 p-6 lg:col-span-2 lg:border-l lg:border-t-0">
          <div className="space-y-5" aria-live="polite">
            <Result label="Total cost" value={`R ${zar.format(results.cost)}`} big />
            <Result label="Fuel required" value={`${zar.format(results.litres)} L`} />
            <Result label="Cost per kilometre" value={`R ${zar.format(results.perKm)} /km`} />
          </div>
          <dl className="grid grid-cols-2 gap-3 border-t border-edge pt-4 text-xs text-zinc-400">
            <div className="col-span-2">
              <dt>Vehicle</dt>
              <dd className="text-sm text-zinc-200">{vehicle ? vehicle.name : "Custom"}</dd>
            </div>
            <div>
              <dt>Total distance</dt>
              <dd className="text-sm text-zinc-200">{zar.format(results.totalKm)} km</dd>
            </div>
            <div>
              <dt>Consumption</dt>
              <dd className="text-sm text-zinc-200">{zar.format(l100)} L/100km</dd>
            </div>
            <div className="col-span-2">
              <dt>Fuel price used</dt>
              <dd className="text-sm text-zinc-200">
                R {zar.format(pricePerLitre)} per litre
                {fuel !== "custom" && ` · ${region === "inland" ? "Inland" : "Coastal"} ${grade?.label ?? ""}`}
              </dd>
            </div>
          </dl>
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Official prices via the Automobile Association of South Africa, effective {formatDate(priceData.effective_date)}.
            Diesel figures are official wholesale prices; pump prices may differ slightly.
          </p>
        </div>
      </div>
    </div>
  );
}

const TYPE_LABEL = { car: "Car", suv: "SUV", van: "Van", truck: "Truck / bakkie" };

function VehicleSearch({ selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [remote, setRemote] = useState(null); // { q, results, total, makes, loading }
  const [searching, setSearching] = useState(false);
  const listId = useId();
  const box = useRef(null);
  const local = useMemo(() => searchVehicles(query), [query]);

  // Full search on the backend (50,000+ vehicles, refreshed daily), debounced.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setRemote(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/vehicles/search?q=${encodeURIComponent(q)}&limit=15`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRemote({ q, ...data });
      } catch {
        /* keep local results */
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const fromApi = remote && remote.q === query.trim() && Array.isArray(remote.results);
  const results = (fromApi ? remote.results.map((v, i) => ({ ...v, id: `api-${i}-${v.name}-${v.years}` })) : local);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const choose = (v) => {
    onSelect(v);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(results[active] ?? results[0]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="relative">
      <label htmlFor="vehicle-search" className={labelClass}>Your vehicle</label>
      <div className="relative">
        <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id="vehicle-search"
          type="search"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={() => query && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={selected ? `${selected.name} — search to change` : "Search any make or model, e.g. Hilux, Jaguar X-Type, Scania"}
          className={`${inputClass} pl-11`}
        />
      </div>

      {selected && (
        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs text-gold">
          {selected.name}{selected.years ? ` (${selected.years})` : ""} · {selected.fuel} · ~{selected.l100} L/100km
        </p>
      )}

      {open && query && (
        <ul id={listId} role="listbox"
          className="absolute z-20 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-edge bg-panel p-1 shadow-2xl shadow-black/60">
          {results.length === 0 && (
            <li className="px-3 py-3 text-sm text-zinc-400">
              {searching
                ? "Searching all makes…"
                : "No match — try just the make (e.g. \"Jaguar\"), pick a \"Generic\" size, or type your consumption below."}
            </li>
          )}
          {results.map((v, i) => (
            <li key={v.id} role="option" aria-selected={i === active}
              onPointerDown={(e) => { e.preventDefault(); choose(v); }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${
                i === active ? "bg-gold/15 text-white" : "text-zinc-300"
              }`}>
              <span className="min-w-0">
                <span className="font-semibold">{v.make} {v.model}</span>{" "}
                <span className="text-zinc-400">{v.engine}</span>
                {v.years && <span className="text-zinc-500"> · {v.years}</span>}
              </span>
              <span className="shrink-0 text-right text-xs text-zinc-500">
                {v.fuel === "diesel" ? "Diesel" : "Petrol"} · {v.l100} L
                <span className="block text-[10px] uppercase tracking-wider text-zinc-600">
                  {TYPE_LABEL[v.type] || "Car"}{v.source === "EPA" ? " · US EPA" : ""}
                </span>
              </span>
            </li>
          ))}
          <li className="border-t border-edge px-3 py-2 text-[11px] text-zinc-500">
            {fromApi && remote.total
              ? `Searching ${remote.total.toLocaleString("en-ZA")} vehicles from ${remote.makes} makes · updated daily`
              : searching
                ? "Searching all makes…"
                : "Showing popular SA vehicles & trucks"}
          </li>
        </ul>
      )}
    </div>
  );
}

function Result({ label, value, big = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`font-extrabold text-white ${big ? "text-4xl text-gold" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function PriceBadge({ status, effectiveDate }) {
  const styles = {
    loading: "border-zinc-600 text-zinc-300",
    live: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    stale: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  };
  const text = {
    loading: "Fetching official prices…",
    live: `Official prices · ${formatDate(effectiveDate)}`,
    stale: `Last known prices · ${formatDate(effectiveDate)}`,
  };
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs ${styles[status]}`}>
      <span className={`h-2 w-2 rounded-full ${
        status === "live" ? "bg-emerald-400" : status === "stale" ? "bg-amber-400" : "animate-pulse bg-zinc-400"
      }`} />
      {text[status]}
    </span>
  );
}
