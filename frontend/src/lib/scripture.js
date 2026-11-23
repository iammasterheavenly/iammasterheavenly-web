import SCRIPTURES from "../data/scriptures.json";

// Same rule as the backend (/api/scripture/today): days since 1970-01-01 in
// South African time (UTC+2), modulo the list length. Changes at midnight SAST.
export function todaysVerse() {
  const day = Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 86_400_000);
  return { ...SCRIPTURES[day % SCRIPTURES.length], translation: "KJV" };
}
