import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, authErrorResponse } from '@/lib/server-auth-utils';

export async function GET(req: NextRequest) {
    try {
        const authResult = await verifyAuth(req);
        if (authResult.error || !authResult.uid) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        const sessions = await prisma.chatSession.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: {
                    select: { messages: true }
                }
            }
        });

        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuth(req);
        if (authResult.error || !authResult.uid) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        const session = await prisma.chatSession.create({
            data: {
                userId,
                title: 'New Chat'
            }
        });

        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}
