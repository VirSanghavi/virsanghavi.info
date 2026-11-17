"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, clearAttempts, cookieOptions, issueToken, passwordMatches, recordAttempt, requestIp, tooManyAttempts } from "@/lib/admin/auth";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const ip = await requestIp();
  if (tooManyAttempts(ip)) return { error: "Too many tries. Wait ten minutes." };
  const password = String(form.get("password") ?? "");
  if (!passwordMatches(password)) {
    recordAttempt(ip);
    return { error: "That is not it." };
  }
  const token = issueToken();
  if (!token) return { error: "The admin session secret is not configured." };
  clearAttempts(ip);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, cookieOptions(30 * 24 * 3600));
  redirect("/admin");
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", cookieOptions(0));
  redirect("/admin");
}
