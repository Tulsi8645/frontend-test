import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import User from '@/models/User';
import ChatSession from '@/models/ChatSession';
import Knowledge from '@/models/Knowledge';
import { verifySuperAdminToken } from '@/lib/auth';

// GET /api/superadmin/analytics - Platform-wide analytics
export async function GET(req: NextRequest) {
    try {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get date ranges
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Business stats
        const totalBusinesses = await Business.countDocuments();
        const activeBusinesses = await Business.countDocuments({ status: 'verified' });
        const pendingBusinesses = await Business.countDocuments({ status: 'pending' });
        const suspendedBusinesses = await Business.countDocuments({ status: 'suspended' });
        const newBusinessesThisMonth = await Business.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // User stats
        const totalUsers = await User.countDocuments();
        const superadminCount = await User.countDocuments({ role: 'superadmin' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });

        // Chat session stats
        const totalSessions = await ChatSession.countDocuments();
        const activeSessions = await ChatSession.countDocuments({ status: 'active' });
        const sessionsToday = await ChatSession.countDocuments({
            createdAt: { $gte: today }
        });
        const sessionsThisWeek = await ChatSession.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        const sessionsThisMonth = await ChatSession.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        const takenOverSessions = await ChatSession.countDocuments({ status: 'taken_over' });

        // Knowledge base stats
        const totalKnowledge = await Knowledge.countDocuments();
        const activeKnowledge = await Knowledge.countDocuments({ isActive: true });
        
        // Knowledge by type
        const knowledgeByType = await Knowledge.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Sessions per business (top 5)
        const topBusinessesBySessions = await ChatSession.aggregate([
            { $group: { _id: '$businessId', sessionCount: { $sum: 1 } } },
            { $sort: { sessionCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'businesses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'business'
                }
            },
            { $unwind: '$business' },
            {
                $project: {
                    businessId: '$_id',
                    businessName: '$business.name',
                    businessSlug: '$business.slug',
                    sessionCount: 1
                }
            }
        ]);

        // Daily sessions for last 7 days
        const dailySessions = await ChatSession.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Recent businesses
        const recentBusinesses = await Business.find()
            .populate('adminUserId', 'username')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name slug email status createdAt');

        return NextResponse.json({
            businesses: {
                total: totalBusinesses,
                active: activeBusinesses,
                pending: pendingBusinesses,
                suspended: suspendedBusinesses,
                newThisMonth: newBusinessesThisMonth,
            },
            users: {
                total: totalUsers,
                superadmins: superadminCount,
                admins: adminCount,
                activeAdmins,
            },
            sessions: {
                total: totalSessions,
                active: activeSessions,
                today: sessionsToday,
                thisWeek: sessionsThisWeek,
                thisMonth: sessionsThisMonth,
                takenOver: takenOverSessions,
            },
            knowledge: {
                total: totalKnowledge,
                active: activeKnowledge,
                byType: knowledgeByType,
            },
            topBusinesses: topBusinessesBySessions,
            dailySessions,
            recentBusinesses,
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
