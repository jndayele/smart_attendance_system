import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL;
        let socketUrl = '';
        try {
            const urlObj = new URL(apiUrl);
            socketUrl = urlObj.origin;
        } catch (e) {
            socketUrl = window.location.origin;
        }

        const newSocket = io(socketUrl, {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket.IO connected');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
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
