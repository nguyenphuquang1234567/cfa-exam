import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import pdf from 'pdf-parse';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

async function processPDF(fileName: string) {
    const PDF_PATH = path.resolve(process.cwd(), fileName);
    const shortName = fileName.replace('.pdf', '');

    console.log(`📖 Đang đọc file: ${fileName}...`);

    if (!fs.existsSync(PDF_PATH)) {
        console.error('❌ Không tìm thấy file tại:', PDF_PATH);
        return;
    }

    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdf(dataBuffer);

    console.log(`✅ Đã đọc xong [${shortName}]. Tổng số trang: ${data.numpages}`);

    // Clean text: collapse multiple spaces/tabs into one to save tokens and improve embedding quality
    const fullText = data.text.replace(/\s+/g, ' ').replace(/\u0000/g, '').trim();

    console.log(`✂️ Đang chia nhỏ [${shortName}] (Chunking)...`);
    const chunks: string[] = [];
    let start = 0;

    while (start < fullText.length) {
        const end = Math.min(start + CHUNK_SIZE, fullText.length);
        chunks.push(fullText.substring(start, end).trim());
        start += (CHUNK_SIZE - CHUNK_OVERLAP);
    }

    console.log(`📦 Tổng cộng có ${chunks.length} đoạn văn cần xử lý cho ${shortName}.`);

    for (let i = 0; i < chunks.length; i++) {
        try {
            const content = chunks[i];
            if (content.length < 100) continue;

            console.log(`- [${shortName}] Đang xử lý đoạn ${i + 1}/${chunks.length}...`);

            const embedResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: content,
            });

            const embedding = embedResponse.data[0].embedding;

            await prisma.$executeRawUnsafe(
                `INSERT INTO "DocumentChunk" (id, "fileName", content, embedding) VALUES ($1, $2, $3, $4::vector)`,
                `chunk-${shortName.replace(/\s+/g, '-')}-${Date.now()}-${i}`,
                shortName,
                content,
                `[${embedding.join(',')}]`
            );

            await new Promise(r => setTimeout(r, 40));
        } catch (err) {
            console.error(`❌ Lỗi tại đoạn ${i}:`, err);
        }
    }
}

async function main() {
    await processPDF('CFA 2025 Level I - SchweserNotes Book 4.pdf');
    console.log('✅ Đã nạp xong Book 4!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
