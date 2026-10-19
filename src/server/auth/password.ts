import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Password hashing with Node's built-in scrypt (memory-hard KDF, no native deps).
 * Stored format: scrypt$<N>$<r>$<p>$<salt b64>$<hash b64>
 */
const KEYLEN = 64;
const DEFAULTS = { N: 2 ** 15, r: 8, p: 1 };

function scrypt(password: string, salt: Buffer, keylen: number, opts: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p } = DEFAULTS;
  const key = await scrypt(password, salt, KEYLEN, { N, r, p, maxmem: 128 * N * r * 2 });
  return ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (![N, r, p].every((n) => Number.isInteger(n) && n > 0) || N > 2 ** 20) return false;
  const salt = Buffer.from(parts[4]!, "base64");
  const expected = Buffer.from(parts[5]!, "base64");
  const actual = await scrypt(password, salt, expected.length, { N, r, p, maxmem: 128 * N * r * 2 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A precomputed hash used to keep timing constant when the e-mail does not exist. */
let dummyHash: Promise<string> | null = null;
export function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  return dummyHash;
}

export const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  describe: "En az 12 karakter; büyük harf, küçük harf ve rakam içermelidir.",
  check(pw: string): string | null {
    if (pw.length < 12) return "Parola en az 12 karakter olmalıdır.";
    if (pw.length > 128) return "Parola en fazla 128 karakter olabilir.";
    if (!/[a-zçğıöşü]/.test(pw) || !/[A-ZÇĞİÖŞÜ]/.test(pw) || !/\d/.test(pw))
      return "Parola büyük harf, küçük harf ve rakam içermelidir.";
    return null;
  },
};
