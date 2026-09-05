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
      SELECT 
        d.DonorID,
        d.Name,
        d.BloodGroup,
        d.Contact,
        d.Email,
        TO_CHAR(d.RegistrationDate, 'YYYY-MM-DD') AS RegDate,
        dh.HealthID,
        dh.Weight,
        dh.BloodPressure,
        dh.Hemoglobin,
        dh.Eligible,
        dh.DeferralReason,
        s.Name AS CheckedByStaff
      FROM DONOR d
      LEFT JOIN (
        SELECT dh1.*
        FROM DONOR_HEALTH dh1
        INNER JOIN (
          SELECT DonorID, MAX(CheckDate) AS MaxCheckDate
          FROM DONOR_HEALTH
          GROUP BY DonorID
        ) latest ON dh1.DonorID = latest.DonorID AND dh1.CheckDate = latest.MaxCheckDate
      ) dh ON d.DonorID = dh.DonorID
      LEFT JOIN STAFF s ON dh.CheckedBy = s.StaffID
      ORDER BY d.DonorID DESC
    `;

        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Fetch Donors Error:', error);
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
            dob,
            bloodGroup,
            contact,
            email,
            address,
            weight,
            bloodPressure,
            hemoglobin,
            checkedBy,
        } = body;

        if (!name || !dob || !bloodGroup || !contact || !email || !weight || !bloodPressure || !hemoglobin) {
            return NextResponse.json(
                { success: false, error: 'All personal details and clinical screening vitals are required.' },
                { status: 400 }
            );
        }

        const pool = await getOraclePool();
        connection = await pool.getConnection();

        // 1. Insert into DONOR table and retrieve generated DonorID
        const donorResult = await connection.execute(
            `INSERT INTO DONOR (Name, DOB, BloodGroup, Contact, Email, Address)
       VALUES (:name, TO_DATE(:dob, 'YYYY-MM-DD'), :bloodGroup, :contact, :email, :address)
       RETURNING DonorID INTO :donorId`,
            {
                name,
                dob,
                bloodGroup,
                contact,
                email,
                address: address || '',
                donorId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
            },
            { autoCommit: false }
        );

        const newDonorId = (donorResult.outBinds as any).donorId[0];

        // 2. Insert into DONOR_HEALTH (Triggers TRG_CHECK_ELIGIBILITY to set Eligible & DeferralReason)
        const healthResult = await connection.execute(
            `INSERT INTO DONOR_HEALTH (DonorID, Weight, BloodPressure, Hemoglobin, CheckedBy)
       VALUES (:donorId, :weight, :bloodPressure, :hemoglobin, :checkedBy)
       RETURNING HealthID, Eligible, DeferralReason INTO :healthId, :eligible, :deferralReason`,
            {
                donorId: newDonorId,
                weight: parseFloat(weight),
                bloodPressure,
                hemoglobin: parseFloat(hemoglobin),
                checkedBy: parseInt(checkedBy || '1', 10),
                healthId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
                eligible: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 5 },
                deferralReason: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 255 },
            },
            { autoCommit: false }
        );

        await connection.commit();

        const outBinds = healthResult.outBinds as any;
        const isEligible = outBinds.eligible[0] === 'Y';
        const reason = outBinds.deferralReason[0] || null;

        return NextResponse.json(
            {
                success: true,
                donorId: newDonorId,
                eligible: isEligible,
                deferralReason: reason,
                message: isEligible
                    ? 'Donor registered and cleared for donation by clinical trigger.'
                    : `Donor registered but flagged as DEFERRED by trigger: ${reason}`,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (connection) await connection.rollback();
        console.error('Donor Registration Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (connection) await connection.close();
    }
}