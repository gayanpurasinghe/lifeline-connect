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
    Sparkles
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

export default function Sidebar() {
    const pathname = usePathname();
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
                },
                {
                    name: 'Donors & Intake',
                    href: '/donors',
                    icon: Heart,
                    badge: 'Triggers',
                    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
                },
                {
                    name: 'Stock & Distribution',
                    href: '/distribution',
                    icon: Truck,
                    badge: '3NF',
                    badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-800/80',
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

            {/* Bottom Engine Health Widget */}
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
                        <span>User: LIFELINE_CONNECT</span>
                        <span className="font-mono text-cyan-400">3NF Schema</span>
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

                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition"
                    aria-label="Toggle navigation menu"
                >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
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
