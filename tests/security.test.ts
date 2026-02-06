import { describe, expect, it } from "vitest";
import { canonicalizeManifest, redactSecrets } from "../src/lib/security";

describe("security utilities", () => {
  it("canonicalizes manifest deterministically", () => {
    const manifestA = { b: 2, a: { d: 4, c: 3 } };
    const manifestB = { a: { c: 3, d: 4 }, b: 2 };
    expect(canonicalizeManifest(manifestA)).toBe(canonicalizeManifest(manifestB));
  });

  it("redacts known secret keys", () => {
    const input = { authorization: "secret", nested: { apiKey: "123" }, ok: "yes" };
    const result = redactSecrets(input) as any;
    expect(result.authorization).toBe("[REDACTED]");
    expect(result.nested.apiKey).toBe("[REDACTED]");
    expect(result.ok).toBe("yes");
  });
});
