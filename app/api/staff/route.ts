import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET() {
    let connection;
    try {
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const sql = `
      SELECT StaffID, Name, Role, Contact, Email, Status
      FROM STAFF
      WHERE Status = 'ACTIVE'
      ORDER BY Name ASC
    `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return NextResponse.json({ success: true, data: result.rows || [] });
    } catch (error: any) {
        console.error('Fetch Staff Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { name, role, contact, email, status = 'ACTIVE' } = body;

        if (!name?.trim() || !role?.trim() || !contact?.trim() || !email?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Staff Name, Role, Contact Phone, and Email are required.' },
                { status: 400 }
            );
        }

        const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'];
        const finalStatus = validStatuses.includes(status) ? status : 'ACTIVE';

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const insertSql = `
      INSERT INTO STAFF (Name, Role, Contact, Email, Status)
      VALUES (:name, :role, :contact, :email, :status)
      RETURNING StaffID INTO :staffId
    `;

        const result = await connection.execute(
            insertSql,
            {
                name: name.trim(),
                role: role.trim(),
                contact: contact.trim(),
                email: email.trim(),
                status: finalStatus,
                staffId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newStaffId = (result.outBinds as any).staffId[0];

        return NextResponse.json({
            success: true,
            staffId: newStaffId,
            message: `Staff member '${name.trim()}' added successfully (Staff ID #${newStaffId}).`,
            staff: {
                STAFFID: newStaffId,
                NAME: name.trim(),
                ROLE: role.trim(),
                CONTACT: contact.trim(),
                EMAIL: email.trim(),
                STATUS: finalStatus,
            },
        });
    } catch (error: any) {
        console.error('Add Staff Error:', error);

        if (error.message?.includes('ORA-00001')) {
            return NextResponse.json(
                { success: false, error: 'A staff member with this email address already exists.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}
