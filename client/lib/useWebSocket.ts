import { useEffect, useCallback } from 'react';
import { wsClient, type WebSocketEvent, type WebSocketPayloads, type ClientEvent, type ClientPayloads } from './websocket';

export function useWebSocket() {
  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  const on = useCallback(<T extends WebSocketEvent>(
    event: T,
    handler: (data: WebSocketPayloads[T]) => void
  ) => {
    return wsClient.on(event, handler);
  }, []);

  const send = useCallback(<T extends ClientEvent>(
    event: T,
    payload: ClientPayloads[T]
  ) => {
    wsClient.send(event, payload);
  }, []);

  return {
    on,
    send,
    joinChat: useCallback((username: string) => {
      wsClient.joinChat(username);
    }, []),
    sendMessage: useCallback((text: string) => {
      wsClient.sendMessage(text);
    }, []),
  };
} 