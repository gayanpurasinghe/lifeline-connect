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