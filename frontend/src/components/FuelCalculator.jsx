import { useEffect, useMemo, useState } from "react";
import { API_URL, zar, toNumber } from "../lib/api.js";

// Used immediately and kept if the free-tier backend is asleep or unreachable.
const FALLBACK_PRICES = [
  { id: "inland-95", label: "Inland 95 Unleaded", price_per_litre: 21.62 },
  { id: "inland-93", label: "Inland 93 Unleaded", price_per_litre: 21.51 },
  { id: "coastal-95", label: "Coastal 95 Unleaded", price_per_litre: 20.79 },
  { id: "diesel-50ppm", label: "Diesel 50ppm", price_per_litre: 19.95 },
];

const VEHICLE_PRESETS = [
  { id: "compact", label: "Compact Car", consumption: 6.5 },
  { id: "sedan", label: "Sedan", consumption: 8.0 },
  { id: "suv", label: "SUV / Bakkie", consumption: 10.5 },
  { id: "custom", label: "Custom", consumption: null },
];

export default function FuelCalculator() {
  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [priceStatus, setPriceStatus] = useState("loading"); // loading | live | fallback
  const [effectiveDate, setEffectiveDate] = useState(null);

  const [distance, setDistance] = useState("100");
  const [vehicleId, setVehicleId] = useState("sedan");
  const [customConsumption, setCustomConsumption] = useState("7.5");
  const [fuelId, setFuelId] = useState("inland-95");
  const [customPrice, setCustomPrice] = useState("21.00");
  const [returnTrip, setReturnTrip] = useState(false);

  // Fetch live defaults from FastAPI. Render's free tier can take ~50s to wake,
  // so each attempt waits up to 30s and we retry once. Fallback prices stay in
  // use (and the calculator stays fully usable) the whole time.
  useEffect(() => {
    let cancelled = false;
    let retryTimer;

    const load = async (attempt = 1) => {
      try {
        const res = await fetch(`${API_URL}/api/fuel-prices`, {
          signal: AbortSignal.timeout(30000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        if (Array.isArray(data.prices) && data.prices.length > 0) {
          setPrices(data.prices);
          setEffectiveDate(data.effective_date ?? null);
          setPriceStatus("live");
        } else {
          setPriceStatus("fallback");
        }
      } catch {
        if (cancelled) return;
        if (attempt < 2) {
          retryTimer = setTimeout(() => !cancelled && load(attempt + 1), 3000);
        } else {
          setPriceStatus("fallback");
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
  }, []);

  const vehicle = VEHICLE_PRESETS.find((v) => v.id === vehicleId);
  const consumption = vehicle.consumption ?? toNumber(customConsumption);
  const selectedFuel = prices.find((p) => p.id === fuelId);
  const pricePerLitre = fuelId === "custom" ? toNumber(customPrice) : selectedFuel?.price_per_litre ?? 0;

  const results = useMemo(() => {
    const oneWay = toNumber(distance);
    const totalKm = returnTrip ? oneWay * 2 : oneWay;
    const litres = (totalKm * consumption) / 100;
    const cost = litres * pricePerLitre;
    const perKm = totalKm > 0 ? cost / totalKm : 0;
    return { totalKm, litres, cost, perKm };
  }, [distance, returnTrip, consumption, pricePerLitre]);

  const inputClass =
    "w-full rounded-lg border border-edge bg-ink px-4 py-3 text-white placeholder-zinc-500 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30";
  const labelClass = "mb-2 block text-sm font-medium text-zinc-300";

  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-panel shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-2 border-b border-edge px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">SA Petrol &amp; Trip Calculator</h3>
          <p className="text-sm text-zinc-400">Estimate litres and Rand cost for any trip.</p>
        </div>
        <PriceBadge status={priceStatus} effectiveDate={effectiveDate} />
      </div>

      <div className="grid gap-0 lg:grid-cols-5">
        {/* Inputs */}
        <div className="space-y-6 p-6 lg:col-span-3">
          <div>
            <label htmlFor="distance" className={labelClass}>
              Distance to travel (km)
            </label>
            <input
              id="distance"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 560"
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>Vehicle fuel consumption (L/100km)</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {VEHICLE_PRESETS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleId(v.id)}
                  aria-pressed={vehicleId === v.id}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                    vehicleId === v.id
                      ? "border-gold bg-gold/10 text-white"
                      : "border-edge bg-ink text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span className="block font-semibold">{v.label}</span>
                  <span className="block text-xs text-zinc-400">
                    {v.consumption ? `~${v.consumption.toFixed(1)} L/100km` : "Enter your own"}
                  </span>
                </button>
              ))}
            </div>
            {vehicleId === "custom" && (
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.1"
                aria-label="Custom fuel consumption in litres per 100 km"
                value={customConsumption}
                onChange={(e) => setCustomConsumption(e.target.value)}
                placeholder="L/100km"
                className={`${inputClass} mt-3`}
              />
            )}
          </div>

          <div>
            <label htmlFor="fuel" className={labelClass}>
              Fuel grade
            </label>
            <select
              id="fuel"
              value={fuelId}
              onChange={(e) => setFuelId(e.target.value)}
              className={inputClass}
            >
              {prices.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — R{zar.format(p.price_per_litre)}/L
                </option>
              ))}
              <option value="custom">Custom price (R/L)</option>
            </select>
            {fuelId === "custom" && (
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                aria-label="Custom fuel price in Rand per litre"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="R per litre"
                className={`${inputClass} mt-3`}
              />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-edge bg-ink px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">
                {returnTrip ? "Return Trip" : "One-Way"}
              </p>
              <p className="text-xs text-zinc-400">
                {returnTrip ? "Distance is doubled" : "Single journey distance"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={returnTrip}
              aria-label="Toggle return trip"
              onClick={() => setReturnTrip((v) => !v)}
              className={`relative h-7 w-14 rounded-full transition ${
                returnTrip ? "bg-gold" : "bg-edge"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  returnTrip ? "translate-x-7" : ""
                }`}
              />
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
            <div>
              <dt>Total distance</dt>
              <dd className="text-sm text-zinc-200">{zar.format(results.totalKm)} km</dd>
            </div>
            <div>
              <dt>Consumption</dt>
              <dd className="text-sm text-zinc-200">{zar.format(consumption)} L/100km</dd>
            </div>
            <div className="col-span-2">
              <dt>Fuel price used</dt>
              <dd className="text-sm text-zinc-200">R {zar.format(pricePerLitre)} per litre</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function Result({ label, value, big = false }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
      <p className={`font-extrabold text-white ${big ? "text-4xl text-gold" : "text-2xl"}`}>
        {value}
      </p>
    </div>
  );
}

function PriceBadge({ status, effectiveDate }) {
  const styles = {
    loading: "border-zinc-600 text-zinc-300",
    live: "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
    fallback: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  };
  const text = {
    loading: "Fetching latest prices…",
    live: `Live prices${effectiveDate ? ` · effective ${effectiveDate}` : ""}`,
    fallback: "Using default prices",
  };
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs ${styles[status]}`}>
      <span
        className={`h-2 w-2 rounded-full ${
          status === "live" ? "bg-emerald-400" : status === "fallback" ? "bg-amber-400" : "animate-pulse bg-zinc-400"
        }`}
      />
      {text[status]}
    </span>
  );
}
