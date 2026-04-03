/**
 * WhatsApp Business API Client via Twilio
 * Handles sending messages through Twilio's WhatsApp API (multi-tenant)
 */

/**
 * Send WhatsApp message via Twilio using business credentials
 */
export async function sendWhatsAppMessage(
    to: string, 
    text: string, 
    accountSid: string,
    authToken: string,
    fromNumber: string
): Promise<boolean> {
    try {
        if (!accountSid || !authToken || !fromNumber) {
            console.error('Twilio credentials not provided');
            return false;
        }

        // Format phone number (ensure it has whatsapp: prefix)
        const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        const formattedFromNumber = fromNumber.startsWith('whatsapp:') 
            ? fromNumber 
            : `whatsapp:${fromNumber}`;

        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                To: toNumber,
                From: formattedFromNumber,
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
    To: string;    // Format: whatsapp:+1234567890 (destination number)
    From: string;  // Format: whatsapp:+1234567890 (source number)
    NumSegments: string;
    ReferralNumMedia: string;
    MessageSid: string;
    AccountSid: string;
    ApiVersion: string;
}

/**
 * Parse Twilio webhook body
 */
export function parseTwilioWebhook(body: TwilioWebhookBody): {
    from: string;
    to: string;
    text: string;
    profileName: string;
    timestamp: number;
} {
    return {
        from: body.From.replace('whatsapp:', ''),
        to: body.To.replace('whatsapp:', ''),
        text: body.Body,
        profileName: body.ProfileName || 'WhatsApp User',
        timestamp: Date.now(),
    };
}
