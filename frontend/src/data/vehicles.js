// Local vehicle list used instantly (and as a fallback while the API wakes up).
// The full search — every car, SUV, van and light pickup sold in the US since 1984
// (US EPA data, refreshed daily) plus this list — runs on the backend at /api/vehicles/search.
//
// sa_vehicles.json holds vehicles common in South Africa plus light, medium and heavy
// trucks and buses. Keep it identical to backend/data/sa_vehicles.json.
import RAW from "./sa_vehicles.json";

const compact = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const VEHICLES = RAW.map((v, i) => {
  const text = `${v.make} ${v.model} ${v.engine} ${v.fuel} ${v.type || "car"}`.toLowerCase();
  return {
    id: `sa-${i}`,
    ...v,
    years: "",
    type: v.type || "car",
    source: "SA",
    name: `${v.make} ${v.model} ${v.engine}`,
    _text: text,
    _compact: compact(text),
  };
});

// Every typed word must appear (dashes/spaces ignored, so "xtype" finds "X-Type").
export function searchVehicles(query, limit = 12) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return VEHICLES.filter((v) => words.every((w) => v._text.includes(w) || v._compact.includes(compact(w)))).slice(0, limit);
}
