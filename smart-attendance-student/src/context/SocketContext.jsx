import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

/**
 * Resolve the Socket.IO server URL.
 *
 * Priority order:
 *  1. VITE_SOCKET_URL  – explicit override (set this in production: your Railway URL)
 *  2. VITE_API_URL     – if set, strip the path and use the origin
 *  3. Hard-coded dev fallback: http://localhost:8000
 *
 * This prevents the socket from accidentally connecting to the Vite
 * dev server (localhost:5173) when neither env var is defined locally.
 */
function resolveSocketUrl() {
    // 1. Explicit socket URL (highest priority)
    const explicit = import.meta.env.VITE_SOCKET_URL;
    if (explicit) return explicit;

    // 2. Derive origin from the API URL env var
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
        try {
            return new URL(apiUrl).origin;
        } catch (_) { /* fall through */ }
    }

    // 3. Local development fallback — matches hardcoded API_BASE in studentAPI.js
    return 'http://localhost:8000';
}

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socketUrl = resolveSocketUrl();

        const newSocket = io(socketUrl, {
            // Try WebSocket first; fall back to HTTP long-polling automatically.
            // This is critical for Railway + Vercel in production.
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        newSocket.on('connect', () => {
            console.log(`[Socket.IO] Connected to ${socketUrl}`);
            setIsConnected(true);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('[Socket.IO] Connection error:', err.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket.IO] Disconnected:', reason);
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    return useContext(SocketContext);
};
