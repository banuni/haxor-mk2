import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import type { ServerWebSocket } from "bun";
import { chatManager } from "./lib/chatManager";
import { dbManager } from "./lib/database";
import index from "./client/index.html";
import { tasksRouter } from "./api/tasks";

// Initialize database and task manager
await dbManager.initialize();
// await taskManager.initialize();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Mount task routes
app.route("/api/tasks", tasksRouter);

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
    "/player": index,
    "/master": index,
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
            userId: userId,
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
      const { username, userId } = payload;
      if (!username || !userId) return;

      (ws as any).userId = userId;
      const user = chatManager.addUser(userId, username);
      console.log("User joined:", user);
      // Broadcast user joined
      broadcastToAll("user_joined", {
        username,
        userId,
        message: `${username} joined the chat`,
      });
      broadcastToAll("active_users", chatManager.getActiveUsers());
      break;
    case "update_username":
      const updateUserId = (ws as any).userId;
      if (!updateUserId) return;
      const { newUsername, userId: targetUserId } = payload;
      if (!newUsername) return;
      
      // Only allow updating other users' names if the sender is the master
      if (targetUserId && targetUserId !== updateUserId && updateUserId !== "master") {
        ws.send(JSON.stringify({
          event: "error",
          data: { message: "Only the master can update other users' names" }
        }));
        return;
      }
      
      const updatedUser = chatManager.updateUsername(targetUserId || updateUserId, newUsername);
      if (updatedUser) {
        broadcastToAll("user_updated", {
          oldUsername: updatedUser.oldUsername,
          newUsername: updatedUser.username,
          userId: targetUserId || updateUserId,
          message: `${updatedUser.oldUsername} is now known as ${updatedUser.username}`,
        });
        broadcastToAll("active_users", chatManager.getActiveUsers());
      }
      break;
    case "send_message":
      const messageUserId = (ws as any).userId;
      if (!messageUserId) return;
      const message = await chatManager.addMessage(messageUserId, payload.text);
      if (message) {
        broadcastToAll("new_message", message);
      }
      break;
    case "clear_messages":
      await chatManager.clearMessages();
      broadcastToAll("messages_cleared", {
        message: "Messages cleared",
        messages: [],
      });
      break;
  }
}

console.log(`🚀 Server running on http://localhost:${server.port}`);
console.log(`📁 Database: ${dbManager.getDbPath()}`);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down gracefully...");
  // taskManager.cleanup();
  dbManager.close();
  server.stop();
  process.exit(0);
});