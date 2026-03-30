import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';

export const config = {
    api: {
        bodyParser: false,
    },
};

interface SocketWithSession extends NetServer {
    io?: SocketIOServer;
}

interface ResponseWithSocket extends NextApiResponse {
    socket: any;
}

const ioHandler = async (req: NextApiRequest, res: ResponseWithSocket) => {
    if (!res.socket.server.io) {
        const io = new SocketIOServer(res.socket.server as any, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        // Socket.IO event handlers
        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Join session room
            socket.on('join-session', async (sessionId: string) => {
                socket.join(sessionId);
                console.log(`Socket ${socket.id} joined session ${sessionId}`);

                // Notify admins that a user joined
                socket.to('admins').emit('user-joined', { sessionId });
            });

            // Admin joins admin room
            socket.on('join-admin', () => {
                socket.join('admins');
                console.log(`Socket ${socket.id} joined admin room`);
            });

            // Handle user message
            socket.on('user-message', async (data: { sessionId: string; message: string }) => {
                const { sessionId, message } = data;

                try {
                    await connectDB();

                    // Save message to database
                    const session = await ChatSession.findOne({ sessionId });
                    if (session) {
                        session.messages.push({
                            role: 'user',
                            text: message,
                            timestamp: new Date(),
                        });
                        session.lastActivityAt = new Date();
                        await session.save();

                        // Broadcast to session room and admins
                        io.to(sessionId).emit('new-message', {
                            role: 'user',
                            text: message,
                            timestamp: new Date(),
                        });

                        io.to('admins').emit('session-updated', {
                            sessionId,
                            message: { role: 'user', text: message, timestamp: new Date() },
                        });
                    }
                } catch (error) {
                    console.error('Error saving user message:', error);
                }
            });

            // Handle admin message
            socket.on('admin-message', async (data: { sessionId: string; message: string; adminId: string }) => {
                const { sessionId, message, adminId } = data;

                try {
                    await connectDB();

                    const session = await ChatSession.findOne({ sessionId });
                    if (session && session.status === 'taken_over' && session.takenOverBy === adminId) {
                        session.messages.push({
                            role: 'admin',
                            text: message,
                            timestamp: new Date(),
                            adminId,
                        });
                        session.lastActivityAt = new Date();
                        await session.save();

                        // Broadcast to session room
                        io.to(sessionId).emit('new-message', {
                            role: 'admin',
                            text: message,
                            timestamp: new Date(),
                            adminId,
                        });

                        // Notify other admins
                        io.to('admins').emit('session-updated', {
                            sessionId,
                            message: { role: 'admin', text: message, timestamp: new Date(), adminId },
                        });
                    }
                } catch (error) {
                    console.error('Error saving admin message:', error);
                }
            });

            // Handle bot message
            socket.on('bot-message', async (data: { sessionId: string; message: string }) => {
                const { sessionId, message } = data;

                try {
                    await connectDB();

                    const session = await ChatSession.findOne({ sessionId });
                    if (session && session.status === 'active') {
                        session.messages.push({
                            role: 'bot',
                            text: message,
                            timestamp: new Date(),
                        });
                        session.lastActivityAt = new Date();
                        await session.save();

                        // Broadcast to session room
                        io.to(sessionId).emit('new-message', {
                            role: 'bot',
                            text: message,
                            timestamp: new Date(),
                        });

                        // Notify admins
                        io.to('admins').emit('session-updated', {
                            sessionId,
                            message: { role: 'bot', text: message, timestamp: new Date() },
                        });
                    }
                } catch (error) {
                    console.error('Error saving bot message:', error);
                }
            });

            // Handle session takeover
            socket.on('takeover-session', async (data: { sessionId: string; adminId: string }) => {
                const { sessionId, adminId } = data;

                try {
                    await connectDB();

                    const session = await ChatSession.findOne({ sessionId });
                    if (session && session.status !== 'closed') {
                        session.status = 'taken_over';
                        session.takenOverBy = adminId;
                        session.takenOverAt = new Date();
                        await session.save();

                        // Notify session
                        io.to(sessionId).emit('session-taken-over', { adminId });

                        // Notify admins
                        io.to('admins').emit('session-taken-over', { sessionId, adminId });
                    }
                } catch (error) {
                    console.error('Error taking over session:', error);
                }
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        res.socket.server.io = io;
    }

    res.end();
};

export default ioHandler;
