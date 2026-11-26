// Popular vehicles on South African roads with approximate combined fuel consumption.
// [make, model, engine/variant, fuel ("petrol" | "diesel"), litres per 100 km]
// Figures are approximate manufacturer combined-cycle claims; real-world use is often
// 10–20% higher. Users can fine-tune the number after choosing their car.
// Add vehicles freely — the search picks them up automatically.

const RAW = [
  // Toyota
  ["Toyota", "Hilux", "2.4 GD-6 manual", "diesel", 7.6],
  ["Toyota", "Hilux", "2.4 GD-6 auto", "diesel", 8.0],
  ["Toyota", "Hilux", "2.8 GD-6", "diesel", 8.5],
  ["Toyota", "Hilux", "2.7 VVT-i petrol", "petrol", 10.6],
  ["Toyota", "Hilux", "2.0 VVT-i single cab", "petrol", 9.3],
  ["Toyota", "Hilux (older)", "2.5 D-4D", "diesel", 8.0],
  ["Toyota", "Fortuner", "2.4 GD-6", "diesel", 7.6],
  ["Toyota", "Fortuner", "2.8 GD-6", "diesel", 8.0],
  ["Toyota", "Corolla Cross", "1.8 XS / XR", "petrol", 7.2],
  ["Toyota", "Corolla Cross", "1.8 Hybrid", "petrol", 4.3],
  ["Toyota", "Corolla", "2.0 sedan", "petrol", 6.0],
  ["Toyota", "Corolla Quest", "1.8", "petrol", 6.6],
  ["Toyota", "Starlet", "1.5", "petrol", 5.6],
  ["Toyota", "Vitz", "1.0", "petrol", 4.4],
  ["Toyota", "Agya", "1.0", "petrol", 4.6],
  ["Toyota", "Urban Cruiser", "1.5", "petrol", 6.2],
  ["Toyota", "Rumion", "1.5", "petrol", 6.0],
  ["Toyota", "Avanza / Veloz", "1.5", "petrol", 6.3],
  ["Toyota", "Yaris Cross", "1.5 Hybrid", "petrol", 3.8],
  ["Toyota", "RAV4", "2.0 CVT", "petrol", 6.9],
  ["Toyota", "Land Cruiser 79", "4.5 V8 D-4D", "diesel", 12.0],
  ["Toyota", "Land Cruiser Prado", "2.8 GD", "diesel", 8.4],
  ["Toyota", "Hiace / Ses'fikile", "2.5 D-4D", "diesel", 9.0],
  ["Toyota", "Quantum", "2.8 GD-6", "diesel", 9.0],
  ["Toyota", "Quantum", "2.7 petrol", "petrol", 12.0],
  ["Toyota", "Tazz", "1.3", "petrol", 7.8],

  // Volkswagen
  ["Volkswagen", "Polo Vivo", "1.4", "petrol", 5.8],
  ["Volkswagen", "Polo Vivo", "1.6", "petrol", 6.2],
  ["Volkswagen", "Polo Vivo GT", "1.0 TSI", "petrol", 5.4],
  ["Volkswagen", "Polo", "1.0 TSI", "petrol", 5.1],
  ["Volkswagen", "Polo GTI", "2.0 TSI", "petrol", 6.5],
  ["Volkswagen", "Citi Golf", "1.4", "petrol", 7.6],
  ["Volkswagen", "Golf", "1.4 TSI", "petrol", 5.7],
  ["Volkswagen", "Golf GTI", "2.0 TSI", "petrol", 6.7],
  ["Volkswagen", "T-Cross", "1.0 TSI", "petrol", 5.5],
  ["Volkswagen", "Tiguan", "1.4 TSI", "petrol", 7.0],
  ["Volkswagen", "Tiguan", "2.0 TDI", "diesel", 6.0],
  ["Volkswagen", "Amarok", "2.0 BiTDI", "diesel", 8.6],
  ["Volkswagen", "Amarok", "3.0 V6 TDI", "diesel", 9.6],
  ["Volkswagen", "Caddy", "2.0 TDI", "diesel", 6.0],
  ["Volkswagen", "Transporter / Kombi", "2.0 BiTDI", "diesel", 8.5],

  // Suzuki
  ["Suzuki", "Swift", "1.2", "petrol", 4.7],
  ["Suzuki", "Dzire", "1.2", "petrol", 4.7],
  ["Suzuki", "Celerio", "1.0", "petrol", 4.4],
  ["Suzuki", "S-Presso", "1.0", "petrol", 4.9],
  ["Suzuki", "Baleno", "1.5", "petrol", 5.4],
  ["Suzuki", "Fronx", "1.5", "petrol", 5.5],
  ["Suzuki", "Ertiga", "1.5", "petrol", 6.2],
  ["Suzuki", "Brezza", "1.5", "petrol", 6.2],
  ["Suzuki", "Grand Vitara", "1.5", "petrol", 6.2],
  ["Suzuki", "Jimny", "1.5", "petrol", 6.4],
  ["Suzuki", "Super Carry", "1.2", "petrol", 6.4],
  ["Suzuki", "Eeco", "1.2", "petrol", 6.1],

  // Hyundai
  ["Hyundai", "Grand i10", "1.0", "petrol", 5.4],
  ["Hyundai", "Grand i10", "1.2", "petrol", 5.6],
  ["Hyundai", "i20", "1.2", "petrol", 5.6],
  ["Hyundai", "i20", "1.0 T-GDI", "petrol", 5.2],
  ["Hyundai", "Venue", "1.0 T-GDI", "petrol", 5.8],
  ["Hyundai", "Creta", "1.5", "petrol", 6.5],
  ["Hyundai", "Tucson", "2.0", "petrol", 7.9],
  ["Hyundai", "H100", "2.6 bakkie", "diesel", 8.6],
  ["Hyundai", "H-1 / Staria", "2.2 CRDi", "diesel", 8.9],

  // Kia
  ["Kia", "Picanto", "1.0", "petrol", 4.4],
  ["Kia", "Picanto", "1.2", "petrol", 5.0],
  ["Kia", "Rio", "1.4", "petrol", 5.8],
  ["Kia", "Pegas", "1.4", "petrol", 5.7],
  ["Kia", "Sonet", "1.5", "petrol", 6.2],
  ["Kia", "Seltos", "1.5", "petrol", 6.8],
  ["Kia", "Sportage", "2.0", "petrol", 7.9],

  // Ford
  ["Ford", "Ranger", "2.0 SiT", "diesel", 7.6],
  ["Ford", "Ranger", "2.0 BiT", "diesel", 7.8],
  ["Ford", "Ranger", "3.0 V6", "diesel", 8.4],
  ["Ford", "Ranger (older)", "2.2 TDCi", "diesel", 7.6],
  ["Ford", "Ranger (older)", "3.2 TDCi", "diesel", 9.0],
  ["Ford", "Everest", "2.0 BiT", "diesel", 7.6],
  ["Ford", "EcoSport", "1.0 EcoBoost", "petrol", 5.8],
  ["Ford", "Figo", "1.5", "petrol", 5.7],
  ["Ford", "Fiesta", "1.0 EcoBoost", "petrol", 5.4],
  ["Ford", "Territory", "1.8T", "petrol", 7.5],

  // Nissan
  ["Nissan", "NP200", "1.6", "petrol", 7.0],
  ["Nissan", "NP300 Hardbody", "2.5 dCi", "diesel", 9.0],
  ["Nissan", "NP300 Hardbody", "2.5 petrol", "petrol", 11.0],
  ["Nissan", "Navara", "2.5 dCi", "diesel", 7.7],
  ["Nissan", "Magnite", "1.0 turbo", "petrol", 5.8],
  ["Nissan", "Almera", "1.5", "petrol", 6.3],
  ["Nissan", "Qashqai", "1.3 turbo", "petrol", 6.5],
  ["Nissan", "X-Trail", "2.5", "petrol", 8.3],
  ["Nissan", "1400 Champ", "1.4", "petrol", 9.0],

  // Isuzu
  ["Isuzu", "D-Max", "1.9 Ddi", "diesel", 6.9],
  ["Isuzu", "D-Max", "3.0 Ddi", "diesel", 8.0],
  ["Isuzu", "D-Max", "2.5 / 250", "diesel", 8.2],
  ["Isuzu", "MU-X", "3.0 Ddi", "diesel", 8.0],

  // Renault
  ["Renault", "Kwid", "1.0", "petrol", 4.7],
  ["Renault", "Kiger", "1.0", "petrol", 5.0],
  ["Renault", "Kiger", "1.0 turbo", "petrol", 5.7],
  ["Renault", "Triber", "1.0", "petrol", 5.5],
  ["Renault", "Clio", "1.0 TCe", "petrol", 5.1],
  ["Renault", "Duster", "1.5 dCi", "diesel", 5.0],
  ["Renault", "Sandero", "0.9 turbo", "petrol", 5.2],

  // Mahindra
  ["Mahindra", "Pik Up", "2.2 mHawk", "diesel", 9.0],
  ["Mahindra", "Scorpio-N", "2.2 diesel", "diesel", 8.5],
  ["Mahindra", "XUV300 / XUV 3XO", "1.2 turbo", "petrol", 6.3],
  ["Mahindra", "XUV700", "2.2 diesel", "diesel", 8.2],

  // Chinese brands
  ["Haval", "Jolion", "1.5T", "petrol", 7.3],
  ["Haval", "Jolion", "1.5 HEV", "petrol", 5.0],
  ["Haval", "H6", "2.0T", "petrol", 7.9],
  ["GWM", "P-Series", "2.0TD", "diesel", 8.5],
  ["GWM", "Steed 5", "2.0 VGT", "diesel", 8.5],
  ["GWM", "Steed 5", "2.2 petrol", "petrol", 10.5],
  ["Chery", "Tiggo 4 Pro", "1.5", "petrol", 7.5],
  ["Chery", "Tiggo 4 Pro", "1.5T", "petrol", 7.4],
  ["Chery", "Tiggo 7 Pro", "1.6T", "petrol", 7.8],
  ["Chery", "Tiggo 8 Pro", "1.6T", "petrol", 8.5],
  ["Omoda", "C5", "1.5T", "petrol", 7.4],
  ["BAIC", "Beijing X55", "1.5T", "petrol", 8.0],

  // Others
  ["Opel", "Corsa", "1.2 turbo", "petrol", 5.4],
  ["Opel", "Corsa Utility", "1.4", "petrol", 7.3],
  ["Chevrolet", "Spark", "1.2", "petrol", 5.8],
  ["Chevrolet", "Utility", "1.4", "petrol", 7.4],
  ["Chevrolet", "Aveo", "1.6", "petrol", 7.0],
  ["Datsun", "Go / Go+", "1.2", "petrol", 5.2],
  ["Honda", "Amaze", "1.2", "petrol", 5.5],
  ["Honda", "Fit / Jazz", "1.5", "petrol", 5.8],
  ["Honda", "BR-V", "1.5", "petrol", 6.8],
  ["Mazda", "Mazda2", "1.5", "petrol", 5.4],
  ["Mazda", "CX-5", "2.0", "petrol", 7.0],
  ["Mazda", "BT-50", "1.9 / 3.0 diesel", "diesel", 7.9],
  ["Peugeot", "208", "1.2", "petrol", 5.0],
  ["Peugeot", "Landtrek", "1.9 diesel", "diesel", 8.4],
  ["Citroën", "C3", "1.2", "petrol", 5.3],
  ["Proton", "Saga", "1.3", "petrol", 5.6],
  ["BMW", "1 Series", "118i", "petrol", 6.0],
  ["BMW", "3 Series", "320i", "petrol", 6.4],
  ["BMW", "3 Series", "320d", "diesel", 4.9],
  ["BMW", "X3", "xDrive20d", "diesel", 6.0],
  ["Mercedes-Benz", "A-Class", "A200", "petrol", 5.9],
  ["Mercedes-Benz", "C-Class", "C200", "petrol", 6.6],
  ["Mercedes-Benz", "Sprinter", "2.1 CDI", "diesel", 9.5],
  ["Audi", "A3", "35 TFSI", "petrol", 5.4],
  ["Audi", "A4", "35 TFSI", "petrol", 6.0],
  ["Land Rover", "Defender", "D300", "diesel", 9.5],
  ["Jeep", "Wrangler", "2.0T", "petrol", 10.5],
  ["Mitsubishi", "Triton", "2.4 diesel", "diesel", 7.8],
  ["Mitsubishi", "Pajero Sport", "2.4 diesel", "diesel", 8.0],
  ["Mitsubishi", "ASX", "2.0", "petrol", 7.7],
  ["Subaru", "Forester", "2.5", "petrol", 7.4],

  // Generic sizes (handy when your car isn't listed)
  ["Generic", "Small hatchback", "1.0–1.4", "petrol", 6.5],
  ["Generic", "Sedan", "1.5–2.0", "petrol", 8.0],
  ["Generic", "SUV", "petrol", "petrol", 10.5],
  ["Generic", "Bakkie", "diesel", "diesel", 9.5],
  ["Generic", "Minibus taxi", "diesel", "diesel", 11.0],
  ["Generic", "Motorcycle", "125–250cc", "petrol", 3.0],
];

export const VEHICLES = RAW.map(([make, model, engine, fuel, l100], i) => ({
  id: i,
  make,
  model,
  engine,
  fuel,
  l100,
  name: `${make} ${model} ${engine}`,
  search: `${make} ${model} ${engine} ${fuel}`.toLowerCase(),
}));

// Simple multi-word search: every word typed must appear somewhere in the vehicle's text.
export function searchVehicles(query, limit = 8) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return VEHICLES.filter((v) => words.every((w) => v.search.includes(w))).slice(0, limit);
}
