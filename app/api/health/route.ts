import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/db/oracle';
import { connectMongo } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    const status = {
        oracle: 'UNKNOWN',
        mongo: 'UNKNOWN',
        timestamp: new Date().toISOString(),
    };

    // Test Oracle
    try {
        const oracleRes = await executeOracleQuery('SELECT SYSDATE AS CURRENT_TIME FROM DUAL');
        status.oracle = oracleRes.rows ? 'CONNECTED' : 'EMPTY_RESULT';
    } catch (error: any) {
        status.oracle = `ERROR: ${error.message}`;
    }

    // Test MongoDB
    try {
        const mongoConn = await connectMongo();
        status.mongo = mongoConn.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    } catch (error: any) {
        status.mongo = `ERROR: ${error.message}`;
    }

    return NextResponse.json(status);
}