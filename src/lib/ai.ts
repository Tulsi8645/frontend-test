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
        const apiKeys = [
            process.env.GEMINI_API_KEY1,
            process.env.GEMINI_API_KEY2,
            process.env.GEMINI_API_KEY
        ].filter(Boolean) as string[];

        if (apiKeys.length === 0) {
            console.error('No GEMINI_API_KEY is defined');
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

        let responseText = null;
        
        // Loop through keys and fallback if one fails
        for (let i = 0; i < apiKeys.length; i++) {
            try {
                const ai = new GoogleGenAI(apiKeys[i] as any);
                const response = await (ai as any).models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: prompt,
                });
                
                if (response?.text) {
                    responseText = response.text;
                    break; // Success! break the fallback loop
                }
            } catch (error) {
                console.warn(`API Key ${i + 1} failed:`, error instanceof Error ? error.message : 'Unknown error');
                if (i === apiKeys.length - 1) {
                    throw new Error("All provided Gemini API keys failed.");
                }
            }
        }

        return responseText || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error('AI Generation Error:', error);
        return null;
    }
}
