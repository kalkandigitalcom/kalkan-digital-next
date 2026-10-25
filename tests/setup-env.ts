// Test environment. Database tests require TEST_DATABASE_URL: a LOCAL, disposable PostgreSQL
// database whose name ends with "_test" (the tests truncate every table). See ./test-db-guard.ts.
import { assertSafeTestDatabaseUrl } from "./test-db-guard";

// DATABASE_URL is always overwritten, so an application/live database URL in the shell can never
// be used by tests: it becomes the validated test URL, or empty (database tests are then skipped).
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
process.env.DATABASE_URL = testDatabaseUrl ? assertSafeTestDatabaseUrl(testDatabaseUrl) : "";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-0000";
(process.env as Record<string, string>).NODE_ENV = "test";
