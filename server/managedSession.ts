import { jwtVerify, SignJWT } from "jose";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import type { User } from "../drizzle/schema";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { getManagedAccountById } from "./db";

export const MANAGED_SESSION_COOKIE = "recroom_managed_session";
const secret = new TextEncoder().encode(ENV.cookieSecret);

export async function createManagedSession(accountId: number) {
  return new SignJWT({ accountId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(secret);
}

export async function getManagedUser(req: Request): Promise<User | null> {
  if (!ENV.cookieSecret) return null;
  const token = parseCookieHeader(req.headers.cookie ?? "")[MANAGED_SESSION_COOKIE];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const accountId = typeof payload.accountId === "number" ? payload.accountId : Number(payload.accountId);
    if (!Number.isInteger(accountId)) return null;
    const account = await getManagedAccountById(accountId);
    if (!account || !account.active) return null;
    return { id: account.id, openId: `managed:${account.id}`, name: account.displayName, email: null, loginMethod: "managed-password", role: account.role, createdAt: account.createdAt, updatedAt: account.updatedAt, lastSignedIn: account.updatedAt };
  } catch {
    return null;
  }
}

export function setManagedSession(res: Response, req: Request, token: string) {
  res.cookie(MANAGED_SESSION_COOKIE, token, { ...getSessionCookieOptions(req), maxAge: 30 * 24 * 60 * 60 * 1000 });
}

export function clearManagedSession(res: Response, req: Request) {
  res.clearCookie(MANAGED_SESSION_COOKIE, getSessionCookieOptions(req));
}
