import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { taskManager } from "./lib/taskManager";
import { chatManager } from "./lib/chatManager";
import { dbManager } from "./lib/database";
import index from "./client/index.html";

// Initialize database and task manager
await dbManager.initialize();
// await taskManager.initialize();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Task API Routes
// app.get("/api/tasks", async (c) => {
//   const tasks = taskManager.getAllTasks();
//   return c.json({ tasks });
// });

// app.post("/api/tasks", async (c) => {
//   const body = await c.req.json();
//   const { title, description, durationMinutes = 10 } = body;

//   if (!title) {
//     return c.json({ error: "Title is required" }, 400);
//   }

//   const task = taskManager.createTask({
//     title,
//     description,
//     durationMs: durationMinutes * 60 * 1000,
//   });

//   // Broadcast to all WebSocket clients
//   broadcastToAll("task_created", task);

//   return c.json({ task }, 201);
// });

// app.get("/api/tasks/:id", async (c) => {
//   const taskId = parseInt(c.req.param("id"));
//   // const task = taskManager.getTask(taskId);

//   if (!task) {
//     return c.json({ error: "Task not found" }, 404);
//   }

//   return c.json({ task });
// });

// app.delete("/api/tasks/:id", async (c) => {
//   const taskId = parseInt(c.req.param("id"));
//   const task = taskManager.cancelTask(taskId);

//   if (!task) {
//     return c.json({ error: "Task not found" }, 404);
//   }

//   // Broadcast to all WebSocket clients
//   broadcastToAll("task_cancelled", task);

//   return c.json({ task });
// });

// Health check
app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tasks: [], //taskManager.getAllTasks().length,
    activeUsers: chatManager.getActiveUsers().length,
  });
});

// WebSocket client management
const clients = new Set<ServerWebSocket<any>>();

function broadcastToAll(event: string, data: any) {
  const message = JSON.stringify({ event, data });
  clients.forEach((client) => {
    if (client.readyState === 1) {
      // OPEN
      client.send(message);
    }
  });
}

// Make broadcast function available to task manager
//taskManager.setBroadcastFunction(broadcastToAll);

// Start the server with WebSocket support
const server = Bun.serve({
  routes: {
    "/*": index,
  },
  port: process.env.PORT || 3000,
  fetch(req, server) {
    const url = new URL(req.url);

    // Handle WebSocket upgrade at /ws endpoint
    if (url.pathname === "/ws" && server.upgrade(req)) {
      return new Response(null, { status: 101 });
    }

    // Handle regular HTTP requests
    return app.fetch(req);
  },
  websocket: {
    async open(ws) {
      console.log("WebSocket connection opened");
      clients.add(ws);

      // Send current state to newly connected client
      ws.send(
        JSON.stringify({
          event: "initial_data",
          data: {
            tasks: [], //taskManager.getAllTasks(),
            messages: await chatManager.getRecentMessages(50),
            activeUsers: chatManager.getActiveUsers(),
          },
        })
      );
    },

    message(ws, message) {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
        ws.send(
          JSON.stringify({
            event: "error",
            data: { message: "Invalid message format" },
          })
        );
      }
    },

    close(ws) {
      console.log("WebSocket connection closed");
      clients.delete(ws);

      // Remove user from chat if they were registered
      const userId = (ws as any).userId;
      if (userId) {
        const user = chatManager.removeUser(userId);
        if (user) {
          broadcastToAll("user_left", {
            username: user.username,
            message: `${user.username} left the chat`,
          });
          broadcastToAll("active_users", chatManager.getActiveUsers());
        }
      }
    },
  },
});

async function handleWebSocketMessage(ws: ServerWebSocket<any>, data: any) {
  const { event, payload } = data;

  switch (event) {
    case "join_chat":
      const { username } = payload;
      if (!username) return;

      const userId = Date.now() + Math.random();
      (ws as any).userId = userId;
      const user = chatManager.addUser(userId, username);

      // Broadcast user joined
      broadcastToAll("user_joined", {
        username,
        message: `${username} joined the chat`,
      });
      broadcastToAll("active_users", chatManager.getActiveUsers());
      break;

    case "send_message":
      const senderId = (ws as any).userId;
      if (!senderId) return;
      const message = await chatManager.addMessage(senderId, payload.text);
      if (message) {
        broadcastToAll("new_message", message);
      }
      break;

    case "typing_start":
      const typingUserId = (ws as any).userId;
      if (!typingUserId) return;

      const typingUser = chatManager.getUser(typingUserId);
      if (typingUser) {
        // Broadcast to all except sender
        clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(
              JSON.stringify({
                event: "user_typing",
                data: { username: typingUser.username, isTyping: true },
              })
            );
          }
        });
      }
      break;

    case "typing_stop":
      const stopTypingUserId = (ws as any).userId;
      if (!stopTypingUserId) return;

      const stopTypingUser = chatManager.getUser(stopTypingUserId);
      if (stopTypingUser) {
        clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) {
            client.send(
              JSON.stringify({
                event: "user_typing",
                data: { username: stopTypingUser.username, isTyping: false },
              })
            );
          }
        });
      }
      break;

    case "create_task":
      const task = taskManager.createTask({
        title: payload.title,
        description: payload.description,
        durationMs: (payload.durationMinutes || 10) * 60 * 1000,
      });
      broadcastToAll("task_created", task);
      break;

    case "cancel_task":
      const cancelledTask = taskManager.cancelTask(payload.taskId);
      if (cancelledTask) {
        broadcastToAll("task_cancelled", cancelledTask);
      }
      break;
  }
}

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`📁 Database: ${dbManager.getDbPath()}`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  taskManager.cleanup();
  dbManager.close();
  server.stop();
  process.exit(0);
});
