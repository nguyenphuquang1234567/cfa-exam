import { Redis } from '@upstash/redis';

async function test() {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const keys = await redis.keys('*');
    console.log('All Redis Keys:', keys);

    for (const key of keys) {
        const val = await redis.get(key);
        console.log(`Key: ${key}, Value:`, val);
    }
}

test();
