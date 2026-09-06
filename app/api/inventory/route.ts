import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

// GET: Fetch inventory units and completed donations for unit logging
export async function GET(request: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const includeAll = searchParams.get('all') === 'true';

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const unitsSql = `
            SELECT 
                UnitID,
                DonationID,
                BloodGroup,
                ComponentType,
                Volume_ml,
                StorageLocation,
                TO_CHAR(CollectionDate, 'YYYY-MM-DD') AS CollectionDate,
                TO_CHAR(ExpiryDate, 'YYYY-MM-DD') AS ExpiryDate,
                ROUND(ExpiryDate - SYSDATE, 1) AS DaysRemaining,
                Status
            FROM BLOOD_UNIT
            ${includeAll ? '' : "WHERE Status = 'AVAILABLE' AND ExpiryDate > SYSDATE"}
            ORDER BY ExpiryDate ASC
        `;

        const donationsSql = `
            SELECT 
                dn.DonationID,
                dn.DonorID,
                d.Name AS DonorName,
                d.BloodGroup,
                TO_CHAR(dn.DonationDate, 'YYYY-MM-DD') AS DonationDate,
                NVL(c.Name, 'Central Walk-in') AS CampName
            FROM DONATION dn
            INNER JOIN DONOR d ON dn.DonorID = d.DonorID
            LEFT JOIN CAMP c ON dn.CampID = c.CampID
            WHERE dn.Status = 'COMPLETED'
            ORDER BY dn.DonationID DESC
        `;

        const [unitsRes, donationsRes] = await Promise.all([
            connection.execute(unitsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(donationsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
        ]);

        return NextResponse.json({
            success: true,
            units: unitsRes.rows || [],
            donations: donationsRes.rows || [],
        });
    } catch (error: any) {
        console.error('Inventory GET Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

// POST: Add a new blood inventory unit
export async function POST(request: NextRequest) {
    let connection;
    try {
        const body = await request.json();
        const {
            donationId,
            bloodGroup,
            componentType = 'WHOLE_BLOOD',
            volumeMl = 450,
            storageLocation,
            collectionDate,
        } = body;

        if (!donationId) {
            return NextResponse.json(
                { success: false, error: 'Valid Donation reference is required.' },
                { status: 400 }
            );
        }

        if (!bloodGroup) {
            return NextResponse.json(
                { success: false, error: 'Blood Group is required.' },
                { status: 400 }
            );
        }

        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(bloodGroup)) {
            return NextResponse.json(
                { success: false, error: `Invalid Blood Group: ${bloodGroup}` },
                { status: 400 }
            );
        }

        const validComponents = ['WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA'];
        const finalComponent = validComponents.includes(componentType) ? componentType : 'WHOLE_BLOOD';

        if (!storageLocation?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Storage location is required (e.g. FRIDGE-A-SHELF-1).' },
                { status: 400 }
            );
        }

        const parsedVolume = parseInt(volumeMl, 10);
        if (isNaN(parsedVolume) || parsedVolume <= 0) {
            return NextResponse.json(
                { success: false, error: 'Volume must be a positive number in ml.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const checkDonation = await connection.execute(
            `SELECT DonationID, Status FROM DONATION WHERE DonationID = :donationId`,
            { donationId: parseInt(donationId, 10) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!checkDonation.rows || checkDonation.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: `Donation record #${donationId} not found.` },
                { status: 404 }
            );
        }

        let insertSql = `
            INSERT INTO BLOOD_UNIT (
                DonationID,
                BloodGroup,
                ComponentType,
                CollectionDate,
                ExpiryDate,
                Volume_ml,
                Status,
                StorageLocation
            ) VALUES (
                :donationId,
                :bloodGroup,
                :componentType,
                ${collectionDate ? "TO_DATE(:collectionDate, 'YYYY-MM-DD')" : "SYSDATE"},
                NULL,
                :volumeMl,
                'AVAILABLE',
                :storageLocation
            )
            RETURNING UnitID, TO_CHAR(ExpiryDate, 'YYYY-MM-DD') INTO :newUnitId, :expiryDate
        `;

        const binds: any = {
            donationId: parseInt(donationId, 10),
            bloodGroup,
            componentType: finalComponent,
            volumeMl: parsedVolume,
            storageLocation: storageLocation.trim().toUpperCase(),
            newUnitId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            expiryDate: { type: oracledb.STRING, dir: oracledb.BIND_OUT },
        };

        if (collectionDate) {
            binds.collectionDate = collectionDate;
        }

        const result = await connection.execute(insertSql, binds, { autoCommit: true });
        const newUnitId = (result.outBinds as any).newUnitId[0];
        const expiryDate = (result.outBinds as any).expiryDate[0];

        return NextResponse.json(
            {
                success: true,
                unitId: newUnitId,
                expiryDate,
                message: `Blood Unit #${newUnitId} (${bloodGroup} ${finalComponent}, ${parsedVolume}ml) added to inventory at ${storageLocation.trim().toUpperCase()}. Expiry auto-set to ${expiryDate} by trigger TRG_SET_UNIT_EXPIRY.`,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Inventory POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

// DELETE inventory unit
export async function DELETE(request: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        let unitId = searchParams.get('unitId');
        let action = searchParams.get('action') || 'discard'; // 'discard' or 'delete'
        let reason = searchParams.get('reason') || '';


        if (!unitId) {
            try {
                const body = await request.json();
                unitId = body.unitId;
                if (body.action) action = body.action;
                if (body.reason) reason = body.reason;
            } catch {

            }
        }

        if (!unitId) {
            return NextResponse.json(
                { success: false, error: 'Blood Unit ID is required.' },
                { status: 400 }
            );
        }

        const parsedUnitId = parseInt(unitId, 10);
        if (isNaN(parsedUnitId)) {
            return NextResponse.json(
                { success: false, error: 'Invalid Blood Unit ID.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const unitCheck = await connection.execute(
            `SELECT UnitID, BloodGroup, ComponentType, Status FROM BLOOD_UNIT WHERE UnitID = :unitId`,
            { unitId: parsedUnitId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!unitCheck.rows || unitCheck.rows.length === 0) {
            return NextResponse.json(
                { success: false, error: `Blood Unit #${parsedUnitId} not found.` },
                { status: 404 }
            );
        }

        const existingUnit = (unitCheck.rows as any[])[0];

        if (existingUnit.STATUS === 'DISTRIBUTED') {
            return NextResponse.json(
                {
                    success: false,
                    error: `Unit #${parsedUnitId} has already been distributed to a hospital requisition and cannot be removed or discarded.`,
                },
                { status: 400 }
            );
        }

        if (action === 'delete') {
            const distCheck = await connection.execute(
                `SELECT DistributionID FROM DISTRIBUTION WHERE UnitID = :unitId`,
                { unitId: parsedUnitId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (distCheck.rows && distCheck.rows.length > 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Unit #${parsedUnitId} is referenced in clinical distribution records and cannot be permanently deleted. Use 'discard' instead.`,
                    },
                    { status: 409 }
                );
            }

            await connection.execute(
                `DELETE FROM BLOOD_UNIT WHERE UnitID = :unitId`,
                { unitId: parsedUnitId },
                { autoCommit: true }
            );

            return NextResponse.json({
                success: true,
                message: `Blood Unit #${parsedUnitId} (${existingUnit.BLOODGROUP} ${existingUnit.COMPONENTTYPE}) was permanently deleted from inventory.`,
            });
        } else {
            await connection.execute(
                `UPDATE BLOOD_UNIT SET Status = 'DISCARDED' WHERE UnitID = :unitId`,
                { unitId: parsedUnitId },
                { autoCommit: true }
            );

            const reasonText = reason ? ` Reason: ${reason}.` : '';
            return NextResponse.json({
                success: true,
                message: `Blood Unit #${parsedUnitId} (${existingUnit.BLOODGROUP} ${existingUnit.COMPONENTTYPE}) was marked as DISCARDED.${reasonText}`,
            });
        }
    } catch (error: any) {
        console.error('Inventory DELETE Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}
