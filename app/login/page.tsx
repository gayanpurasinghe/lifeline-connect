'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    Shield,
    Lock,
    User,
    Key,
    Database,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    Building2,
    Stethoscope,
    Server,
    HeartHandshake,
    Heart,
    Calendar,
    Activity,
    Droplet
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loginMode, setLoginMode] = useState<'DONOR' | 'STAFF'>('DONOR');

    // Staff state
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Donor state
    const [donorIdentifier, setDonorIdentifier] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStaffSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const result = await login(username, password, 'ORACLE_PDB');
        setSubmitting(false);

        if (result.success) {
            if (result.user?.role === 'DONOR') {
                router.push('/donor-portal');
            } else {
                router.push('/dashboard');
            }
        } else {
            setError(result.error || 'Authentication failed. Please check credentials.');
        }
    };

    const handleDonorSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const result = await login(donorIdentifier, undefined, 'DONOR');
        setSubmitting(false);

        if (result.success) {
            router.push('/donor-portal');
        } else {
            setError(result.error || 'Donor authentication failed. Please verify your email or Donor ID.');
        }
    };

    const handleQuickSelectStaff = (userVal: string, passVal: string) => {
        setUsername(userVal);
        setPassword(passVal);
        setError(null);
    };

    const handleQuickSelectDonor = (identVal: string) => {
        setDonorIdentifier(identVal);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-lg z-10">
                {/* Header Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-xl shadow-rose-950/60 mb-4 border border-rose-400/30">
                        <HeartHandshake className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                        LifeLine Connect
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                            {loginMode === 'DONOR' ? 'Donor Portal' : 'PDB Auth'}
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {loginMode === 'DONOR'
                            ? 'Access upcoming donation drives, clinical vitals & personal history'
                            : 'Oracle 21c Database Authentication (Role-Based Access Control)'}
                    </p>
                </div>

                {/* If already logged in, show current session status */}
                {user && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 backdrop-blur">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-900/60 text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-emerald-300">
                                        Currently Authenticated ({user.role})
                                    </div>
                                    <div className="text-sm font-bold text-white flex items-center gap-2">
                                        {user.displayName}
                                        {user.bloodGroup && (
                                            <span className="px-1.5 py-0.2 bg-rose-950/80 text-rose-400 border border-rose-800 rounded font-bold text-xs">
                                                {user.bloodGroup}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={user.role === 'DONOR' ? '/donor-portal' : '/dashboard'}
                                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center gap-1"
                                >
                                    {user.role === 'DONOR' ? 'My Portal' : 'Dashboard'}
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                    onClick={() => logout()}
                                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mode Segmented Tab Switcher */}
                <div className="grid grid-cols-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mb-4 backdrop-blur-md">
                    <button
                        type="button"
                        onClick={() => {
                            setLoginMode('DONOR');
                            setError(null);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            loginMode === 'DONOR'
                                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Heart className="w-4 h-4" />
                        Donor Portal Login
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setLoginMode('STAFF');
                            setError(null);
                        }}
                        className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                            loginMode === 'STAFF'
                                ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white border border-slate-600 shadow'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                        }`}
                    >
                        <Shield className="w-4 h-4" />
                        Staff / Admin (Oracle PDB)
                    </button>
                </div>

                {/* Main Login Card */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    {error && (
                        <div className="mb-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div className="leading-relaxed">{error}</div>
                        </div>
                    )}

                    {loginMode === 'DONOR' ? (
                        /* DONOR LOGIN FORM */
                        <div>
                            <form onSubmit={handleDonorSubmit} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-medium text-slate-300">
                                            Registered Donor Email or Donor ID
                                        </label>
                                        <span className="text-[11px] text-rose-400 font-mono">Oracle 3NF DONOR</span>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={donorIdentifier}
                                            onChange={(e) => setDonorIdentifier(e.target.value)}
                                            placeholder="e.g. saman@mail.com or 1"
                                            className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition font-mono"
                                        />
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1.5">
                                        Enter the email address or numeric ID used when you registered for blood donation.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || authLoading}
                                    className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Looking up Donor in Oracle...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Heart className="w-4 h-4 fill-white" />
                                            <span>Sign In to Donor Portal</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Demo Donor 1-Click Selectors */}
                            <div className="mt-6 pt-5 border-t border-slate-800">
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                                    <span>Registered Demo Donors</span>
                                    <span className="text-[10px] text-rose-400 font-mono">1-Click Fast Select</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectDonor('saman@mail.com')}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/60 font-bold text-xs">
                                                O+
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-400 transition">
                                                    Saman Kumara <span className="text-slate-500 font-normal">(Donor #1)</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    saman@mail.com • 1 Donation (Rotary Camp)
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-rose-400 font-medium group-hover:translate-x-0.5 transition">
                                            Select &rarr;
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectDonor('anura@mail.com')}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-900/60 font-bold text-xs">
                                                A-
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200 group-hover:text-rose-400 transition">
                                                    Anura Bandara <span className="text-slate-500 font-normal">(Donor #2)</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    anura@mail.com • 1 Donation (Kandy Drive)
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-rose-400 font-medium group-hover:translate-x-0.5 transition">
                                            Select &rarr;
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectDonor('dilani@mail.com')}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-900/60 font-bold text-xs">
                                                B+
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition">
                                                    Dilani Wickramasinghe <span className="text-slate-500 font-normal">(Donor #3)</span>
                                                </div>
                                                <div className="text-[10px] text-amber-400/90 font-mono">
                                                    dilani@mail.com • Deferred: Low Hemoglobin
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-amber-400 font-medium group-hover:translate-x-0.5 transition">
                                            Select &rarr;
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectDonor('priyantha@mail.com')}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-900/60 font-bold text-xs">
                                                B-
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-400 transition">
                                                    Priyantha Senanayake <span className="text-slate-500 font-normal">(Donor #8)</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    priyantha@mail.com • Central Walk-in Donor
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-cyan-400 font-medium group-hover:translate-x-0.5 transition">
                                            Select &rarr;
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* STAFF & ADMIN ORACLE PDB FORM */
                        <div>
                            <form onSubmit={handleStaffSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Oracle PDB Username
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="e.g. staff_user or admin_user"
                                            className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                                        Database Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                            <Key className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || authLoading}
                                    className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 border border-slate-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Connecting to Oracle PDB...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Database className="w-4 h-4 text-rose-400" />
                                            <span>Authenticate via Oracle 21c</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Staff Quick Select Buttons */}
                            <div className="mt-6 pt-5 border-t border-slate-800">
                                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                                    <span>Database Role Accounts</span>
                                    <span className="text-[10px] text-slate-400 font-mono">1-Click Fast Select</span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectStaff('admin_user', 'Admin#2026')}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-rose-950/80 text-rose-400">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200">System Admin</div>
                                                <div className="text-[10px] text-slate-400 font-mono">admin_user • RL_LIFELINE_ADMIN</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-rose-400 font-medium group-hover:translate-x-0.5 transition">Select &rarr;</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectStaff('staff_user', 'Staff#2026')}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-emerald-950/80 text-emerald-400">
                                                <Stethoscope className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200">Clinical Staff</div>
                                                <div className="text-[10px] text-slate-400 font-mono">staff_user • RL_CLINICAL_STAFF</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-emerald-400 font-medium group-hover:translate-x-0.5 transition">Select &rarr;</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectStaff('hospital_user', 'Hosp#2026')}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-blue-950/80 text-blue-400">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200">Hospital Coordinator</div>
                                                <div className="text-[10px] text-slate-400 font-mono">hospital_user • RL_HOSPITAL_COORDINATOR</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-blue-400 font-medium group-hover:translate-x-0.5 transition">Select &rarr;</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectStaff('LIFELINE_CONNECT', 'LifeLine2026')}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-purple-950/80 text-purple-400">
                                                <Server className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200">Schema Owner / DBA</div>
                                                <div className="text-[10px] text-slate-400 font-mono">LIFELINE_CONNECT • Full DDL/DML</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-purple-400 font-medium group-hover:translate-x-0.5 transition">Select &rarr;</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleQuickSelectStaff('donor_user', 'Donor#2026')}
                                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition group"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-md bg-rose-950/80 text-rose-400">
                                                <Heart className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-slate-200">Registered Donor (Oracle PDB)</div>
                                                <div className="text-[10px] text-slate-400 font-mono">donor_user • RL_DONOR_PORTAL</div>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-rose-400 font-medium group-hover:translate-x-0.5 transition">Select &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
