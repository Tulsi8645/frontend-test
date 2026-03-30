import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/business/profile - Get current admin's business profile
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

        return NextResponse.json({ business });
    } catch (error) {
        console.error('Error fetching business profile:', error);
        return NextResponse.json(
            { error: 'Failed to fetch business profile' },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/business/profile - Update business profile
export async function PATCH(req: NextRequest) {
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
        const { name, description, website, phone, address, settings } = body;

        await connectDB();

        const business = await Business.findById(session.businessId);
        if (!business) {
            return NextResponse.json(
                { error: 'Business not found' },
                { status: 404 }
            );
        }

        // Update allowed fields
        if (name) business.name = name;
        if (description !== undefined) business.description = description;
        if (website !== undefined) business.website = website;
        if (phone !== undefined) business.phone = phone;
        if (address) business.address = { ...business.address, ...address };
        if (settings) {
            business.settings = { ...business.settings, ...settings };
        }

        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Business profile updated successfully',
            business,
        });
    } catch (error) {
        console.error('Error updating business profile:', error);
        return NextResponse.json(
            { error: 'Failed to update business profile' },
            { status: 500 }
        );
    }
}
