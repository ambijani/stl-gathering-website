/**
 * HMAC-SHA256 session tokens using the Web Crypto API.
 * Compatible with both the Node.js runtime and the Edge runtime (middleware).
 */

function getSecret(): string {
  const s = process.env.SESSION_SECRET ?? "";
  if (!s) throw new Error("SESSION_SECRET env var is not set");
  return s;
}

async function getKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function bufToHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

/** Create a signed session token: `<expiry-unix-seconds>.<nonce>.<hmac-hex>` */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  const expiry = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const nonce = bufToHex(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiry}.${nonce}`;
  const key = await getKey(secret);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${bufToHex(sig)}`;
}

/** Verify a session token. Returns true only if the HMAC signature is valid and it hasn't expired. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!process.env.SESSION_SECRET || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const providedSigHex = token.slice(dot + 1);
  // Strict format check also rejects legacy tokens (no expiry) and old demo-mode tokens.
  const match = /^(\d+)\.[0-9a-f]{32}$/.exec(payload);
  if (!match || !/^[0-9a-f]{64}$/.test(providedSigHex)) return false;
  if (Number(match[1]) * 1000 <= Date.now()) return false;
  try {
    const secret = getSecret();
    const key = await getKey(secret);
    const providedSigBytes = new Uint8Array(
      providedSigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
    );
    return await globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      providedSigBytes,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}
