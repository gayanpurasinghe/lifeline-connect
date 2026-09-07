import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        const { searchParams } = request.nextUrl;
        const campId = searchParams.get('campId');

        const parsedCampId = campId ? parseInt(campId, 10) : NaN;
        const filter = !isNaN(parsedCampId) ? { campId: parsedCampId } : {};
        const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, count: reviews.length, data: reviews });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        const body = await request.json();
        const { campId, donorName, rating, feedback, waitingTimeMinutes } = body;

        if (!campId || !donorName || !rating || !feedback) {
            return NextResponse.json(
                { success: false, error: 'Missing required review fields' },
                { status: 400 }
            );
        }

        const review = await Review.create({
            campId: Number(campId),
            donorName,
            rating: Number(rating),
            feedback,
            waitingTimeMinutes: Number(waitingTimeMinutes) || 0,
        });

        return NextResponse.json({ success: true, data: review }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}