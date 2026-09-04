import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongoCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    var mongooseCache: MongoCache | undefined;
}

let cached: MongoCache = globalThis.mongooseCache || { conn: null, promise: null };

if (!globalThis.mongooseCache) {
    globalThis.mongooseCache = cached;
}

export async function connectMongo() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        }).then((m) => m);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}