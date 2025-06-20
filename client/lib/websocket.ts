import { type Message } from "db/schema";

// Define all possible event types
export type WebSocketEvent =
  | "initial_data"
  | "user_joined"
  | "user_left"
  | "user_updated"
  | "new_message"
  | "error"
  | "messages_cleared";

// Define payload types for each event
export interface WebSocketPayloads {
  initial_data: {
    messages: Message[];
    activeUsers: { id: string; username: string }[];
  };
  user_joined: {
    username: string;
    userId: string;
    message: string;
  };
  user_left: {
    username: string;
    userId: string;
    message: string;
  };
  user_updated: {
    userId: string;
    oldUsername: string;
    newUsername: string;
    message: string;
  };
  new_message: Message;
  error: {
    message: string;
  };
  messages_cleared: {
    message: string;
    messages: Message[];
  };
}

// Define the message format
export interface WebSocketMessage<T extends WebSocketEvent> {
  event: T;
  data: WebSocketPayloads[T];
}

// Define client events that can be sent
export type ClientEvent = "join_chat" | "send_message" | "clear_messages" | "update_username";

// Define payload types for client events
export interface ClientPayloads {
  join_chat: {
    username: string;
    userId: string;
  };
  send_message: {
    text: string;
    userId: string;
  };
  clear_messages: {};
  update_username: {
    newUsername: string;
    userId: string;
  };
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private eventHandlers: Map<WebSocketEvent, Set<(data: any) => void>> =
    new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private userId: string | null = null;

  constructor(private url: string) {
    console.log("WebSocket client initialized with URL:", url);
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket is already connecting");
      return;
    }

    console.log("Attempting to connect to WebSocket...");
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log("WebSocket connected successfully");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(
          event.data
        ) as WebSocketMessage<WebSocketEvent>;
        console.log("Received WebSocket message:", message);
        const handlers = this.eventHandlers.get(message.event);
        if (handlers) {
          handlers.forEach((handler) => handler(message.data));
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onclose = (event) => {
      console.log("WebSocket disconnected", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      this.connect();
    }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      console.log("Disconnecting WebSocket...");
      this.ws.close();
      this.ws = null;
    }
  }

  on<T extends WebSocketEvent>(
    event: T,
    handler: (data: WebSocketPayloads[T]) => void
  ) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<T extends WebSocketEvent>(
    event: T,
    handler: (data: WebSocketPayloads[T]) => void
  ) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  send<T extends ClientEvent>(event: T, payload: ClientPayloads[T]) {
    if (!this.ws) {
      console.error("WebSocket is not initialized");
      throw new Error("WebSocket is not initialized");
    }

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected", {
        readyState: this.ws.readyState,
        event,
        payload,
      });
      throw new Error("WebSocket is not connected");
    }

    console.log("Sending WebSocket message:", { event, payload });
    this.ws.send(JSON.stringify({ event, payload }));
  }

  // Chat convenience methods
  joinChat(username: string) {
    if (!this.userId) {
      throw new Error("userId must be set before joining chat");
    }
    this.send("join_chat", { username, userId: this.userId });
  }

  sendMessage(text: string) {
    if (!this.userId) {
      throw new Error("userId must be set before sending messages");
    }
    this.send("send_message", { text, userId: this.userId });
  }

  clearMessages() {
    this.send("clear_messages", {});
  }

  updateUsername(newUsername: string, targetUserId?: string) {
    if (!this.userId) {
      throw new Error("userId must be set before updating username");
    }
    this.send("update_username", { newUsername, userId: targetUserId || this.userId });
  }
}

// Create a singleton instance with the correct WebSocket URL
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
console.log("Creating WebSocket client with URL:", wsUrl);
export const wsClient = new WebSocketClient(wsUrl);
