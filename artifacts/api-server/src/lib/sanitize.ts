/**
 * Lightweight XSS hardening for untrusted string input.
 * Strips HTML tags, null bytes, and control characters (except tab/newline).
 * Does not HTML-entity-encode (stored text should stay readable); API responses
 * must never be rendered with dangerouslySetInnerHTML without escaping.
 */

const HTML_TAG_RE = /<\/?[^>]+>/g;
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT_PROTO_RE = /^\s*(javascript|vbscript|data\s*:\s*text\/html)\s*:/i;

/** Strip tags and dangerous control characters from a single string. */
export function sanitizeText(input: unknown, maxLength = 10_000): string {
  if (input == null) return "";
  let s = String(input);
  s = s.replace(CONTROL_CHARS_RE, "");
  s = s.replace(HTML_TAG_RE, "");
  s = s.trim();
  if (s.length > maxLength) s = s.slice(0, maxLength);
  return s;
}

/** Sanitize a free-form message / bio field (allows newlines). */
export function sanitizeMultiline(input: unknown, maxLength = 20_000): string {
  return sanitizeText(input, maxLength).replace(/\r\n/g, "\n");
}

/** Reject or neutralize dangerous URL schemes for user-supplied URLs. */
export function sanitizeUrl(input: unknown): string | null {
  if (input == null || input === "") return null;
  const raw = String(input).trim();
  if (SCRIPT_PROTO_RE.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Deep-sanitize string values in plain objects / arrays (request bodies).
 * Leaves numbers, booleans, null untouched. Skips password-like keys.
 */
const SKIP_KEYS = new Set([
  "password",
  "passwordHash",
  "currentPassword",
  "newPassword",
  "token",
  "refreshToken",
  "accessToken",
  "clientSecret",
]);

export function sanitizeValue(value: unknown, key?: string): unknown {
  if (key && SKIP_KEYS.has(key)) return value;
  if (typeof value === "string") {
    if (key && /url|link|href|avatar|image|photo|file/i.test(key)) {
      const url = sanitizeUrl(value);
      return url ?? sanitizeText(value, 2048);
    }
    return sanitizeText(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v));
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeValue(v, k);
    }
    return out;
  }
  return value;
}
