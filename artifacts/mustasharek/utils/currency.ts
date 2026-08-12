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
 * Supports both the original one-argument form and the detailed
 * amount/country/lang form used by the lawyer booking screen.
 */
export function rateLabel(
  amountOrCountry: number | "qatar" | "jordan",
  country?: "qatar" | "jordan",
  _lang?: "ar" | "en",
): string {
  if (typeof amountOrCountry === "number") {
    return formatPrice(amountOrCountry, country ?? "qatar");
  }
  return amountOrCountry === "jordan" ? "د.أ / ساعة" : "ر.ق / ساعة";
}
