import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Messages table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  fromName: text('from_name').notNull(),
  fromRole: text('from_role').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  clearedAt: integer('cleared_at', { mode: 'timestamp' }),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  description: text('description'),
  taskType: text('task_type', {
    enum: ['disable', 'scan', 'extract', 'destroy'],
  }).notNull(),
  status: text('status', {
    enum: ['analyzing', 'pending', 'in-progress', 'success', 'fail', 'aborted'],
  }).notNull(),
  goal: text('goal'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  probability: integer('probability'), // Stored as integer percentage
  estimatedSecondsToComplete: integer('estimated_seconds_to_complete'),
  targetName: text('target_name').notNull(),
  algorithmName: text('algorithm_name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  archivedAt: integer('archived_at', { mode: 'timestamp' }),
});

// Types for TypeScript
export type Message = typeof messages.$inferSelect;
export type NewMessage = Omit<typeof messages.$inferInsert, 'id' | 'createdAt'>;

export type Task = typeof tasks.$inferSelect;
export type NewTask = Omit<typeof tasks.$inferInsert, 'id' | 'createdAt'>; 