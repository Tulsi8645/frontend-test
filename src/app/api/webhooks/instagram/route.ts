import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Business from '@/models/Business';
import { 
    verifyInstagramWebhook, 
    parseInstagramWebhook, 
    sendInstagramMessage,
    getInstagramUserProfile,
} from '@/lib/instagram';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';

/**
 * GET /api/webhooks/instagram
 * Instagram webhook verification - multi-tenancy only
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('Instagram webhook verification:', { mode, token: token ? '***' : null, challenge });

    if (!mode || !token || !challenge) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();
    
    // Find business by verify token (Instagram uses same verify token as Facebook)
    const business = await Business.findOne({
        'facebookCredentials.verifyToken': token,
        'instagramCredentials.enabled': true
    });
    
    if (!business) {
        console.error('No business found with matching verify token for Instagram');
        return NextResponse.json({ error: 'Verification failed - no matching business' }, { status: 403 });
    }

    const verifyToken = business.facebookCredentials?.verifyToken;
    
    if (!verifyToken) {
        console.error('Business has no verify token configured');
        return NextResponse.json({ error: 'Verification failed - no verify token' }, { status: 403 });
    }
    
    const result = verifyInstagramWebhook(mode, token, challenge, verifyToken);
    if (result.success) {
        console.log('Instagram webhook verified successfully for business:', business._id.toString());
        return new NextResponse(result.challenge, { status: 200 });
    }

    console.error('Instagram webhook verification failed');
    return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/**
 * POST /api/webhooks/instagram
 * Receive messages from Instagram - multi-tenancy only
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
            // Find business by Instagram account ID
            const business = await Business.findOne({
                'instagramCredentials.instagramAccountId': msg.accountId,
                'instagramCredentials.enabled': true
            });

            if (!business) {
                console.error(`No business found for Instagram account: ${msg.accountId}, skipping message`);
                continue;
            }

            await handleInstagramMessage(
                msg.senderId, 
                msg.text,
                business._id.toString(),
                business.facebookCredentials?.pageAccessToken || ''
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Instagram webhook error:', error);
        return NextResponse.json({ success: true }); // Return 200 to prevent Instagram from retrying
    }
}

/**
 * Handle incoming Instagram message (multi-tenant mode only)
 */
async function handleInstagramMessage(
    senderId: string, 
    text: string, 
    businessId: string,
    accessToken: string
) {
    try {
        // Get user profile using business's access token
        const profile = await getInstagramUserProfile(senderId, accessToken);
        
        // Find or create session for this Instagram user (scoped to business)
        const sessionId = `ig_${businessId}_${senderId}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Create new session
            session = new ChatSession({
                sessionId,
                channel: 'instagram',
                externalId: senderId,
                businessId,  // Associate with business
                status: 'active',
                messages: [],
                userInfo: {
                    name: profile?.username || profile?.name || 'Instagram User',
                    profilePic: profile?.profilePic,
                },
            });
            console.log('Created new Instagram session:', sessionId, 'for user:', profile?.username || 'unknown', 'business:', businessId);
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to(`business:${businessId}`).emit('session-created', {
                    sessionId,
                    channel: 'instagram',
                    userName: profile?.username || profile?.name || 'Instagram User',
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
            io.to(`business:${businessId}`).emit('session-updated', {
                sessionId,
                message: { role: 'user', text, timestamp },
                businessId,
            });
        }

        // If session is taken over, don't send AI response
        if (session.status === 'taken_over') {
            console.log('Instagram session taken over, waiting for admin response');
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

            // Send to Instagram using business's access token
            await sendInstagramMessage(senderId, aiResponse, accessToken);

            // Notify admins
            if (io) {
                io.to(`business:${businessId}`).emit('session-updated', {
                    sessionId,
                    message: { role: 'bot', text: aiResponse, timestamp: botTimestamp },
                    businessId,
                });
            }
        }
    } catch (error) {
        console.error('Error handling Instagram message:', error);
    }
}
