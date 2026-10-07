import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

/**
 * Puerta del admin: sin sesión, /admin/** redirige al login y /api/admin/** responde 401.
 * Es una comprobación optimista; cada página y cada ruta del admin vuelven a comprobar la sesión.
 * (En la demo estática de GitHub Pages este fichero se elimina antes del build.)
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = Boolean(req.auth?.user);
  if (pathname === "/admin/login") {
    return loggedIn ? NextResponse.redirect(new URL("/admin/solicitudes", req.url)) : NextResponse.next();
  }
  if (loggedIn) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  const login = new URL("/admin/login", req.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
