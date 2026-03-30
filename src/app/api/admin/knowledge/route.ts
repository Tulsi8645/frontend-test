import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Knowledge, { knowledgeToJSONFormat, IKnowledge } from '@/models/Knowledge';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/knowledge - List all knowledge entries (Admin only)
export async function GET(req: NextRequest) {
    try {
        // Verify admin authentication
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');
        const format = searchParams.get('format'); // 'json' for old format, otherwise array

        // Build query - filter by businessId for non-superadmin users
        const query: any = {};
        
        // Superadmin sees all entries, regular admin sees only their business entries
        if (session.role !== 'superadmin' && session.businessId) {
            query.businessId = session.businessId;
        }

        if (type) query.type = type;
        if (category) query.category = category;
        if (isActive !== null) query.isActive = isActive === 'true';

        const entries = await Knowledge.find(query).sort({ priority: -1, createdAt: -1 });

        if (format === 'json') {
            return NextResponse.json({ knowledge: knowledgeToJSONFormat(entries) });
        }

        return NextResponse.json({ entries });
    } catch (error) {
        console.error('Error fetching knowledge:', error);
        return NextResponse.json(
            { error: 'Failed to fetch knowledge entries' },
            { status: 500 }
        );
    }
}

// POST /api/admin/knowledge - Create new knowledge entry (Admin only)
export async function POST(req: NextRequest) {
    try {
        // Verify admin authentication
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();

        const body = await req.json();
        const { type, key, value, category, tags, priority, metadata } = body;

        if (!type || !key || value === undefined) {
            return NextResponse.json(
                { error: 'Type, key, and value are required' },
                { status: 400 }
            );
        }

        // Check if key already exists for this business
        const keyQuery: any = { key };
        if (session.role !== 'superadmin' && session.businessId) {
            keyQuery.businessId = session.businessId;
        }
        const existing = await Knowledge.findOne(keyQuery);
        if (existing) {
            return NextResponse.json(
                { error: `Knowledge with key '${key}' already exists` },
                { status: 409 }
            );
        }

        const entryData: any = {
            type,
            key,
            value,
            category: category || 'general',
            tags: tags || [],
            priority: priority || 0,
            metadata: metadata || {},
            isActive: true,
        };
        
        // Add businessId for non-superadmin users
        if (session.role !== 'superadmin' && session.businessId) {
            entryData.businessId = session.businessId;
        }

        const entry = await Knowledge.create(entryData);

        return NextResponse.json({ entry }, { status: 201 });
    } catch (error) {
        console.error('Error creating knowledge:', error);
        return NextResponse.json(
            { error: 'Failed to create knowledge entry' },
            { status: 500 }
        );
    }
}
