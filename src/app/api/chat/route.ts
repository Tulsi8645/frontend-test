import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import connectDB from '@/lib/db';
import Knowledge, { knowledgeToJSONFormat } from '@/models/Knowledge';
import ChatSession from '@/models/ChatSession';
import { verifyApiKey, unauthorizedResponse } from '@/lib/auth';

// Handle explicit CORS Preflight for browsers embedding the ChatWidget across origins
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-API-Secret'
        }
    });
}

export async function POST(req: NextRequest) {
    try {
        // Authenticate the request using API key
        const authResult = await verifyApiKey(req);
        if (!authResult) {
            return unauthorizedResponse();
        }
        const { business } = authResult;

        // Check if business is verified and active
        if (business.status !== 'verified') {
            return NextResponse.json(
                { error: 'Business account is not verified or has been suspended' },
                { status: 403 }
            );
        }

        const { message, sessionId, noSave } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not defined');
            return NextResponse.json({ error: 'AI configuration error' }, { status: 500 });
        }

        // Connect to MongoDB
        await connectDB();

        // Find or create chat session (scoped to business)
        let chatSession = null;
        if (sessionId) {
            chatSession = await ChatSession.findOne({ sessionId, businessId: business._id });
        }

        // If session is taken over by admin, don't generate AI response
        if (chatSession && chatSession.status === 'taken_over') {
            // Store user message
            if (!noSave) {
                chatSession.messages.push({
                    role: 'user',
                    text: message,
                    timestamp: new Date(),
                });
                chatSession.lastActivityAt = new Date();
                await chatSession.save();
            }

            return NextResponse.json({
                reply: null,
                takenOver: true,
                sessionId: chatSession.sessionId,
                message: 'An admin has taken over this conversation. Please wait for their response.',
            });
        }

        // Fetch knowledge for this business (scoped to business)
        const knowledgeEntries = await Knowledge.find({ 
            businessId: business._id,
            isActive: true 
        }).sort({ priority: -1 });
        const knowledge = knowledgeToJSONFormat(knowledgeEntries);

        const prompt = `
            You are the assistant of ${knowledge.shop_name || business.name}.
            Answer politely, clearly, and briefly.

            Here is the shop information:
            ${JSON.stringify(knowledge, null, 2)}

            Customer question:
            ${message}
        `;
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
        });
        const aiReply = response.text || "Sorry, I couldn't generate a response.";

        // Store conversation if session exists
        if (chatSession && !noSave) {
            chatSession.messages.push(
                { role: 'user', text: message, timestamp: new Date() },
                { role: 'bot', text: aiReply, timestamp: new Date() }
            );
            chatSession.lastActivityAt = new Date();
            await chatSession.save();
        }

        return NextResponse.json({ reply: aiReply, sessionId: chatSession?.sessionId });
    } catch (error: unknown) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
    }
}

// GET /api/chat/session - Get or create a chat session
export async function GET(req: NextRequest) {
    try {
        // Authenticate the request using API key
        const authResult = await verifyApiKey(req);
        if (!authResult) {
            return unauthorizedResponse();
        }
        const { business } = authResult;

        // Check if business is verified and active
        if (business.status !== 'verified') {
            return NextResponse.json(
                { error: 'Business account is not verified or has been suspended' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('sessionId');

        await connectDB();

        let chatSession = null;
        if (sessionId) {
            chatSession = await ChatSession.findOne({ sessionId, businessId: business._id });
        }

        if (!chatSession) {
            // Create new session (scoped to business)
            const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            chatSession = await ChatSession.create({
                sessionId: newSessionId,
                businessId: business._id,
                status: 'active',
                messages: [],
                userInfo: {
                    userAgent: req.headers.get('user-agent') || '',
                    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                        req.headers.get('x-real-ip') || 
                        '',
                    referrer: req.headers.get('referer') || '',
                },
            });
        }

        return NextResponse.json({
            sessionId: chatSession.sessionId,
            status: chatSession.status,
            messages: chatSession.messages,
            takenOver: chatSession.status === 'taken_over',
        });
    } catch (error) {
        console.error('Session Error:', error);
        return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
    }
}
