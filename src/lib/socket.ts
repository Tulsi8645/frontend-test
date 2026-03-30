import { Server as SocketIOServer } from 'socket.io';

// Socket.IO instance that can be accessed from API routes
let io: SocketIOServer | null = null;

export function setSocketInstance(socketIo: SocketIOServer) {
    io = socketIo;
}

export function getSocketInstance(): SocketIOServer | null {
    return io;
}

export { io };
