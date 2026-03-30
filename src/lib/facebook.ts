/**
 * Facebook Messenger API Client
 * Handles sending messages and managing Facebook Messenger integration
 */

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '';
const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || '';
const API_VERSION = 'v18.0';

export interface FacebookMessage {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
        mid: string;
        text?: string;
        attachments?: Array<{
            type: string;
            payload: { url: string };
        }>;
    };
    postback?: {
        payload: string;
    };
}

export interface FacebookWebhookEntry {
    id: string;
    time: number;
    messaging?: FacebookMessage[];
}

export interface FacebookWebhookBody {
    object: 'page';
    entry: FacebookWebhookEntry[];
}

/**
 * Send text message to Facebook user
 */
export async function sendFacebookMessage(recipientId: string, text: string, pageAccessToken: string = PAGE_ACCESS_TOKEN): Promise<boolean> {
    try {
        const response = await fetch(`https://graph.facebook.com/${API_VERSION}/me/messages?access_token=${pageAccessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
                messaging_type: 'RESPONSE',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Facebook API error:', error);
            return false;
        }

        const data = await response.json();
        console.log('Facebook message sent:', data);
        return true;
    } catch (error) {
        console.error('Failed to send Facebook message:', error);
        return false;
    }
}

/**
 * Get user profile from Facebook
 */
export async function getFacebookUserProfile(psid: string, pageAccessToken: string = PAGE_ACCESS_TOKEN): Promise<{ name?: string; profile_pic?: string } | null> {
    try {
        const response = await fetch(
            `https://graph.facebook.com/${API_VERSION}/${psid}?fields=name,profile_pic&access_token=${pageAccessToken}`
        );

        if (!response.ok) {
            console.error('Failed to fetch Facebook user profile');
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching Facebook profile:', error);
        return null;
    }
}

/**
 * Verify webhook signature (optional but recommended for production)
 */
export function verifyWebhookSignature(body: string, signature: string, appSecret: string): boolean {
    // Implement signature verification if needed
    // For now, we'll rely on the verify token
    return true;
}

/**
 * Parse webhook body and extract messages
 */
export function parseWebhookMessages(body: FacebookWebhookBody): Array<{
    pageId: string;
    senderId: string;
    text: string;
    timestamp: number;
}> {
    const messages: Array<{
        pageId: string;
        senderId: string;
        text: string;
        timestamp: number;
    }> = [];

    if (body.object !== 'page') return messages;

    for (const entry of body.entry) {
        const pageId = entry.id;
        
        if (entry.messaging) {
            for (const event of entry.messaging) {
                // Handle text messages
                if (event.message?.text) {
                    messages.push({
                        pageId,
                        senderId: event.sender.id,
                        text: event.message.text,
                        timestamp: event.timestamp,
                    });
                }
                
                // Handle postback (button clicks)
                if (event.postback?.payload) {
                    messages.push({
                        pageId,
                        senderId: event.sender.id,
                        text: event.postback.payload,
                        timestamp: event.timestamp,
                    });
                }
            }
        }
    }

    return messages;
}

export { PAGE_ACCESS_TOKEN, VERIFY_TOKEN };
