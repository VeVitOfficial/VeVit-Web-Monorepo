import { createHash, createPrivateKey, createPublicKey, createSign, createVerify, type KeyObject } from "node:crypto";
import { b64url } from "./crypto.ts";

// ES256 ID tokens. Keys come from the environment only (base64 of a PEM); nothing is generated or stored at runtime.

export type OfficeKey = { kid: string; publicKey: KeyObject; privateKey: KeyObject | null };

function fromPem(pemB64: string): OfficeKey {
  const pem = Buffer.from(pemB64.trim(), "base64").toString("utf8");
  let privateKey: KeyObject | null = null;
  let publicKey: KeyObject;
  if (pem.includes("PRIVATE KEY")) {
    privateKey = createPrivateKey(pem);
    publicKey = createPublicKey(privateKey);
  } else {
    publicKey = createPublicKey(pem);
  }
  const jwk = publicKey.export({ format: "jwk" });
  if (publicKey.asymmetricKeyType !== "ec" || jwk.crv !== "P-256") throw new Error("Office OIDC keys must be EC P-256");
  // kid = first 16 hex characters of the SHA-256 of the public key (SPKI DER): stable, derivable, no extra variable.
  const der = publicKey.export({ format: "der", type: "spki" });
  return { kid: createHash("sha256").update(der).digest("hex").slice(0, 16), publicKey, privateKey };
}

/**
 * OFFICE_OIDC_KEY_ACTIVE: private key that signs (required). OFFICE_OIDC_KEY_SECONDARY: private or public key that is only
 * published in the JWKS (the next key before a rotation, or the previous one after it). Both base64 of a PEM.
 */
export function loadOfficeKeys(env: Record<string, string | undefined>): { active: OfficeKey; published: OfficeKey[] } | null {
  const a = env.OFFICE_OIDC_KEY_ACTIVE?.trim();
  if (!a) return null;
  const active = fromPem(a);
  if (!active.privateKey) throw new Error("OFFICE_OIDC_KEY_ACTIVE must be a private key");
  const published = [active];
  const b = env.OFFICE_OIDC_KEY_SECONDARY?.trim();
  if (b) {
    const second = fromPem(b);
    if (second.kid !== active.kid) published.push(second);
  }
  return { active, published };
}

export function jwksFor(keys: OfficeKey[]): { keys: Record<string, unknown>[] } {
  return {
    keys: keys.map((k) => {
      const { kty, crv, x, y } = k.publicKey.export({ format: "jwk" });
      return { kty, crv, x, y, kid: k.kid, alg: "ES256", use: "sig" };
    }),
  };
}

export function signJwt(claims: Record<string, unknown>, key: OfficeKey): string {
  if (!key.privateKey) throw new Error("no private key");
  const head = b64url(Buffer.from(JSON.stringify({ alg: "ES256", typ: "JWT", kid: key.kid })));
  const body = b64url(Buffer.from(JSON.stringify(claims)));
  const sig = createSign("SHA256").update(`${head}.${body}`).sign({ key: key.privateKey, dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${b64url(sig)}`;
}

/** For tests and for the provider's own checks: the claims when the signature verifies against one of the keys. */
export function verifyJwt(token: string, keys: OfficeKey[]): Record<string, unknown> | null {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(Buffer.from(h, "base64url").toString("utf8"));
    if (header.alg !== "ES256") return null;
    const key = keys.find((k) => k.kid === header.kid);
    if (!key) return null;
    const ok = createVerify("SHA256").update(`${h}.${p}`).verify({ key: key.publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
    return ok ? JSON.parse(Buffer.from(p, "base64url").toString("utf8")) : null;
  } catch {
    return null;
  }
}
