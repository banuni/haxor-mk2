import { Database } from 'bun:sqlite'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

class DatabaseManager {
  private db: Database | null = null
  private dbPath: string

  constructor() {
    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
    
    this.dbPath = join(dataDir, 'app.db')
  }

  async initialize() {
    this.db = new Database(this.dbPath)
    
    // Enable WAL mode for better performance
    this.db.run('PRAGMA journal_mode = WAL')
    this.db.run('PRAGMA synchronous = NORMAL')
    this.db.run('PRAGMA cache_size = 1000')
    
    this.createTables()
    console.log(`📊 Database initialized: ${this.dbPath}`)
  }

  private createTables() {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'running',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        duration_ms INTEGER,
        completed_at DATETIME
      )
    `)

    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)
    `)
  }

  getDb() {
    if (!this.db) throw new Error('Database not initialized')
    return this.db
  }

  getDbPath() {
    return this.dbPath
  }

  close() {
    if (this.db) {
      this.db.close()
      console.log('📊 Database closed')
    }
  }
}

export const dbManager = new DatabaseManager() 