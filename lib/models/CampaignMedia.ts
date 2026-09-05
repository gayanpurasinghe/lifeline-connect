import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaignMedia extends Document {
    title: string;
    category: 'GUIDELINE' | 'PROMOTIONAL_MEDIA' | 'AWARENESS';
    fileFormat: string;
    fileUrl: string;
    tags: string[];
    flexibleMetadata: Record<string, any>;
    createdAt: Date;
}

const CampaignMediaSchema = new Schema<ICampaignMedia>(
    {
        title: { type: String, required: true },
        category: {
            type: String,
            enum: ['GUIDELINE', 'PROMOTIONAL_MEDIA', 'AWARENESS'],
            required: true,
        },
        fileFormat: { type: String, required: true },
        fileUrl: { type: String, required: true },
        tags: [{ type: String }],
        flexibleMetadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

export default mongoose.models.CampaignMedia ||
    mongoose.model<ICampaignMedia>('CampaignMedia', CampaignMediaSchema);