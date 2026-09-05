import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Review from '@/lib/models/Review';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectMongo();

        // MongoDB Aggregation Pipeline: $group -> $avg -> $sort -> $limit
        const topCamps = await Review.aggregate([
            {
                $group: {
                    _id: '$campId',
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    averageWaitTime: { $avg: '$waitingTimeMinutes' },
                },
            },
            {
                $sort: {
                    averageRating: -1,
                    totalReviews: -1,
                },
            },
            {
                $limit: 5,
            },
            {
                $project: {
                    campId: '$_id',
                    _id: 0,
                    averageRating: { $round: ['$averageRating', 1] },
                    totalReviews: 1,
                    averageWaitTime: { $round: ['$averageWaitTime', 0] },
                },
            },
        ]);

        return NextResponse.json({ success: true, data: topCamps });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}