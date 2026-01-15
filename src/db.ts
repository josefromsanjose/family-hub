import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var __prisma: PrismaClient | undefined;
}

const isProduction = process.env.NODE_ENV === "production";

const databaseUrl = isProduction
  ? process.env.DATABASE_URL
  : process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    isProduction
      ? "DATABASE_URL environment variable is not set"
      : "DIRECT_URL or DATABASE_URL environment variable is not set"
  );
}

// Create PostgreSQL connection pool with SSL configuration
// Remove sslmode from URL and handle SSL via Pool config
const connectionUrl = new URL(databaseUrl);
connectionUrl.searchParams.delete("sslmode");

const pool = new Pool({
  connectionString: connectionUrl.toString(),
  // SSL is not enforced on Supabase, so disable for development
  ssl: isProduction ? true : false,
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
