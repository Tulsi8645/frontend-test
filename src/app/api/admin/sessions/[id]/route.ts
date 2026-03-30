import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/sessions/[id] - Get single session details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const chatSession = await ChatSession.findOne({ sessionId: id });
        if (!chatSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify the session belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (chatSession.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        return NextResponse.json({ session: chatSession });
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json(
            { error: 'Failed to fetch session' },
            { status: 500 }
        );
    }
}

// POST /api/admin/sessions/[id]/takeover - Take over a chat session
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const chatSession = await ChatSession.findOne({ sessionId: id });
        if (!chatSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify the session belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (chatSession.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        if (chatSession.status === 'closed') {
            // Allow taking over closed sessions - reopen them
            console.log(`Reopening closed session ${id}`);
        }

        if (chatSession.status === 'taken_over' && chatSession.takenOverBy !== session.userId) {
            return NextResponse.json(
                { error: 'Session is already taken over by another admin' },
                { status: 409 }
            );
        }

        // Allow reopening closed sessions
        chatSession.status = 'taken_over';
        chatSession.takenOverBy = session.userId;
        chatSession.takenOverAt = new Date();
        await chatSession.save();

        return NextResponse.json({
            success: true,
            message: 'Session taken over successfully',
            session: chatSession,
        });
    } catch (error) {
        console.error('Error taking over session:', error);
        return NextResponse.json(
            { error: 'Failed to take over session' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/sessions/[id]/message - Send message as admin
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        const { message } = await req.json();
        if (!message) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        await connectDB();
        const { id } = await params;

        const chatSession = await ChatSession.findOne({ sessionId: id });
        if (!chatSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify the session belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (chatSession.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        if (chatSession.status !== 'taken_over' || chatSession.takenOverBy !== session.userId) {
            return NextResponse.json(
                { error: 'You must take over the session first' },
                { status: 403 }
            );
        }

        chatSession.messages.push({
            role: 'admin',
            text: message,
            timestamp: new Date(),
            adminId: session.userId,
        });
        chatSession.lastActivityAt = new Date();
        await chatSession.save();

        return NextResponse.json({
            success: true,
            message: 'Message sent',
            session: chatSession,
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/sessions/[id] - Close a session
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const chatSession = await ChatSession.findOne({ sessionId: id });
        if (!chatSession) {
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        // Verify the session belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (chatSession.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        chatSession.status = 'closed';
        chatSession.takenOverBy = undefined;
        chatSession.takenOverAt = undefined;
        await chatSession.save();

        return NextResponse.json({
            success: true,
            message: 'Session closed',
            sessionId: id,
        });
    } catch (error) {
        console.error('Error closing session:', error);
        return NextResponse.json(
            { error: 'Failed to close session' },
            { status: 500 }
        );
    }
}
