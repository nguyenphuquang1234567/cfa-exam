import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth, authErrorResponse } from '@/lib/server-auth-utils';

export async function POST(req: Request) {
    console.log('--- Onboarding API Start ---');
    try {
        const body = await req.json();
        const { hasCompletedOnboarding } = body;
        console.log('Request body:', body);

        const authResult = await verifyAuth(req);
        if (authResult.error) {
            console.error('Auth verification failed:', authResult.error);
            return authErrorResponse(authResult as any);
        }

        const email = authResult.email;
        if (!email) {
            console.error('No email found in token for UID:', authResult.uid);
            return NextResponse.json({ error: 'Email not found in token' }, { status: 400 });
        }

        console.log('Attempting to find user with email:', email);
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            console.error(`User not found for email: ${email}`);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log('Found user ID:', user.id, 'Updating status via raw SQL...');

        // Use raw SQL to bypass Prisma Client model validation which might be out of sync
        await prisma.$executeRaw`UPDATE "User" SET "hasCompletedOnboarding" = true WHERE id = ${user.id}`;

        console.log('Onboarding status updated successfully for:', user.id);
        return NextResponse.json({ success: true, userId: user.id });
    } catch (error: any) {
        console.error('CRITICAL ERROR in Onboarding API:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal Server Error'
        }, { status: 500 });
    }
}
