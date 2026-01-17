import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, authErrorResponse } from '@/lib/server-auth-utils';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authResult = await verifyAuth(req);
        if (authResult.error) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authResult = await verifyAuth(req);
        if (authResult.error) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        await prisma.chatSession.deleteMany({
            where: { id: sessionId, userId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
) {
    try {
        const { sessionId } = await params;
        const authResult = await verifyAuth(req);
        if (authResult.error) return authErrorResponse(authResult as any);
        const userId = authResult.uid;

        const body = await req.json();
        const { title } = body;

        if (!title || typeof title !== 'string') {
            return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
        }

        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const updatedSession = await prisma.chatSession.update({
            where: { id: sessionId },
            data: { title: title.trim() }
        });

        return NextResponse.json(updatedSession);
    } catch (error) {
        console.error('Rename error:', error);
        return NextResponse.json({ error: 'Failed to rename session' }, { status: 500 });
    }
}
