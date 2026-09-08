import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
) {
    const { reportId } = await params;
    const searchParams = request.nextUrl.searchParams;
    let connection;

    try {
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        let plsqlBlock = '';
        let binds: Record<string, any> = {};

        const CURSOR_TYPE = oracledb.CURSOR;
        const BIND_OUT_DIR = oracledb.BIND_OUT;

        switch (reportId) {
            case 'units-by-camp':
                plsqlBlock = `BEGIN LIFELINE_REPORTS_PKG.GET_UNITS_COLLECTED_BY_CAMP(:p_cursor); END;`;
                binds = {
                    p_cursor: { type: CURSOR_TYPE, dir: BIND_OUT_DIR },
                };
                break;

            case 'expiring-inventory':
                const rawDays = parseInt(searchParams.get('days') || '30', 10);
                const days = isNaN(rawDays) || rawDays < 1 ? 30 : rawDays;
                plsqlBlock = `BEGIN LIFELINE_REPORTS_PKG.GET_EXPIRING_INVENTORY(:p_days_ahead, :p_cursor); END;`;
                binds = {
                    p_days_ahead: days,
                    p_cursor: { type: CURSOR_TYPE, dir: BIND_OUT_DIR },
                };
                break;

            case 'donor-history':
                const rawId = parseInt(searchParams.get('donorId') || '1', 10);
                const donorId = isNaN(rawId) || rawId < 1 ? 1 : rawId;
                plsqlBlock = `BEGIN LIFELINE_REPORTS_PKG.GET_DONOR_HISTORY_REPORT(:p_donor_id, :p_cursor); END;`;
                binds = {
                    p_donor_id: donorId,
                    p_cursor: { type: CURSOR_TYPE, dir: BIND_OUT_DIR },
                };
                break;

            case 'hospital-fulfillment':
                plsqlBlock = `BEGIN LIFELINE_REPORTS_PKG.GET_HOSPITAL_FULFILLMENT_REPORT(:p_cursor); END;`;
                binds = {
                    p_cursor: { type: CURSOR_TYPE, dir: BIND_OUT_DIR },
                };
                break;

            case 'camp-performance':
                plsqlBlock = `BEGIN LIFELINE_REPORTS_PKG.GET_CAMP_PERFORMANCE_REPORT(:p_cursor); END;`;
                binds = {
                    p_cursor: { type: CURSOR_TYPE, dir: BIND_OUT_DIR },
                };
                break;

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid report identifier' },
                    { status: 404 }
                );
        }

        const result = await connection.execute(plsqlBlock, binds, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });

        const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
        const rows = await cursor.getRows(200);
        await cursor.close();

        return NextResponse.json({
            success: true,
            report: reportId,
            count: rows.length,
            data: rows,
        });
    } catch (error: any) {
        console.error(`PL/SQL Error (${reportId}):`, error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}