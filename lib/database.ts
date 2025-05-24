import { Database } from "bun:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

class DatabaseManager {
  // private db: Database | null = null;

  constructor() {
    // this.db = new Database("data/app.db");
  }

  async initialize() {
    return;
  }

  getDb() {
    // if (!this.db) throw new Error("Database not initialized");
    // return this.db;
  }

  getDbPath() {
    // return this.dbPath;
  }

  close() {
    // if (this.db) {
    //   this.db.close();
    //   console.log("📊 Database closed");
    // }
  }
}

export const dbManager = new DatabaseManager();
