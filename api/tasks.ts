import { Hono } from "hono";
import { db } from "../db";
import { tasks, type Task, type NewTask } from "../db/schema";
import { eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";

export const tasksRouter = new Hono();

// Get all tasks
tasksRouter.get("/", async (c) => {
  console.log("Getting tasks...");
  try {
    const showAborted = c.req.query("showAborted") === "true";
    const query = showAborted
      ? db.select().from(tasks).orderBy(tasks.createdAt)
      : db
          .select()
          .from(tasks)
          .where(ne(tasks.status, "aborted"))
          .orderBy(tasks.createdAt);

    const allTasks = await query;
    console.log("allTasks", allTasks);
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
    const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();

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
  console.log("Creating task...");
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

    const result = await db
      .update(tasks)
      .set(body)
      .where(eq(tasks.id, id))
      .returning();

    if (!result.length) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json(result[0]);
  } catch (error) {
    console.error("Error updating task:", error);
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
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ error: "Failed to delete task" }, 500);
  }
});
