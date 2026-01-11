import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, isSameDay } from 'date-fns';

export async function POST(req: Request) {
    try {
        const { userId, correctAnswers, totalQuestions, timeSpent, topicPerformance } = await req.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Get user to check current streak and lastActiveAt
        const user = await (prisma.user.findUnique as any)({
            where: { id: userId },
            select: {
                id: true,
                currentStreak: true,
                longestStreak: true,
                lastActiveAt: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const now = new Date();
        const today = startOfDay(now);
        let newStreak = (user as any).currentStreak;

        // 2. Logic to update Streak
        if (!(user as any).lastActiveAt) {
            // First time ever
            newStreak = 1;
        } else {
            const lastActiveDate = startOfDay(new Date((user as any).lastActiveAt));

            if (isSameDay(today, lastActiveDate)) {
                // Already active today, streak stays the same
                newStreak = (user as any).currentStreak;
            } else {
                const yesterday = startOfDay(subDays(today, 1));
                if (isSameDay(lastActiveDate, yesterday)) {
                    // Active yesterday, increment streak
                    newStreak = (user as any).currentStreak + 1;
                } else if (lastActiveDate < yesterday) {
                    // Missed a day or more, reset to 1
                    newStreak = 1;
                }
            }
        }

        const newLongestStreak = Math.max(newStreak, (user as any).longestStreak);

        // Prepare TopicPerformance updates
        const topicUpdates: any[] = [];
        if (topicPerformance) {
            const topicIds = Object.keys(topicPerformance);

            // Fetch existing performances to calculate accuracy
            const existingPerformances = await prisma.topicPerformance.findMany({
                where: {
                    userId,
                    topicId: { in: topicIds }
                }
            });

            const performanceMap = new Map(existingPerformances.map((p: any) => [p.topicId, p]));

            for (const [topicId, stats] of Object.entries(topicPerformance) as [string, { correct: number, total: number }][]) {
                const existing = performanceMap.get(topicId);
                const currentTotal = (existing?.totalAttempts || 0);
                const currentCorrect = (existing?.correctCount || 0);

                const newTotal = currentTotal + stats.total;
                const newCorrect = currentCorrect + stats.correct;
                const newAccuracy = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;

                topicUpdates.push(
                    prisma.topicPerformance.upsert({
                        where: {
                            userId_topicId: { userId, topicId }
                        },
                        update: {
                            totalAttempts: newTotal,
                            correctCount: newCorrect,
                            accuracy: newAccuracy,
                            lastPracticed: now,
                        },
                        create: {
                            userId,
                            topicId,
                            totalAttempts: stats.total,
                            correctCount: stats.correct,
                            accuracy: newAccuracy,
                            lastPracticed: now,
                        }
                    })
                );
            }
        }

        // 3. Update User, DailyProgress, and TopicPerformance in a transaction
        await prisma.$transaction([
            // Update User streaks
            (prisma.user.update as any)({
                where: { id: userId },
                data: {
                    currentStreak: newStreak,
                    longestStreak: newLongestStreak,
                    lastActiveAt: now,
                }
            }),
            // Upsert DailyProgress
            prisma.dailyProgress.upsert({
                where: {
                    userId_date: {
                        userId,
                        date: today,
                    }
                },
                update: {
                    questionsAnswered: { increment: totalQuestions },
                    correctAnswers: { increment: correctAnswers },
                    timeSpent: { increment: timeSpent || 0 },
                    sessionsCount: { increment: 1 },
                },
                create: {
                    userId,
                    date: today,
                    questionsAnswered: totalQuestions,
                    correctAnswers: correctAnswers,
                    timeSpent: timeSpent || 0,
                    sessionsCount: 1,
                }
            }),
            ...topicUpdates
        ]);

        return NextResponse.json({
            success: true,
            currentStreak: newStreak,
            longestStreak: newLongestStreak
        });

    } catch (error) {
        console.error('Error completing quiz:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
