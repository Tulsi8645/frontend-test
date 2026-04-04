import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

/**
 * GET /api/admin/facebook/diagnostic
 * Check if the Facebook integration for the current business is correctly set up
 */
export async function GET(req: NextRequest) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        if (!session.businessId) {
            return NextResponse.json({ error: 'No business associated with account' }, { status: 400 });
        }

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        const creds = business.facebookCredentials;
        if (!creds || !creds.pageId || !creds.pageAccessToken) {
            return NextResponse.json({ 
                status: 'incomplete', 
                message: 'Facebook credentials are not fully configured in settings.' 
            });
        }

        // 1. Verify Page Access Token & Permissions
        const debugResponse = await fetch(
            `https://graph.facebook.com/v18.0/debug_token?input_token=${creds.pageAccessToken}&access_token=${creds.pageAccessToken}`
        );
        await debugResponse.json(); // Verify token is valid

        // 2. Check Page Subscription Status
        const subResponse = await fetch(
            `https://graph.facebook.com/v18.0/${creds.pageId}/subscribed_apps?access_token=${creds.pageAccessToken}`
        );
        const subData = await subResponse.json();

        // 3. Check Page Info
        const pageResponse = await fetch(
            `https://graph.facebook.com/v18.0/${creds.pageId}?fields=name,id&access_token=${creds.pageAccessToken}`
        );
        const pageData = await pageResponse.json();

        interface FacebookAppSubscription {
            id: string;
            name: string;
        }

        return NextResponse.json({
            status: 'success',
            configuration: {
                pageId: creds.pageId,
                enabled: creds.enabled,
                hasVerifyToken: !!creds.verifyToken,
                hasAccessToken: !!creds.pageAccessToken
            },
            facebookData: {
                pageName: pageData.name || 'Unknown',
                pageIdMatch: pageData.id === creds.pageId,
                isSubscribed: subData.data?.some((app: FacebookAppSubscription) => app.id === process.env.FACEBOOK_APP_ID) || 'Check Meta Dashboard',
                rawSubscriptions: subData.data || []
            },
            recommendations: [
                !creds.enabled ? 'Enable Facebook in settings.' : null,
                !subData.data?.length ? 'Visit Meta Dashboard -> Messenger -> Settings and ensure the Page is Subscribed to the App.' : null,
            ].filter(Boolean)
        });
    } catch (error) {
        console.error('Facebook diagnostic error:', error);
        return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 });
    }
}
