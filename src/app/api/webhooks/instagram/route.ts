import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { 
    verifyInstagramWebhook, 
    parseInstagramWebhook, 
    sendInstagramMessage,
    getInstagramUserProfile,
    INSTAGRAM_ACCESS_TOKEN,
} from '@/lib/instagram';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';

const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || ''; // Reuses same token as Facebook

/**
 * GET /api/webhooks/instagram
 * Instagram webhook verification
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('Instagram webhook verification:', { mode, token, challenge });

    if (mode && token && challenge) {
        const result = verifyInstagramWebhook(mode, token, challenge, VERIFY_TOKEN);
        if (result.success) {
            return new NextResponse(result.challenge, { status: 200 });
        }
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/instagram
 * Receive messages from Instagram
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        console.log('Instagram webhook received:', JSON.stringify(body, null, 2));

        // Parse webhook payload
        const messages = parseInstagramWebhook(body);

        if (messages.length === 0) {
            console.log('No messages found in webhook');
            return NextResponse.json({ success: true, message: 'No messages to process' });
        }

        await connectDB();

        // Process each message
        for (const msg of messages) {
            await handleInstagramMessage(msg.senderId, msg.text);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Instagram webhook error:', error);
        return NextResponse.json({ success: true }); // Return 200 to prevent Instagram from retrying
    }
}

/**
 * Handle incoming Instagram message
 */
async function handleInstagramMessage(senderId: string, text: string) {
    try {
        // Get user profile
        const profile = await getInstagramUserProfile(senderId);
        
        // Find or create session for this Instagram user
        const sessionId = `ig_${senderId}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Create new session
            session = new ChatSession({
                sessionId,
                channel: 'instagram',
                externalId: senderId,
                status: 'active',
                messages: [],
                userInfo: {
                    name: profile?.username || profile?.name || 'Instagram User',
                    profilePic: profile?.profilePic,
                },
            });
            console.log('Created new Instagram session:', sessionId, 'for user:', profile?.username || 'unknown');
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'instagram',
                    userName: profile?.username || profile?.name || 'Instagram User',
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
            console.log('Instagram session taken over, waiting for admin response');
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

            // Send to Instagram
            await sendInstagramMessage(senderId, aiResponse);

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
        console.error('Error handling Instagram message:', error);
    }
}
