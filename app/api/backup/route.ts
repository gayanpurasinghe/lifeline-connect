import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/db/oracle';
import { connectMongo } from '@/lib/db/mongodb';
import CampaignMedia from '@/lib/models/CampaignMedia';
import Review from '@/lib/models/Review';
import Appeal from '@/lib/models/Appeal';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ORACLE_TABLES = [
    'VENUE',
    'STAFF',
    'VOLUNTEER',
    'CAMP',
    'CAMP_STAFF',
    'CAMP_VOLUNTEER',
    'DONOR',
    'DONOR_HEALTH',
    'DONATION',
    'BLOOD_UNIT',
    'HOSPITAL',
    'BLOOD_REQUEST',
    'REQUEST_ITEM',
    'DISTRIBUTION',
];

export async function POST() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDirName = `backup_${timestamp}`;
    const backupsRoot = path.join(process.cwd(), 'resourses', 'backups');
    const targetDir = path.join(backupsRoot, backupDirName);

    const resultSummary: {
        timestamp: string;
        oracle: Record<string, number>;
        mongodb: Record<string, number>;
        totalRecords: number;
        storageLocation: string;
    } = {
        timestamp: new Date().toISOString(),
        oracle: {},
        mongodb: {},
        totalRecords: 0,
        storageLocation: `resourses/backups/${backupDirName}`,
    };

    const fullDump: {
        timestamp: string;
        oracle: Record<string, any[]>;
        mongodb: Record<string, any[]>;
    } = {
        timestamp: resultSummary.timestamp,
        oracle: {},
        mongodb: {},
    };

    try {
        if (!fs.existsSync(backupsRoot)) {
            fs.mkdirSync(backupsRoot, { recursive: true });
        }
        fs.mkdirSync(targetDir, { recursive: true });

        // 1. Export Oracle 21c (14 Normalized 3NF Tables)
        for (const table of ORACLE_TABLES) {
            try {
                const queryResult = await executeOracleQuery(`SELECT * FROM ${table}`);
                const rows = queryResult.rows || [];
                fullDump.oracle[table] = rows;
                resultSummary.oracle[table] = rows.length;
                resultSummary.totalRecords += rows.length;
            } catch (tableErr: any) {
                console.warn(`Could not export table ${table}:`, tableErr.message);
                fullDump.oracle[table] = [];
                resultSummary.oracle[table] = 0;
            }
        }

        // 2. Export MongoDB NoSQL Collections
        try {
            await connectMongo();

            const [media, reviews, appeals] = await Promise.all([
                CampaignMedia.find({}).lean(),
                Review.find({}).lean(),
                Appeal.find({}).lean(),
            ]);

            fullDump.mongodb['CampaignMedia'] = media || [];
            fullDump.mongodb['Review'] = reviews || [];
            fullDump.mongodb['Appeal'] = appeals || [];

            resultSummary.mongodb['CampaignMedia'] = (media || []).length;
            resultSummary.mongodb['Review'] = (reviews || []).length;
            resultSummary.mongodb['Appeal'] = (appeals || []).length;
            resultSummary.totalRecords += (media || []).length + (reviews || []).length + (appeals || []).length;
        } catch (mongoErr: any) {
            console.warn('Could not export MongoDB collections:', mongoErr.message);
        }

        // 3. Save Files
        fs.writeFileSync(path.join(targetDir, 'oracle_snapshot.json'), JSON.stringify(fullDump.oracle, null, 2));
        fs.writeFileSync(path.join(targetDir, 'mongodb_snapshot.json'), JSON.stringify(fullDump.mongodb, null, 2));
        fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(resultSummary, null, 2));

        return NextResponse.json({
            success: true,
            message: `Dual-database backup completed successfully (${resultSummary.totalRecords} total records exported).`,
            summary: resultSummary,
            backupData: fullDump,
        });
    } catch (error: any) {
        console.error('Backup API Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        const backupsRoot = path.join(process.cwd(), 'resourses', 'backups');

        if (!fs.existsSync(backupsRoot)) {
            return NextResponse.json({ success: true, backups: [] });
        }

        const entries = fs.readdirSync(backupsRoot, { withFileTypes: true });
        const backupDirs = entries
            .filter((d) => d.isDirectory() && d.name.startsWith('backup_'))
            .map((d) => {
                const manifestPath = path.join(backupsRoot, d.name, 'manifest.json');
                let manifest = null;
                if (fs.existsSync(manifestPath)) {
                    try {
                        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
                    } catch {}
                }
                return {
                    name: d.name,
                    manifest,
                };
            })
            .reverse();

        return NextResponse.json({ success: true, backups: backupDirs });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
