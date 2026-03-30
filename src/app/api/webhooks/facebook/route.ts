import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { 
    sendFacebookMessage, 
    getFacebookUserProfile, 
    parseWebhookMessages, 
    VERIFY_TOKEN 
} from '@/lib/facebook';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';

/**
 * GET /api/webhooks/facebook
 * Facebook webhook verification endpoint
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    // Verify the webhook
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Facebook webhook verified');
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/facebook
 * Receive messages from Facebook Messenger
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Facebook webhook received:', JSON.stringify(body, null, 2));

        await connectDB();

        // Parse messages from webhook
        const messages = parseWebhookMessages(body);

        for (const msg of messages) {
            await handleFacebookMessage(msg.pageId, msg.senderId, msg.text);
        }

        // Must return 200 OK quickly to Facebook
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error('Facebook webhook error:', error);
        // Still return 200 to prevent Facebook from retrying
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

/**
 * Handle incoming Facebook message
 */
async function handleFacebookMessage(pageId: string, senderId: string, text: string) {
    try {
        // Find or create session for this Facebook user
        const sessionId = `fb_${pageId}_${senderId}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Get user profile for name
            const profile = await getFacebookUserProfile(senderId);
            
            // Create new session
            session = new ChatSession({
                sessionId,
                channel: 'facebook',
                externalId: senderId,
                pageId,
                status: 'active',
                messages: [],
                userInfo: {
                    name: profile?.name || 'Facebook User',
                },
            });
            console.log('Created new Facebook session:', sessionId);
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'facebook',
                    userName: profile?.name || 'Facebook User',
                });
            }
        }

        // Add user message
        const timestamp = new Date();
        session.messages.push({
            role: 'user',
            text,
            timestamp,
        });
        session.lastActivityAt = timestamp;
        await session.save();

        // Notify admins via socket
        const io = getSocketInstance();
        if (io) {
            io.to('admins').emit('session-updated', {
                sessionId,
                message: { role: 'user', text, timestamp },
            });
        }

        // If session is taken over, don't send AI response
        if (session.status === 'taken_over') {
            console.log('Session taken over, waiting for admin response');
            return;
        }

        // Generate AI response
        const chatHistory = session.messages.map((m: IChatMessage) => ({
            role: m.role === 'admin' ? 'user' : m.role,
            text: m.text,
        }));

        const aiResponse = await generateAIResponse(text, chatHistory);

        if (aiResponse) {
            // Add bot message to session
            const botTimestamp = new Date();
            session.messages.push({
                role: 'bot',
                text: aiResponse,
                timestamp: botTimestamp,
            });
            session.lastActivityAt = botTimestamp;
            await session.save();

            // Send to Facebook
            await sendFacebookMessage(senderId, aiResponse);

            // Notify admins
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-updated', {
                    sessionId,
                    message: { role: 'bot', text: aiResponse, timestamp: botTimestamp },
                });
            }
        }
    } catch (error) {
        console.error('Error handling Facebook message:', error);
    }
}
