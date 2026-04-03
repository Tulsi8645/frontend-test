import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Business from '@/models/Business';
import { 
    sendFacebookMessage, 
    getFacebookUserProfile, 
    parseWebhookMessages, 
    VERIFY_TOKEN as FALLBACK_VERIFY_TOKEN
} from '@/lib/facebook';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';

/**
 * GET /api/webhooks/facebook?businessId=xxx
 * Facebook webhook verification endpoint - supports multi-tenancy
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    const businessId = searchParams.get('businessId');

    console.log('Facebook webhook verification:', { mode, token: token ? '***' : null, challenge, businessId });

    // Verify the webhook
    if (mode === 'subscribe' && token && challenge) {
        await connectDB();
        
        let verifyToken = FALLBACK_VERIFY_TOKEN;
        
        // If businessId provided, use that business's verify token
        if (businessId) {
            const business = await Business.findById(businessId);
            if (business?.facebookCredentials?.verifyToken) {
                verifyToken = business.facebookCredentials.verifyToken;
            }
        } else {
            // Try to find business by verify token
            const business = await Business.findOne({
                'facebookCredentials.verifyToken': token,
                'facebookCredentials.enabled': true
            });
            if (business) {
                verifyToken = business.facebookCredentials?.verifyToken || FALLBACK_VERIFY_TOKEN;
            }
        }

        if (token === verifyToken) {
            console.log('Facebook webhook verified successfully');
            return new NextResponse(challenge, { status: 200 });
        }
    }

    console.error('Facebook webhook verification failed: token mismatch');
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
            // Find business by pageId
            const business = await Business.findOne({
                'facebookCredentials.pageId': msg.pageId,
                'facebookCredentials.enabled': true
            });

            if (!business) {
                console.error(`No business found for pageId: ${msg.pageId}, using legacy mode`);
                // Fallback to legacy mode (single-tenant)
                await handleFacebookMessageLegacy(msg.pageId, msg.senderId, msg.text);
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
 * Handle incoming Facebook message (multi-tenant mode)
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
                businessId,  // Associate with business
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
                io.to(`business:${businessId}`).emit('session-created', {
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
            io.to(`business:${businessId}`).emit('session-updated', {
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
                io.to(`business:${businessId}`).emit('session-updated', {
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

/**
 * Legacy handler for single-tenant mode (fallback)
 */
async function handleFacebookMessageLegacy(pageId: string, senderId: string, text: string) {
    try {
        const sessionId = `fb_${pageId}_${senderId}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            const profile = await getFacebookUserProfile(senderId);
            
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
            console.log('Created new Facebook session (legacy):', sessionId);
            
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'facebook',
                    userName: profile?.name || 'Facebook User',
                });
            }
        }

        const timestamp = new Date();
        session.messages.push({
            role: 'user',
            text,
            timestamp,
        });
        session.lastActivityAt = timestamp;
        await session.save();

        const io = getSocketInstance();
        if (io) {
            io.to('admins').emit('session-updated', {
                sessionId,
                message: { role: 'user', text, timestamp },
            });
        }

        if (session.status === 'taken_over') {
            return;
        }

        const chatHistory = session.messages.map((m: IChatMessage) => ({
            role: m.role === 'admin' ? 'user' : m.role,
            text: m.text,
        }));

        const aiResponse = await generateAIResponse(text, chatHistory);

        if (aiResponse) {
            const botTimestamp = new Date();
            session.messages.push({
                role: 'bot',
                text: aiResponse,
                timestamp: botTimestamp,
            });
            session.lastActivityAt = botTimestamp;
            await session.save();

            await sendFacebookMessage(senderId, aiResponse);

            if (io) {
                io.to('admins').emit('session-updated', {
                    sessionId,
                    message: { role: 'bot', text: aiResponse, timestamp: botTimestamp },
                });
            }
        }
    } catch (error) {
        console.error('Error handling Facebook message (legacy):', error);
    }
}
