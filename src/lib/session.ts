import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "tmcc_session";
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
  return new TextEncoder().encode(value);
}
export async function createSession(admin: { id: string; email: string; name: string }) {
  const token = await new SignJWT(admin).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
  const jar = await cookies();
  jar.set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}
export async function getSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.id !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string") return null;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch { return null; }
}
export async function clearSession() {
  const jar = await cookies();
  jar.set(cookieName, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
