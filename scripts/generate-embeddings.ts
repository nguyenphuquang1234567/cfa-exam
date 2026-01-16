import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbeddings() {
    console.log('🚀 Starting embedding generation for all tables...');

    try {
        // 1. Process Main Question Table
        const questions: any[] = await prisma.$queryRaw`
            SELECT id, content, explanation FROM "Question" WHERE embedding IS NULL
        `;
        console.log(`Found ${questions.length} main questions needing embeddings.`);

        for (const q of questions) {
            try {
                const textToEmbed = `Question: ${q.content}\nExplanation: ${q.explanation || ''}`;
                console.log(`- Generating for Question ID: ${q.id.substring(0, 8)}...`);
                const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: textToEmbed });
                const embedding = response.data[0].embedding;
                await prisma.$executeRawUnsafe(`UPDATE "Question" SET embedding = $1::vector WHERE id = $2`, `[${embedding.join(',')}]`, q.id);
                await new Promise(r => setTimeout(r, 100));
            } catch (err) { console.error(`❌ Error Question ${q.id}:`, err); }
        }

        // 2. Process ModuleQuizQuestion Table
        const moduleQuestions: any[] = await prisma.$queryRaw`
            SELECT id, prompt as content, explanation FROM "ModuleQuizQuestion" WHERE embedding IS NULL
        `;
        console.log(`Found ${moduleQuestions.length} module questions needing embeddings.`);

        for (const mq of moduleQuestions) {
            try {
                const textToEmbed = `Curriculum Question: ${mq.content}\nExplanation: ${mq.explanation || ''}`;
                console.log(`- Generating for Module Question ID: ${mq.id.substring(0, 8)}...`);
                const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: textToEmbed });
                const embedding = response.data[0].embedding;
                await prisma.$executeRawUnsafe(`UPDATE "ModuleQuizQuestion" SET embedding = $1::vector WHERE id = $2`, `[${embedding.join(',')}]`, mq.id);
                await new Promise(r => setTimeout(r, 100));
            } catch (err) { console.error(`❌ Error Module Question ${mq.id}:`, err); }
        }

        console.log('✅ All tables processed!');
    } catch (error) {
        console.error('💥 Critical Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateEmbeddings();
