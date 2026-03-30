import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import User from '@/models/User';
import { verifySuperAdminToken } from '@/lib/auth';

// GET /api/superadmin/businesses - Get all businesses with optional filtering
export async function GET(req: NextRequest) {
    try {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        await connectDB();

        // Build query
        const query: any = {};
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
            ];
        }

        // Get businesses with pagination
        const skip = (page - 1) * limit;
        const businesses = await Business.find(query)
            .populate('adminUserId', 'username isActive')
            .populate('verifiedBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Business.countDocuments(query);

        // Get stats
        const stats = {
            total: await Business.countDocuments(),
            pending: await Business.countDocuments({ status: 'pending' }),
            verified: await Business.countDocuments({ status: 'verified' }),
            suspended: await Business.countDocuments({ status: 'suspended' }),
        };

        return NextResponse.json({
            businesses,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching businesses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch businesses' },
            { status: 500 }
        );
    }
}
