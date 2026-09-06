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
      SELECT HospitalID, Name, Location, Contact, Email
      FROM HOSPITAL
      ORDER BY Name ASC
    `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return NextResponse.json({ success: true, data: result.rows || [] });
    } catch (error: any) {
        console.error('Fetch Hospitals Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { name, location, contact, email } = body;

        if (!name?.trim() || !location?.trim() || !contact?.trim() || !email?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Hospital Name, Location, Contact Phone, and Email are required.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const insertSql = `
      INSERT INTO HOSPITAL (Name, Location, Contact, Email)
      VALUES (:name, :location, :contact, :email)
      RETURNING HospitalID INTO :hospitalId
    `;

        const result = await connection.execute(
            insertSql,
            {
                name: name.trim(),
                location: location.trim(),
                contact: contact.trim(),
                email: email.trim(),
                hospitalId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newHospitalId = (result.outBinds as any).hospitalId[0];

        return NextResponse.json({
            success: true,
            hospitalId: newHospitalId,
            message: `Hospital '${name.trim()}' registered successfully (Hospital ID #${newHospitalId}).`,
            hospital: {
                HOSPITALID: newHospitalId,
                NAME: name.trim(),
                LOCATION: location.trim(),
                CONTACT: contact.trim(),
                EMAIL: email.trim(),
            },
        }, { status: 201 });
    } catch (error: any) {
        console.error('Add Hospital Error:', error);
        if (error.message?.includes('ORA-00001')) {
            return NextResponse.json(
                { success: false, error: 'A hospital with this official email address already exists.' },
                { status: 409 }
            );
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}
