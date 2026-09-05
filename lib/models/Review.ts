import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
    campId: number;
    donorName: string;
    rating: number;
    feedback: string;
    waitingTimeMinutes?: number;
    createdAt: Date;
}

const ReviewSchema = new Schema<IReview>({
    campId: { type: Number, required: true, index: true },
    donorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, required: true },
    waitingTimeMinutes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);