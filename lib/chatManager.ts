import { dbManager } from './database'

interface User {
  id: string | number
  username: string
  joinedAt: Date
}

interface Message {
  id: number
  user_id: string | number
  username: string
  text: string
  timestamp: string
}

class ChatManager {
  private activeUsers = new Map<string | number, User>()

  addUser(userId: string | number, username: string): User {
    const user: User = {
      id: userId,
      username,
      joinedAt: new Date()
    }
    
    this.activeUsers.set(userId, user)
    console.log(`👋 User joined: ${username}`)
    return user
  }

  removeUser(userId: string | number): User | null {
    const user = this.activeUsers.get(userId)
    if (user) {
      this.activeUsers.delete(userId)
      console.log(`👋 User left: ${user.username}`)
    }
    return user || null
  }

  getUser(userId: string | number): User | null {
    return this.activeUsers.get(userId) || null
  }

  getActiveUsers(): User[] {
    return Array.from(this.activeUsers.values())
  }

  addMessage(userId: string | number, text: string): Message | null {
    const user = this.activeUsers.get(userId)
    if (!user) return null

    const db = dbManager.getDb()
    const stmt = db.prepare(`
      INSERT INTO messages (user_id, username, text)
      VALUES (?, ?, ?)
    `)
    
    const result = stmt.run(userId, user.username, text)
    
    const message = db.prepare('SELECT * FROM messages WHERE id = ?')
      .get(result.lastInsertRowid) as Message
    
    console.log(`💬 Message from ${user.username}: ${text}`)
    return message
  }

  getRecentMessages(limit = 50): Message[] {
    const db = dbManager.getDb()
    const stmt = db.prepare(`
      SELECT * FROM messages 
      ORDER BY timestamp DESC 
      LIMIT ?
    `)
    
    return (stmt.all(limit) as Message[]).reverse()
  }
}

export const chatManager = new ChatManager() 