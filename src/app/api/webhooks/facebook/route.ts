import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Business from '@/models/Business';
import { 
    sendFacebookMessage, 
    getFacebookUserProfile, 
    parseWebhookMessages
} from '@/lib/facebook';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';
import mongoose from 'mongoose';

/**
 * GET /api/webhooks/facebook
 * Facebook webhook verification endpoint - multi-tenancy only
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('Facebook webhook verification:', { mode, token: token ? '***' : null, challenge });

    if (mode !== 'subscribe' || !token || !challenge) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();
    
    // Find business by verify token (allow verification even if not enabled yet)
    const business = await Business.findOne({
        'facebookCredentials.verifyToken': token
    });
    
    if (!business) {
        console.error('No business found with matching verify token');
        return NextResponse.json({ error: 'Verification failed - no matching business' }, { status: 403 });
    }

    const verifyToken = business.facebookCredentials?.verifyToken;

    if (token === verifyToken) {
        console.log('Facebook webhook verified successfully for business:', business._id.toString());
        return new NextResponse(challenge, { status: 200 });
    }

    console.error('Facebook webhook verification failed: token mismatch');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/facebook
 * Receive messages from Facebook Messenger - multi-tenancy only
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Facebook webhook received:', JSON.stringify(body, null, 2));

        await connectDB();

        // Parse messages from webhook
        const messages = parseWebhookMessages(body);

        for (const msg of messages) {
            // Find business by pageId
            const business = await Business.findOne({
                'facebookCredentials.pageId': msg.pageId
            });

            if (!business) {
                console.error(`No business found for pageId: ${msg.pageId}, skipping message`);
                continue;
            }

            await handleFacebookMessage(
                msg.pageId, 
                msg.senderId, 
                msg.text, 
                business._id.toString(),
                business.facebookCredentials?.pageAccessToken || ''
            );
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
 * Handle incoming Facebook message (multi-tenant mode only)
 */
async function handleFacebookMessage(
    pageId: string, 
    senderId: string, 
    text: string, 
    businessId: string,
    pageAccessToken: string
) {
    try {
        // Find or create session for this Facebook user (scoped to business)
        const sessionId = `fb_${businessId}_${pageId}_${senderId}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Get user profile for name
            const profile = await getFacebookUserProfile(senderId, pageAccessToken);
            
            // Create new session
            session = new ChatSession({
                sessionId,
                channel: 'facebook',
                externalId: senderId,
                pageId,
                businessId: new mongoose.Types.ObjectId(businessId),  // Associate with business
                status: 'active',
                messages: [],
                userInfo: {
                    name: profile?.name || 'Facebook User',
                },
            });
            console.log('Created new Facebook session:', sessionId, 'for business:', businessId);
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'facebook',
                    userName: profile?.name || 'Facebook User',
                    businessId,
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

        // Notify admins via socket (scoped to business)
        const io = getSocketInstance();
        if (io) {
            io.to('admins').emit('session-updated', {
                sessionId,
                message: { role: 'user', text, timestamp },
                businessId,
            });
        }

        // If session is taken over, don't send AI response
        if (session.status === 'taken_over') {
            console.log('Session taken over, waiting for admin response');
            return;
        }

        // Generate AI response (with business context)
        const chatHistory = session.messages.map((m: IChatMessage) => ({
            role: m.role === 'admin' ? 'user' : m.role,
            text: m.text,
        }));

        const aiResponse = await generateAIResponse(text, chatHistory, businessId);

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
            await sendFacebookMessage(senderId, aiResponse, pageAccessToken);

            // Notify admins
            if (io) {
                io.to('admins').emit('session-updated', {
                    sessionId,
                    message: { role: 'bot', text: aiResponse, timestamp: botTimestamp },
                    businessId,
                });
            }
        }
    } catch (error) {
        console.error('Error handling Facebook message:', error);
    }
}
