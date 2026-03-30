import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Business from '@/models/Business';
import User, { hashPassword } from '@/models/User';

// POST /api/business/signup - Register a new business
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            businessName,
            slug,
            description,
            website,
            email,
            phone,
            address,
            adminUsername,
            adminPassword,
            settings,
        } = body;

        // Validate required fields
        if (!businessName || !slug || !email || !adminUsername || !adminPassword) {
            return NextResponse.json(
                { error: 'Missing required fields: businessName, slug, email, adminUsername, adminPassword' },
                { status: 400 }
            );
        }

        // Validate slug format (alphanumeric, hyphens, underscores only)
        if (!/^[a-z0-9-_]+$/i.test(slug)) {
            return NextResponse.json(
                { error: 'Slug must contain only letters, numbers, hyphens, and underscores' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (adminPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check if slug is already taken
        const existingSlug = await Business.findOne({ slug: slug.toLowerCase() });
        if (existingSlug) {
            return NextResponse.json(
                { error: 'Business slug is already taken' },
                { status: 409 }
            );
        }

        // Check if email is already registered
        const existingEmail = await Business.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return NextResponse.json(
                { error: 'Email is already registered' },
                { status: 409 }
            );
        }

        // Check if username is already taken
        const existingUsername = await User.findOne({ username: adminUsername.toLowerCase() });
        if (existingUsername) {
            return NextResponse.json(
                { error: 'Username is already taken' },
                { status: 409 }
            );
        }

        // Create the business first (without adminUserId)
        const business = await Business.create({
            name: businessName,
            slug: slug.toLowerCase(),
            description,
            website,
            email: email.toLowerCase(),
            phone,
            address,
            status: 'pending',
            settings: settings || {
                enableAI: true,
                allowHumanHandover: true,
            },
        });

        // Create the admin user for this business
        const adminUser = await User.create({
            username: adminUsername.toLowerCase(),
            passwordHash: hashPassword(adminPassword),
            role: 'admin',
            businessId: business._id,
            isActive: true,
        });

        // Update business with adminUserId
        business.adminUserId = adminUser._id;
        await business.save();

        return NextResponse.json({
            success: true,
            message: 'Business registration successful! Your account is pending verification by the superadmin. You will receive access to full functionality once verified.',
            business: {
                id: business._id,
                name: business.name,
                slug: business.slug,
                status: business.status,
                email: business.email,
            },
        }, { status: 201 });

    } catch (error) {
        console.error('Business signup error:', error);
        return NextResponse.json(
            { error: 'Failed to register business' },
            { status: 500 }
        );
    }
}

// GET /api/business/signup - Check if slug or email is available
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');
        const email = searchParams.get('email');
        const username = searchParams.get('username');

        await connectDB();

        const result: { slug?: boolean; email?: boolean; username?: boolean } = {};

        if (slug) {
            const existing = await Business.findOne({ slug: slug.toLowerCase() });
            result.slug = !existing;
        }

        if (email) {
            const existing = await Business.findOne({ email: email.toLowerCase() });
            result.email = !existing;
        }

        if (username) {
            const existing = await User.findOne({ username: username.toLowerCase() });
            result.username = !existing;
        }

        return NextResponse.json({ available: result });
    } catch (error) {
        console.error('Availability check error:', error);
        return NextResponse.json(
            { error: 'Failed to check availability' },
            { status: 500 }
        );
    }
}
