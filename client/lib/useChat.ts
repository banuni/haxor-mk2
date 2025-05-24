import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import type { Message } from "../api/messages";

interface ChatUser {
  id: string;
  username: string;
}

interface UseChatReturn {
  messages: Message[];
  activeUsers: ChatUser[];
  sendMessage: (text: string) => void;
  joinChat: (username: string) => void;
  isConnected: boolean;
  error: string | null;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<ChatUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { on, sendMessage, joinChat } = useWebSocket();

  // Handle initial connection and data
  useEffect(() => {
    const unsubInitial = on("initial_data", (data) => {
      console.log("initial_data", data);
      setMessages(data.messages);
      setActiveUsers(data.activeUsers);
      setIsConnected(true);
      setError(null);
    });

    const unsubError = on("error", (data) => {
      setError(data.message);
    });

    return () => {
      unsubInitial();
      unsubError();
    };
  }, [on]);

  // Handle new messages
  useEffect(() => {
    const unsubNewMessage = on("new_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubNewMessage();
    };
  }, [on]);

  // Handle user joined/left events
  useEffect(() => {
    const unsubUserJoined = on("user_joined", (data) => {
      setActiveUsers((prev) => [...prev, { id: data.username, username: data.username }]);
    });

    const unsubUserLeft = on("user_left", (data) => {
      setActiveUsers((prev) => prev.filter(user => user.username !== data.username));
    });

    return () => {
      unsubUserJoined();
      unsubUserLeft();
    };
  }, [on]);

  // Wrapped send message function
  const handleSendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendMessage(text);
    },
    [sendMessage]
  );

  // Wrapped join chat function
  const handleJoinChat = useCallback(
    (username: string) => {
      if (!username.trim()) return;
      joinChat(username);
    },
    [joinChat]
  );

  return {
    messages,
    activeUsers,
    sendMessage: handleSendMessage,
    joinChat: handleJoinChat,
    isConnected,
    error,
  };
}
