import { dbManager } from './database'

interface Task {
  id: number
  title: string
  description?: string
  status: 'running' | 'done' | 'cancelled'
  created_at: string
  duration_ms: number
  completed_at?: string
}

class TaskManager {
  private timers = new Map<number, NodeJS.Timeout>()
  private broadcastFn?: (event: string, data: any) => void
  private initialized = false

  constructor() {
    // Don't initialize in constructor anymore
  }

  async initialize() {
    if (this.initialized) return

    // Restore running tasks on startup
    await this.restoreRunningTasks()
    
    // Cleanup completed tasks every hour
    setInterval(() => this.cleanupOldTasks(), 60 * 60 * 1000)

    this.initialized = true
    console.log('✨ Task manager initialized')
  }

  setBroadcastFunction(fn: (event: string, data: any) => void) {
    this.broadcastFn = fn
  }

  private async restoreRunningTasks() {
    const db = dbManager.getDb()
    const runningTasks = db.prepare(`
      SELECT * FROM tasks WHERE status = 'running'
    `).all() as Task[]

    for (const task of runningTasks) {
      const elapsed = Date.now() - new Date(task.created_at).getTime()
      const remaining = task.duration_ms - elapsed

      if (remaining > 0) {
        this.scheduleCompletion(task.id, remaining)
      } else {
        // Task should have completed while server was down
        this.completeTask(task.id)
      }
    }

    console.log(`🔄 Restored ${runningTasks.length} running tasks`)
  }

  createTask(taskData: { title: string; description?: string; durationMs: number }): Task {
    const db = dbManager.getDb()
    
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, duration_ms)
      VALUES (?, ?, ?)
    `)
    
    const result = stmt.run(taskData.title, taskData.description, taskData.durationMs)
    const task = this.getTask(result.lastInsertRowid as number)
    
    if (task) {
      this.scheduleCompletion(task.id, task.duration_ms)
      console.log(`✨ Created task: ${task.title} (${task.duration_ms / 1000}s)`)
    }
    
    return task!
  }

  private scheduleCompletion(taskId: number, delayMs: number) {
    const timer = setTimeout(() => {
      this.completeTask(taskId)
    }, delayMs)
    
    this.timers.set(taskId, timer)
  }

  completeTask(taskId: number) {
    const db = dbManager.getDb()
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = 'done', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND status = 'running'
    `)
    
    const result = stmt.run(taskId)
    
    if (result.changes > 0) {
      const task = this.getTask(taskId)
      
      // Clear timer
      const timer = this.timers.get(taskId)
      if (timer) {
        clearTimeout(timer)
        this.timers.delete(taskId)
      }

      // Broadcast completion
      if (this.broadcastFn && task) {
        this.broadcastFn('task_completed', task)
      }

      console.log(`✅ Completed task: ${taskId}`)
      return task
    }
    
    return null
  }

  cancelTask(taskId: number): Task | null {
    const db = dbManager.getDb()
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = 'cancelled' 
      WHERE id = ? AND status = 'running'
    `)
    
    const result = stmt.run(taskId)
    
    if (result.changes > 0) {
      // Clear timer
      const timer = this.timers.get(taskId)
      if (timer) {
        clearTimeout(timer)
        this.timers.delete(taskId)
      }

      console.log(`❌ Cancelled task: ${taskId}`)
      return this.getTask(taskId)
    }
    
    return null
  }

  getTask(taskId: number): Task | null {
    const db = dbManager.getDb()
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?')
    return stmt.get(taskId) as Task | null
  }

  getAllTasks(): Task[] {
    const db = dbManager.getDb()
    const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100')
    return stmt.all() as Task[]
  }

  private cleanupOldTasks() {
    const db = dbManager.getDb()
    const stmt = db.prepare(`
      DELETE FROM tasks 
      WHERE status IN ('done', 'cancelled') 
      AND datetime(completed_at) < datetime('now', '-7 days')
    `)
    
    const result = stmt.run()
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} old tasks`)
    }
  }

  cleanup() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.timers.clear()
    console.log('🧹 Task manager cleanup complete')
  }
}

export const taskManager = new TaskManager() 