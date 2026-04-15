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

/** Create a signed session token: `<nonce>.<hmac-hex>` */
export async function createSessionToken(): Promise<string> {
  const secret = getSecret();
  const nonce = bufToHex(globalThis.crypto.getRandomValues(new Uint8Array(16)));
  const key = await getKey(secret);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(nonce));
  return `${nonce}.${bufToHex(sig)}`;
}

/** Create a signed demo session token: `demo.<nonce>.<hmac-hex>` */
export async function createDemoSessionToken(): Promise<string> {
  const secret = getSecret();
  const nonce = `demo.${bufToHex(globalThis.crypto.getRandomValues(new Uint8Array(16)))}`;
  const key = await getKey(secret);
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(nonce));
  return `${nonce}.${bufToHex(sig)}`;
}

/** Returns true if the token is a demo session (nonce starts with "demo."). */
export function isDemoToken(token: string | undefined): boolean {
  if (!token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  return token.slice(0, dot).startsWith("demo.");
}

/** Verify a session token. Returns true only if the HMAC signature is valid. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!process.env.SESSION_SECRET || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return false;
  const nonce = token.slice(0, dot);
  const providedSigHex = token.slice(dot + 1);
  if (!nonce || !providedSigHex) return false;
  try {
    const secret = getSecret();
    const key = await getKey(secret);
    const providedSigBytes = new Uint8Array(
      providedSigHex.match(/.{2}/g)!.map((h) => parseInt(h, 16))
    );
    return globalThis.crypto.subtle.verify(
      "HMAC",
      key,
      providedSigBytes,
      new TextEncoder().encode(nonce)
    );
  } catch {
    return false;
  }
}
