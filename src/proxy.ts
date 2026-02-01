import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit, getIP } from './lib/rate-limit';

export async function proxy(request: NextRequest) {
    // Only apply to API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = getIP(request);
        const path = request.nextUrl.pathname;

        // 1. Strict limit for Auth-sensitive actions (Redis based)
        if (path.includes('/api/user/update-password')) {
            const result = await rateLimit(`password_upd_${ip}`, {
                limit: 7,
                window: 3600 * 1000 // 7 times per hour
            });
            if (!result.success) {
                return NextResponse.json({ error: 'Too many password attempts.' }, { status: 429 });
            }
        }

        // 2. Strict limit for Quiz Questions (Redis based)
        if (path.includes('/api/quiz/questions')) {
            const result = await rateLimit(`q_limit_${ip}`, {
                limit: 50,
                window: 60 * 1000 // 50 times per minute
            });
            if (!result.success) {
                return NextResponse.json({ error: 'Slowing down questions.' }, { status: 429 });
            }
        }

        // 3. Global Baseline (Redis based)
        const globalResult = await rateLimit(`global_api_${ip}`, {
            limit: 300,
            window: 60 * 1000 // 300 requests per minute total
        });

        if (!globalResult.success && process.env.NODE_ENV !== 'development') {
            return NextResponse.json(
                { error: 'System is busy (Rate limit exceeded).' },
                { status: 429 }
            );
        }
    }

    return NextResponse.next();
}

// Optionally, specify paths to run middleware on
export const config = {
    matcher: '/api/:path*',
};
