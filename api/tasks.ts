import { Hono } from "hono";
import { db } from "../db";
import { tasks, type Task, type NewTask } from "../db/schema";
import { eq, ne, isNull, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export const tasksRouter = new Hono();

// Utility function to update a task
async function updateTask(id: string, updates: Partial<Task>) {
  const result = await db
    .update(tasks)
    .set(updates)
    .where(eq(tasks.id, id))
    .returning();

  if (!result.length) {
    throw new Error("Task not found");
  }

  return result[0];
}

// Get all tasks
tasksRouter.get("/", async (c) => {
  try {
    const showAborted = c.req.query("showAborted") === "true";
    const query = showAborted
      ? db.select().from(tasks).where(isNull(tasks.archivedAt)).orderBy(tasks.createdAt)
      : db
          .select()
          .from(tasks)
          .where(and(ne(tasks.status, "aborted"), isNull(tasks.archivedAt)))
          .orderBy(tasks.createdAt);

    const allTasks = await query;
    return c.json(allTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

// Get a single task by ID
tasksRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const task = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), isNull(tasks.archivedAt)))
      .get();

    if (!task) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json({ error: "Failed to fetch task" }, 500);
  }
});

// Create a new task
tasksRouter.post("/", async (c) => {
  try {
    const body = await c.req.json<NewTask>();

    const newTask = {
      ...body,
      id: nanoid(),
      createdAt: new Date(),
    };

    await db.insert(tasks).values(newTask);
    return c.json(newTask, 201);
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ error: "Failed to create task" }, 500);
  }
});

// Update a task
tasksRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<Task>>();

    const updatedTask = await updateTask(id, body);
    return c.json(updatedTask);
  } catch (error: any) {
    console.error("Error updating task:", error);
    if (error.message === "Task not found") {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ error: "Failed to update task" }, 500);
  }
});

// Delete a task
tasksRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const result = await db.delete(tasks).where(eq(tasks.id, id)).returning();

    if (!result.length) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    return c.json({ error: "Failed to delete task" }, 500);
  }
});

// Archive a task
tasksRouter.post("/:id/archive", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedTask = await updateTask(id, {
      archivedAt: new Date(),
    });
    return c.json(updatedTask);
  } catch (error: any) {
    console.error("Error archiving task:", error);
    if (error.message === "Task not found") {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ error: "Failed to archive task" }, 500);
  }
});

// Abort a task
tasksRouter.post("/:id/abort", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedTask = await updateTask(id, {
      status: "aborted",
    });
    return c.json(updatedTask);
  } catch (error: any) {
    console.error("Error aborting task:", error);
    if (error.message === "Task not found") {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ error: "Failed to abort task" }, 500);
  }
});

// Start a task
tasksRouter.post("/:id/start", async (c) => {
  try {
    const id = c.req.param("id");

    // First get the current task state
    const currentTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), isNull(tasks.archivedAt)))
      .get();

    if (!currentTask) {
      return c.json({ error: "Task not found" }, 404);
    }

    if (currentTask.status !== "pending") {
      return c.json(
        { error: "Task can only be started if it is in pending state" },
        400
      );
    }

    const updatedTask = await updateTask(id, {
      status: "in-progress",
      startedAt: new Date(),
    });
    return c.json(updatedTask);
  } catch (error: any) {
    console.error("Error starting task:", error);
    if (error.message === "Task not found") {
      return c.json({ error: "Task not found" }, 404);
    }
    return c.json({ error: "Failed to start task" }, 500);
  }
});
