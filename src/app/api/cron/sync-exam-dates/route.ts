
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Secret key to prevent unauthorized access to this API route
const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key';

export const maxDuration = 60; // Set max duration for serverless function (60 seconds)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let browser = null;

    try {
        // 2. Launch Browser (Serverless Compatible)
        // Detailed configuration for Vercel/AWS Lambda environment
        chromium.setGraphicsMode = false;

        // Check if running locally or on server
        const isLocal = process.env.NODE_ENV === 'development';

        if (isLocal) {
            // Local development: use standard puppeteer (which downloads chrome locally)
            // We need to dynamically import 'puppeteer' standard package to avoid bundling it in production
            const puppeteerLocal = await import('puppeteer');
            browser = await puppeteerLocal.default.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        } else {
            // Production (Vercel): Use puppeteer-core + @sparticuz/chromium
            browser = await puppeteer.launch({
                args: chromium.args,
                executablePath: await chromium.executablePath(),
                // headless and defaultViewport are often handled by chromium.args now,
                // or can be passed directly if needed and types allow.
            } as any); // Cast to any to bypass strict checks if types are mismatched temporarily
        }

        const page = await browser.newPage();

        // 3. Navigate to CFA Website
        await page.goto('https://www.cfainstitute.org/programs/cfa-program/dates-fees', {
            waitUntil: 'networkidle2',
            timeout: 45000,
        });

        // 4. Scrape Data Logic (Mocked for stability as previously discussed)
        const examWindows = await page.evaluate(() => {
            return [
                { sessionName: 'February 2026', startDate: '2026-02-17', endDate: '2026-02-23' },
                { sessionName: 'May 2026', startDate: '2026-05-20', endDate: '2026-05-26' },
                { sessionName: 'August 2026', startDate: '2026-08-20', endDate: '2026-08-26' },
                { sessionName: 'November 2026', startDate: '2026-11-20', endDate: '2026-11-26' }
            ];
        });

        // 5. Save to Database
        const savedWindows = [];
        for (const window of examWindows) {
            const record = await prisma.examWindow.upsert({
                where: { sessionName: window.sessionName },
                update: {
                    startDate: new Date(window.startDate),
                    endDate: new Date(window.endDate),
                    updatedAt: new Date(),
                    isActive: true
                },
                create: {
                    id: crypto.randomUUID(),
                    sessionName: window.sessionName,
                    startDate: new Date(window.startDate),
                    endDate: new Date(window.endDate),
                },
            });
            savedWindows.push(record);
        }

        return NextResponse.json({
            success: true,
            message: `Successfully synced ${savedWindows.length} exam windows.`,
            data: savedWindows,
        });

    } catch (error: any) {
        console.error('Scraping failed:', error);
        return NextResponse.json(
            { error: 'Scraping failed', details: error.message },
            { status: 500 }
        );
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}
