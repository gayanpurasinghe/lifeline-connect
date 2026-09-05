import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET() {
    let connection;
    try {
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        // 1. Fetch pending/partial hospital requests and their items
        const requestsSql = `
      SELECT 
        br.RequestID,
        h.Name AS HospitalName,
        h.Location AS HospitalLocation,
        br.Priority,
        TO_CHAR(br.RequiredDate, 'YYYY-MM-DD') AS RequiredDate,
        br.Status AS RequestStatus,
        ri.RequestItemID,
        ri.BloodGroup,
        ri.ComponentType,
        ri.UnitsRequested,
        ri.UnitsFulfilled,
        (ri.UnitsRequested - ri.UnitsFulfilled) AS UnitsRemaining
      FROM BLOOD_REQUEST br
      INNER JOIN HOSPITAL h ON br.HospitalID = h.HospitalID
      INNER JOIN REQUEST_ITEM ri ON br.RequestID = ri.RequestID
      WHERE ri.UnitsFulfilled < ri.UnitsRequested
      ORDER BY 
        CASE br.Priority 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'URGENT' THEN 2 
          ELSE 3 
        END,
        br.RequiredDate ASC
    `;

        // 2. Fetch available, unexpired blood units in inventory
        const unitsSql = `
      SELECT 
        UnitID,
        BloodGroup,
        ComponentType,
        Volume_ml,
        StorageLocation,
        TO_CHAR(ExpiryDate, 'YYYY-MM-DD') AS ExpiryDate,
        ROUND(ExpiryDate - SYSDATE, 1) AS DaysRemaining
      FROM BLOOD_UNIT
      WHERE Status = 'AVAILABLE'
        AND ExpiryDate > SYSDATE
      ORDER BY ExpiryDate ASC
    `;

        // 3. Fetch active medical/technician staff to attribute dispatch
        const staffSql = `
      SELECT StaffID, Name, Role 
      FROM STAFF 
      WHERE Status = 'ACTIVE'
      ORDER BY Name ASC
    `;

        const [requestsRes, unitsRes, staffRes] = await Promise.all([
            connection.execute(requestsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(unitsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(staffSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
        ]);

        return NextResponse.json({
            success: true,
            requests: requestsRes.rows || [],
            availableUnits: unitsRes.rows || [],
            staff: staffRes.rows || [],
        });
    } catch (error: any) {
        console.error('Distribution GET Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { requestItemId, unitId, staffId, notes } = body;

        if (!requestItemId || !unitId || !staffId) {
            return NextResponse.json(
                { success: false, error: 'Requisition Item, Unit, and Authorizing Staff are required.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        // Insert into DISTRIBUTION table
        // Fires TRG_AFTER_DISTRIBUTION:
        // 1. Sets BLOOD_UNIT.Status = 'DISTRIBUTED'
        // 2. Increments REQUEST_ITEM.UnitsFulfilled = UnitsFulfilled + 1
        const distResult = await connection.execute(
            `INSERT INTO DISTRIBUTION (RequestItemID, UnitID, StaffID, Notes)
       VALUES (:requestItemId, :unitId, :staffId, :notes)
       RETURNING DistributionID INTO :distId`,
            {
                requestItemId: parseInt(requestItemId, 10),
                unitId: parseInt(unitId, 10),
                staffId: parseInt(staffId, 10),
                notes: notes || 'Standard clinical dispatch',
                distId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const distId = (distResult.outBinds as any).distId[0];

        return NextResponse.json(
            {
                success: true,
                distributionId: distId,
                message: `Unit #${unitId} distributed successfully. Trigger TRG_AFTER_DISTRIBUTION updated inventory and requisition counters.`,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Distribution Dispatch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}