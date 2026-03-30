import { NextRequest, NextResponse } from 'next/server';
import connectDB from './db';
import Business from '@/models/Business';

export interface AdminSession {
    userId: string;
    username: string;
    role: string;
    businessId?: string;
    exp: number;
}

export interface AuthenticatedRequest extends NextRequest {
    business?: {
        _id: string;
        name: string;
        apiKey: string;
        settings: any;
    };
}

export function verifyAdminToken(req: NextRequest): AdminSession | null {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
        return null;
    }

    try {
        const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());

        // Check expiration
        if (Date.now() > sessionData.exp) {
            return null;
        }

        // Verify role is admin or superadmin
        if (sessionData.role !== 'admin' && sessionData.role !== 'superadmin') {
            return null;
        }

        return sessionData as AdminSession;
    } catch {
        return null;
    }
}

export function verifySuperAdminToken(req: NextRequest): AdminSession | null {
    const token = req.cookies.get('admin_token')?.value;

    if (!token) {
        return null;
    }

    try {
        const sessionData = JSON.parse(Buffer.from(token, 'base64').toString());

        // Check expiration
        if (Date.now() > sessionData.exp) {
            return null;
        }

        // Verify role is superadmin only
        if (sessionData.role !== 'superadmin') {
            return null;
        }

        return sessionData as AdminSession;
    } catch {
        return null;
    }
}

// Middleware response for unauthorized access
export function unauthorizedResponse() {
    return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
    );
}

// Middleware response for forbidden access
export function forbiddenResponse(message = 'Forbidden') {
    return NextResponse.json(
        { error: message },
        { status: 403 }
    );
}

// Verify API key from request headers for chat API
export async function verifyApiKey(req: NextRequest): Promise<{ business: any } | null> {
    const apiKey = req.headers.get('x-api-key');
    const apiSecret = req.headers.get('x-api-secret');

    if (!apiKey || !apiSecret) {
        return null;
    }

    try {
        await connectDB();

        const business = await Business.findOne({
            apiKey,
            apiSecret,
            status: 'verified',
        });

        if (!business) {
            return null;
        }

        return { business };
    } catch (error) {
        console.error('Error verifying API key:', error);
        return null;
    }
}

// Middleware to authenticate chat API requests
export async function authenticateChatApi(req: NextRequest): Promise<{ business: any } | null> {
    // First try API key authentication
    const apiAuth = await verifyApiKey(req);
    if (apiAuth) {
        return apiAuth;
    }

    return null;
}

// Higher-order function to protect routes with admin authentication
export function withAdminAuth(
    handler: (req: NextRequest, session: AdminSession) => Promise<NextResponse>
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const session = verifyAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }
        return handler(req, session);
    };
}

// Higher-order function to protect routes with superadmin authentication
export function withSuperAdminAuth(
    handler: (req: NextRequest, session: AdminSession) => Promise<NextResponse>
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const session = verifySuperAdminToken(req);
        if (!session) {
            return unauthorizedResponse();
        }
        return handler(req, session);
    };
}
