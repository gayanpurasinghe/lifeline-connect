import { NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/db/oracle';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = `
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

        const result = await executeOracleQuery(sql);
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Oracle Camps Fetch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}