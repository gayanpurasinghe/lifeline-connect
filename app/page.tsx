'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Heart,
  Truck,
  Database,
  ShieldCheck,
  ArrowRight,
  Server,
  Layers,
  BookOpen
} from 'lucide-react';

export default function HomePage() {
  const [dbStatus, setDbStatus] = useState<{ oracle: string; mongo: string } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setDbStatus({ oracle: data.oracle, mongo: data.mongo }))
      .catch(() => setDbStatus({ oracle: 'ERROR', mongo: 'ERROR' }));
  }, []);

  const modules = [
    {
      title: 'Executive Dashboard',
      description: 'Run 5 PL/SQL analytical business reports via dynamic SYS_REFCURSOR bindings.',
      href: '/dashboard',
      icon: Activity,
      badge: 'Oracle PL/SQL',
      badgeColor: 'bg-rose-950 text-rose-400 border-rose-800',
    },
    {
      title: 'Camps & Community Reviews',
      description: 'Manage donation drives and view/post donor reviews, ratings, and wait times.',
      href: '/camps',
      icon: Calendar,
      badge: 'Dual-DB Hybrid',
      badgeColor: 'bg-cyan-950 text-cyan-400 border-cyan-800',
    },
    {
      title: 'Donor Registration & Intake',
      description: 'Register donors with automated clinical eligibility screening via TRG_CHECK_ELIGIBILITY.',
      href: '/donors',
      icon: Heart,
      badge: 'Trigger Enforced',
      badgeColor: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    },
    {
      title: 'Distribution & Stock Dispatch',
      description: 'Fulfill hospital requisitions; automated stock updates via TRG_AFTER_DISTRIBUTION.',
      href: '/distribution',
      icon: Truck,
      badge: '3NF Relational',
      badgeColor: 'bg-indigo-950 text-indigo-400 border-indigo-800',
    },
    {
      title: 'Emergency Appeals Portal',
      description: 'Real-time critical shortage broadcasts with embedded MongoDB comment threads.',
      href: '/appeals',
      icon: AlertTriangle,
      badge: 'MongoDB NoSQL',
      badgeColor: 'bg-amber-950 text-amber-400 border-amber-800',
    },
    {
      title: 'Campaign Media & Guidelines',
      description: 'Pre-donation clinical guides, awareness infographics, and promotional media in polymorphic formats.',
      href: '/media',
      icon: BookOpen,
      badge: 'Flexible Documents',
      badgeColor: 'bg-purple-950 text-purple-400 border-purple-800',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-950/70 border border-rose-800 text-rose-400 mb-4">
          <Layers className="h-3.5 w-3.5" />
          Enterprise Dual-Database Architecture
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          LifeLine Connect <span className="text-rose-500">Blood Bank</span> System
        </h1>
        <p className="text-slate-400 text-base md:text-lg">
          High-performance blood logistics engine combining Oracle 21c (3NF Relational + PL/SQL) with MongoDB (Unstructured Document Storage).
        </p>

        {/* Live Engine Status Chips */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <Database className="h-4 w-4 text-rose-400" />
            <span className="text-slate-400">Oracle XEPDB1:</span>
            <span className={`font-bold ${dbStatus?.oracle === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {dbStatus ? dbStatus.oracle : 'CHECKING...'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <Server className="h-4 w-4 text-emerald-400" />
            <span className="text-slate-400">MongoDB NoSQL:</span>
            <span className={`font-bold ${dbStatus?.mongo === 'CONNECTED' ? 'text-emerald-400' : 'text-slate-500'}`}>
              {dbStatus ? dbStatus.mongo : 'CHECKING...'}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400">Security / RBAC:</span>
            <span className="font-bold text-cyan-400">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className="group bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl group-hover:border-rose-500/40 group-hover:text-rose-400 transition">
                    <Icon className="h-6 w-6 text-rose-500" />
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${mod.badgeColor}`}>
                    {mod.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-rose-400 transition">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300">
                <span>Launch Subsystem</span>
                <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}