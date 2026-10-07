import "dotenv/config";
import { defineConfig } from "prisma/config";

// Configuración del CLI de Prisma 7: la URL de conexión vive aquí (no en schema.prisma).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://tbb:tbb@127.0.0.1:5432/turistabybonestar?schema=public",
  },
});
