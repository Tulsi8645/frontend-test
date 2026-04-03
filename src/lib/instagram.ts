/**
 * Instagram Messaging API Client
 * Uses Facebook Graph API (Meta Business Platform) for Instagram messaging
 * 
 * Note: Instagram messaging requires:
 * - Instagram Business/Creator account connected to a Facebook Page
 * - Facebook Page with Instagram connected
 * - Same permissions as Facebook Messenger
 */

const INSTAGRAM_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN || ''; // Reuses same token as Facebook
const INSTAGRAM_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';

const GRAPH_API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface InstagramMessage {
    from: { id: string; username?: string };
    id: string;
    text?: string;
    timestamp: number;
}

interface InstagramWebhookEntry {
    id: string;
    time: number;
    messaging?: InstagramMessageData[];
    standby?: InstagramMessageData[];
}

interface InstagramMessageData {
    sender: { id: string };
    recipient: { id: string };
    timestamp: number;
    message?: {
        mid: string;
        text: string;
        quick_reply?: { payload: string };
    };
    postback?: {
        mid: string;
        payload: string;
        title?: string;
    };
}

interface InstagramWebhookBody {
    object: 'instagram';
    entry: InstagramWebhookEntry[];
}

/**
 * Send Instagram message via Facebook Graph API (multi-tenant)
 */
export async function sendInstagramMessage(
    recipientId: string, 
    text: string, 
    accessToken: string
): Promise<boolean> {
    try {
        if (!accessToken) {
            console.error('Instagram access token not provided');
            return false;
        }

        const url = `${BASE_URL}/me/messages?access_token=${accessToken}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Instagram API error:', error);
            return false;
        }

        const data = await response.json();
        console.log('Instagram message sent:', data.message_id);
        return true;
    } catch (error) {
        console.error('Failed to send Instagram message:', error);
        return false;
    }
}

/**
 * Get Instagram user profile info (multi-tenant)
 */
export async function getInstagramUserProfile(
    userId: string, 
    accessToken: string
): Promise<{
    username?: string;
    profilePic?: string;
    name?: string;
} | null> {
    try {
        if (!accessToken) {
            return null;
        }

        const url = `${BASE_URL}/${userId}?fields=username,profile_pic,name&access_token=${accessToken}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Failed to fetch Instagram profile:', await response.json());
            return null;
        }

        const data = await response.json();
        return {
            username: data.username,
            profilePic: data.profile_pic,
            name: data.name,
        };
    } catch (error) {
        console.error('Error fetching Instagram profile:', error);
        return null;
    }
}

/**
 * Verify Instagram webhook (same as Facebook)
 */
export function verifyInstagramWebhook(
    mode: string,
    token: string,
    challenge: string,
    verifyToken: string
): { success: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === verifyToken) {
        console.log('Instagram webhook verified');
        return { success: true, challenge };
    }
    return { success: false };
}

/**
 * Parse Instagram webhook payload
 */
export function parseInstagramWebhook(body: InstagramWebhookBody): {
    senderId: string;
    text: string;
    messageId: string;
    timestamp: number;
    username?: string;
    accountId: string;
}[] {
    const messages: {
        senderId: string;
        text: string;
        messageId: string;
        timestamp: number;
        username?: string;
        accountId: string;
    }[] = [];

    if (body.object !== 'instagram') {
        return messages;
    }

    for (const entry of body.entry) {
        const messaging = entry.messaging || entry.standby || [];
        const accountId = entry.id; // Instagram account ID from entry
        
        for (const event of messaging) {
            // Handle text messages
            if (event.message && event.message.text) {
                messages.push({
                    senderId: event.sender.id,
                    text: event.message.text,
                    messageId: event.message.mid,
                    timestamp: event.timestamp,
                    accountId,
                });
            }
            
            // Handle postback (quick reply/button clicks)
            if (event.postback && event.postback.payload) {
                messages.push({
                    senderId: event.sender.id,
                    text: event.postback.payload,
                    messageId: event.postback.mid,
                    timestamp: event.timestamp,
                    accountId,
                });
            }
        }
    }

    return messages;
}

/**
 * Verify webhook signature for security
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
    if (!INSTAGRAM_APP_SECRET) {
        console.warn('INSTAGRAM_APP_SECRET not set, skipping signature verification');
        return true;
    }

    try {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', INSTAGRAM_APP_SECRET)
            .update(body, 'utf8')
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(`sha256=${expectedSignature}`)
        );
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

export {
    INSTAGRAM_ACCESS_TOKEN,
    INSTAGRAM_APP_SECRET,
};

export type {
    InstagramWebhookBody,
    InstagramMessageData,
    InstagramWebhookEntry,
};
