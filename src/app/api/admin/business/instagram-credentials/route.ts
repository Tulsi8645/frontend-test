import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/business/instagram-credentials - Get Instagram credentials
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
        const credentials = business.instagramCredentials || {
            instagramAccountId: '',
            enabled: false,
        };

        return NextResponse.json({
            credentials: {
                instagramAccountId: credentials.instagramAccountId || '',
                enabled: credentials.enabled || false,
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/instagram`,
        });
    } catch (error) {
        console.error('Error fetching Instagram credentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch Instagram credentials' },
            { status: 500 }
        );
    }
}

// POST /api/admin/business/instagram-credentials - Save Instagram credentials
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
        const { instagramAccountId, enabled } = body;

        // Validate required fields
        if (enabled && !instagramAccountId) {
            return NextResponse.json(
                { error: 'Instagram Account ID is required when enabling Instagram' },
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

        // Update Instagram credentials
        business.instagramCredentials = {
            instagramAccountId: instagramAccountId || business.instagramCredentials?.instagramAccountId,
            enabled: enabled !== undefined ? enabled : business.instagramCredentials?.enabled,
        };

        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Instagram credentials updated successfully',
            credentials: {
                instagramAccountId: business.instagramCredentials.instagramAccountId,
                enabled: business.instagramCredentials.enabled,
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/instagram`,
        });
    } catch (error) {
        console.error('Error updating Instagram credentials:', error);
        return NextResponse.json(
            { error: 'Failed to update Instagram credentials' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/business/instagram-credentials - Remove Instagram credentials
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

        // Remove Instagram credentials
        business.instagramCredentials = undefined;
        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Instagram credentials removed successfully',
        });
    } catch (error) {
        console.error('Error removing Instagram credentials:', error);
        return NextResponse.json(
            { error: 'Failed to remove Instagram credentials' },
            { status: 500 }
        );
    }
}
