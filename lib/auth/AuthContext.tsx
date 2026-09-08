'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession } from './session';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: UserSession | null;
    loading: boolean;
    login: (username: string, password?: string, authType?: 'ORACLE_PDB' | 'DONOR') => Promise<{ success: boolean; user?: UserSession; error?: string }>;
    logout: () => Promise<void>;
    hasPermission: (allowedRoles?: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Fetch current session on initial load
        fetch('/api/auth/me')
            .then((res) => res.json())
            .then((data) => {
                if (data.authenticated && data.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            })
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const login = async (username: string, password?: string, authType: 'ORACLE_PDB' | 'DONOR' = 'ORACLE_PDB') => {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, authType }),
            });
            const data = await res.json();
            if (data.success && data.user) {
                setUser(data.user);
                return { success: true, user: data.user };
            }
            return { success: false, error: data.error || 'Authentication failed' };
        } catch (err: any) {
            return { success: false, error: err.message || 'Network error occurred' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
            setUser(null);
            router.push('/login');
            router.refresh();
        }
    };

    const hasPermission = (allowedRoles?: UserRole[]) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        if (!user) return false;
        if (user.role === 'ADMIN' || user.role === 'SCHEMA_OWNER') return true;
        return allowedRoles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
