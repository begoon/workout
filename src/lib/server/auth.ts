import { env } from "$env/dynamic/private";
import { createHmac, timingSafeEqual } from "node:crypto";

const PASSWORD = env.AUTH_PASSWORD ?? "";
const SECRET = env.AUTH_SECRET ?? "";

export const AUTH_COOKIE = "workout_auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const TOKEN = PASSWORD && SECRET ? createHmac("sha256", SECRET).update(PASSWORD).digest("hex") : "";

export function verifyPassword(input: string): boolean {
    if (!PASSWORD) return false;
    const a = Buffer.from(input);
    const b = Buffer.from(PASSWORD);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export function isAuthCookieValid(value: string | undefined): boolean {
    if (!value || !TOKEN) return false;
    if (value.length !== TOKEN.length) return false;
    return timingSafeEqual(Buffer.from(value), Buffer.from(TOKEN));
}

export function issueAuthToken(): string {
    return TOKEN;
}
