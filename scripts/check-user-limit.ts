import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const prisma = new PrismaClient();
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const chatRatelimitFree = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "86400s"),
    prefix: "chat_free",
});

const chatRatelimitPro = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "86400s"),
    prefix: "chat_pro",
});

async function checkUser(email: string) {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, subscription: true, name: true }
    });

    if (!user) {
        console.log('User not found');
        return;
    }

    const isPro = user.subscription === 'PRO';
    const ratelimit = isPro ? chatRatelimitPro : chatRatelimitFree;
    const limit = isPro ? 60 : 3;

    const { remaining, reset } = await ratelimit.getRemaining(user.id);
    const resetDate = new Date(reset);

    console.log(`\n--- User Info: ${user.name} (${email}) ---`);
    console.log(`ID: ${user.id}`);
    console.log(`Plan: ${user.subscription}`);
    console.log(`Used: ${limit - remaining} / ${limit}`);
    console.log(`Remaining: ${remaining}`);
    console.log(`Reset Time (Unix ms): ${reset}`);
    console.log(`Reset Date (Local): ${resetDate.toLocaleString()}`);
    console.log(`Resets in: ${Math.round((reset - Date.now()) / 1000 / 60)} minutes`);
}

const targetEmail = process.argv[2];
if (!targetEmail) {
    console.log('Please provide an email: npx tsx scripts/check-user-limit.ts user@example.com');
} else {
    checkUser(targetEmail).finally(() => prisma.$disconnect());
}
