import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ChatSession from '@/models/ChatSession';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/sessions - List all chat sessions for the business
export async function GET(req: NextRequest) {
    try {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'active';
        const channel = searchParams.get('channel');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build query - filter by businessId for non-superadmin users
        const query: any = {};
        
        // Superadmin sees all sessions, regular admin sees only their business sessions
        if (session.role !== 'superadmin' && session.businessId) {
            query.businessId = session.businessId;
        }

        if (status !== 'all') {
            query.status = status;
        }
        
        // Add channel filter if specified
        if (channel) {
            query.channel = channel;
        }

        const sessions = await ChatSession.find(query)
            .select('sessionId businessId channel externalId status messages takenOverBy takenOverAt createdAt updatedAt lastActivityAt userInfo')
            .sort({ lastActivityAt: -1 })
            .limit(limit)
            .lean(); // Convert to plain JS objects

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat sessions' },
            { status: 500 }
        );
    }
}
