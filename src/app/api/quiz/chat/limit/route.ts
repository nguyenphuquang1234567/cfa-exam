import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, authErrorResponse } from '@/lib/server-auth-utils';
import { getLimitInfo } from '@/lib/rate-limit';

/**
 * API to check user's remaining chat credits
 * Matches the logic in /api/quiz/chat/route.ts
 */
export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuth(req);
        if (authResult.error) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        const { prisma } = await import('@/lib/prisma');
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { subscription: true }
        });

        const isFree = !user || user.subscription === 'FREE';
        const isPro = user?.subscription === 'PRO';

        let limitInfo;
        if (isFree) {
            limitInfo = {
                ...getLimitInfo(`chat_free_6hr_${userId}`, { limit: 3, window: 21600000 }),
                type: 'FREE',
                limit: 3
            };
        } else {
            limitInfo = {
                ...getLimitInfo(`chat_pro_${userId}`, { limit: 70, window: 86400000 }),
                type: 'PRO',
                limit: 70
            };
        }

        return NextResponse.json(limitInfo);

    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
