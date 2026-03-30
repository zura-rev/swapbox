import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

let socket: Socket | null = null;

export function useSocket() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    socket = io('/', { auth: { token } });

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}
