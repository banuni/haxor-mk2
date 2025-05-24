import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

// Create SQLite database instance
const sqlite = new Database("data/app.db");

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for convenience
export * from "./schema";
