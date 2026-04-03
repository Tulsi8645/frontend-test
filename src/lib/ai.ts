import { GoogleGenAI } from '@google/genai';
import Knowledge, { knowledgeToJSONFormat } from '@/models/Knowledge';

interface ChatMessage {
    role: 'user' | 'bot';
    text: string;
}

/**
 * Generate AI response using Gemini
 * Supports multi-tenancy with business-specific knowledge
 */
export async function generateAIResponse(
    message: string,
    chatHistory: ChatMessage[],
    businessId?: string
): Promise<string | null> {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY is not defined');
            return null;
        }

        // Fetch knowledge for AI response (business-specific if businessId provided)
        const knowledgeQuery = businessId ? { businessId, isActive: true } : { isActive: true };
        const knowledgeEntries = await Knowledge.find(knowledgeQuery).sort({ priority: -1 });
        const knowledge = knowledgeToJSONFormat(knowledgeEntries);

        // Build conversation context
        const historyContext = chatHistory
            .map(m => `${m.role === 'user' ? 'Customer' : 'Assistant'}: ${m.text}`)
            .join('\n');

        const prompt = `
You are the assistant of ${knowledge.shop_name || 'Matt Repair Shop'}.
Answer politely, clearly, and briefly.

Here is the shop information:
${JSON.stringify(knowledge, null, 2)}

${historyContext ? `Previous conversation:\n${historyContext}\n\n` : ''}Customer question:
${message}
`;

        const ai = new GoogleGenAI(apiKey as any);

        const response = await (ai as any).models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });

        return response.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('AI Generation Error:', error);
        return null;
    }
}
