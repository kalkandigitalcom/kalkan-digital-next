// Test environment. Integration tests require TEST_DATABASE_URL (a disposable database!).
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-0000";
(process.env as Record<string, string>).NODE_ENV = "test";
