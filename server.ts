import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import connectDB from './src/lib/db';
import ChatSession from './src/models/ChatSession';
import { setSocketInstance } from './src/lib/socket';
import { sendFacebookMessage } from './src/lib/facebook';
import { sendWhatsAppMessage } from './src/lib/whatsapp';
import { sendInstagramMessage } from './src/lib/instagram';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url!, true);
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error handling request:', err);
            res.statusCode = 500;
            res.end('Internal Server Error');
        }
    });

    // Initialize Socket.IO
    const io = new SocketIOServer(httpServer, {
        path: '/api/socket',
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Set socket instance for use in API routes
    setSocketInstance(io);

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
                    const timestamp = new Date();
                    session.messages.push({
                        role: 'user',
                        text: message,
                        timestamp,
                    });
                    session.lastActivityAt = timestamp;
                    await session.save();

                    // Broadcast to session room EXCEPT sender (they already have it in UI)
                    socket.to(sessionId).emit('new-message', {
                        sessionId,
                        role: 'user',
                        text: message,
                        timestamp,
                    });

                    // Notify admins via session-updated
                    io.to('admins').emit('session-updated', {
                        sessionId,
                        message: { role: 'user', text: message, timestamp },
                    });
                }
            } catch (error) {
                console.error('Error saving user message:', error);
            }
        });

        // Handle admin message (only for broadcasting and external channel sending - DB save is done via API)
        socket.on('admin-message', async (data: { sessionId: string; message: string; adminId: string; timestamp?: string }) => {
            const { sessionId, message, adminId, timestamp: clientTimestamp } = data;
            console.log(`[SOCKET] Admin ${adminId} message broadcast for session ${sessionId}: ${message}`);

            try {
                await connectDB();

                const session = await ChatSession.findOne({ sessionId });
                if (!session) {
                    console.log(`[SOCKET] Session ${sessionId} not found`);
                    return;
                }
                
                if (session.status !== 'taken_over' || session.takenOverBy?.toString() !== adminId) {
                    console.log(`[SOCKET] Cannot send: session not taken over by this admin. Status: ${session?.status}, takenOverBy: ${session?.takenOverBy}`);
                    return;
                }

                // Use client timestamp or create new one
                const timestamp = clientTimestamp ? new Date(clientTimestamp) : new Date();

                // Send to external channel if not website
                if (session.channel === 'facebook' && session.externalId) {
                    try {
                        const Business = (await import('./src/models/Business')).default;
                        const business = await Business.findById(session.businessId);
                        const token = business?.facebookCredentials?.pageAccessToken;
                        if (!token) {
                            console.error(`[SOCKET] No Facebook token found for business ${session.businessId}`);
                        } else {
                            console.log(`[SOCKET] Sending Facebook message to ${session.externalId}`);
                            await sendFacebookMessage(session.externalId, message, token);
                            console.log(`[SOCKET] Facebook message sent successfully`);
                        }
                    } catch (fbError) {
                        console.error('[SOCKET] Error sending Facebook message:', fbError);
                    }
                } else if (session.channel === 'whatsapp' && session.externalId && session.businessId) {
                    try {
                        const Business = (await import('./src/models/Business')).default;
                        const business = await Business.findById(session.businessId);
                        if (business?.whatsappCredentials) {
                            console.log(`[SOCKET] Sending WhatsApp message to ${session.externalId}`);
                            await sendWhatsAppMessage(
                                session.externalId, 
                                message,
                                business.whatsappCredentials.wabaId || '',
                                business.whatsappCredentials.accessToken || '',
                                business.whatsappCredentials.phoneNumberId || ''
                            );
                        } else {
                            console.error(`[SOCKET] No WhatsApp credentials found for business ${session.businessId}`);
                        }
                    } catch (waError) {
                        console.error('[SOCKET] Error sending WhatsApp message:', waError);
                    }
                } else if (session.channel === 'instagram' && session.externalId && session.businessId) {
                    try {
                        const Business = (await import('./src/models/Business')).default;
                        const business = await Business.findById(session.businessId);
                        if (business?.facebookCredentials?.pageAccessToken) {
                            console.log(`[SOCKET] Sending Instagram message to ${session.externalId}`);
                            await sendInstagramMessage(
                                session.externalId, 
                                message,
                                business.facebookCredentials.pageAccessToken
                            );
                        } else {
                            console.error(`[SOCKET] No Instagram credentials found for business ${session.businessId}`);
                        }
                    } catch (igError) {
                        console.error('[SOCKET] Error sending Instagram message:', igError);
                    }
                }

                // Make sure admin is in the session room
                socket.join(sessionId);

                // Broadcast to OTHER admins only (sender already has the message from API response)
                // Use socket.to() to exclude sender
                const messageData = {
                    sessionId,
                    role: 'admin',
                    text: message,
                    timestamp: timestamp.toISOString(),
                    adminId,
                };
                
                // Broadcast to session room (other admins viewing this session)
                socket.to(sessionId).emit('new-message', messageData);
                
                // Notify other admins in the admin list
                socket.to('admins').emit('session-updated', {
                    sessionId,
                    message: { role: 'admin', text: message, timestamp: timestamp.toISOString(), adminId },
                });
                
                console.log(`[SOCKET] Admin message broadcast complete for ${sessionId}`);
            } catch (error) {
                console.error('[SOCKET] Error handling admin message:', error);
            }
        });

        // Handle bot message
        socket.on('bot-message', async (data: { sessionId: string; message: string }) => {
            const { sessionId, message } = data;

            try {
                await connectDB();

                const session = await ChatSession.findOne({ sessionId });
                if (session && session.status === 'active') {
                    const timestamp = new Date();
                    session.messages.push({
                        role: 'bot',
                        text: message,
                        timestamp,
                    });
                    session.lastActivityAt = timestamp;
                    await session.save();

                    // Broadcast to session room
                    io.to(sessionId).emit('new-message', {
                        sessionId,
                        role: 'bot',
                        text: message,
                        timestamp,
                    });

                    // Notify admins
                    io.to('admins').emit('session-updated', {
                        sessionId,
                        message: { role: 'bot', text: message, timestamp },
                    });
                }
            } catch (error) {
                console.error('Error saving bot message:', error);
            }
        });

        // Handle session takeover
        socket.on('takeover-session', async (data: { sessionId: string; adminId: string }) => {
            const { sessionId, adminId } = data;
            console.log(`Admin ${adminId} taking over session ${sessionId}`);

            try {
                await connectDB();

                const session = await ChatSession.findOne({ sessionId });
                if (session && session.status !== 'closed') {
                    session.status = 'taken_over';
                    session.takenOverBy = adminId;
                    session.takenOverAt = new Date();
                    await session.save();

                    // Join the admin to the session room
                    socket.join(sessionId);
                    socket.join('admins');
                    console.log(`Admin ${adminId} joined rooms: ${sessionId} and admins`);

                    // Notify session
                    io.to(sessionId).emit('session-taken-over', { adminId });

                    // Notify admins
                    io.to('admins').emit('session-taken-over', { sessionId, adminId });
                } else if (session && session.status === 'closed') {
                    // Reopen closed session
                    session.status = 'taken_over';
                    session.takenOverBy = adminId;
                    session.takenOverAt = new Date();
                    await session.save();

                    socket.join(sessionId);
                    socket.join('admins');
                    console.log(`Admin ${adminId} reopened and took over session ${sessionId}`);

                    io.to(sessionId).emit('session-taken-over', { adminId });
                    io.to('admins').emit('session-taken-over', { sessionId, adminId });
                }
            } catch (error) {
                console.error('Error taking over session:', error);
            }
        });

        // Handle session close
        socket.on('close-session', async (data: { sessionId: string }) => {
            const { sessionId } = data;
            console.log(`Closing session ${sessionId}`);

            try {
                await connectDB();

                const session = await ChatSession.findOne({ sessionId });
                if (session) {
                    session.status = 'closed';
                    session.takenOverBy = undefined;
                    session.takenOverAt = undefined;
                    await session.save();

                    // Notify the user that session is closed
                    io.to(sessionId).emit('session-closed');

                    // Notify admins
                    io.to('admins').emit('session-closed', { sessionId });
                    console.log(`Session ${sessionId} closed and notifications sent`);
                }
            } catch (error) {
                console.error('Error closing session:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Socket.IO server running on path: /api/socket`);
    });
});
