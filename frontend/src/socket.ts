import { io } from 'socket.io-client';

// Point this to your Express server's address
const SERVER_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5002';

// Initialize the socket but don't connect immediately
export const socket = io(SERVER_URL, {
    autoConnect: false,
});