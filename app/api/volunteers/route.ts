import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        let sql = `
            SELECT v.VolunteerID, v.Name, v.Contact, v.Email, v.Skills, v.Status,
                   COUNT(cv.CampID) AS AssignedCampsCount
            FROM VOLUNTEER v
            LEFT JOIN CAMP_VOLUNTEER cv ON v.VolunteerID = cv.VolunteerID
        `;

        const binds: oracledb.BindParameters = {};

        if (statusFilter && statusFilter !== 'ALL') {
            sql += ` WHERE v.Status = :status`;
            binds['status'] = statusFilter.toUpperCase();
        }

        sql += `
            GROUP BY v.VolunteerID, v.Name, v.Contact, v.Email, v.Skills, v.Status
            ORDER BY v.VolunteerID ASC
        `;

        const result = await connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return NextResponse.json({ success: true, data: result.rows || [] });
    } catch (error: any) {
        console.error('Fetch Volunteers Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { name, contact, email, skills, status = 'ACTIVE' } = body;

        if (!name?.trim() || !contact?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Volunteer Name and Contact Phone are required.' },
                { status: 400 }
            );
        }

        const validStatuses = ['ACTIVE', 'INACTIVE'];
        const finalStatus = validStatuses.includes(status) ? status : 'ACTIVE';

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const insertSql = `
            INSERT INTO VOLUNTEER (Name, Contact, Email, Skills, Status)
            VALUES (:name, :contact, :email, :skills, :status)
            RETURNING VolunteerID INTO :volunteerId
        `;

        const result = await connection.execute(
            insertSql,
            {
                name: name.trim(),
                contact: contact.trim(),
                email: email?.trim() || null,
                skills: skills?.trim() || 'General Assistance',
                status: finalStatus,
                volunteerId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newVolunteerId = (result.outBinds as any).volunteerId[0];

        return NextResponse.json({
            success: true,
            volunteerId: newVolunteerId,
            message: `Volunteer '${name.trim()}' registered successfully (Volunteer ID #${newVolunteerId}).`,
            volunteer: {
                VOLUNTEERID: newVolunteerId,
                NAME: name.trim(),
                CONTACT: contact.trim(),
                EMAIL: email?.trim() || null,
                SKILLS: skills?.trim() || 'General Assistance',
                STATUS: finalStatus,
            },
        });
    } catch (error: any) {
        console.error('Add Volunteer Error:', error);

        if (error.message?.includes('ORA-00001')) {
            return NextResponse.json(
                { success: false, error: 'A volunteer with this email address already exists.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function PATCH(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { volunteerId, status, skills, contact } = body;

        if (!volunteerId) {
            return NextResponse.json({ success: false, error: 'VolunteerID is required.' }, { status: 400 });
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const updates: string[] = [];
        const binds: oracledb.BindParameters = { volunteerId: Number(volunteerId) };

        if (status) {
            const validStatuses = ['ACTIVE', 'INACTIVE'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ success: false, error: 'Invalid status value.' }, { status: 400 });
            }
            updates.push(`Status = :status`);
            binds['status'] = status;
        }

        if (skills) {
            updates.push(`Skills = :skills`);
            binds['skills'] = skills.trim();
        }

        if (contact) {
            updates.push(`Contact = :contact`);
            binds['contact'] = contact.trim();
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update.' }, { status: 400 });
        }

        const updateSql = `UPDATE VOLUNTEER SET ${updates.join(', ')} WHERE VolunteerID = :volunteerId`;
        await connection.execute(updateSql, binds, { autoCommit: true });

        return NextResponse.json({
            success: true,
            message: `Volunteer #${volunteerId} updated successfully.`,
        });
    } catch (error: any) {
        console.error('Update Volunteer Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}
