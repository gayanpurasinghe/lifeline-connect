import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/db/oracle';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const campId = parseInt(id, 10);

        // 1. Fetch Assigned Medical & Administrative Staff
        const staffSql = `
      SELECT 
        cs.CampID,
        cs.AssignedRole,
        s.StaffID,
        s.Name AS StaffName,
        s.Role AS PrimaryRole,
        s.Contact
      FROM CAMP_STAFF cs
      INNER JOIN STAFF s ON cs.StaffID = s.StaffID
      WHERE cs.CampID = :campId
      ORDER BY s.Name ASC
    `;

        // 2. Fetch Assigned Volunteers
        const volunteerSql = `
      SELECT 
        cv.CampID,
        cv.AssignedTask,
        cv.HoursContributed,
        v.VolunteerID,
        v.Name AS VolunteerName,
        v.Contact,
        v.Skills
      FROM CAMP_VOLUNTEER cv
      INNER JOIN VOLUNTEER v ON cv.VolunteerID = v.VolunteerID
      WHERE cv.CampID = :campId
      ORDER BY v.Name ASC
    `;

        const [staffResult, volunteerResult] = await Promise.all([
            executeOracleQuery(staffSql, [campId]),
            executeOracleQuery(volunteerSql, [campId]),
        ]);

        return NextResponse.json({
            success: true,
            campId,
            staff: staffResult.rows || [],
            volunteers: volunteerResult.rows || [],
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}