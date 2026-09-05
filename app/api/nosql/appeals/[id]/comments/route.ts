import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Appeal from '@/lib/models/Appeal';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { authorName, contactNumber, message } = body;

        if (!authorName || !message) {
            return NextResponse.json(
                { success: false, error: 'Author name and message are required' },
                { status: 400 }
            );
        }

        await connectMongo();
        const updated = await Appeal.findByIdAndUpdate(
            id,
            {
                $push: {
                    comments: {
                        authorName,
                        contactNumber: contactNumber || 'Not provided',
                        message,
                        postedAt: new Date(),
                    },
                },
            },
            { new: true }
        );

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}