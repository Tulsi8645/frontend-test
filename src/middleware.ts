import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // We only care about applying these permissive CORS headers to our /api/ routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        
        // Intercept browser OPTIONS preflight requests securely
        if (request.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-API-Secret',
                },
            });
        }
        
        // Pass standard requests down to the route, then gracefully append CORS headers to the resulting response
        const response = NextResponse.next();
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-API-Secret');
        
        return response;
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};
