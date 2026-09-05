import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Appeal from '@/lib/models/Appeal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        const { searchParams } = request.nextUrl;
        const bloodGroup = searchParams.get('bloodGroup');

        // Filter by required blood type if provided, otherwise retrieve all active
        const query: any = { isActive: true };
        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        let appeals = await Appeal.find(query).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, count: appeals.length, data: appeals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        const body = await request.json();
        const newAppeal = await Appeal.create(body);
        return NextResponse.json({ success: true, data: newAppeal }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}