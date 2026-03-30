import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// POST /api/admin/business/regenerate-api-keys - Regenerate API credentials
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

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Generate new API credentials
        const credentials = business.regenerateApiCredentials();
        await business.save();

        return NextResponse.json({
            success: true,
            message: 'API credentials regenerated successfully',
            apiKey: credentials.apiKey,
            apiSecret: credentials.apiSecret,
        });
    } catch (error) {
        console.error('Error regenerating API keys:', error);
        return NextResponse.json(
            { error: 'Failed to regenerate API keys' },
            { status: 500 }
        );
    }
}
