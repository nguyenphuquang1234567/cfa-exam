
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting exam date sync...');

    let browser = null;
    try {
        // Launch standard Puppeteer (works great in GitHub Actions environment)
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        console.log('Browser launched, navigating to CFA site...');

        // Navigate to CFA Website
        await page.goto('https://www.cfainstitute.org/programs/cfa-program/dates-fees', {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        console.log('Page loaded, extracting data...');

        // Scrape Data - FULL AUTOMATION INTERACTION
        // 1. Select Level I
        const levelSelectSelector = 'select[aria-label="Exam Level"]';
        await page.waitForSelector(levelSelectSelector, { timeout: 10000 });
        await page.select(levelSelectSelector, 'Level I');
        console.log('Selected Level I');

        // 2. Wait for Exam Period dropdown to populate
        const periodSelectSelector = 'select[aria-label="Exam Period"]';
        await page.waitForFunction(
            (selector) => {
                const select = document.querySelector(selector) as HTMLSelectElement;
                return select && select.options.length > 1;
            },
            { timeout: 10000 },
            periodSelectSelector
        );
        console.log('Exam Period dropdown populated');

        // 3. Get all available 2026 options
        const options = await page.evaluate((selector) => {
            const select = document.querySelector(selector) as HTMLSelectElement;
            return Array.from(select.options)
                .map(opt => ({ text: opt.text, value: opt.value }))
                .filter(opt => opt.text.includes('2026'));
        }, periodSelectSelector);

        console.log(`Found ${options.length} options for 2026:`, options.map(o => o.text));

        const results: any[] = [];

        // 4. Iterate and scrape each option
        for (const option of options) {
            console.log(`Processing: ${option.text}`);

            // Select the option
            await page.select(periodSelectSelector, option.value);

            // Wait for dynamic content to update. 
            // We look for a container that changes. The text "CFA Program Exam Dates" is distinct.
            // We wait for a specific element that appears in the timeline for the selected date.
            try {
                // Simple wait for network idle or a short pause to allow React/Angular to render
                await new Promise(r => setTimeout(r, 2000));

                // Extract dates
                const dates = await page.evaluate(() => {
                    const bodyText = document.body.innerText;
                    // Look for "Month DD - Month DD, YYYY" pattern near "Exam Dates"
                    // Or just look for the regex pattern we verified earlier: "Start Month - End Month YYYY"
                    // Verified pattern from Subagent: "February 2 – 8, 2026"
                    // Regex: Month DD – DD, YYYY
                    const simpleDateRegex = /([a-zA-Z]+)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),\s*(\d{4})/;
                    const match = bodyText.match(simpleDateRegex);

                    // Also handle cross-month: "May 28 – June 3, 2026"
                    const complexDateRegex = /([a-zA-Z]+)\s+(\d{1,2})\s*[–-]\s*([a-zA-Z]+)\s+(\d{1,2}),\s*(\d{4})/;
                    const complexMatch = bodyText.match(complexDateRegex);

                    if (complexMatch) {
                        // Month1 DD - Month2 DD, YYYY
                        const [_, m1, d1, m2, d2, y] = complexMatch;
                        return {
                            start: `${y}-${m1}-${d1}`,
                            end: `${y}-${m2}-${d2}`
                        };
                    } else if (match) {
                        // Month DD - DD, YYYY (Same month)
                        const [_, m, d1, d2, y] = match;
                        return {
                            start: `${y}-${m}-${d1}`,
                            end: `${y}-${m}-${d2}`
                        };
                    }
                    return null;
                });

                if (dates) {
                    // Convert to ISO (using Node context to parse properly)
                    const startDate = new Date(dates.start).toISOString();
                    const endDate = new Date(dates.end).toISOString();

                    results.push({
                        sessionName: option.text,
                        startDate: startDate,
                        endDate: endDate
                    });
                    console.log(`  -> Scraped: ${dates.start} to ${dates.end}`);
                } else {
                    console.log(`  -> No dates found for ${option.text}`);
                }

            } catch (e) {
                console.error(`  -> Failed to scrape ${option.text}:`, e);
            }
        }

        const examWindows = results;

        // Fallback if automation failed completely (e.g. selector changed)
        if (examWindows.length === 0) {
            console.log("Automation returned 0 results. Using Fallback.");
            // ... fallback logic (optional, but requested to keep 2026) ...
            return [
                { sessionName: 'February 2020', startDate: '2026-02-17', endDate: '2026-02-23' },
                { sessionName: 'May 2020', startDate: '2026-05-20', endDate: '2026-05-26' },
                { sessionName: 'August 2020', startDate: '2026-08-20', endDate: '2026-08-26' },
                { sessionName: 'November 2020', startDate: '2026-11-20', endDate: '2026-11-26' }
            ];
        }

        console.log(`Found ${examWindows.length} exam windows.`);

        // Save to Database
        for (const window of examWindows) {
            await prisma.examWindow.upsert({
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
            console.log(`Synced: ${window.sessionName}`);
        }

        console.log('Sync completed successfully.');

    } catch (error) {
        console.error('Scraping failed:', error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
        await prisma.$disconnect();
    }
}

main();
