import { useEffect, useRef, useState } from 'react';
import { WsVoteCastMessage } from '../types';

export function usePollSocket(
  pollId: string | null,
  onMessage: (data: WsVoteCastMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [latencyNotice, setLatencyNotice] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pollId) return;

    let isMounted = true;

    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setLatencyNotice(null);
          // Subscribe to specific poll room
          ws.send(JSON.stringify({ type: 'subscribe', pollId }));

          // Start ping heartbeat
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = window.setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'vote_cast' || data.type === 'snapshot') {
              if (data.pollId === pollId) {
                onMessage(data as WsVoteCastMessage);
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

          // Attempt reconnection after 2 seconds
          reconnectTimeoutRef.current = window.setTimeout(() => {
            if (isMounted) {
              connect();
            }
          }, 2000);
        };

        ws.onerror = (err) => {
          console.warn('WebSocket encountered error, attempting recovery...', err);
          ws.close();
        };
      } catch (err) {
        console.error('Failed to initialize WebSocket:', err);
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ type: 'unsubscribe', pollId }));
          } catch {
            // ignore
          }
        }
        wsRef.current.close();
      }
    };
  }, [pollId]);

  return { isConnected, latencyNotice };
}
