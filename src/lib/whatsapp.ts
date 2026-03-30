/**
 * WhatsApp Business API Client via Twilio
 * Handles sending messages through Twilio's WhatsApp API
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || ''; // Format: whatsapp:+1234567890

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
    try {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
            console.error('Twilio credentials not configured');
            return false;
        }

        // Format phone number (ensure it has whatsapp: prefix)
        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        const fromNumber = TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') 
            ? TWILIO_WHATSAPP_NUMBER 
            : `whatsapp:${TWILIO_WHATSAPP_NUMBER}`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: toNumber,
                From: fromNumber,
                Body: text,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Twilio API error:', error);
            return false;
        }

        const data = await response.json();
        console.log('WhatsApp message sent:', data.sid);
        return true;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        return false;
    }
}

export interface TwilioWebhookBody {
    SmsMessageSid: string;
    NumMedia: string;
    ProfileName: string;
    MessageType: string;
    SmsSid: string;
    WaId: string;  // WhatsApp ID (phone number)
    SmsStatus: string;
    Body: string;
    To: string;
    NumSegments: string;
    ReferralNumMedia: string;
    MessageSid: string;
    AccountSid: string;
    From: string;  // Format: whatsapp:+1234567890
    ApiVersion: string;
}

/**
 * Parse Twilio webhook body
 */
export function parseTwilioWebhook(body: TwilioWebhookBody): {
    from: string;
    text: string;
    profileName: string;
    timestamp: number;
} {
    return {
        from: body.From.replace('whatsapp:', ''),
        text: body.Body,
        profileName: body.ProfileName || 'WhatsApp User',
        timestamp: Date.now(),
    };
}

export { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER };
