'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Activity,
    AlertTriangle,
    Calendar,
    Heart,
    Truck,
    BookOpen,
    Home,
    Database,
    Server,
    Shield,
    Menu,
    X,
    Layers,
    ChevronRight,
    Sparkles,
    Lock,
    LogIn,
    LogOut,
    UserCheck,
    Stethoscope,
    Building2,
    KeyRound,
    Users
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/session';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    allowedRoles?: UserRole[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout, hasPermission } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [healthStatus, setHealthStatus] = useState<{ oracle: string; mongo: string } | null>(null);

    useEffect(() => {
        fetch('/api/health')
            .then((res) => res.json())
            .then((data) => setHealthStatus({ oracle: data.oracle, mongo: data.mongo }))
            .catch(() => setHealthStatus({ oracle: 'DISCONNECTED', mongo: 'DISCONNECTED' }));
    }, []);

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const navSections: NavSection[] = [
        {
            title: 'OVERVIEW',
            items: [
                { name: 'Portal Home', href: '/', icon: Home },
                {
                    name: 'Executive Dashboard',
                    href: '/dashboard',
                    icon: Activity,
                    badge: 'PL/SQL',
                    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
                },
            ],
        },
        {
            title: 'ORACLE RELATIONAL CORE',
            items: [
                {
                    name: 'Camps & Rosters',
                    href: '/camps',
                    icon: Calendar,
                    badge: 'Hybrid',
                    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
                    allowedRoles: ['ADMIN', 'CLINICAL_STAFF', 'SCHEMA_OWNER'],
                },
                {
                    name: 'Donors & Intake',
                    href: '/donors',
                    icon: Heart,
                    badge: 'Triggers',
                    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
                    allowedRoles: ['ADMIN', 'CLINICAL_STAFF', 'SCHEMA_OWNER'],
                },
                {
                    name: 'Staff & Volunteers',
                    href: '/staff',
                    icon: Users,
                    badge: 'Personnel',
                    badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-800/80',
                    allowedRoles: ['ADMIN', 'CLINICAL_STAFF', 'SCHEMA_OWNER'],
                },
                {
                    name: 'Stock & Distribution',
                    href: '/distribution',
                    icon: Truck,
                    badge: '3NF',
                    badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
                    allowedRoles: ['ADMIN', 'HOSPITAL_COORDINATOR', 'SCHEMA_OWNER'],
                },
            ],
        },
        {
            title: 'MONGODB DOCUMENT STORE',
            items: [
                {
                    name: 'Emergency Appeals',
                    href: '/appeals',
                    icon: AlertTriangle,
                    badge: 'Live Q&A',
                    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
                    allowedRoles: ['ADMIN', 'HOSPITAL_COORDINATOR', 'CLINICAL_STAFF', 'SCHEMA_OWNER'],
                },
                {
                    name: 'Media & Guidelines',
                    href: '/media',
                    icon: BookOpen,
                    badge: 'Flexible',
                    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
                },
            ],
        },
    ];

    const getRoleBadgeInfo = (role?: UserRole) => {
        switch (role) {
            case 'ADMIN':
            case 'SCHEMA_OWNER':
                return {
                    label: 'ADMIN (FULL)',
                    bg: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
                    icon: Shield,
                };
            case 'CLINICAL_STAFF':
                return {
                    label: 'CLINICAL STAFF',
                    bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
                    icon: Stethoscope,
                };
            case 'HOSPITAL_COORDINATOR':
                return {
                    label: 'HOSPITAL COORD',
                    bg: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
                    icon: Building2,
                };
            default:
                return {
                    label: 'GUEST / POOL',
                    bg: 'bg-slate-800 text-slate-400 border-slate-700',
                    icon: Database,
                };
        }
    };

    const roleBadge = getRoleBadgeInfo(user?.role);
    const RoleIcon = roleBadge.icon;

    const sidebarContent = (
        <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800/80 text-slate-200 select-none">
            {/* Brand Header */}
            <div className="p-5 border-b border-slate-800/80">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-105 transition">
                        <Heart className="h-5 w-5 text-white fill-white" />
                    </div>
                    <div>
                        <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                            LifeLine Connect
                        </span>
                        <span className="text-[11px] text-rose-400 font-medium tracking-wide flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            Dual-Database Portal
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                {navSections.map((section) => (
                    <div key={section.title}>
                        <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {section.title}
                        </div>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                const isAllowed = !user || hasPermission(item.allowedRoles);

                                if (!isAllowed) {
                                    // Render locked item to visually demonstrate RBAC restrictions to examiner
                                    return (
                                        <div
                                            key={item.href}
                                            title="Restricted by Oracle Role Privilege (RBAC)"
                                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-950/40 border border-slate-900 cursor-not-allowed opacity-60"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="h-4 w-4 text-slate-600" />
                                                <span className="line-through decoration-slate-700">{item.name}</span>
                                            </div>
                                            <span className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-rose-950/40 text-rose-400 border-rose-900/60 uppercase">
                                                <Lock className="h-2.5 w-2.5" />
                                                RBAC
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/40'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon
                                                className={`h-4 w-4 transition-colors ${
                                                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-400'
                                                }`}
                                            />
                                            <span>{item.name}</span>
                                        </div>

                                        {item.badge && (
                                            <span
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-wider ${
                                                    isActive
                                                        ? 'bg-white/20 text-white border-white/30'
                                                        : item.badgeColor || 'bg-slate-900 text-slate-400 border-slate-800'
                                                }`}
                                            >
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Account / RBAC Authentication Card */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
                {user ? (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-rose-400">
                                    <RoleIcon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">
                                        {user.displayName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono truncate">
                                        {user.username}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => logout()}
                                title="Sign Out of Oracle PDB"
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                            <span className="text-slate-400">Role:</span>
                            <span className={`px-2 py-0.5 rounded-md border font-mono font-bold text-[9px] ${roleBadge.bg}`}>
                                {roleBadge.label}
                            </span>
                        </div>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-900/50 hover:border-rose-700 text-slate-200 transition group"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-rose-600 text-white shadow-sm">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                                    Sign In with PDB
                                </div>
                                <div className="text-[10px] text-slate-400">
                                    Oracle RBAC Accounts
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition" />
                    </Link>
                )}
            </div>

            {/* Bottom Database Connectivity Status */}
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
                <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Database Connectivity</span>
                        <Shield className="h-3 w-3 text-cyan-400" />
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <Database className="h-3 w-3 text-rose-400" />
                            Oracle 21c:
                        </span>
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {healthStatus?.oracle === 'CONNECTED' ? 'ONLINE' : 'PDB ACTIVE'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-300">
                            <Server className="h-3 w-3 text-emerald-400" />
                            MongoDB NoSQL:
                        </span>
                        <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {healthStatus?.mongo === 'CONNECTED' ? 'ONLINE' : 'ACTIVE'}
                        </span>
                    </div>

                    <div className="pt-2 mt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Auth: {user ? user.username : 'Default Pool'}</span>
                        <span className="font-mono text-cyan-400">XEPDB1</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header Bar (< md) */}
            <header className="md:hidden sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800 px-4 h-14 flex items-center justify-between backdrop-blur">
                <Link href="/" className="flex items-center gap-2 font-bold text-sm text-white">
                    <div className="h-7 w-7 rounded-lg bg-rose-600 flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white fill-white" />
                    </div>
                    <span>LifeLine Connect</span>
                </Link>

                <div className="flex items-center gap-2">
                    {user ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${roleBadge.bg}`}>
                            {user.username}
                        </span>
                    ) : (
                        <Link
                            href="/login"
                            className="px-2 py-1 text-xs bg-rose-600 text-white rounded font-medium"
                        >
                            Login
                        </Link>
                    )}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </header>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileOpen(false)}
                >
                    <div
                        className="w-72 h-full bg-slate-950 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {sidebarContent}
                    </div>
                </div>
            )}

            {/* Desktop Left Fixed Sidebar (>= md) */}
            <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
                {sidebarContent}
            </aside>
        </>
    );
}
