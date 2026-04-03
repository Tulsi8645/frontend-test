import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import Business from '@/models/Business';
import { 
    sendWhatsAppMessage, 
    parseTwilioWebhook,
    TwilioWebhookBody 
} from '@/lib/whatsapp';
import { generateAIResponse } from '@/lib/ai';
import { getSocketInstance } from '@/lib/socket';
import { IChatMessage } from '@/models/ChatSession';

/**
 * POST /api/webhooks/whatsapp
 * Receive messages from WhatsApp via Twilio
 * Supports multi-tenancy by looking up business via phone number
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.formData();
        
        // Convert FormData to object
        const data: Record<string, string> = {};
        body.forEach((value, key) => {
            data[key] = value.toString();
        });

        console.log('WhatsApp webhook received:', data);

        const webhookData = data as unknown as TwilioWebhookBody;
        const { from, text, profileName, to } = parseTwilioWebhook(webhookData);

        await connectDB();

        // Find business by the destination phone number (Twilio number)
        const business = await Business.findOne({
            'whatsappCredentials.phoneNumberId': to,
            'whatsappCredentials.enabled': true
        });

        if (!business) {
            console.error(`No business found for Twilio number: ${to}, using legacy mode`);
            // Fallback to legacy mode
            await handleWhatsAppMessageLegacy(from, text, profileName);
        } else {
            await handleWhatsAppMessage(
                from, 
                text, 
                profileName,
                business._id.toString(),
                business.whatsappCredentials?.accessToken || ''
            );
        }

        // Return empty TwiML response (required by Twilio)
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { 
                status: 200, 
                headers: { 'Content-Type': 'application/xml' }
            }
        );
    } catch (error) {
        console.error('WhatsApp webhook error:', error);
        // Still return 200 to prevent Twilio from retrying
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
            { 
                status: 200, 
                headers: { 'Content-Type': 'application/xml' }
            }
        );
    }
}

/**
 * Handle incoming WhatsApp message (multi-tenant mode)
 */
async function handleWhatsAppMessage(
    phoneNumber: string, 
    text: string, 
    profileName: string,
    businessId: string,
    accessToken: string
) {
    try {
        // Find or create session for this WhatsApp user (scoped to business)
        const sessionId = `wa_${businessId}_${phoneNumber.replace(/\+/g, '')}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Create new session
            session = new ChatSession({
                sessionId,
                channel: 'whatsapp',
                externalId: phoneNumber,
                businessId,  // Associate with business
                status: 'active',
                messages: [],
                userInfo: {
                    name: profileName,
                },
            });
            console.log('Created new WhatsApp session:', sessionId, 'for business:', businessId);
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to(`business:${businessId}`).emit('session-created', {
                    sessionId,
                    channel: 'whatsapp',
                    userName: profileName,
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
            console.log('WhatsApp session taken over, waiting for admin response');
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

            // Send to WhatsApp using business credentials
            await sendWhatsAppMessage(phoneNumber, aiResponse);

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
        console.error('Error handling WhatsApp message:', error);
    }
}

/**
 * Legacy handler for single-tenant mode (fallback)
 */
async function handleWhatsAppMessageLegacy(phoneNumber: string, text: string, profileName: string) {
    try {
        const sessionId = `wa_${phoneNumber.replace(/\+/g, '')}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            session = new ChatSession({
                sessionId,
                channel: 'whatsapp',
                externalId: phoneNumber,
                status: 'active',
                messages: [],
                userInfo: {
                    name: profileName,
                },
            });
            console.log('Created new WhatsApp session (legacy):', sessionId);
            
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'whatsapp',
                    userName: profileName,
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
            console.log('WhatsApp session taken over, waiting for admin response');
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

            await sendWhatsAppMessage(phoneNumber, aiResponse);

            if (io) {
                io.to('admins').emit('session-updated', {
                    sessionId,
                    message: { role: 'bot', text: aiResponse, timestamp: botTimestamp },
                });
            }
        }
    } catch (error) {
        console.error('Error handling WhatsApp message (legacy):', error);
    }
}
