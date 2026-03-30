import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import User from '@/models/User';
import { verifySuperAdminToken } from '@/lib/auth';

import { Types } from 'mongoose';

// PATCH /api/superadmin/businesses/[id] - Update business status or settings
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, ...data } = body;

        await connectDB();

        const business = await Business.findById(id);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        switch (action) {
            case 'verify':
                business.status = 'verified';
                business.verifiedAt = new Date();
                business.verifiedBy = new Types.ObjectId(session.userId);
                await business.save();
                return NextResponse.json({
                    success: true,
                    message: 'Business verified successfully',
                    business,
                });

            case 'suspend':
                business.status = 'suspended';
                await business.save();
                return NextResponse.json({
                    success: true,
                    message: 'Business suspended successfully',
                    business,
                });

            case 'activate':
                business.status = 'verified';
                await business.save();
                return NextResponse.json({
                    success: true,
                    message: 'Business activated successfully',
                    business,
                });

            case 'regenerate-api-keys':
                const credentials = business.regenerateApiCredentials();
                await business.save();
                return NextResponse.json({
                    success: true,
                    message: 'API credentials regenerated successfully',
                    apiKey: credentials.apiKey,
                    apiSecret: credentials.apiSecret,
                    business,
                });

            case 'update':
                // Update allowed fields
                const allowedFields = ['name', 'description', 'website', 'phone', 'address', 'settings'];
                allowedFields.forEach((field) => {
                    if (data[field] !== undefined) {
                        business.set(field, data[field]);
                    }
                });
                await business.save();
                return NextResponse.json({
                    success: true,
                    message: 'Business updated successfully',
                    business,
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error updating business:', error);
        return NextResponse.json(
            { error: 'Failed to update business' },
            { status: 500 }
        );
    }
}

// GET /api/superadmin/businesses/[id] - Get single business details
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const business = await Business.findById(id)
            .populate('adminUserId', 'username isActive createdAt')
            .populate('verifiedBy', 'username');

        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        return NextResponse.json({ business });
    } catch (error) {
        console.error('Error fetching business:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business' },
            { status: 500 }
        );
    }
}

// DELETE /api/superadmin/businesses/[id] - Delete business
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const business = await Business.findById(id);
        if (!business) {
            return NextResponse.json({ error: 'Business not found' }, { status: 404 });
        }

        // Also deactivate the admin user
        if (business.adminUserId) {
            await User.findByIdAndUpdate(business.adminUserId, { isActive: false });
        }

        await Business.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Business deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting business:', error);
        return NextResponse.json(
            { error: 'Failed to delete business' },
            { status: 500 }
        );
    }
}
