/**
 * Production-grade data normalization utilities for LEAD INTELLIGENCE OS.
 * Normalizes domains, phone numbers, and company names for reliable deduplication.
 */

/**
 * Normalizes a website or domain string.
 * Strips protocol, www prefix, path, search params, trailing slashes and port.
 * Returns clean root domain e.g. "example.com" or "agency.ae"
 */
export function normalizeDomain(rawDomain: string | null | undefined): string | null {
  if (!rawDomain) return null;
  let cleaned = rawDomain.trim().toLowerCase();
  if (!cleaned) return null;

  // If no protocol is provided, add https:// so URL parsing works
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const url = new URL(cleaned);
    let hostname = url.hostname.toLowerCase();
    // Strip www. or m. subdomains
    hostname = hostname.replace(/^(www\d*|m)\./i, "");
    // Remove trailing dot if present
    hostname = hostname.replace(/\.$/, "");
    return hostname || null;
  } catch {
    // Fallback regex cleanup if URL constructor fails on malformed input
    let fallback = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^(www\d*|m)\./i, "")
      .split("/")[0]
      .split("?")[0]
      .split(":")[0];
    return fallback.length > 3 && fallback.includes(".") ? fallback : null;
  }
}

/**
 * Normalizes phone numbers to standard E.164-compatible digit string.
 * Supports UAE (+971), India (+91), US (+1), and generic international formats.
 */
export function normalizePhone(rawPhone: string | null | undefined, defaultCountryCode = "971"): string | null {
  if (!rawPhone) return null;
  const trimmed = rawPhone.trim();
  if (!trimmed) return null;

  // Extract all digits and optional leading plus
  let hasPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits || digits.length < 6) return null;

  // Handle UAE local numbers (e.g. 0501234567 -> 971501234567, 041234567 -> 97141234567)
  if (digits.startsWith("0") && defaultCountryCode === "971") {
    digits = `971${digits.slice(1)}`;
  } else if (!hasPlus && digits.length === 9 && (digits.startsWith("5") || digits.startsWith("4") || digits.startsWith("2") || digits.startsWith("6"))) {
    digits = `971${digits}`;
  }

  return digits;
}

/**
 * Normalizes company name for deduplication matching.
 * Converts to lowercase, strips common legal suffixes (LLC, FZ-LLC, Ltd, Inc, Corp, Group),
 * and removes special punctuation.
 */
export function normalizeCompanyName(rawName: string | null | undefined): string {
  if (!rawName) return "";
  let name = rawName.trim().toLowerCase();

  // Strip common corporate suffixes
  const legalSuffixes = [
    /\b(fze|fz-llc|fz\s*llc|llc|l\.l\.c\.|ltd|limited|inc|incorporated|corp|corporation|group|est|establishment|co|company)\b/gi,
    /[^\w\s]/gi, // Remove punctuation
    /\s+/g,      // Collapse multiple spaces
  ];

  for (const pattern of legalSuffixes) {
    name = name.replace(pattern, " ");
  }

  return name.trim();
}
