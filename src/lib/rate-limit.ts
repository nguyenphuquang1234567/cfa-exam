import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { prisma } from '@/lib/prisma';

// Initialize Redis client once (Used for IP-based limiting ONLY)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface RateLimitOption {
    limit: number;    // Maximum number of requests
    window: number;   // Window in milliseconds
}

// Fallback storage for when Upstash Redis is unavailable or exhausted
const localMemoryCache = new Map<string, { count: number; reset: number }>();

/**
 * IP-based Rate Limiter using Upstash Redis (High Performance)
 * With Local Memory Fallback if Upstash fails.
 */
export async function rateLimit(key: string, options: RateLimitOption) {
    try {
        const windowInSeconds = Math.floor(options.window / 1000);

        const ratelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(options.limit, `${windowInSeconds}s`),
            analytics: true,
            prefix: "@upstash/ratelimit",
        });

        const { success, limit, remaining, reset } = await ratelimit.limit(key);
        console.log(`[Upstash Redis] Key: ${key}, Success: ${success}, Rem: ${remaining}`);
        return { success, remaining, reset };
    } catch (error) {
        console.error("RateLimit Error (Falling back to local RAM):", error);

        // --- LOCAL MEMORY FALLBACK ---
        const now = Date.now();
        const record = localMemoryCache.get(key);

        if (!record || now > record.reset) {
            // New window or first time
            const newRecord = { count: 1, reset: now + options.window };
            localMemoryCache.set(key, newRecord);
            return {
                success: true,
                remaining: options.limit - 1,
                reset: newRecord.reset
            };
        }

        if (record.count >= options.limit) {
            // Already limited
            return {
                success: false,
                remaining: 0,
                reset: record.reset
            };
        }

        // Increment count
        record.count++;
        return {
            success: true,
            remaining: options.limit - record.count,
            reset: record.reset
        };
    }
}

/**
 * Persistent Chat Rate Limiter using PRISMA (DATABASE)
 * As per USER request, reverting chat limit to use the database.
 */
export async function persistentChatLimit(userId: string, options: RateLimitOption) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { chatCount: true, chatResetTime: true }
    });

    if (!user) {
        return { success: false, remaining: 0, reset: Date.now() };
    }

    const now = new Date();
    let count = user.chatCount;
    let resetTime = user.chatResetTime;

    // Logic: If current time > resetTime, reset the count
    if (!resetTime || now > resetTime) {
        count = 0;
        // Set new reset time to be 24h from now (or the window specified)
        resetTime = new Date(now.getTime() + options.window);

        // Update user immediately with clean slate
        await prisma.user.update({
            where: { id: userId },
            data: { chatCount: 0, chatResetTime: resetTime }
        });
    }

    if (count >= options.limit) {
        return {
            success: false,
            remaining: 0,
            reset: resetTime.getTime()
        };
    }

    // Increment count in DB
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            chatCount: { increment: 1 },
            // Ensure resetTime is set if it was null
            chatResetTime: resetTime
        }
    });

    return {
        success: true,
        remaining: Math.max(0, options.limit - (count + 1)),
        reset: resetTime.getTime()
    };
}

/**
 * Check rate limit status from DB without incrementing
 */
export async function getLimitInfo(userId: string, options: RateLimitOption) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { chatCount: true, chatResetTime: true }
    });

    if (!user) {
        return { count: 0, remaining: options.limit, resetTime: Date.now() };
    }

    const now = new Date();
    let count = user.chatCount;
    let resetTime = user.chatResetTime;

    if (!resetTime || now > resetTime) {
        count = 0;
        resetTime = new Date(now.getTime() + options.window);
    }

    return {
        count: count,
        remaining: Math.max(0, options.limit - count),
        resetTime: resetTime.getTime()
    };
}

/**
 * Helper to get IP from request headers
 */
export function getIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    // @ts-ignore
    return (req as any).ip || '127.0.0.1';
}
