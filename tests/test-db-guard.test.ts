import { describe, expect, it } from "vitest";
import { assertSafeTestDatabaseUrl, UnsafeTestDatabaseError } from "./test-db-guard";

describe("test database guard", () => {
  it("accepts explicit local databases ending with _test", () => {
    for (const url of [
      "postgres://kalkan:pw@localhost:5432/kalkan_digital_test",
      "postgresql://kalkan:pw@127.0.0.1:55432/kalkan_digital_test",
      "postgres://localhost/kd_test",
      "postgres://u:p%40ss@localhost/kd_test", // percent-encoded "@" in the password
    ]) {
      expect(assertSafeTestDatabaseUrl(url)).toBe(url);
    }
  });

  it.each([
    ["empty", ""],
    ["missing", undefined],
    ["wrong scheme", "mysql://u:p@localhost/kd_test"],
    ["name without _test suffix", "postgres://u:p@localhost/kalkan_digital"],
    ["test only as prefix", "postgres://u:p@localhost/test_kalkan"],
    ["_test not at the end", "postgres://u:p@localhost/kalkan_test_live"],
    ["no database name (PGDATABASE fallback)", "postgres://u:p@localhost:5432"],
    ["empty database name", "postgres://u:p@localhost/"],
    ["remote host", "postgres://u:p@db.example.com/kalkan_digital_test"],
    ["host containing localhost", "postgres://u:p@localhost.example.com/kalkan_digital_test"],
    ["no host (PGHOST fallback)", "postgres:///kalkan_digital_test"],
    ["multi-host list", "postgres://u:p@localhost,db.example.com/kalkan_digital_test"],
    ["IPv6 / other loopback spellings", "postgres://u:p@[::1]/kalkan_digital_test"],
    ["extra path segment", "postgres://u:p@localhost/kalkan_digital_test/extra"],
    ["query parameters", "postgres://u:p@localhost/kalkan_digital_test?database=live"],
    ["host query parameter", "postgres://u:p@localhost/kalkan_digital_test?host=db.example.com"],
    ["fragment", "postgres://u:p@localhost/kalkan_digital_test#x"],
  ])("rejects %s", (_label, url) => {
    expect(() => assertSafeTestDatabaseUrl(url)).toThrow(UnsafeTestDatabaseError);
  });

  it("never echoes the URL (it may contain a password)", () => {
    const unsafeUrl = "postgres://user:SuperSecret123@db.example.com/live";
    const call = () => assertSafeTestDatabaseUrl(unsafeUrl);

    // Fails if the guard ever stops throwing for this URL.
    expect(call).toThrow(UnsafeTestDatabaseError);

    let error: unknown;
    try {
      call();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(UnsafeTestDatabaseError);
    const message = (error as Error).message;
    expect(message.length).toBeGreaterThan(0);
    expect(message).not.toContain("SuperSecret123");
    expect(message).not.toContain("user:");
    expect(message).not.toContain("db.example.com");
    expect(message).not.toContain(unsafeUrl);
  });
});
