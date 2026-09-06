import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import CampaignMedia from '@/lib/models/CampaignMedia';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        await connectMongo();
        const { searchParams } = request.nextUrl;
        const category = searchParams.get('category');
        const tag = searchParams.get('tag');

        const filter: any = {};
        if (category) filter.category = category;
        if (tag) filter.tags = tag;

        // Seed baseline flexible documents if empty
        const count = await CampaignMedia.countDocuments();
        if (count === 0) {
            await CampaignMedia.create([
                {
                    title: 'Pre-Donation Hemoglobin & Iron Diet Guidelines',
                    category: 'GUIDELINE',
                    fileFormat: 'PDF',
                    fileUrl: 'https://lifeline.lk/docs/iron-diet-guide.pdf',
                    tags: ['DonorHealth', 'Screening', 'IronDiet'],
                    flexibleMetadata: {
                        targetAudience: 'First-time donors',
                        authorRole: 'Clinical Nutritionist',
                        pages: 4,
                        minimumHbRecommended: '12.5 g/dL',
                        recommendedFoods: ['Spinach', 'Lentils', 'Red Meat', 'Citrus Fruits'],
                    },
                },
                {
                    title: 'National Blood Drive 2026 Social Banner Kit',
                    category: 'PROMOTIONAL_MEDIA',
                    fileFormat: 'ZIP (PNG/SVG)',
                    fileUrl: 'https://lifeline.lk/media/drive-2026-kit.zip',
                    tags: ['Promotion', 'Banners', 'SocialMedia'],
                    flexibleMetadata: {
                        dimensions: ['1080x1080', '1920x1080', '1080x1920'],
                        colorPalette: ['#E11D48', '#0F172A', '#FFFFFF'],
                        languagesAvailable: ['English', 'Sinhala', 'Tamil'],
                        campaignLicense: 'CC-BY-4.0',
                    },
                },
                {
                    title: 'Community Platelet Apheresis Awareness Infographic',
                    category: 'AWARENESS',
                    fileFormat: 'PNG',
                    fileUrl: 'https://lifeline.lk/media/apheresis-infographic.png',
                    tags: ['Platelets', 'Apheresis', 'CancerSupport'],
                    flexibleMetadata: {
                        readingTimeMinutes: 2,
                        targetConditions: ['Leukemia', 'Trauma Resuscitation'],
                        donorRestPeriodDays: 14,
                    },
                },
            ]);
        }

        const items = await CampaignMedia.find(filter).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, count: items.length, data: items });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectMongo();
        const body = await request.json();
        const { title, category, fileFormat, fileUrl, tags, flexibleMetadata } = body;

        if (!title?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Document Title is required.' },
                { status: 400 }
            );
        }

        const validCategories = ['GUIDELINE', 'AWARENESS', 'PROMOTIONAL_MEDIA'];
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
                { status: 400 }
            );
        }

        if (!fileFormat?.trim()) {
            return NextResponse.json(
                { success: false, error: 'File format is required (e.g. PDF, PNG, MP4, ZIP).' },
                { status: 400 }
            );
        }

        if (!fileUrl?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Asset download or preview URL is required.' },
                { status: 400 }
            );
        }

        let parsedTags: string[] = [];
        if (Array.isArray(tags)) {
            parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
        } else if (typeof tags === 'string') {
            parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }

        let metadataObj = {};
        if (flexibleMetadata && typeof flexibleMetadata === 'object') {
            metadataObj = flexibleMetadata;
        }

        const newMedia = await CampaignMedia.create({
            title: title.trim(),
            category,
            fileFormat: fileFormat.trim().toUpperCase(),
            fileUrl: fileUrl.trim(),
            tags: parsedTags,
            flexibleMetadata: metadataObj,
        });

        return NextResponse.json(
            {
                success: true,
                data: newMedia,
                message: `Media asset '${newMedia.title}' registered successfully in MongoDB document store.`,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('CampaignMedia POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectMongo();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });
        }

        const deleted = await CampaignMedia.findByIdAndDelete(id);
        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Document '${deleted.title}' deleted successfully from MongoDB.`,
        });
    } catch (error: any) {
        console.error('CampaignMedia DELETE Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}