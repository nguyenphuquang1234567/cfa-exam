import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, authErrorResponse } from '@/lib/server-auth-utils';

export async function POST(req: NextRequest) {
    try {
        const authResult = await verifyAuth(req);
        if (authResult.error) {
            return authErrorResponse(authResult as { error: string; status: number });
        }
        const userId = authResult.uid as string;

        const body = await req.json();
        const { rating, category, content } = body;

        if (!rating || !content) {
            return NextResponse.json({ error: 'Rating and content are required' }, { status: 400 });
        }

        const feedback = await prisma.feedback.create({
            data: {
                userId,
                rating: Number(rating),
                category,
                content,
            },
        });

        return NextResponse.json({ success: true, feedback });
    } catch (error: any) {
        console.error('Feedback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
