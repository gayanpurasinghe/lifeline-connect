import mongoose, { Schema, Document } from 'mongoose';

export interface IComment {
    authorName: string;
    contactNumber: string;
    message: string;
    postedAt: Date;
}

export interface IAppeal extends Document {
    hospitalName: string;
    bloodGroup: string;
    unitsNeeded: number;
    urgency: 'CRITICAL' | 'URGENT' | 'STANDARD';
    location: string;
    isActive: boolean;
    comments: IComment[];
    createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
    authorName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    message: { type: String, required: true },
    postedAt: { type: Date, default: Date.now },
});

const AppealSchema = new Schema<IAppeal>({
    hospitalName: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    unitsNeeded: { type: Number, required: true },
    urgency: { type: String, enum: ['CRITICAL', 'URGENT', 'STANDARD'], default: 'URGENT' },
    location: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    comments: [CommentSchema],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Appeal || mongoose.model<IAppeal>('Appeal', AppealSchema);