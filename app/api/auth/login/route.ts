import { NextResponse } from 'next/server';
import oracledb from 'oracledb';
import { cookies } from 'next/headers';
import { UserRole, UserSession, encodeSession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getOraclePool } from '@/lib/db/oracle';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password, authType = 'ORACLE_PDB' } = body;

        if (authType === 'DONOR') {
            const trimmedIdentifier = (username || '').trim();
            if (!trimmedIdentifier) {
                return NextResponse.json(
                    { success: false, error: 'Donor Email or Donor ID is required.' },
                    { status: 400 }
                );
            }

            let connection;
            try {
                const pool = await getOraclePool();
                connection = await pool.getConnection();

                const donorSql = `
                    SELECT 
                        d.DonorID,
                        d.Name,
                        d.BloodGroup,
                        d.Contact,
                        d.Email,
                        d.Address,
                        d.Status,
                        TO_CHAR(d.RegistrationDate, 'YYYY-MM-DD') AS RegDate
                    FROM DONOR d
                    WHERE LOWER(d.Email) = LOWER(:ident) 
                       OR TO_CHAR(d.DonorID) = :ident 
                       OR d.Contact = :ident
                `;

                const res = await connection.execute(donorSql, { ident: trimmedIdentifier }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
                if (!res.rows || res.rows.length === 0) {
                    return NextResponse.json(
                        { success: false, error: `No registered donor found matching "${trimmedIdentifier}". Please check your email or Donor ID.` },
                        { status: 404 }
                    );
                }

                const donorRow = res.rows[0] as any;
                const donorSession: UserSession = {
                    username: donorRow.EMAIL || `donor_${donorRow.DONORID}`,
                    role: 'DONOR',
                    oracleRoles: ['DONOR_PORTAL'],
                    displayName: donorRow.NAME,
                    loginTime: new Date().toISOString(),
                    donorId: donorRow.DONORID,
                    bloodGroup: donorRow.BLOODGROUP,
                    email: donorRow.EMAIL,
                    contact: donorRow.CONTACT,
                    address: donorRow.ADDRESS,
                };

                const cookieStore = await cookies();
                cookieStore.set(SESSION_COOKIE_NAME, encodeSession(donorSession), {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 8,
                });

                return NextResponse.json({
                    success: true,
                    user: donorSession,
                });
            } catch (dbErr: any) {
                console.error('Donor Auth Database Error:', dbErr);
                return NextResponse.json(
                    { success: false, error: `Database error during donor verification: ${dbErr.message}` },
                    { status: 500 }
                );
            } finally {
                if (connection) await connection.close();
            }
        }

        // ORACLE PDB ROLE-BASED AUTHENTICATION 
        if (!username || !password) {
            return NextResponse.json(
                { success: false, error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const trimmedUser = username.trim();
        const connectString = process.env.ORACLE_CONN_STR || 'localhost:1521/XEPDB1';

        // Authenticate against Oracle PDB directly with provided credentials
        let connection: oracledb.Connection;
        try {
            connection = await oracledb.getConnection({
                user: trimmedUser,
                password: password,
                connectString: connectString,
            });
        } catch (dbErr: any) {
            console.error('Oracle PDB Authentication Failed:', dbErr.message);


            let friendlyMsg = 'Authentication failed. Please verify your credentials.';
            if (dbErr.message.includes('ORA-01017')) {
                friendlyMsg = 'Invalid Oracle username or password (ORA-01017).';
            } else if (dbErr.message.includes('ORA-28000')) {
                friendlyMsg = 'The Oracle user account is locked (ORA-28000).';
            } else if (dbErr.message.includes('ORA-12541') || dbErr.message.includes('NJS-511') || dbErr.message.includes('ORA-12170')) {
                friendlyMsg = `Cannot connect to Oracle PDB (${connectString}). Please ensure Oracle 21c XE is running.`;
            }

            return NextResponse.json(
                { success: false, error: friendlyMsg, oraError: dbErr.message },
                { status: 401 }
            );
        }

        // Resolve assigned Oracle Database Roles from USER_ROLE_PRIVS
        let oracleRoles: string[] = [];
        try {
            const roleQuery = await connection.execute<{ GRANTED_ROLE: string }>(
                `SELECT GRANTED_ROLE FROM USER_ROLE_PRIVS`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            if (roleQuery.rows) {
                oracleRoles = roleQuery.rows.map((row: any) => row.GRANTED_ROLE || row[0]);
            }
        } catch (roleErr) {
            console.warn('Could not read USER_ROLE_PRIVS:', roleErr);
        } finally {
            await connection.close();
        }

        // Map Oracle Database Roles to Portal Roles
        let role: UserRole = 'CLINICAL_STAFF';
        let displayName = trimmedUser;
        let donorId: number | undefined;
        let bloodGroup: string | undefined;

        const upperUser = trimmedUser.toUpperCase();
        if (upperUser === 'LIFELINE_CONNECT') {
            role = 'ADMIN';
            displayName = 'Schema Owner (DBA)';
            oracleRoles = ['DBA', 'RESOURCE', 'CONNECT'];
        } else if (oracleRoles.includes('RL_LIFELINE_ADMIN') || upperUser === 'ADMIN_USER') {
            role = 'ADMIN';
            displayName = 'System Administrator';
        } else if (oracleRoles.includes('RL_HOSPITAL_COORDINATOR') || upperUser === 'HOSPITAL_USER') {
            role = 'HOSPITAL_COORDINATOR';
            displayName = 'Hospital Coordinator';
        } else if (oracleRoles.includes('RL_CLINICAL_STAFF') || upperUser === 'STAFF_USER') {
            role = 'CLINICAL_STAFF';
            displayName = 'Clinical Screening Officer';
        } else if (oracleRoles.includes('RL_DONOR_PORTAL') || upperUser === 'DONOR_USER') {
            role = 'DONOR';
            displayName = 'Registered Donor (Oracle User)';
            donorId = 1;
            bloodGroup = 'O+';
        }

        const session: UserSession = {
            username: trimmedUser,
            role,
            oracleRoles,
            displayName,
            loginTime: new Date().toISOString(),
            donorId,
            bloodGroup,
        };

        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 8,
        });

        return NextResponse.json({
            success: true,
            user: session,
        });
    } catch (err: any) {
        console.error('Login Handler Error:', err);
        return NextResponse.json(
            { success: false, error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
