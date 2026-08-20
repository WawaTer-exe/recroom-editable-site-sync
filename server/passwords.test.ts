import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./passwords";

describe("managed account passwords", () => {
  it("hashes, verifies, and salts passwords without exposing plaintext", () => {
    const password = process.env.INITIAL_MANAGED_ACCOUNT_PASSWORD;
    expect(password).toBeTruthy();
    const first = hashPassword(password);
    const second = hashPassword(password);
    expect(first).not.toBe(password);
    expect(second).not.toBe(password);
    expect(first).not.toBe(second);
    expect(verifyPassword(password, first)).toBe(true);
    expect(verifyPassword("wrong-password", first)).toBe(false);
  });
});
