import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery, getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const campId = parseInt(id, 10);

        if (isNaN(campId)) {
            return NextResponse.json({ success: false, error: 'Invalid Camp ID' }, { status: 400 });
        }

        // 1. Fetch Assigned Medical & Administrative Staff
        const staffSql = `
            SELECT 
                cs.AssignmentID,
                cs.CampID,
                cs.Role AS AssignedRole,
                TO_CHAR(cs.AssignedDate, 'YYYY-MM-DD') AS AssignedDate,
                s.StaffID,
                s.Name AS StaffName,
                s.Role AS PrimaryRole,
                s.Contact,
                s.Email
            FROM CAMP_STAFF cs
            INNER JOIN STAFF s ON cs.StaffID = s.StaffID
            WHERE cs.CampID = :campId
            ORDER BY s.Name ASC
        `;

        // 2. Fetch Assigned Volunteers
        const volunteerSql = `
            SELECT 
                cv.AssignmentID,
                cv.CampID,
                cv.Role AS AssignedRole,
                TO_CHAR(cv.AssignedDate, 'YYYY-MM-DD') AS AssignedDate,
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
        console.error('Fetch Camp Roster Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;
    try {
        const { id } = await params;
        const campId = parseInt(id, 10);

        if (isNaN(campId)) {
            return NextResponse.json({ success: false, error: 'Invalid Camp ID' }, { status: 400 });
        }

        const body = await request.json();
        const { type, personId, role } = body;

        if (!type || !personId || !role?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Type (STAFF or VOLUNTEER), Person ID, and Role are required.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        if (type.toUpperCase() === 'STAFF') {
            const insertSql = `
                INSERT INTO CAMP_STAFF (CampID, StaffID, Role)
                VALUES (:campId, :personId, :role)
                RETURNING AssignmentID INTO :assignmentId
            `;

            const result = await connection.execute(
                insertSql,
                {
                    campId,
                    personId: Number(personId),
                    role: role.trim(),
                    assignmentId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                },
                { autoCommit: true }
            );

            const newId = (result.outBinds as any).assignmentId[0];

            return NextResponse.json({
                success: true,
                assignmentId: newId,
                message: `Staff member #${personId} successfully assigned as '${role.trim()}' to Camp #${campId}.`,
            });
        } else if (type.toUpperCase() === 'VOLUNTEER') {
            const insertSql = `
                INSERT INTO CAMP_VOLUNTEER (CampID, VolunteerID, Role)
                VALUES (:campId, :personId, :role)
                RETURNING AssignmentID INTO :assignmentId
            `;

            const result = await connection.execute(
                insertSql,
                {
                    campId,
                    personId: Number(personId),
                    role: role.trim(),
                    assignmentId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                },
                { autoCommit: true }
            );

            const newId = (result.outBinds as any).assignmentId[0];

            return NextResponse.json({
                success: true,
                assignmentId: newId,
                message: `Volunteer #${personId} successfully assigned with duty '${role.trim()}' to Camp #${campId}.`,
            });
        } else {
            return NextResponse.json({ success: false, error: 'Invalid assignment type. Must be STAFF or VOLUNTEER.' }, { status: 400 });
        }
    } catch (error: any) {
        console.error('Assign to Camp Error:', error);

        if (error.message?.includes('ORA-00001')) {
            return NextResponse.json(
                { success: false, error: 'This person is already assigned to this camp drive.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const assignmentId = searchParams.get('assignmentId');

        if (!type || !assignmentId) {
            return NextResponse.json(
                { success: false, error: 'Assignment Type and AssignmentID are required.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        let deleteSql = '';
        if (type.toUpperCase() === 'STAFF') {
            deleteSql = `DELETE FROM CAMP_STAFF WHERE AssignmentID = :assignmentId`;
        } else if (type.toUpperCase() === 'VOLUNTEER') {
            deleteSql = `DELETE FROM CAMP_VOLUNTEER WHERE AssignmentID = :assignmentId`;
        } else {
            return NextResponse.json({ success: false, error: 'Invalid type. Must be STAFF or VOLUNTEER.' }, { status: 400 });
        }

        const result = await connection.execute(deleteSql, { assignmentId: Number(assignmentId) }, { autoCommit: true });

        if (result.rowsAffected === 0) {
            return NextResponse.json({ success: false, error: 'Assignment record not found.' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Assignment #${assignmentId} successfully removed from camp roster.`,
        });
    } catch (error: any) {
        console.error('Delete Camp Assignment Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}