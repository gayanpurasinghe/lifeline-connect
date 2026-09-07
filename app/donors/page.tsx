'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import {
    HeartPulse,
    UserCheck,
    UserX,
    UserPlus,
    Search,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Phone,
    Mail,
    Filter,
    Droplet,
    Sparkles,
    Calendar,
    Activity,
    Info,
    Shield,
    ArrowRight,
    Heart
} from 'lucide-react';

interface DonorRecord {
    DONORID: number;
    NAME: string;
    BLOODGROUP: string;
    CONTACT: string;
    EMAIL: string;
    REGDATE: string;
    WEIGHT?: number;
    BLOODPRESSURE?: string;
    HEMOGLOBIN?: number;
    ELIGIBLE?: string;
    DEFERRALREASON?: string;
    CHECKEDBYSTAFF?: string;
}

export default function DonorsPage() {
    const { user } = useAuth();
    const [donors, setDonors] = useState<DonorRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<'directory' | 'screening'>('directory');
    const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBloodGroup, setSelectedBloodGroup] = useState('ALL');
    const [eligibilityFilter, setEligibilityFilter] = useState('ALL');

    // Registration Form State
    const [name, setName] = useState('');
    const [dob, setDob] = useState('2000-01-01');
    const [bloodGroup, setBloodGroup] = useState('O+');
    const [contact, setContact] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [weight, setWeight] = useState('65');
    const [bloodPressure, setBloodPressure] = useState('120/80');
    const [hemoglobin, setHemoglobin] = useState('14.0');
    const [checkedBy, setCheckedBy] = useState('1');

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/donors');
            const json = await res.json();
            if (json.success) setDonors(json.data || []);
        } catch (err) {
            console.error('Failed to load donors:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatusBanner(null);

        try {
            const res = await fetch('/api/donors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                }),
            });

            const json = await res.json();
            if (json.success) {
                if (json.eligible) {
                    setStatusBanner({ type: 'success', message: json.message });
                } else {
                    setStatusBanner({ type: 'warning', message: json.message });
                }
                // Reset form
                setName('');
                setContact('');
                setEmail('');
                setAddress('');
                fetchDonors();
                setActiveTab('directory');
            } else {
                setStatusBanner({ type: 'error', message: json.error || 'Registration failed' });
            }
        } catch (err: any) {
            setStatusBanner({ type: 'error', message: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Logic
    const filteredDonors = donors.filter((d) => {
        const matchesSearch =
            d.NAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.CONTACT.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.EMAIL && d.EMAIL.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesGroup = selectedBloodGroup === 'ALL' || d.BLOODGROUP === selectedBloodGroup;

        const matchesEligibility =
            eligibilityFilter === 'ALL'
                ? true
                : eligibilityFilter === 'ELIGIBLE'
                    ? d.ELIGIBLE === 'Y'
                    : d.ELIGIBLE === 'N';

        return matchesSearch && matchesGroup && matchesEligibility;
    });

    // Aggregates
    const totalCount = donors.length;
    const eligibleCount = donors.filter((d) => d.ELIGIBLE === 'Y').length;
    const deferredCount = donors.filter((d) => d.ELIGIBLE === 'N').length;
    const universalCount = donors.filter((d) => d.BLOODGROUP === 'O-').length;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <HeartPulse className="h-8 w-8 text-rose-500" />
                        Donor Management & Clinical Intake
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Oracle 3NF Entities: <code className="text-rose-400 font-mono">DONOR</code>,{' '}
                        <code className="text-emerald-400 font-mono">DONOR_HEALTH</code>,{' '}
                        <code className="text-cyan-400 font-mono">DONATION</code> • Trigger{' '}
                        <code className="text-amber-400 font-mono">TRG_EVALUATE_DONOR_HEALTH</code>
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('screening')}
                        className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>New Clinical Screening</span>
                    </button>
                </div>
            </div>

            {user?.role === 'DONOR' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-rose-600 text-white shadow">
                            <Heart className="w-5 h-5 fill-white" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-white">
                                Logged in as Donor: {user.displayName} (Donor #{user.donorId} • Blood Group {user.bloodGroup})
                            </div>
                            <div className="text-[11px] text-slate-400">
                                View your personal donation records, clinical vital evaluations, and official PDF certificate.
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/donor-portal?tab=history"
                        className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition shadow flex items-center justify-center gap-1.5 shrink-0"
                    >
                        Open My Donor Portal
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            )}

            {/* Notification Banner */}
            {statusBanner && (
                <div
                    className={`p-4 rounded-xl border flex items-center justify-between text-sm ${statusBanner.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                        : statusBanner.type === 'warning'
                            ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                            : 'bg-rose-950/60 border-rose-800 text-rose-300'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {statusBanner.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        ) : (
                            <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
                        )}
                        <span>{statusBanner.message}</span>
                    </div>
                    <button onClick={() => setStatusBanner(null)} className="text-slate-400 hover:text-white">
                        &times;
                    </button>
                </div>
            )}

            {/* Metric Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Total Donors</span>
                        <UserCheck className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-white">{totalCount}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Registered Profiles</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Clinically Eligible</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{eligibleCount}</div>
                    <div className="text-[11px] text-emerald-400/80 mt-1">Cleared by Health Trigger</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Deferred Donors</span>
                        <UserX className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="text-2xl font-black text-rose-400">{deferredCount}</div>
                    <div className="text-[11px] text-rose-400/80 mt-1">Vital Bounds Not Met</div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                        <span>Universal (O-)</span>
                        <Droplet className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-400">{universalCount}</div>
                    <div className="text-[11px] text-purple-400/80 mt-1">Critical Emergency Responders</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-6">
                <button
                    onClick={() => setActiveTab('directory')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'directory'
                        ? 'border-rose-500 text-rose-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <UserCheck className="w-4 h-4" />
                    <span>Master Donor Directory ({donors.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('screening')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'screening'
                        ? 'border-rose-500 text-rose-400'
                        : 'border-transparent text-slate-400 hover:text-white'
                        }`}
                >
                    <HeartPulse className="w-4 h-4" />
                    <span>Clinical Intake & Automated Screening</span>
                </button>
            </div>

            {/* TAB 1: MASTER DONOR DIRECTORY */}
            {activeTab === 'directory' && (
                <div className="space-y-4">
                    {/* Search & Blood Group Filter Bar */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                            <div className="relative w-full md:w-80">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by donor name, phone, email..."
                                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                                    <Filter className="w-3.5 h-3.5" />
                                    Eligibility:
                                </span>
                                <select
                                    value={eligibilityFilter}
                                    onChange={(e) => setEligibilityFilter(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-2"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="ELIGIBLE">Eligible Only</option>
                                    <option value="DEFERRED">Deferred Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Blood Group Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80">
                            <span className="text-[11px] font-semibold text-slate-400 mr-1">Blood Group:</span>
                            <button
                                onClick={() => setSelectedBloodGroup('ALL')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${selectedBloodGroup === 'ALL'
                                    ? 'bg-rose-600 text-white shadow'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                    }`}
                            >
                                All ({donors.length})
                            </button>
                            {bloodGroups.map((bg) => {
                                const count = donors.filter((d) => d.BLOODGROUP === bg).length;
                                return (
                                    <button
                                        key={bg}
                                        onClick={() => setSelectedBloodGroup(bg)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${selectedBloodGroup === bg
                                            ? 'bg-rose-600 text-white shadow'
                                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                            }`}
                                    >
                                        <span>{bg}</span>
                                        <span className="text-[10px] opacity-75 font-mono">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Donors Table */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        {loading ? (
                            <div className="p-16 text-center text-slate-400 text-sm">Loading donors from Oracle...</div>
                        ) : filteredDonors.length === 0 ? (
                            <div className="p-16 text-center text-slate-500 text-sm">No donors found matching criteria.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                                            <th className="py-3.5 px-4">Donor Profile</th>
                                            <th className="py-3.5 px-4">Blood Group</th>
                                            <th className="py-3.5 px-4">Contact Info</th>
                                            <th className="py-3.5 px-4">Latest Vitals</th>
                                            <th className="py-3.5 px-4">Clinical Eligibility</th>
                                            <th className="py-3.5 px-4">Evaluation Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {filteredDonors.map((d) => {
                                            const isEligible = d.ELIGIBLE === 'Y';
                                            return (
                                                <tr key={d.DONORID} className="hover:bg-slate-800/30 transition">
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-white flex items-center gap-2">
                                                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                                                            {d.NAME}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            ID #{d.DONORID} • Reg: {d.REGDATE || 'Active'}
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                                                            <Droplet className="w-3 h-3 fill-rose-400 text-rose-400" />
                                                            {d.BLOODGROUP}
                                                        </span>
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        <div className="text-slate-300 flex items-center gap-1.5">
                                                            <Phone className="w-3 h-3 text-slate-500" />
                                                            {d.CONTACT}
                                                        </div>
                                                        {d.EMAIL && (
                                                            <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5 font-mono">
                                                                <Mail className="w-3 h-3 text-slate-500" />
                                                                {d.EMAIL}
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        {d.WEIGHT ? (
                                                            <div className="font-mono text-[11px] text-slate-200">
                                                                <span>{d.WEIGHT} kg</span> • <span>{d.HEMOGLOBIN} g/dL</span>
                                                                <div className="text-[10px] text-slate-400 mt-0.5">BP: {d.BLOODPRESSURE}</div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-500 italic">Pending screening</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-4">
                                                        {d.ELIGIBLE ? (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${isEligible
                                                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                                                                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                                                                    }`}
                                                            >
                                                                {isEligible ? (
                                                                    <>
                                                                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                                                        Eligible
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <ShieldAlert className="h-3 w-3 text-rose-400" />
                                                                        Deferred
                                                                    </>
                                                                )}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </td>

                                                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                                                        {d.DEFERRALREASON ? (
                                                            <span className="text-rose-400 font-medium">
                                                                {d.DEFERRALREASON}
                                                            </span>
                                                        ) : isEligible ? (
                                                            <span className="text-emerald-400 font-medium">
                                                                Cleared for collection
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                        {d.CHECKEDBYSTAFF && (
                                                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                                                Screened by: {d.CHECKEDBYSTAFF}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: CLINICAL INTAKE & SCREENING */}
            {activeTab === 'screening' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Screening Form */}
                    <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6">
                        <div className="border-b border-slate-800 pb-4">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-rose-500" />
                                <span>Register & Screen New Voluntary Donor</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">
                                Medical officers record donor vital metrics. Oracle trigger{' '}
                                <code className="text-rose-400 font-mono">TRG_EVALUATE_DONOR_HEALTH</code> autonomously validates thresholds.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-300 mb-1.5 font-semibold">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Kasun Rajakaruna"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold">Date of Birth</label>
                                    <input
                                        required
                                        type="date"
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold">Blood Group</label>
                                    <select
                                        value={bloodGroup}
                                        onChange={(e) => setBloodGroup(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-bold"
                                    >
                                        {bloodGroups.map((bg) => (
                                            <option key={bg} value={bg}>{bg}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold">Contact Phone</label>
                                    <input
                                        required
                                        type="text"
                                        value={contact}
                                        onChange={(e) => setContact(e.target.value)}
                                        placeholder="+94 7X XXX XXXX"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 mb-1.5 font-semibold">Email Address</label>
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="donor@example.com"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 mb-1.5 font-semibold">Residential Address / City</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. 45/2 Peradeniya Road, Kandy"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm"
                                />
                            </div>

                            {/* Vitals Section */}
                            <div className="pt-4 border-t border-slate-800 space-y-3">
                                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                    <Activity className="w-4 h-4" />
                                    <span>Clinical Vitals (Evaluated by Oracle Database Trigger)</span>
                                </span>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-slate-300 mb-1">Weight (kg)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.1"
                                            value={weight}
                                            onChange={(e) => setWeight(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 mb-1">Blood Pressure</label>
                                        <input
                                            required
                                            type="text"
                                            value={bloodPressure}
                                            onChange={(e) => setBloodPressure(e.target.value)}
                                            placeholder="120/80"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 mb-1">Hb (g/dL)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.1"
                                            value={hemoglobin}
                                            onChange={(e) => setHemoglobin(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                    Trigger Requirement: Weight $\ge 50$ kg and Hemoglobin $\ge 12.5$ g/dL for clearance. Otherwise marked as DEFERRED with deferral log.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-rose-950/50 transition flex items-center justify-center gap-2 text-sm"
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        <span>Evaluating Trigger & Registering...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Register & Evaluate Clinical Eligibility</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Screening Protocol Info Card */}
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                            <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                <Shield className="w-4 h-4 text-rose-500" />
                                <span>National Blood Transfusion Screening Rules</span>
                            </h3>

                            <div className="space-y-3 text-xs text-slate-300">
                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-white block mb-1">Weight Threshold</span>
                                    <p className="text-slate-400">
                                        Must be at least <strong className="text-emerald-400">50.0 kg</strong>. Less than 50 kg triggers an automated clinical deferral.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-white block mb-1">Hemoglobin Threshold</span>
                                    <p className="text-slate-400">
                                        Minimum <strong className="text-emerald-400">12.5 g/dL</strong> required to avoid donor anemia and guarantee recipient component quality.
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                                    <span className="font-bold text-white block mb-1">Autonomous Trigger</span>
                                    <p className="text-slate-400">
                                        Trigger <code className="text-rose-400 font-mono">TRG_EVALUATE_DONOR_HEALTH</code> intercepts every record and assigns eligibility without manual intervention.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}