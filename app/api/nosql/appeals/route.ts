import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Appeal from '@/lib/models/Appeal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        const { searchParams } = request.nextUrl;
        const bloodGroup = searchParams.get('bloodGroup');
        const keyword = searchParams.get('keyword');

        const filter: any = {};
        if (bloodGroup) filter.bloodGroup = bloodGroup;

        if (keyword && keyword.trim() !== '') {
            const regex = new RegExp(keyword.trim(), 'i');
            filter.$or = [
                { hospitalName: regex },
                { location: regex },
                { 'comments.message': regex },
                { 'comments.authorName': regex },
            ];
        }

        const appeals = await Appeal.find(filter).sort({ createdAt: -1 }).lean();
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