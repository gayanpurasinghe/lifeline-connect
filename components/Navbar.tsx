'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, AlertTriangle, Calendar, Heart, Truck, BookOpen } from 'lucide-react';

export default function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: Activity },
        { name: 'Camps & Rosters', href: '/camps', icon: Calendar },
        { name: 'Donors & Intake', href: '/donors', icon: Heart },
        { name: 'Distribution', href: '/distribution', icon: Truck },
        { name: 'Emergency Appeals', href: '/appeals', icon: AlertTriangle },
        { name: 'Media & Guides', href: '/media', icon: BookOpen },
    ];

    return (
        <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg text-white">
                    <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
                    <span>LifeLine Connect</span>
                </Link>
                <div className="flex items-center gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
}