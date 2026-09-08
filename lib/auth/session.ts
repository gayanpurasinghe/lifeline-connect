export type UserRole = 'ADMIN' | 'CLINICAL_STAFF' | 'HOSPITAL_COORDINATOR' | 'SCHEMA_OWNER' | 'DONOR';

export interface UserSession {
    username: string;
    role: UserRole;
    oracleRoles: string[];
    displayName: string;
    loginTime: string;
    donorId?: number;
    bloodGroup?: string;
    email?: string;
    contact?: string;
    address?: string;
}

export const SESSION_COOKIE_NAME = 'lifeline_session';


export function encodeSession(session: UserSession): string {
    return Buffer.from(JSON.stringify(session)).toString('base64');
}


export function decodeSession(token: string): UserSession | null {
    try {
        const json = Buffer.from(token, 'base64').toString('utf-8');
        return JSON.parse(json) as UserSession;
    } catch {
        return null;
    }
}
