import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET() {
    let connection;
    try {
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const campsSql = `
      SELECT 
        c.CampID,
        c.Name AS CampName,
        TO_CHAR(c.StartDate, 'YYYY-MM-DD') AS StartDate,
        TO_CHAR(c.EndDate, 'YYYY-MM-DD') AS EndDate,
        c.TargetUnits,
        c.Status,
        v.Name AS VenueName,
        v.City,
        v.Address,
        s.Name AS OrganizerName,
        NVL(SUM(dn.UnitsDonated), 0) AS UnitsCollected
      FROM CAMP c
      INNER JOIN VENUE v ON c.VenueID = v.VenueID
      INNER JOIN STAFF s ON c.OrganizerID = s.StaffID
      LEFT JOIN DONATION dn ON c.CampID = dn.CampID
      GROUP BY 
        c.CampID, c.Name, c.StartDate, c.EndDate, c.TargetUnits, c.Status,
        v.Name, v.City, v.Address, s.Name
      ORDER BY c.StartDate DESC
    `;

        const venuesSql = `
      SELECT VenueID, Name, City, Address, Capacity
      FROM VENUE
      ORDER BY Name ASC
    `;

        const staffSql = `
      SELECT StaffID, Name, Role
      FROM STAFF
      WHERE Status = 'ACTIVE'
      ORDER BY Name ASC
    `;

        const [campsRes, venuesRes, staffRes] = await Promise.all([
            connection.execute(campsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(venuesSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(staffSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
        ]);

        return NextResponse.json({
            success: true,
            data: campsRes.rows || [],
            venues: venuesRes.rows || [],
            organizers: staffRes.rows || [],
        });
    } catch (error: any) {
        console.error('Oracle Camps Fetch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const {
            name,
            venueId,
            startDate,
            endDate,
            targetUnits,
            organizerId,
            status = 'PLANNED',
        } = body;

        if (!name?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Camp Name is required.' },
                { status: 400 }
            );
        }
        if (!venueId) {
            return NextResponse.json(
                { success: false, error: 'Host Venue selection is required.' },
                { status: 400 }
            );
        }
        if (!organizerId) {
            return NextResponse.json(
                { success: false, error: 'Lead Organizer selection is required.' },
                { status: 400 }
            );
        }
        if (!startDate || !endDate) {
            return NextResponse.json(
                { success: false, error: 'Start Date and End Date are required.' },
                { status: 400 }
            );
        }
        if (new Date(endDate) < new Date(startDate)) {
            return NextResponse.json(
                { success: false, error: 'End Date cannot be earlier than Start Date.' },
                { status: 400 }
            );
        }

        const numericTarget = parseInt(targetUnits || '50', 10);
        if (isNaN(numericTarget) || numericTarget <= 0) {
            return NextResponse.json(
                { success: false, error: 'Target Units must be greater than 0.' },
                { status: 400 }
            );
        }

        const validStatuses = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
        const finalStatus = validStatuses.includes(status) ? status : 'PLANNED';

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const insertSql = `
      INSERT INTO CAMP (
        Name,
        VenueID,
        StartDate,
        EndDate,
        TargetUnits,
        Status,
        OrganizerID
      ) VALUES (
        :name,
        :venueId,
        TO_DATE(:startDate, 'YYYY-MM-DD'),
        TO_DATE(:endDate, 'YYYY-MM-DD'),
        :targetUnits,
        :status,
        :organizerId
      )
      RETURNING CampID INTO :campId
    `;

        const result = await connection.execute(
            insertSql,
            {
                name: name.trim(),
                venueId: parseInt(venueId, 10),
                startDate,
                endDate,
                targetUnits: numericTarget,
                status: finalStatus,
                organizerId: parseInt(organizerId, 10),
                campId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newCampId = (result.outBinds as any).campId[0];

        return NextResponse.json({
            success: true,
            campId: newCampId,
            message: `Blood donation drive '${name.trim()}' scheduled successfully (Camp ID #${newCampId}).`,
        });
    } catch (error: any) {
        console.error('Schedule Camp Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}