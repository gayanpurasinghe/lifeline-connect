import { NextRequest, NextResponse } from 'next/server';
import { getOraclePool } from '@/lib/db/oracle';
import oracledb from 'oracledb';

export const dynamic = 'force-dynamic';

export async function GET() {
    let connection;
    try {
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const requestsSql = `
      SELECT 
        br.RequestID,
        h.HospitalID,
        h.Name AS HospitalName,
        h.Location AS HospitalLocation,
        br.Priority,
        TO_CHAR(br.RequiredDate, 'YYYY-MM-DD') AS RequiredDate,
        br.Status AS RequestStatus,
        br.RequestedBy,
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
      WHERE Status = 'AVAILABLE'
        AND ExpiryDate > SYSDATE
      ORDER BY ExpiryDate ASC
    `;


        const staffSql = `
      SELECT StaffID, Name, Role 
      FROM STAFF 
      WHERE Status = 'ACTIVE'
      ORDER BY Name ASC
    `;


        const hospitalsSql = `
      SELECT HospitalID, Name, Location, Contact, Email
      FROM HOSPITAL
      ORDER BY Name ASC
    `;


        const donationsSql = `
      SELECT 
        dn.DonationID,
        dn.DonorID,
        d.Name AS DonorName,
        d.BloodGroup,
        TO_CHAR(dn.DonationDate, 'YYYY-MM-DD') AS DonationDate,
        NVL(c.Name, 'Central Blood Bank Walk-in') AS CampName
      FROM DONATION dn
      INNER JOIN DONOR d ON dn.DonorID = d.DonorID
      LEFT JOIN CAMP c ON dn.CampID = c.CampID
      WHERE dn.Status = 'COMPLETED'
      ORDER BY dn.DonationID DESC
    `;

        const [requestsRes, unitsRes, staffRes, hospitalsRes, donationsRes] = await Promise.all([
            connection.execute(requestsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(unitsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(staffSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(hospitalsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
            connection.execute(donationsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT }),
        ]);

        return NextResponse.json({
            success: true,
            requests: requestsRes.rows || [],
            availableUnits: unitsRes.rows || [],
            staff: staffRes.rows || [],
            hospitals: hospitalsRes.rows || [],
            donations: donationsRes.rows || [],
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
        const pool = await getOraclePool();
        connection = await pool.getConnection();


        if (body.action === 'create_requisition' || body.hospitalId) {
            const {
                hospitalId,
                requestedBy,
                priority = 'NORMAL',
                requiredDate,
                bloodGroup,
                componentType = 'WHOLE_BLOOD',
                unitsRequested = 1,
            } = body;

            if (!hospitalId) {
                return NextResponse.json(
                    { success: false, error: 'Hospital selection is required.' },
                    { status: 400 }
                );
            }
            if (!requestedBy?.trim()) {
                return NextResponse.json(
                    { success: false, error: 'Requesting Medical Officer / Doctor is required.' },
                    { status: 400 }
                );
            }
            if (!requiredDate) {
                return NextResponse.json(
                    { success: false, error: 'Required By Date is required.' },
                    { status: 400 }
                );
            }
            if (!bloodGroup) {
                return NextResponse.json(
                    { success: false, error: 'Blood Group is required.' },
                    { status: 400 }
                );
            }

            const unitsNum = parseInt(unitsRequested, 10);
            if (isNaN(unitsNum) || unitsNum <= 0) {
                return NextResponse.json(
                    { success: false, error: 'Units Requested must be greater than 0.' },
                    { status: 400 }
                );
            }

            const validPriorities = ['CRITICAL', 'URGENT', 'NORMAL'];
            const finalPriority = validPriorities.includes(priority) ? priority : 'NORMAL';

            const validComponents = ['WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA'];
            const finalComponent = validComponents.includes(componentType) ? componentType : 'WHOLE_BLOOD';


            const requestResult = await connection.execute(
                `INSERT INTO BLOOD_REQUEST (HospitalID, RequiredDate, Priority, Status, RequestedBy)
         VALUES (:hospitalId, TO_DATE(:requiredDate, 'YYYY-MM-DD'), :priority, 'PENDING', :requestedBy)
         RETURNING RequestID INTO :requestId`,
                {
                    hospitalId: parseInt(hospitalId, 10),
                    requiredDate,
                    priority: finalPriority,
                    requestedBy: requestedBy.trim(),
                    requestId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                },
                { autoCommit: false }
            );

            const newRequestId = (requestResult.outBinds as any).requestId[0];

            // Insert into REQUEST_ITEM
            const itemResult = await connection.execute(
                `INSERT INTO REQUEST_ITEM (RequestID, BloodGroup, ComponentType, UnitsRequested, UnitsFulfilled)
         VALUES (:requestId, :bloodGroup, :componentType, :unitsRequested, 0)
         RETURNING RequestItemID INTO :itemId`,
                {
                    requestId: newRequestId,
                    bloodGroup,
                    componentType: finalComponent,
                    unitsRequested: unitsNum,
                    itemId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                },
                { autoCommit: false }
            );

            await connection.commit();

            const newItemId = (itemResult.outBinds as any).itemId[0];

            return NextResponse.json(
                {
                    success: true,
                    requestId: newRequestId,
                    requestItemId: newItemId,
                    message: `Hospital Requisition #${newRequestId} registered successfully (Item #${newItemId}: ${unitsNum} units of ${bloodGroup} ${finalComponent}).`,
                },
                { status: 201 }
            );
        }


        if (body.action === 'add_unit') {
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
                    { success: false, error: 'Donation record reference is required.' },
                    { status: 400 }
                );
            }
            if (!bloodGroup) {
                return NextResponse.json(
                    { success: false, error: 'Blood Group is required.' },
                    { status: 400 }
                );
            }
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

            const validComponents = ['WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA'];
            const finalComponent = validComponents.includes(componentType) ? componentType : 'WHOLE_BLOOD';

            // Insert into BLOOD_UNIT
            // ExpiryDate is null so TRG_SET_UNIT_EXPIRY trigger calculates it based on componentType
            const insertSql = `
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
                    ${collectionDate ? "TO_DATE(:collectionDate, 'YYYY-MM-DD')" : 'SYSDATE'},
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

            if (collectionDate) binds.collectionDate = collectionDate;

            const unitResult = await connection.execute(insertSql, binds, { autoCommit: true });
            const newUnitId = (unitResult.outBinds as any).newUnitId[0];
            const autoExpiry = (unitResult.outBinds as any).expiryDate[0];

            return NextResponse.json(
                {
                    success: true,
                    unitId: newUnitId,
                    expiryDate: autoExpiry,
                    message: `Blood Unit #${newUnitId} (${bloodGroup} ${finalComponent}) registered into inventory at ${storageLocation.trim().toUpperCase()}. Expiry auto-set to ${autoExpiry} via Oracle trigger TRG_SET_UNIT_EXPIRY.`,
                },
                { status: 201 }
            );
        }

        // Delete Blood Unit from Inventory
        if (body.action === 'discard_unit' || body.action === 'delete_unit') {
            const unitIdNum = parseInt(body.unitId, 10);
            if (isNaN(unitIdNum)) {
                return NextResponse.json(
                    { success: false, error: 'Valid Blood Unit ID is required.' },
                    { status: 400 }
                );
            }

            const unitCheck = await connection.execute(
                `SELECT UnitID, BloodGroup, ComponentType, Status FROM BLOOD_UNIT WHERE UnitID = :unitId`,
                { unitId: unitIdNum },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (!unitCheck.rows || unitCheck.rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: `Blood Unit #${unitIdNum} not found.` },
                    { status: 404 }
                );
            }

            const existingUnit = (unitCheck.rows as any[])[0];
            if (existingUnit.STATUS === 'DISTRIBUTED') {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Unit #${unitIdNum} has already been distributed to a hospital requisition and cannot be removed or discarded.`,
                    },
                    { status: 400 }
                );
            }

            if (body.action === 'delete_unit') {
                await connection.execute(
                    `DELETE FROM BLOOD_UNIT WHERE UnitID = :unitId`,
                    { unitId: unitIdNum },
                    { autoCommit: true }
                );
                return NextResponse.json({
                    success: true,
                    message: `Blood Unit #${unitIdNum} (${existingUnit.BLOODGROUP} ${existingUnit.COMPONENTTYPE}) was permanently deleted from database.`,
                });
            } else {
                await connection.execute(
                    `UPDATE BLOOD_UNIT SET Status = 'DISCARDED' WHERE UnitID = :unitId`,
                    { unitId: unitIdNum },
                    { autoCommit: true }
                );
                const reasonText = body.reason ? ` (Reason: ${body.reason})` : '';
                return NextResponse.json({
                    success: true,
                    message: `Blood Unit #${unitIdNum} (${existingUnit.BLOODGROUP} ${existingUnit.COMPONENTTYPE}) marked as DISCARDED.${reasonText}`,
                });
            }
        }

        // Dispatch Blood Unit to existing Requisition Item
        const { requestItemId, unitId, staffId, notes } = body;

        if (!requestItemId || !unitId || !staffId) {
            return NextResponse.json(
                { success: false, error: 'Requisition Item, Unit, and Authorizing Staff are required for dispatch.' },
                { status: 400 }
            );
        }

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
        console.error('Distribution POST Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}

export async function DELETE(request: NextRequest) {
    let connection;
    try {
        const { searchParams } = new URL(request.url);
        const unitId = searchParams.get('unitId');
        const action = searchParams.get('action') || 'discard';
        const reason = searchParams.get('reason') || '';

        if (!unitId) {
            return NextResponse.json({ success: false, error: 'Unit ID is required.' }, { status: 400 });
        }

        const unitIdNum = parseInt(unitId, 10);
        const pool = await getOraclePool();
        connection = await pool.getConnection();

        const unitCheck = await connection.execute(
            `SELECT UnitID, BloodGroup, ComponentType, Status FROM BLOOD_UNIT WHERE UnitID = :unitId`,
            { unitId: unitIdNum },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!unitCheck.rows || unitCheck.rows.length === 0) {
            return NextResponse.json({ success: false, error: `Blood Unit #${unitIdNum} not found.` }, { status: 404 });
        }

        const existingUnit = (unitCheck.rows as any[])[0];
        if (existingUnit.STATUS === 'DISTRIBUTED') {
            return NextResponse.json(
                { success: false, error: `Unit #${unitIdNum} has already been distributed and cannot be removed.` },
                { status: 400 }
            );
        }

        if (action === 'delete') {
            await connection.execute(
                `DELETE FROM BLOOD_UNIT WHERE UnitID = :unitId`,
                { unitId: unitIdNum },
                { autoCommit: true }
            );
            return NextResponse.json({
                success: true,
                message: `Blood Unit #${unitIdNum} permanently deleted.`,
            });
        } else {
            await connection.execute(
                `UPDATE BLOOD_UNIT SET Status = 'DISCARDED' WHERE UnitID = :unitId`,
                { unitId: unitIdNum },
                { autoCommit: true }
            );
            return NextResponse.json({
                success: true,
                message: `Blood Unit #${unitIdNum} marked as DISCARDED.${reason ? ` Reason: ${reason}` : ''}`,
            });
        }
    } catch (error: any) {
        console.error('Distribution DELETE Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}