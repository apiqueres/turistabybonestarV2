import type { NextAuthConfig } from "next-auth";

/**
 * Configuración de Auth.js compartida por `proxy.ts` (sin acceso a la base de datos)
 * y por `auth.ts` (que añade el proveedor de credenciales). Sesión en cookie JWT de 12 h.
 */
export const authConfig = {
  trustHost: true,
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
