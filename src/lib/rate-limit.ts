import { NextResponse } from 'next/server';

interface RateLimitOption {
    limit: number;    // Maximum number of requests
    window: number;   // Window in milliseconds
}

import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter for middleware (IP-based)
 * NOT for persistent chat limits.
 */
export function rateLimit(key: string, options: RateLimitOption) {
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
        const newRecord = {
            count: 1,
            resetTime: now + options.window,
        };
        rateLimitMap.set(key, newRecord);
        return {
            success: true,
            remaining: options.limit - 1,
            reset: newRecord.resetTime,
        };
    }

    if (record.count >= options.limit) {
        return {
            success: false,
            remaining: 0,
            reset: record.resetTime,
        };
    }

    record.count++;
    return {
        success: true,
        remaining: options.limit - record.count,
        reset: record.resetTime,
    };
}

/**
 * Persistent Chat Rate Limiter using Prisma
 * Specifically for tracking AI chat messages bucket.
 */
export async function persistentChatLimit(userId: string, options: RateLimitOption) {
    const now = Date.now();

    // Fetch user's current limit status
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { chatCount: true, chatResetTime: true }
    });

    if (!user) {
        return { success: false, remaining: 0, reset: now + options.window };
    }

    const resetTime = user.chatResetTime ? user.chatResetTime.getTime() : 0;

    // Check if we need to reset the window
    if (now > resetTime) {
        const newResetTime = new Date(now + options.window);
        await prisma.user.update({
            where: { id: userId },
            data: {
                chatCount: 1,
                chatResetTime: newResetTime
            }
        });

        return {
            success: true,
            remaining: options.limit - 1,
            reset: newResetTime.getTime()
        };
    }

    // Within window, check limit
    if (user.chatCount >= options.limit) {
        return {
            success: false,
            remaining: 0,
            reset: resetTime
        };
    }

    // Increment count in DB
    await prisma.user.update({
        where: { id: userId },
        data: {
            chatCount: { increment: 1 }
        }
    });

    return {
        success: true,
        remaining: options.limit - (user.chatCount + 1),
        reset: resetTime
    };
}

/**
 * Check rate limit status without incrementing (using Prisma)
 */
export async function getLimitInfo(userId: string, options: RateLimitOption) {
    const now = Date.now();

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { chatCount: true, chatResetTime: true }
    });

    if (!user) {
        return { count: 0, remaining: options.limit, resetTime: now + options.window };
    }

    const resetTime = user.chatResetTime ? user.chatResetTime.getTime() : 0;

    if (now > resetTime) {
        return { count: 0, remaining: options.limit, resetTime: now + options.window };
    }

    return {
        count: user.chatCount,
        remaining: Math.max(0, options.limit - user.chatCount),
        resetTime: resetTime
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
    // @ts-ignore - for development environment
    const socketAddr = req.socket?.remoteAddress;
    return socketAddr || '127.0.0.1';
}
