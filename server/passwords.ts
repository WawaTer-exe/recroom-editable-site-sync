import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const PREFIX = "scrypt";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [prefix, salt, stored] = encoded.split("$");
  if (prefix !== PREFIX || !salt || !stored) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(stored, "hex");
  return expected.length === derived.length && timingSafeEqual(derived, expected);
}
