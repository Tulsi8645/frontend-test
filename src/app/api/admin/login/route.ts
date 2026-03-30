import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User, { hashPassword } from '@/models/User';
import Business from '@/models/Business';

// POST /api/admin/login - Admin login with env credentials or database user
export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        await connectDB();

        // Check against env credentials for superadmin first
        const envUsername = process.env.SUPERADMIN_USERNAME || process.env.ADMIN_USERNAME;
        const envPassword = process.env.SUPERADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

        if (envUsername && envPassword && username === envUsername && password === envPassword) {
            // Create or update superadmin user
            let superadmin = await User.findOne({ username: envUsername.toLowerCase() });

            if (!superadmin) {
                superadmin = await User.create({
                    username: envUsername.toLowerCase(),
                    passwordHash: hashPassword(envPassword),
                    role: 'superadmin',
                    isActive: true,
                });
            }

            // Create session token
            const sessionData = {
                userId: superadmin._id.toString(),
                username: superadmin.username,
                role: 'superadmin',
                exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            };
            const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');

            return NextResponse.json({
                success: true,
                token,
                user: {
                    username: superadmin.username,
                    role: 'superadmin',
                },
                redirect: '/superadmin/dashboard',
            });
        }

        // Check against database for business admins
        const user = await User.findOne({ username: username.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is deactivated' },
                { status: 403 }
            );
        }

        // Verify password
        if (!user.verifyPassword(password)) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check if business is verified (for admin users)
        if (user.role === 'admin' && user.businessId) {
            const business = await Business.findById(user.businessId);
            if (!business) {
                return NextResponse.json(
                    { error: 'Business not found' },
                    { status: 404 }
                );
            }
            if (business.status !== 'verified') {
                return NextResponse.json(
                    { error: `Business account is ${business.status}. Please wait for verification.` },
                    { status: 403 }
                );
            }
        }

        // Create session token
        const sessionData = {
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
            businessId: user.businessId?.toString(),
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };
        const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');

        const redirect = user.role === 'superadmin' ? '/superadmin/dashboard' : '/admin/dashboard';

        return NextResponse.json({
            success: true,
            token,
            user: {
                username: user.username,
                role: user.role,
                businessId: user.businessId?.toString(),
            },
            redirect,
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Failed to login' },
            { status: 500 }
        );
    }
}
