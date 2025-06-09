import { useEffect, useCallback } from "react";
import {
  wsClient,
  type WebSocketEvent,
  type WebSocketPayloads,
  type ClientEvent,
  type ClientPayloads,
} from "./websocket";

export function useWebSocket(userId: string) {
  useEffect(() => {
    wsClient.setUserId(userId);
    wsClient.connect();
    return () => wsClient.disconnect();
  }, [userId]);

  const on = useCallback(
    <T extends WebSocketEvent>(
      event: T,
      handler: (data: WebSocketPayloads[T]) => void
    ) => {
      return wsClient.on(event, handler);
    },
    []
  );

  const send = useCallback(
    <T extends ClientEvent>(event: T, payload: ClientPayloads[T]) => {
      wsClient.send(event, payload);
    },
    []
  );

  return {
    on,
    send,
    joinChat: useCallback((username: string) => {
      wsClient.joinChat(username);
    }, []),
    sendMessage: useCallback((text: string) => {
      wsClient.sendMessage(text);
    }, []),
    clearMessages: useCallback(() => {
      wsClient.clearMessages();
    }, []),
    updateUsername: useCallback((username: string, targetUserId?: string) => {
      wsClient.updateUsername(username, targetUserId);
    }, []),
  };
}
