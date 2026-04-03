import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/business/facebook-credentials - Get Facebook credentials
export async function GET(req: NextRequest) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        if (!session.businessId) {
            return NextResponse.json(
                { error: 'No business associated with this account' },
                { status: 404 }
            );
        }

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Return credentials without sensitive data
        const credentials = business.facebookCredentials || {
            pageId: '',
            enabled: false,
            verifyToken: '',
        };

        return NextResponse.json({
            credentials: {
                pageId: credentials.pageId || '',
                enabled: credentials.enabled || false,
                verifyToken: credentials.verifyToken || '',
                // Don't return pageAccessToken for security
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/facebook`,
        });
    } catch (error) {
        console.error('Error fetching Facebook credentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Facebook credentials' },
            { status: 500 }
        );
    }
}

// POST /api/admin/business/facebook-credentials - Save Facebook credentials
export async function POST(req: NextRequest) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        if (!session.businessId) {
            return NextResponse.json(
                { error: 'No business associated with this account' },
                { status: 404 }
            );
        }

        const body = await req.json();
        const { pageId, pageAccessToken, verifyToken, enabled } = body;

        // Validate required fields
        if (enabled && (!pageId || !pageAccessToken || !verifyToken)) {
            return NextResponse.json(
                { error: 'Page ID, Access Token, and Verify Token are required when enabling Facebook' },
                { status: 400 }
            );
        }

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Update Facebook credentials
        business.facebookCredentials = {
            pageId: pageId || business.facebookCredentials?.pageId,
            pageAccessToken: pageAccessToken || business.facebookCredentials?.pageAccessToken,
            verifyToken: verifyToken || business.facebookCredentials?.verifyToken,
            enabled: enabled !== undefined ? enabled : business.facebookCredentials?.enabled,
        };

        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Facebook credentials updated successfully',
            credentials: {
                pageId: business.facebookCredentials.pageId,
                enabled: business.facebookCredentials.enabled,
                verifyToken: business.facebookCredentials.verifyToken,
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/facebook`,
        });
    } catch (error) {
        console.error('Error updating Facebook credentials:', error);
        return NextResponse.json(
            { error: 'Failed to update Facebook credentials' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/business/facebook-credentials - Remove Facebook credentials
export async function DELETE(req: NextRequest) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        if (!session.businessId) {
            return NextResponse.json(
                { error: 'No business associated with this account' },
                { status: 404 }
            );
        }

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Remove Facebook credentials
        business.facebookCredentials = undefined;
        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Facebook credentials removed successfully',
        });
    } catch (error) {
        console.error('Error removing Facebook credentials:', error);
        return NextResponse.json(
            { error: 'Failed to remove Facebook credentials' },
            { status: 500 }
        );
    }
}
