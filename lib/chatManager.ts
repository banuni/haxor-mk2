import { db } from "../db";
import { messages, type Message } from "../db/schema";
import { eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

interface User {
  id: string;
  username: string;
}

class ChatManager {
  private activeUsers = new Map<string, User>();

  addUser(userId: string, username: string): User {
    const user: User = {
      id: userId,
      username,
    };

    this.activeUsers.set(userId, user);
    console.log(`👋 User joined: ${username}`);
    return user;
  }

  removeUser(userId: string): User | null {
    const user = this.activeUsers.get(userId);
    if (user) {
      this.activeUsers.delete(userId);
      console.log(`👋 User left: ${user.username}`);
    }
    return user || null;
  }

  getUser(userId: string): User | null {
    return this.activeUsers.get(userId) || null;
  }

  getActiveUsers(): User[] {
    return Array.from(this.activeUsers.values());
  }

  updateUsername(userId: string, newUsername: string): { username: string; oldUsername: string } | null {
    const user = this.activeUsers.get(userId);
    if (!user) return null;

    const oldUsername = user.username;
    user.username = newUsername;
    this.activeUsers.set(userId, user);
    
    console.log(`👤 User renamed: ${oldUsername} -> ${newUsername}`);
    return { username: newUsername, oldUsername };
  }

  async addMessage(userId: string, content: string): Promise<Message | null> {
    const user = this.activeUsers.get(userId);
    if (!user) return null;

    const [message] = await db
      .insert(messages)
      .values({
        id: nanoid(),
        fromName: user.username,
        fromRole: "user",
        content,
      })
      .returning();

    console.log(`💬 Message from ${user.username}: ${content}`);
    return message;
  }

  async getRecentMessages(limit = 50): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(isNull(messages.clearedAt))
      .orderBy(messages.createdAt)
      .limit(limit);
  }

  async clearMessages(): Promise<void> {
    await db
      .update(messages)
      .set({ clearedAt: new Date() })
      .where(isNull(messages.clearedAt));
  }
}

export const chatManager = new ChatManager();
