'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { addDays, differenceInWeeks, startOfWeek } from 'date-fns';

export async function updateStudyPlanExamDate(userId: string, examDate: Date) {
    if (!userId) {
        throw new Error('User ID is required');
    }

    // 1. Get user and topics
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { cfaLevel: true },
    });

    if (!dbUser) {
        throw new Error('User not found');
    }

    const topics = await prisma.topic.findMany({
        where: { cfaLevel: dbUser.cfaLevel },
        orderBy: { order: 'asc' },
    });

    // 2. Clear existing plan to generate a fresh one
    await prisma.studyPlan.deleteMany({
        where: { userId, isActive: true }
    });

    // 3. Create new Study Plan
    const studyPlan = await prisma.studyPlan.create({
        data: {
            userId,
            name: 'My Custom Study Plan',
            cfaLevel: dbUser.cfaLevel,
            examDate,
            isActive: true,
        }
    });

    // 4. Calculate distributions
    const todayStr = new Date().toLocaleDateString('en-CA');
    const startDate = new Date(todayStr + 'T00:00:00Z');

    // Normalize examDate to UTC midnight
    const examDateStr = new Date(examDate).toLocaleDateString('en-CA');
    const targetExamDate = new Date(examDateStr + 'T00:00:00Z');

    const totalWeeks = Math.max(differenceInWeeks(targetExamDate, startDate), 4);
    const reviewWeeks = Math.min(Math.max(Math.floor(totalWeeks * 0.2), 1), 4);
    const learningWeeks = Math.max(totalWeeks - reviewWeeks, 1);

    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const weekIndex = Math.min(Math.floor((i / topics.length) * learningWeeks), learningWeeks - 1);
        const weekNumber = weekIndex + 1;

        // Target date is the end of that week
        const targetDate = addDays(startOfWeek(startDate, { weekStartsOn: 1 }), (weekNumber * 7) - 1);

        await prisma.studyPlanItem.create({
            data: {
                studyPlanId: studyPlan.id,
                topicId: topic.id,
                weekNumber,
                targetDate,
                isCompleted: false,
            }
        });
    }

    revalidatePath('/study-plan');
    return { success: true, planId: studyPlan.id };
}

export async function getActiveStudyPlan(userId: string) {
    if (!userId) return null;

    return await prisma.studyPlan.findFirst({
        where: { userId, isActive: true },
        include: {
            items: {
                include: { topic: true },
                orderBy: { weekNumber: 'asc' }
            }
        }
    });
}

export async function toggleStudyItemCompletion(itemId: string, isCompleted: boolean) {
    const updatedItem = await prisma.studyPlanItem.update({
        where: { id: itemId },
        data: {
            isCompleted,
            completedAt: isCompleted ? new Date() : null
        }
    });

    revalidatePath('/study-plan');
    return updatedItem;
}
