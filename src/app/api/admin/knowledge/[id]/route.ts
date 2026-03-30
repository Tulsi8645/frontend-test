import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Knowledge from '@/models/Knowledge';
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth';

// GET /api/admin/knowledge/[id] - Get single knowledge entry (Admin only)
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin authentication
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const entry = await Knowledge.findById(id);
        if (!entry) {
            return NextResponse.json(
                { error: 'Knowledge entry not found' },
                { status: 404 }
            );
        }

        // Verify the entry belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (entry.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        return NextResponse.json({ entry });
    } catch (error) {
        console.error('Error fetching knowledge:', error);
        return NextResponse.json(
            { error: 'Failed to fetch knowledge entry' },
            { status: 500 }
        );
    }
}

// PUT /api/admin/knowledge/[id] - Update knowledge entry (Admin only)
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin authentication
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const body = await req.json();
        const { value, category, tags, priority, isActive, metadata } = body;

        const entry = await Knowledge.findById(id);
        if (!entry) {
            return NextResponse.json(
                { error: 'Knowledge entry not found' },
                { status: 404 }
            );
        }

        // Verify the entry belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (entry.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        const updatedEntry = await Knowledge.findByIdAndUpdate(
            id,
            {
                ...(value !== undefined && { value }),
                ...(category !== undefined && { category }),
                ...(tags !== undefined && { tags }),
                ...(priority !== undefined && { priority }),
                ...(isActive !== undefined && { isActive }),
                ...(metadata !== undefined && { metadata }),
            },
            { new: true }
        );

        return NextResponse.json({ entry: updatedEntry });
    } catch (error) {
        console.error('Error updating knowledge:', error);
        return NextResponse.json(
            { error: 'Failed to update knowledge entry' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/knowledge/[id] - Delete knowledge entry (Admin only)
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Verify admin authentication
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }

        await connectDB();
        const { id } = await params;

        const entry = await Knowledge.findById(id);
        if (!entry) {
            return NextResponse.json(
                { error: 'Knowledge entry not found' },
                { status: 404 }
            );
        }

        // Verify the entry belongs to the admin's business (unless superadmin)
        if (session.role !== 'superadmin' && session.businessId) {
            if (entry.businessId?.toString() !== session.businessId) {
                return unauthorizedResponse();
            }
        }

        await Knowledge.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Knowledge entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting knowledge:', error);
        return NextResponse.json(
            { error: 'Failed to delete knowledge entry' },
            { status: 500 }
        );
    }
}
