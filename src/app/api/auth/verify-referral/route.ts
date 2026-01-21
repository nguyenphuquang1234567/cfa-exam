import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        // Hardcoded check for now, can be database driven later
        const isValid = code === 'mentis1321';

        return NextResponse.json({ valid: isValid });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
