import nacl from "tweetnacl";
import { canonicalizeManifest } from "@/lib/security";

export function verifySkillSignature(
  manifest: unknown,
  signature: string,
  publicKey: string
) {
  const message = new TextEncoder().encode(canonicalizeManifest(manifest));
  const sigBytes = Buffer.from(signature, "base64");
  const keyBytes = Buffer.from(publicKey, "base64");
  return nacl.sign.detached.verify(message, sigBytes, keyBytes);
}
