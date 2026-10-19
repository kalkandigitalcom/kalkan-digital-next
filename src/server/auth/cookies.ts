/** Cookie names. Safe to import from proxy.ts (no Node-only deps). */
export const SESSION_COOKIE_SECURE = "__Host-kd_session";
export const SESSION_COOKIE_DEV = "kd_session";
export const SESSION_COOKIE_NAMES = [SESSION_COOKIE_SECURE, SESSION_COOKIE_DEV] as const;
