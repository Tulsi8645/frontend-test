import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/business/whatsapp-credentials - Get WhatsApp credentials
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
        const credentials = business.whatsappCredentials || {
            phoneNumberId: '',
            wabaId: '',
            enabled: false,
        };

        return NextResponse.json({
            credentials: {
                phoneNumberId: credentials.phoneNumberId || '',
                wabaId: credentials.wabaId || '',
                enabled: credentials.enabled || false,
                // Don't return accessToken for security
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/whatsapp`,
        });
    } catch (error) {
        console.error('Error fetching WhatsApp credentials:', error);
        return NextResponse.json(
            { error: 'Failed to fetch WhatsApp credentials' },
            { status: 500 }
        );
    }
}

// POST /api/admin/business/whatsapp-credentials - Save WhatsApp credentials
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
        const { phoneNumberId, wabaId, accessToken, enabled } = body;

        // Validate required fields
        if (enabled && (!phoneNumberId || !accessToken)) {
            return NextResponse.json(
                { error: 'Phone Number ID and Access Token are required when enabling WhatsApp' },
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

        // Update WhatsApp credentials
        business.whatsappCredentials = {
            phoneNumberId: phoneNumberId || business.whatsappCredentials?.phoneNumberId,
            wabaId: wabaId || business.whatsappCredentials?.wabaId,
            accessToken: accessToken || business.whatsappCredentials?.accessToken,
            enabled: enabled !== undefined ? enabled : business.whatsappCredentials?.enabled,
        };

        await business.save();

        return NextResponse.json({
            success: true,
            message: 'WhatsApp credentials updated successfully',
            credentials: {
                phoneNumberId: business.whatsappCredentials.phoneNumberId,
                wabaId: business.whatsappCredentials.wabaId,
                enabled: business.whatsappCredentials.enabled,
            },
            webhookUrl: `${process.env.BASE_URL || ''}/api/webhooks/whatsapp`,
        });
    } catch (error) {
        console.error('Error updating WhatsApp credentials:', error);
        return NextResponse.json(
            { error: 'Failed to update WhatsApp credentials' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/business/whatsapp-credentials - Remove WhatsApp credentials
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

        // Remove WhatsApp credentials
        business.whatsappCredentials = undefined;
        await business.save();

        return NextResponse.json({
            success: true,
            message: 'WhatsApp credentials removed successfully',
        });
    } catch (error) {
        console.error('Error removing WhatsApp credentials:', error);
        return NextResponse.json(
            { error: 'Failed to remove WhatsApp credentials' },
            { status: 500 }
        );
    }
}
