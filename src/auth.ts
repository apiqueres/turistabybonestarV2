import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { verifyCredentials } from "@/lib/repo/users";

// `email` es el identificador de AdminUser: puede ser un correo o un nombre de usuario (se guarda en minúsculas).
const credentialsSchema = z.object({ email: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) });

/** Auth.js v5 con usuario y contraseña de la tabla AdminUser (bcrypt). */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Usuario o correo", type: "text" }, password: { label: "Contraseña", type: "password" } },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const account = await verifyCredentials(parsed.data.email, parsed.data.password);
        return account ? { id: account.id, name: account.name, email: account.email } : null;
      },
    }),
  ],
});
