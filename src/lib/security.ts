import crypto from "crypto";

const REDACT_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "apikey",
  "apiKey",
  "token",
  "access_token",
  "refresh_token",
  "password",
  "secret"
]);

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function timingSafeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function redactSecrets(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(redactSecrets);
  if (input && typeof input === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (REDACT_KEYS.has(key)) {
        result[key] = "[REDACTED]";
      } else {
        result[key] = redactSecrets(value);
      }
    }
    return result;
  }
  return input;
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const sorted: Record<string, unknown> = {};
    for (const [key, val] of entries) {
      sorted[key] = sortObject(val);
    }
    return sorted;
  }
  return value;
}

export function canonicalizeManifest(manifest: unknown): string {
  return JSON.stringify(sortObject(manifest));
}
