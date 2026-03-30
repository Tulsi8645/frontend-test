import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
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
        const { from, text, profileName } = parseTwilioWebhook(webhookData);

        await connectDB();

        // Handle the WhatsApp message
        await handleWhatsAppMessage(from, text, profileName);

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
 * Handle incoming WhatsApp message
 */
async function handleWhatsAppMessage(phoneNumber: string, text: string, profileName: string) {
    try {
        // Find or create session for this WhatsApp user
        const sessionId = `wa_${phoneNumber.replace(/\+/g, '')}`;
        
        let session = await ChatSession.findOne({ sessionId });
        
        if (!session) {
            // Create new session
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
            console.log('Created new WhatsApp session:', sessionId);
            
            // Emit session-created event for notifications
            const io = getSocketInstance();
            if (io) {
                io.to('admins').emit('session-created', {
                    sessionId,
                    channel: 'whatsapp',
                    userName: profileName,
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
            console.log('WhatsApp session taken over, waiting for admin response');
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

            // Send to WhatsApp
            await sendWhatsAppMessage(phoneNumber, aiResponse);

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
        console.error('Error handling WhatsApp message:', error);
    }
}
