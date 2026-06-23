import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Automatically calls `fetchFn` whenever a `global_update` event is received
 * from the Socket.IO server. Works on top of the existing SocketContext.
 *
 * @param {Function} fetchFn  - The data-fetching function to call on update.
 * @param {Array}    deps     - Extra dependencies to re-bind the listener when changed.
 */
export function useSocketRefresh(fetchFn, deps = []) {
    const { socket } = useSocket();

    const stableFetch = useCallback(fetchFn, deps); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!socket) return;
        socket.on('global_update', stableFetch);
        return () => {
            socket.off('global_update', stableFetch);
        };
    }, [socket, stableFetch]);
}
