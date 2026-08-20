import { describe, expect, it } from "vitest";

describe("managed account bootstrap configuration", () => {
  it("loads the configured bootstrap password through the server environment", () => {
    const secret = process.env.INITIAL_MANAGED_ACCOUNT_PASSWORD;
    expect(secret).toBeTruthy();
    expect(secret).toMatch(/^.{8,}$/);
  });
});
