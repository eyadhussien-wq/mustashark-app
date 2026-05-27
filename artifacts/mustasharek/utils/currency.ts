/**
 * Returns the currency label for a given country.
 * Qatar  → ريال قطري
 * Jordan → دينار أردني
 */
export function getCurrency(country: "qatar" | "jordan"): string {
  return country === "jordan" ? "دينار" : "ريال";
}

/**
 * Formats a price with the correct currency for the country.
 * e.g. 300, "qatar"  → "300 ريال"
 *      150, "jordan" → "150 دينار"
 */
export function formatPrice(
  amount: number,
  country: "qatar" | "jordan"
): string {
  return `${amount} ${getCurrency(country)}`;
}

/**
 * Short rate label used in cards and stats.
 * e.g. "qatar"  → "ر.ق / ساعة"
 *      "jordan" → "د.أ / ساعة"
 */
export function rateLabel(country: "qatar" | "jordan"): string {
  return country === "jordan" ? "د.أ / ساعة" : "ر.ق / ساعة";
}
