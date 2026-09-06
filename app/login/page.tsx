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
    HeartHandshake
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        const result = await login(username, password);
        setSubmitting(false);

        if (result.success) {
            router.push('/dashboard');
        } else {
            setError(result.error || 'Authentication failed. Please check credentials.');
        }
    };

    const handleQuickSelect = (userVal: string, passVal: string) => {
        setUsername(userVal);
        setPassword(passVal);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-md z-10">
                {/* Header Branding */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl shadow-xl shadow-rose-950/60 mb-4 border border-rose-400/30">
                        <HeartHandshake className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                        LifeLine Connect
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono">
                            PDB Auth
                        </span>
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Oracle 21c Database Authentication (Role-Based Access Control)
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
                                    <div className="text-xs font-semibold text-emerald-300">Currently Authenticated</div>
                                    <div className="text-sm font-bold text-white">{user.displayName} ({user.username})</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/dashboard"
                                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center gap-1"
                                >
                                    Portal
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

                {/* Main Login Card */}
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                                <div className="leading-relaxed">{error}</div>
                            </div>
                        )}

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
                            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Connecting to Oracle PDB...</span>
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4" />
                                    <span>Authenticate via Oracle 21c</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-800">


                        <div className="grid grid-cols-1 gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickSelect('admin_user', 'Admin#2026')}
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
                                onClick={() => handleQuickSelect('staff_user', 'Staff#2026')}
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
                                onClick={() => handleQuickSelect('hospital_user', 'Hosp#2026')}
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
                                onClick={() => handleQuickSelect('LIFELINE_CONNECT', 'LifeLine2026')}
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
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
}
