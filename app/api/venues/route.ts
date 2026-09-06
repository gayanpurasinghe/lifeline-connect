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
      SELECT VenueID, Name, Address, City, Capacity, Contact
      FROM VENUE
      ORDER BY Name ASC
    `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return NextResponse.json({ success: true, data: result.rows || [] });
    } catch (error: any) {
        console.error('Fetch Venues Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const { name, address, city, capacity, contact } = body;

        if (!name?.trim() || !address?.trim() || !city?.trim() || !contact?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Venue Name, Address, City, and Contact Phone are required.' },
                { status: 400 }
            );
        }

        const capNum = capacity ? parseInt(capacity, 10) : 100;
        if (isNaN(capNum) || capNum <= 0) {
            return NextResponse.json(
                { success: false, error: 'Capacity must be greater than 0.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const insertSql = `
      INSERT INTO VENUE (Name, Address, City, Capacity, Contact)
      VALUES (:name, :address, :city, :capacity, :contact)
      RETURNING VenueID INTO :venueId
    `;

        const result = await connection.execute(
            insertSql,
            {
                name: name.trim(),
                address: address.trim(),
                city: city.trim(),
                capacity: capNum,
                contact: contact.trim(),
                venueId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: true }
        );

        const newVenueId = (result.outBinds as any).venueId[0];

        return NextResponse.json({
            success: true,
            venueId: newVenueId,
            message: `Venue '${name.trim()}' added successfully (Venue ID #${newVenueId}).`,
            venue: {
                VENUEID: newVenueId,
                NAME: name.trim(),
                ADDRESS: address.trim(),
                CITY: city.trim(),
                CAPACITY: capNum,
                CONTACT: contact.trim(),
            },
        });
    } catch (error: any) {
        console.error('Add Venue Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}
