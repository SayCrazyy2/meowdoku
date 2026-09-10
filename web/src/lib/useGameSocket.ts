'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

export function useGameSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);
  const telegramIdRef = useRef<string | null>(null);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback((sessionToken: string, telegramId: string) => {
    disconnect();
    sessionTokenRef.current = sessionToken;
    telegramIdRef.current = telegramId;

    try {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      // In production or behind reverse proxy, standard port or 3001
      const port = process.env.NEXT_PUBLIC_WS_PORT || '3001';
      const wsUrl = `${wsProtocol}//${hostname}:${port}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(
          JSON.stringify({
            type: 'INIT',
            sessionToken,
            telegramId,
          })
        );
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
      };

      socket.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('[useGameSocket] WebSocket connection failed:', err);
    }
  }, [disconnect]);

  const sendCellAction = useCallback((action: 'cross' | 'uncross' | 'cat', r: number, c: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'CELL_ACTION',
            sessionToken: sessionTokenRef.current,
            action,
            r,
            c,
            timestamp: Date.now(),
          })
        );
      } catch {}
    }
  }, []);

  const sendLoseFish = useCallback((fishRemaining: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'LOSE_FISH',
            sessionToken: sessionTokenRef.current,
            fishRemaining,
          })
        );
      } catch {}
    }
  }, []);

  const sendHintUsed = useCallback((hintType: 'cat' | 'cross') => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'HINT_USED',
            sessionToken: sessionTokenRef.current,
            hintType,
          })
        );
      } catch {}
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendCellAction,
    sendLoseFish,
    sendHintUsed,
    isConnected,
  };
}
